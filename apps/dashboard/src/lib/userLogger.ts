import { prisma, Prisma } from '@plinkk/prisma';

import { calculateObjectDiff } from './diffUtils';

export async function logUserAction(userId: string, action: string, targetId?: string, details?: any, ip?: string) {
  try {
    await prisma.userLog.create({
      data: {
        userId,
        action,
        targetId,
        details: details ?? Prisma.DbNull,
        ip
      }
    });
  } catch (e) {
    console.error('Failed to create user log:', e);
  }
}

/**
 * Logs a user action with a detailed diff of changes.
 * @param userId The ID of the user performing the action
 * @param action The action name (e.g. "UPDATE_PROFILE")
 * @param targetId The ID of the object being modified (optional)
 * @param oldData The object state before change
 * @param newData The object state after change
 * @param ip The user's IP address
 * @param extraDetails Any additional metadata to log
 */
export async function logDetailedAction<T extends Record<string, any>>(
  userId: string,
  action: string,
  targetId: string | undefined,
  oldData: Partial<T>,
  newData: Partial<T>,
  ip?: string,
  extraDetails?: Record<string, any>
) {
  try {
    const diff = calculateObjectDiff(oldData, newData, ['updatedAt', 'password']); // Exclude common noise/sensitive fields

    // If no changes, skip logging entirely to prevent spam
    if (Object.keys(diff).length === 0) {
      return;
    }

    // Generate human-readable formatted message
    const changesCount = Object.keys(diff).length;
    const fields = Object.keys(diff).slice(0, 3).join(", ");
    const suffix = changesCount > 3 ? ` and ${changesCount - 3} more` : "";
    const formatted = `Updated ${fields}${suffix}`;

    // Improve formatting for Create/Delete actions
    let specificFormatted = formatted;
    if (action.startsWith("CREATE")) {
      specificFormatted = `Created item with ${changesCount} properties`;
    } else if (action.startsWith("DELETE")) {
      specificFormatted = `Deleted item`;
    }

    // Infer category from action
    let category = "GENERAL";
    if (action.includes("PLINKK")) category = "PLINKK";
    else if (action.includes("REDIRECT")) category = "REDIRECT";
    else if (action.includes("PASSWORD") || action.includes("2FA") || action.includes("EMAIL") || action.includes("VISIBILITY")) category = "SECURITY";
    else if (action.includes("PROFILE") || action.includes("USERNAME") || action.includes("COSMETICS") || action.includes("GRAVATAR")) category = "PROFILE";
    else if (action.includes("PREMIUM") || action.includes("BILLING")) category = "BILLING";

    // Generate explicit changes list for UI "Old -> New"
    const changes = Object.entries(diff).map(([key, value]) => {
      const oldVal = JSON.stringify(value.old) || "null";
      const newVal = JSON.stringify(value.new) || "null";
      // Clean up quotes for strings if simple
      const cleanOld = typeof value.old === 'string' ? value.old : oldVal;
      const cleanNew = typeof value.new === 'string' ? value.new : newVal;
      return `${key}: ${cleanOld} -> ${cleanNew}`;
    });

    const details = {
      diff,
      formatted: extraDetails?.formatted || specificFormatted,
      changes,
      category,
      ...extraDetails
    };

    await prisma.userLog.create({
      data: {
        userId,
        action,
        targetId,
        details,
        ip
      }
    });
  } catch (e) {
    console.error(`Failed to create detailed user log for ${action}:`, e);
  }
}
