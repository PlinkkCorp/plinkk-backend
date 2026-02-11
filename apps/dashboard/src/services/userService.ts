import { prisma } from "@plinkk/prisma";
import { userCache } from "../lib/cache";

export interface UserBasicInfo {
  id: string;
  userName: string;
  email: string;
  publicEmail: string | null;
  isPublic: boolean;
  isVerified: boolean;
  isPartner: boolean;
  isPremium: boolean;
  premiumUntil: Date | null;
  createdAt: Date;
  role: {
    id: string;
    name: string;
    priority: number;
  } | null;
}

export interface UserWithPlinkks extends UserBasicInfo {
  plinkks: {
    id: string;
    name: string;
    slug: string;
    isDefault: boolean;
    isActive: boolean;
    views: number;
  }[];
}

const USER_SAFE_SELECT = {
  id: true,
  userName: true,
  email: true,
  publicEmail: true,
  isPublic: true,
  isVerified: true,
  isPartner: true,
  isPremium: true,
  premiumUntil: true,
  createdAt: true,
  twoFactorEnabled: true,
  role: {
    select: {
      id: true,
      name: true,
      priority: true,
    },
  },
};

const USER_WITH_PLINKKS_SELECT = {
  ...USER_SAFE_SELECT,
  plinkks: {
    select: {
      id: true,
      name: true,
      slug: true,
      isDefault: true,
      isActive: true,
      views: true,
    },
  },
};

export async function findUserById(userId: string) {
  const cacheKey = `user:${userId}`;
  const cached = userCache.get(cacheKey);
  if (cached) return cached;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SAFE_SELECT,
  });

  if (user) userCache.set(cacheKey, user);
  return user;
}

export async function findUserWithRole(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
}

export async function findUserWithRoleAndCosmetics(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, cosmetics: true },
  });
}

export async function findAllUsersForAdmin(): Promise<UserWithPlinkks[]> {
  const users = await prisma.user.findMany({
    select: USER_WITH_PLINKKS_SELECT,
    orderBy: { createdAt: "desc" },
  });
  return users as UserWithPlinkks[];
}

export async function searchUsers(query: string, limit: number = 8) {
  if (!query.trim()) return [];
  const take = Math.min(10, Math.max(1, limit));
  return prisma.user.findMany({
    where: {
      OR: [
        { id: { contains: query } },
        { userName: { contains: query } },
        { email: { contains: query } },
      ],
    },
    select: {
      id: true,
      userName: true,
      email: true,
      role: true,
      image: true,
    },
    take,
    orderBy: { createdAt: "asc" },
  });
}

export async function getUserStats() {
  const [totalUsers, totalPublic, allRoles] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isPublic: true } }),
    prisma.role.findMany({
      where: { name: { in: ["ADMIN", "DEVELOPER", "MODERATOR"] } },
      include: { users: true },
    }),
  ]);

  const moderatorsRole = allRoles.find((r) => r.name === "MODERATOR");
  const moderators = moderatorsRole?.users?.length || 0;

  return {
    totalUsers,
    totalPublic,
    totalPrivate: totalUsers - totalPublic,
    moderators,
  };
}

export function invalidateUserCache(userId: string) {
  userCache.delete(`user:${userId}`);
}
