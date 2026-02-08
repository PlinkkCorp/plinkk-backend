import { prisma, Role } from "@plinkk/prisma";
import { isBannedSlug } from "./bannedSlugs";
import { RESERVED_SLUGS } from "./reservedSlugs";
import { verifyRoleAdmin, verifyRoleDeveloper, verifyRolePartner } from "./verifyRole";

export const MAX_REDIRECTS_DEFAULT = 5;
export const MAX_REDIRECTS_PARTNER = 20;
export const MAX_REDIRECTS_EXTENDED = 100;

/**
 * Retourne le nombre maximum de redirections autorisées pour un rôle donné
 */
export function getMaxRedirectsForRole(role?: Role | null): number {
  if (role && typeof role.maxRedirects === 'number') {
    return role.maxRedirects;
  }
  if (verifyRoleAdmin(role) || verifyRoleDeveloper(role)) return MAX_REDIRECTS_EXTENDED;
  if (verifyRolePartner(role)) return MAX_REDIRECTS_PARTNER;
  return MAX_REDIRECTS_DEFAULT;
}

/**
 * Vérifie si un slug de redirection est disponible
 * @returns { available: boolean, reason?: string }
 */
export async function isRedirectSlugAvailable(
  slug: string,
  excludeRedirectId?: string
): Promise<{ available: boolean; reason?: string }> {
  if (!slug || slug.length < 2) {
    return { available: false, reason: "slug_too_short" };
  }
  
  if (slug.length > 50) {
    return { available: false, reason: "slug_too_long" };
  }
  
  // Vérifier le format du slug (alphanum + tirets)
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{1,2}$/.test(slug)) {
    return { available: false, reason: "slug_invalid_format" };
  }
  
  // Vérifier si c'est un slug réservé du système
  if (RESERVED_SLUGS.has(slug)) {
    return { available: false, reason: "slug_reserved" };
  }
  
  // Vérifier si c'est un slug banni
  try {
    if (await isBannedSlug(slug)) {
      return { available: false, reason: "slug_banned" };
    }
  } catch (e) {
    // Ignorer l'erreur si la table n'existe pas
  }
  
  // Vérifier si une redirection existe déjà avec ce slug
  const existingRedirect = await prisma.redirect.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existingRedirect && existingRedirect.id !== excludeRedirectId) {
    return { available: false, reason: "slug_already_taken" };
  }
  
  return { available: true };
}

/**
 * Crée une nouvelle redirection
 */
export async function createRedirect(
  userId: string,
  slug: string,
  targetUrl: string,
  options?: { title?: string; description?: string; expiresAt?: Date }
) {
  return prisma.redirect.create({
    data: {
      slug,
      targetUrl,
      userId,
      title: options?.title,
      description: options?.description,
      expiresAt: options?.expiresAt,
    },
  });
}

/**
 * Met à jour une redirection
 */
export async function updateRedirect(
  redirectId: string,
  data: {
    slug?: string;
    targetUrl?: string;
    title?: string;
    description?: string;
    isActive?: boolean;
    expiresAt?: Date | null;
  }
) {
  return prisma.redirect.update({
    where: { id: redirectId },
    data,
  });
}

/**
 * Supprime une redirection
 */
export async function deleteRedirect(redirectId: string) {
  return prisma.redirect.delete({
    where: { id: redirectId },
  });
}

/**
 * Récupère les redirections d'un utilisateur
 */
export async function getUserRedirects(userId: string) {
  return prisma.redirect.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Récupère une redirection par son slug
 */
export async function getRedirectBySlug(slug: string) {
  return prisma.redirect.findUnique({
    where: { slug },
    include: { user: { select: { id: true, userName: true } } },
  });
}

/**
 * Enregistre un clic sur une redirection
 */
export async function recordRedirectClick(redirectId: string, request?: any) {
  // Incrémenter le compteur global
  await prisma.redirect.update({
    where: { id: redirectId },
    data: { clicks: { increment: 1 } },
  });
  
  // Enregistrer dans les stats journalières
  try {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate();
    const dateObj = new Date(Date.UTC(y, m, d));
    
    await prisma.redirectClickDaily.upsert({
      where: { redirectId_date: { redirectId, date: dateObj } },
      create: { redirectId, date: dateObj, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch (e) {
    request?.log?.warn({ err: e }, "recordRedirectClick.daily failed");
  }
}

/**
 * Récupère les statistiques d'une redirection
 */
export async function getRedirectStats(redirectId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  const dailyStats = await prisma.redirectClickDaily.findMany({
    where: {
      redirectId,
      date: { gte: since },
    },
    orderBy: { date: "asc" },
  });
  
  const redirect = await prisma.redirect.findUnique({
    where: { id: redirectId },
    select: { clicks: true, createdAt: true },
  });
  
  return {
    totalClicks: redirect?.clicks || 0,
    createdAt: redirect?.createdAt,
    dailyStats: dailyStats.map((s) => ({
      date: s.date.toISOString().split("T")[0],
      count: s.count,
    })),
  };
}

/**
 * Compte le nombre de redirections d'un utilisateur
 */
export async function countUserRedirects(userId: string): Promise<number> {
  return prisma.redirect.count({ where: { userId } });
}
