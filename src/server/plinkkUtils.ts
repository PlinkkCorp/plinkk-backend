// Utilitaires liés aux pages Plinkk (profils secondaires)
import { PrismaClient, Role } from "../../generated/prisma/client";
import { RESERVED_SLUGS } from "./reservedSlugs";
import { isBannedSlug } from "./bannedSlugs";
import profileConfig from "../public/config/profileConfig";

export const MAX_PAGES_DEFAULT = 2;

export function slugify(input: string): string {
  return (input || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isAdminLike(role?: Role | null): boolean {
  return role === "ADMIN" || role === "DEVELOPER" || role === "MODERATOR";
}

export function isPartener(role?: Role | null): boolean {
  return role === "PARTNER";
}

export function getMaxPagesForRole(role?: Role | null): number {
  return isAdminLike(role) ? 100 : isPartener(role) ? 5 : MAX_PAGES_DEFAULT;
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

// Suggestion de slug unique: ajoute -1, -2...
export async function suggestUniqueSlug(
  prisma: PrismaClient,
  userId: string,
  baseSlug: string
): Promise<string> {
  let candidate = baseSlug || "page";
  let i = 1;
  while (true) {
    const exists = await prisma.plinkk.findFirst({
      where: { userId, slug: candidate },
    });
    if (!exists) return candidate;
    i += 1;
    candidate = `${baseSlug}-${i}`;
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

// Génère un slug unique à l'échelle du système (tous comptes), en ajoutant -2, -3 si nécessaire
export async function suggestGloballyUniqueSlug(
  prisma: PrismaClient,
  baseSlug: string,
  excludePlinkkId?: string
): Promise<string> {
  const base = baseSlug || "page";
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
    // Éviter les mots réservés
    if (await isReservedSlug(prisma, candidate)) {
      suffix++;
      continue;
    }
    // Le slug ne doit pas entrer en conflit avec un @ (User.id)
    const userHit = await prisma.user.findUnique({ where: { id: candidate } });
    if (userHit) {
      suffix++;
      continue;
    }
    // Le slug ne doit pas entrer en conflit avec un autre plinkk (global)
    const plinkkHit = await prisma.plinkk.findFirst({
      where: {
        slug: candidate,
        ...(excludePlinkkId ? { NOT: { id: excludePlinkkId } } : {}),
      },
    });
    if (plinkkHit) {
      suffix++;
      continue;
    }
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
  const slug = await suggestGloballyUniqueSlug(prisma, base);
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
      visibility: (opts.visibility || "PUBLIC") as any,
      isPublic: (opts.visibility || "PUBLIC") === "PUBLIC",
    },
  });
  try {
    // Create PlinkkSettings from example profileConfig (non-blocking)
    await prisma.plinkkSettings.create({
      data: {
        plinkkId: created.id,
        profileLink: (profileConfig as any).profileLink,
        profileImage: (profileConfig as any).profileImage,
        profileIcon: (profileConfig as any).profileIcon,
        profileSiteText: (profileConfig as any).profileSiteText,
        userName: (profileConfig as any).userName,
        iconUrl: (profileConfig as any).iconUrl,
        description: (profileConfig as any).description,
        profileHoverColor: (profileConfig as any).profileHoverColor,
        degBackgroundColor: (profileConfig as any).degBackgroundColor,
        neonEnable:
          (profileConfig as any).neonEnable ??
          (profileConfig as any).neonEnable === 0
            ? 0
            : 1,
        buttonThemeEnable: (profileConfig as any).buttonThemeEnable,
        EnableAnimationArticle: (profileConfig as any).EnableAnimationArticle,
        EnableAnimationButton: (profileConfig as any).EnableAnimationButton,
        EnableAnimationBackground: (profileConfig as any)
          .EnableAnimationBackground,
        backgroundSize: (profileConfig as any).backgroundSize,
        selectedThemeIndex: (profileConfig as any).selectedThemeIndex,
        selectedAnimationIndex: (profileConfig as any).selectedAnimationIndex,
        selectedAnimationButtonIndex: (profileConfig as any)
          .selectedAnimationButtonIndex,
        selectedAnimationBackgroundIndex: (profileConfig as any)
          .selectedAnimationBackgroundIndex,
        animationDurationBackground: (profileConfig as any)
          .animationDurationBackground,
        delayAnimationButton: (profileConfig as any).delayAnimationButton,
        canvaEnable: (profileConfig as any).canvaEnable,
        selectedCanvasIndex: (profileConfig as any).selectedCanvasIndex,
      },
    });
  } catch (e) {}
  if (isFirst) await reindexNonDefault(prisma, userId);
  return created;
}
