import { PrismaClient, User, Role, Cosmetic } from "@plinkk/prisma";
import crypto from "crypto";

export function getGravatarUrl(email: string) {
  if (!email) return null;
  const hash = crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}`;
}

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
