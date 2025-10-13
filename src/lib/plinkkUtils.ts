// Utilitaires liés aux pages Plinkk (profils secondaires)
import { PrismaClient, Role } from "../../generated/prisma/client";
import { RESERVED_SLUGS } from "./reservedSlugs";
import { isBannedSlug } from "./bannedSlugs";
import profileConfig from "../public/config/profileConfig";
import { verifyRoleAdmin, verifyRoleDeveloper, verifyRolePartner } from "./verifyRole";

export const MAX_PAGES_DEFAULT = 1; // default users can create 1 plinkk

export function slugify(input: string): string {
  return (input || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getMaxPagesForRole(role?: Role | null): number {
  // USER: 1, PARTNER: 2, DEVELOPER: 3, ADMIN: unlimited (represented by Infinity)
  if (verifyRoleAdmin(role)) return Infinity;
  if (verifyRoleDeveloper(role)) return 3;
  if (verifyRolePartner(role)) return 2;
  return MAX_PAGES_DEFAULT;
}

// Identifiants réservés (chemins, préfixes d'actifs, zones système)
// Vérifie si un slug est réservé (in-memory ou DB)
export async function isReservedSlug(
  prisma: PrismaClient,
  slug: string
): Promise<boolean> {
  if (!slug) return true;
  if (RESERVED_SLUGS.has(slug)) return true;
  try {
    // if DB has BannedSlug model, consider it as banned list
    return await isBannedSlug(slug);
  } catch (e) {
    return RESERVED_SLUGS.has(slug);
  }
}

// Suggestion de slug unique: ajoute -1, -2... (évite de sauter directement à -2)
export async function suggestUniqueSlug(prisma: PrismaClient, userId: string, baseSlug: string): Promise<string> {
  const base = baseSlug || "page";
  let i = 0;
  while (true) {
    const candidate = i === 0 ? base : `${base}-${i}`;
    const exists = await prisma.plinkk.findFirst({ where: { userId, slug: candidate } });
    if (!exists) return candidate;
    i += 1;
  }
}

// Attribue un index disponible (>0), 0 est réservé à la page par défaut
export async function getNextIndex(
  prisma: PrismaClient,
  userId: string
): Promise<number> {
  const pages = await prisma.plinkk.findMany({
    where: { userId },
    select: { index: true },
  });
  const used = new Set(pages.map((p) => p.index));
  let i = 1;
  while (used.has(i)) i++;
  return i;
}

// Réindexe toutes les pages non-défaut en séquence 1..N selon createdAt
export async function reindexNonDefault(
  prisma: PrismaClient,
  userId: string
): Promise<void> {
  const pages = await prisma.plinkk.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  let n = 1;
  for (const p of pages) {
    if (p.isDefault) {
      if (p.index !== 0) {
        await prisma.plinkk.update({ where: { id: p.id }, data: { index: 0 } });
      }
      continue;
    }
    if (p.index !== n) {
      await prisma.plinkk.update({ where: { id: p.id }, data: { index: n } });
    }
    n++;
  }
}

// Génère un slug unique à l'échelle du système (tous comptes), en ajoutant -1, -2... si nécessaire
export async function suggestGloballyUniqueSlug(
  prisma: PrismaClient,
  baseSlug: string,
  excludePlinkkId?: string,
  // allowCandidateIfUserId: if provided, a candidate equal to this user id will be permitted
  allowCandidateIfUserId?: string
): Promise<string> {
  const base = baseSlug || 'page';
  let i = 0;
  while (true) {
    const candidate = i === 0 ? base : `${base}-${i}`;
    // Éviter les mots réservés
    if (await isReservedSlug(prisma, candidate)) { i++; continue; }
    // Le slug ne doit pas entrer en conflit avec un @ (User.id)
    const userHit = await prisma.user.findUnique({ where: { id: candidate } });
    if (userHit && userHit.id !== allowCandidateIfUserId) { i++; continue; }
    // Le slug ne doit pas entrer en conflit avec un autre plinkk (global)
    const plinkkHit = await prisma.plinkk.findFirst({ where: { slug: candidate, ...(excludePlinkkId ? { NOT: { id: excludePlinkkId } } : {}) } });
    if (plinkkHit) { i++; continue; }
    return candidate;
  }
}

// Création centralisée d'un Plinkk (applique quota, slug global, défaut/index)
export async function createPlinkkForUser(
  prisma: PrismaClient,
  userId: string,
  opts: {
    name?: string;
    slugBase?: string;
    visibility?: "PUBLIC" | "PRIVATE";
    isActive?: boolean;
  }
) {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!me) throw new Error("user_not_found");
  const count = await prisma.plinkk.count({ where: { userId } });
  const maxPages = getMaxPagesForRole(me.role);
  if (count >= maxPages) throw new Error("max_pages_reached");
  const name = (opts.name || "Page").trim() || "Page";
  const base = slugify(opts.slugBase || name);
  // Allow the created user's id to be used as the plinkk slug for their main Plinkk
  const slug = await suggestGloballyUniqueSlug(prisma, base, undefined, userId);
  const isFirst = count === 0;
  const index = isFirst ? 0 : await getNextIndex(prisma, userId);
  const created = await prisma.plinkk.create({
    data: {
      userId,
      name,
      slug,
      index,
      isDefault: isFirst,
      isActive: opts.isActive ?? true,
      visibility: (opts.visibility || "PUBLIC"),
      isPublic: (opts.visibility || "PUBLIC") === "PUBLIC",
    },
  });
  try {
    // Create PlinkkSettings from example profileConfig (non-blocking)
    await prisma.plinkkSettings.create({
      data: {
        plinkkId: created.id,
        profileLink: profileConfig.profileLink,
        profileImage: profileConfig.profileImage,
        profileIcon: profileConfig.profileIcon,
        profileSiteText: profileConfig.profileSiteText,
        userName: profileConfig.userName,
        iconUrl: profileConfig.iconUrl,
        description: profileConfig.description,
        profileHoverColor: profileConfig.profileHoverColor,
        degBackgroundColor: profileConfig.degBackgroundColor,
        neonEnable:
          profileConfig.neonEnable ??
          profileConfig.neonEnable === 0
            ? 0
            : 1,
        buttonThemeEnable: profileConfig.buttonThemeEnable,
        EnableAnimationArticle: profileConfig.EnableAnimationArticle,
        EnableAnimationButton: profileConfig.EnableAnimationButton,
        EnableAnimationBackground: profileConfig.EnableAnimationBackground,
        backgroundSize: profileConfig.backgroundSize,
        selectedThemeIndex: profileConfig.selectedThemeIndex,
        selectedAnimationIndex: profileConfig.selectedAnimationIndex,
        selectedAnimationButtonIndex: profileConfig.selectedAnimationButtonIndex,
        selectedAnimationBackgroundIndex: profileConfig.selectedAnimationBackgroundIndex,
        animationDurationBackground: profileConfig.animationDurationBackground,
        delayAnimationButton: profileConfig.delayAnimationButton,
        canvaEnable: profileConfig.canvaEnable,
        selectedCanvasIndex: profileConfig.selectedCanvasIndex,
      },
    });
  } catch (e) {}
  if (isFirst) await reindexNonDefault(prisma, userId);
  return created;
}
