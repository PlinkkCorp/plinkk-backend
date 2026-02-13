import { prisma, Prisma } from '@plinkk/prisma';

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
