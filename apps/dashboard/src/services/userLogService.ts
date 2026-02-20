
import { prisma, Prisma } from '@plinkk/prisma';
import { logUserAction } from '../lib/userLogger';

// helper types for log restoration
interface DiffObject { [key: string]: unknown; }
interface LogDetails { diff?: DiffObject; }

function isLogDetails(d: unknown): d is LogDetails {
    return d !== null && typeof d === 'object' && 'diff' in d;
}


/**
 * Restore a Plinkk (or related entity) to the state of a specific log entry
 * by undoing all subsequent changes.
 */
export async function restoreUserLogState(logId: string, userId: string, ip?: string) {
    // 1. Fetch the target log
    const targetLog = await prisma.userLog.findUnique({
        where: { id: logId }
    });

    if (!targetLog) {
        throw new Error('Log not found');
    }

    if (targetLog.userId !== userId) {
        throw new Error('Unauthorized');
    }

    if (!targetLog.targetId) {
        throw new Error('This log has no target ID, cannot restore state.');
    }

    // 2. Fetch all subsequent logs for this target
    // We need to revert them in reverse order (Newest -> Oldest relative to target)
    // Actually, to "undo" a stack of actions:
    // Action 1 (Target) -> Action 2 -> Action 3 (Latest)
    // We want to return to state AFTER Action 1.
    // So we must Undo Action 3, then Undo Action 2.
    // So we fetch logs created AFTER targetLog, ordered by createdAt DESC (Newest first).
    const subsequentLogs = await prisma.userLog.findMany({
        where: {
            targetId: targetLog.targetId,
            createdAt: { gt: targetLog.createdAt },
        },
        orderBy: { createdAt: 'desc' }
    });

    if (subsequentLogs.length === 0) {
        return { restored: false, message: 'No subsequent modifications found to revert. You are already at this state.' };
    }

    let revertedCount = 0;

    // 3. Process each log to undo it
    for (const log of subsequentLogs) {
        const details = log.details;
        if (!isLogDetails(details) || !details.diff) continue;

        const diff = details.diff;

        try {
            if (log.action === 'UPDATE_PLINKK_LINKS') {
                await revertArrayChanges(diff, 'link');
            } else if (log.action === 'UPDATE_PLINKK_CATEGORIES') {
                await revertArrayChanges(diff, 'category');
            } else if (log.action === 'UPDATE_PLINKK_SOCIALS') {

                // settings.ts wipes and recreates, but logs "changes".
                // Wait, settings.ts diff for Socials was:
                // changes = { old: [...], new: [...] } -> simple object diff of arrays?
                // It was NOT using calculateArrayDiff!
                // See settings.ts line 140: const changes = { old: ..., new: ... };
                // This is NOT the structure expected by revertArrayChanges (added/removed/updated).
                // We need to handle this "Swap" style diff.
                await revertSwapDiff(diff, 'socialIcon', targetLog.targetId, userId);
            } else if (log.action === 'UPDATE_PLINKK_LABELS') {
                // Similar to Socials: old/new arrays.
                await revertSwapDiff(diff, 'label', targetLog.targetId, userId);
            } else if (log.action === 'UPDATE_PLINKK_NEON') {
                // settings.ts line 388: changes = { added: [], removed: [] } -> partial array diff but manual.
                // diff structure in log: { neonColors: { added: [], removed: [] } }
                // Need specific handler.
                if (diff.neonColors) {
                    await revertManualArrayDiff(diff.neonColors, 'neonColor', 'color', targetLog.targetId, userId);
                }
            } else if (log.action === 'UPDATE_PLINKK_BACKGROUND') {
                // diff: { background: { added, removed } }
                if (diff.background) {
                    await revertManualArrayDiff(diff.background, 'backgroundColor', 'color', targetLog.targetId, userId);
                }
            } else if (log.action === 'UPDATE_PLINKK_STATUSBAR') {
                // Object diff.
                await revertFlatUpdate('plinkkStatusbar', { plinkkId: targetLog.targetId }, diff);
            } else if (log.action.startsWith('UPDATE_PLINKK')) {
                // Default: Flat update on Plinkk model
                await revertFlatUpdate('plinkk', { id: targetLog.targetId }, diff);
            }

            revertedCount++;
        } catch (err) {
            console.error(`Failed to revert log ${log.id}:`, err);
            // Continue or abort? Abort seems safer to avoid partial inconsistent state.
            throw err;
        }
    }

    // 5. Log the restoration
    await logUserAction(
        userId,
        `RESTORE_PLINKK`, // Generic action for now
        targetLog.targetId,
        {
            restoredToLogId: targetLog.id,
            revertedLogsCount: revertedCount,
            formatted: `Restored state from ${new Date(targetLog.createdAt).toLocaleDateString()}`
        },
        ip
    );

    return { restored: true, revertedCount };
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

async function revertFlatUpdate(modelName: string, where: any, diff: DiffObject) {
    const patch: Record<string, unknown> = {};
    for (const [key, change] of Object.entries(diff)) {
        if (change && typeof change === 'object' && 'old' in change) {
            patch[key] = (change as { old: unknown }).old;
        }
    }
    if (Object.keys(patch).length > 0) {
        // @ts-ignore
        await prisma[modelName].update({
            where,
            data: patch
        });
    }
}

/**
 * Reverts changes from calculateArrayDiff (added, removed, updated).
 */
async function revertArrayChanges(diff: any, modelName: string) {
    // 1. Revert 'added' -> Delete them
    if (diff.added && diff.added.length > 0) {
        const ids = diff.added.map((item: any) => item.id);
        // @ts-ignore
        await prisma[modelName].deleteMany({
            where: { id: { in: ids } }
        });
    }

    // 2. Revert 'removed' -> Create them back
    if (diff.removed && diff.removed.length > 0) {
        // We need to insert them.
        // Assuming the 'removed' items contain all necessary fields (userId, plinkkId, etc.)
        // calculateArrayDiff stores the full object.
        for (const item of diff.removed) {
            // We use create (not createMany) to handle potential relation quirks or just to be safe
            // omit 'id' if auto-generated? No, usually we want to restore SAME ID if possible to preserve relations.
            // If ID is UUID, we can set it.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { ...data } = item;
            // Try to restore with original ID
            try {
                // @ts-ignore
                await prisma[modelName].create({ data });
            } catch (e) {
                // If ID conflict/exists (shouldn't happen if we are reverting deletion), handle it.
                // Or if foreign key failure (Category deleted?).
                console.warn(`Could not restore ${modelName} ${item.id}`, e);
                // Fallback: Create without ID? No, references would break.
            }
        }
    }

    // 3. Revert 'updated' -> Apply old values
    if (diff.updated && diff.updated.length > 0) {
        for (const update of diff.updated) {
            const { id, changes } = update;
            const patch: any = {};
            for (const [key, change] of Object.entries(changes as Record<string, any>)) {
                if (change && 'old' in change) {
                    patch[key] = change.old;
                }
            }
            if (Object.keys(patch).length > 0) {
                // @ts-ignore
                await prisma[modelName].update({
                    where: { id },
                    data: patch
                });
            }
        }
    }

    // 4. Revert 'reordered' -> Not easily doable without 'old' order map?
    // calculateArrayDiff detects reorder but doesn't store "Old Order Map".
    // However, if we revert 'updated', and 'order' field was updated, it SHOULD be covered by step 3!
    // Reordering usually changes 'order' field.
}

/**
 * Reverts "Swap" style diffs ({ old: [], new: [] }).
 * This implies a full wipe and recreate happened (like Socials/Labels in settings.ts).
 * To revert: Delete current (new), Restore original (old).
 */
async function revertSwapDiff(diff: any, modelName: string, plinkkId: string, userId: string) {
    // diff is { old: [...], new: [...] }
    if (!diff.old) return; // Can't restore without old data

    // 1. Wipe current (all for this plinkk)
    // @ts-ignore
    await prisma[modelName].deleteMany({
        where: { plinkkId, userId }
    });

    // 2. Insert 'old'
    if (diff.old.length > 0) {
        // Clean data: remove IDs if they were auto-generated and we want fresh ones?
        // Or if we want to restore exactly. 
        // labels/socials in settings.ts seem to not care about IDs (no ID diffing).
        const dataToInsert = diff.old.map((item: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, createdAt, updatedAt, ...rest } = item;
            // We likely need to re-attach plinkkId/userId if missing, but they should be in 'rest' if captured from DB?
            // settings.ts: oldLabels = prisma.label.findMany(...) -> has all fields.
            return { ...rest, plinkkId, userId };
        });

        // @ts-ignore
        await prisma[modelName].createMany({
            data: dataToInsert
        });
    }
}

/**
 * Reverts "Manual Array" diffs ({ added: [], removed: [] }) for simple lists (Neon, Bg).
 */
async function revertManualArrayDiff(diff: any, modelName: string, valueField: string, plinkkId: string, userId: string) {
    // 1. Revert 'added' -> Delete
    if (diff.added && diff.added.length > 0) {
        // @ts-ignore
        await prisma[modelName].deleteMany({
            where: {
                plinkkId,
                userId,
                [valueField]: { in: diff.added }
            }
        });
    }

    // 2. Revert 'removed' -> Create
    if (diff.removed && diff.removed.length > 0) {
        const data = diff.removed.map((val: string) => ({
            plinkkId,
            userId,
            [valueField]: val
        }));
        // @ts-ignore
        await prisma[modelName].createMany({ data });
    }
}
