import { prisma } from "@plinkk/prisma";
import { themeCache } from "../lib/cache";

export async function getThemesForUser(userId?: string) {
  const cacheKey = `themes:${userId || "guest"}`;
  const cached = themeCache.get(cacheKey);
  if (cached) return cached;

  const [community, mine] = await Promise.all([
    prisma.theme.findMany({
      where: { status: "APPROVED", isPrivate: false },
      select: {
        id: true,
        name: true,
        description: true,
        data: true,
        author: { select: { id: true, userName: true } },
      },
      orderBy: { name: "asc" },
    }),
    userId
      ? prisma.theme.findMany({
          where: { authorId: userId, isPrivate: true },
          select: {
            id: true,
            name: true,
            description: true,
            data: true,
          },
          orderBy: { name: "asc" },
        })
      : [],
  ]);

  const result = { community, mine };
  themeCache.set(cacheKey, result);
  return result;
}

export async function getSubmittedThemes() {
  return prisma.theme.findMany({
    where: { status: "SUBMITTED", isPrivate: false },
    select: {
      id: true,
      name: true,
      description: true,
      author: { select: { id: true, userName: true } },
      updatedAt: true,
      data: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getApprovedThemes() {
  return prisma.theme.findMany({
    where: { status: "APPROVED", isPrivate: false },
    select: {
      id: true,
      name: true,
      description: true,
      author: { select: { id: true, userName: true } },
      updatedAt: true,
      data: true,
      pendingUpdate: true,
      pendingUpdateAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getArchivedThemes() {
  return prisma.theme.findMany({
    where: { status: "ARCHIVED", isPrivate: false },
    select: {
      id: true,
      name: true,
      description: true,
      author: { select: { id: true, userName: true } },
      updatedAt: true,
      data: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getRejectedThemes() {
  return prisma.theme.findMany({
    where: { status: "REJECTED", isPrivate: false },
    select: {
      id: true,
      name: true,
      description: true,
      author: { select: { id: true, userName: true } },
      updatedAt: true,
      data: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getThemeById(id: string) {
  return prisma.theme.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      data: true,
      author: { select: { id: true, userName: true } },
      status: true,
      pendingUpdate: true,
      isPrivate: true,
    },
  });
}

export async function getPendingThemesPreview(limit: number = 10) {
  return prisma.theme.findMany({
    where: { status: "SUBMITTED", isPrivate: false },
    select: {
      id: true,
      name: true,
      description: true,
      authorId: true,
      data: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export function invalidateThemeCache(userId?: string) {
  if (userId) {
    themeCache.delete(`themes:${userId}`);
  }
  themeCache.delete("themes:guest");
}
