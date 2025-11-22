import { PrismaClient, Prisma } from '@plinkk/prisma/generated/prisma/client';

const prisma = new PrismaClient();

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
