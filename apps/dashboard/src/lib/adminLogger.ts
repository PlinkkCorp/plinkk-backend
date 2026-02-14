import { prisma, Prisma } from '@plinkk/prisma';
import { calculateObjectDiff } from './diffUtils';

export async function logAdminAction(adminId: string, action: string, targetId?: string, details?: any, ip?: string) {
  try {
    await prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetId,
        details: details ?? Prisma.DbNull,
        ip
      }
    });
  } catch (e) {
    console.error('Failed to create admin log:', e);
  }
}

/**
 * Logs an admin action with a detailed diff of changes.
 * @param adminId The ID of the admin performing the action
 * @param action The action name (e.g. "UPDATE_PROFILE")
 * @param targetId The ID of the object being modified (optional)
 * @param oldData The object state before change
 * @param newData The object state after change
 * @param ip The admin's IP address
 * @param extraDetails Any additional metadata to log
 */
export async function logDetailedAdminAction<T extends Record<string, any>>(
  adminId: string,
  action: string,
  targetId: string | undefined,
  oldData: Partial<T>,
  newData: Partial<T>,
  ip?: string,
  extraDetails?: Record<string, any>
) {
  try {
    // Only verify relevant changes
    const diff = calculateObjectDiff(oldData, newData, ['updatedAt', 'password', 'createdAt']);

    // If no changes, skip logging entirely to prevent spam
    if (Object.keys(diff).length === 0) {
      return;
    }

    // Generate explicit changes list for UI "Old -> New"
    const changes = Object.entries(diff).map(([key, value]) => {
      const oldVal = value.old === undefined ? 'null' : (typeof value.old === 'object' ? JSON.stringify(value.old) : String(value.old));
      const newVal = value.new === undefined ? 'null' : (typeof value.new === 'object' ? JSON.stringify(value.new) : String(value.new));
      return `${key}: ${oldVal} -> ${newVal}`;
    });

    const details = {
      diff,
      changes,
      ...extraDetails
    };

    await prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetId,
        details,
        ip
      }
    });
  } catch (e) {
    console.error(`Failed to create detailed admin log for ${action}:`, e);
  }
}
