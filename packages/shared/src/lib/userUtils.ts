import { PrismaClient, User, Role, Cosmetic } from "@plinkk/prisma";

export async function getUserWithRole(prisma: PrismaClient, userId: string): Promise<(User & { role: Role | null }) | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
}

export async function getUserWithRoleAndCosmetics(prisma: PrismaClient, userId: string): Promise<(User & { role: Role | null, cosmetics: Cosmetic | null }) | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, cosmetics: true },
  });
}
