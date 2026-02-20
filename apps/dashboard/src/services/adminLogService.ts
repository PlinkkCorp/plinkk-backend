import { prisma, Prisma } from '@plinkk/prisma';
import { logAdminAction } from '../lib/adminLogger';

interface DiffObject { [key: string]: unknown; }
interface LogDetails { diff?: DiffObject; }
function isLogDetails(d: unknown): d is LogDetails {
    return d !== null && typeof d === 'object' && 'diff' in d;
}


/**
 * Maps an action string to a Prisma model name.
 */
function getModelFromAction(action: string): Prisma.ModelName | null {
    if (action.includes('USER') || action.includes('PROFILE') || action === 'DISABLE_2FA') return 'User';
    if (action.includes('PLINKK')) return 'Plinkk';
    if (action.includes('THEME')) return 'Theme';
    if (action.includes('REDIRECT')) return 'Redirect';
    if (action.includes('ROLE')) return 'Role';
    return null;
}

export async function restoreLogState(logId: string, adminId: string, ip?: string) {
    // 1. Fetch the target log
    const targetLog = await prisma.adminLog.findUnique({
        where: { id: logId }
    });

    if (!targetLog) {
        throw new Error('Log not found');
    }

    if (!targetLog.targetId) {
        throw new Error('This log has no target ID, cannot restore state.');
    }

    const modelName = getModelFromAction(targetLog.action);
    if (!modelName) {
        throw new Error(`Cannot determine model for action: ${targetLog.action}`);
    }

    // 2. Fetch all subsequent logs for this target
    const subsequentLogs = await prisma.adminLog.findMany({
        where: {
            targetId: targetLog.targetId,
            createdAt: { gt: targetLog.createdAt },
            // We only care about actions that modified the same model type
            // Using a simplified check for now, assuming targetId is unique across models or we trust the flow
        },
        orderBy: { createdAt: 'desc' } // Newest first
    });

    // 3. Calculate the restoration
    // We need to "undo" changes. The details.diff structure typically is { field: { old: val, new: val } }
    // To undo, we set field = old.

    const restorePatch: Record<string, any> = {};
    const logsProcessed: string[] = [];

    // Iterate from newest to oldest (up to but not including targetLog)
    // For each log, if it changed a field, we want to revert it to its 'old' value.
    // Since we go Newest -> Oldest, the 'old' value of a later log might be overwritten by the 'old' value of an earlier log
    // which is correct. We want the state *before* the earliest subsequent log (which is the state *after* targetLog).
    //
    // Wait, if we want to restore specifically to the state *of* targetLog (result of targetLog),
    // we need to undo everything that happened *after* it.
    // Log 1 (Target): A->B.  We want B.
    // Log 2: B->C.
    // Log 3: C->D.
    //
    // Current state is D.
    // Undo Log 3: field becomes C (Log3.old).
    // Undo Log 2: field becomes B (Log2.old).
    //
    // So yes, iterating Newest -> Oldest (Log 3 then Log 2) and setting field = old works.

    for (const log of subsequentLogs) {
        const details = log.details;
        if (!isLogDetails(details) || !details.diff) continue;

        const diff = details.diff;
        for (const [key, change] of Object.entries(diff)) {
            if (change && typeof change === 'object' && 'old' in change) {
                // We apply the 'old' value to revert this change
                restorePatch[key] = (change as { old: unknown }).old;
            }
        }
        logsProcessed.push(log.id);
    }

    if (Object.keys(restorePatch).length === 0) {
        // No subsequent changes found to revert? 
        // It's possible the current state IS the target state, or subsequent logs didn't capture diffs properly.
        // However, maybe the user wants to ensure the state is exactly as described in targetLog.new?
        // But relying on targetLog.new is dangerous if fields were changed by other means (not logged).
        // The safest "Restore" in a system with partial logs is "Undo subsequent logged actions".

        // If no subsequent logs, maybe we just verify if current state matches targetLog.new?
        // For now, let's treat "no restoration needed" as a success or info.
        return { restored: false, message: 'No subsequent modifications found to revert.' };
    }

    // 4. Apply the patch
    // @ts-ignore - dynamic prisma model access
    const modelDelegate = (prisma as unknown as Record<string, unknown>)[modelName.toLowerCase()]; // conventional prisma client mapping is lowercase
    if (!modelDelegate) {
        const delegate = (prisma as unknown as Record<string, unknown>)[modelName]; // try exact match if lowercase failed (e.g. User vs user)
        if (!delegate) throw new Error(`Prisma delegate not found for model: ${modelName}`);
    }

    // Need to handle lowercase model name convention of Prisma Client
    const delegateKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const delegate = (prisma as unknown as Record<string, unknown>)[delegateKey];

    if (!delegate) throw new Error(`Prisma delegate not found for ${delegateKey}`);

    await delegate.update({
        where: { id: targetLog.targetId },
        data: restorePatch
    });

    // 5. Log the restoration
    await logAdminAction(
        adminId,
        `RESTORE_${modelName.toUpperCase()}`,
        targetLog.targetId,
        {
            restoredToLogId: targetLog.id,
            revertedLogsCount: logsProcessed.length,
            revertedFields: Object.keys(restorePatch),
            patch: restorePatch
        },
        ip
    );

    return { restored: true, revertedCount: logsProcessed.length };
}
