import { prisma } from "@plinkk/prisma";

export async function getPublicPath(userId: string): Promise<string> {
  const defaultPlinkk = await prisma.plinkk.findFirst({
    where: { userId, isDefault: true },
    select: { slug: true },
  });
  return defaultPlinkk?.slug || userId;
}

export async function getUserWithRole(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
}

export async function getUserWithRoleAndCosmetics(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, cosmetics: true },
  });
}
