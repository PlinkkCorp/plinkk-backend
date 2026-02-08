import { PrismaClient, Role, Visibility } from "@plinkk/prisma";
import { RESERVED_SLUGS } from "./reservedSlugs";
import { isBannedSlug } from "./bannedSlugs";
import { profileData as profileConfig } from "./defaultConfig.js";
import {
  verifyRoleAdmin,
  verifyRoleDeveloper,
  verifyRolePartner,
} from "./verifyRole";
import { getMaxPlinkks } from "./premiumService";

export const MAX_PAGES_DEFAULT = 1;

export function slugify(input: string): string {
  return (input || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getMaxPagesForRole(role?: Role | null): number {
  if (verifyRoleAdmin(role)) return Infinity;
  if (verifyRoleDeveloper(role)) return 3;
  if (verifyRolePartner(role)) return 2;
  return MAX_PAGES_DEFAULT;
}

export async function getPublicPath(prisma: PrismaClient, userId: string): Promise<string> {
  const defaultPlinkk = await prisma.plinkk.findFirst({
    where: { userId, isDefault: true },
    select: { slug: true },
  });
  return defaultPlinkk?.slug || userId;
}

export async function recordPlinkkView(prisma: any, plinkkId: string, userId: string, request: any) {
  try {
    await prisma.pageStat.create({
      data: {
        plinkkId,
        eventType: "view",
        ip: String(request.ip || request.headers?.["x-forwarded-for"] || ""),
        meta: { userId },
      },
    });
  } catch (e) {
    request.log?.warn({ err: e }, "recordPlinkkView.pageStat failed");
  }
  try {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate();
    const dateObj = new Date(Date.UTC(y, m, d));
    await prisma.plinkkViewDaily.upsert({
      where: { plinkkId_date: { plinkkId, date: dateObj } },
      create: { plinkkId, date: dateObj, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch (e) {
    request.log?.warn({ err: e }, "recordPlinkkView.daily failed");
  }
}

export async function isReservedSlug(
  prisma: PrismaClient,
  slug: string
): Promise<boolean> {
  if (!slug) return true;
  if (RESERVED_SLUGS.has(slug)) return true;
  try {
    return await isBannedSlug(slug);
  } catch (e) {
    return RESERVED_SLUGS.has(slug);
  }
}

export async function suggestUniqueSlug(
  prisma: PrismaClient,
  userId: string,
  baseSlug: string
): Promise<string> {
  const base = baseSlug || "page";
  let i = 0;
  while (true) {
    const candidate = i === 0 ? base : `${base}-${i}`;
    const exists = await prisma.plinkk.findFirst({
      where: { userId, slug: candidate },
    });
    if (!exists) return candidate;
    i += 1;
  }
}

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

export async function suggestGloballyUniqueSlug(
  prisma: PrismaClient,
  baseSlug: string,
  excludePlinkkId?: string,
  allowCandidateIfUserId?: string
): Promise<string> {
  const base = baseSlug || "page";
  let i = 0;
  while (true) {
    const candidate = i === 0 ? base : `${base}-${i}`;
    if (await isReservedSlug(prisma, candidate)) {
      i++;
      continue;
    }
    const userHit = await prisma.user.findUnique({ where: { id: candidate } });
    if (userHit && userHit.id !== allowCandidateIfUserId) {
      i++;
      continue;
    }
    const plinkkHit = await prisma.plinkk.findFirst({
      where: {
        slug: candidate,
        ...(excludePlinkkId ? { NOT: { id: excludePlinkkId } } : {}),
      },
    });
    if (plinkkHit) {
      i++;
      continue;
    }
    return candidate;
  }
}

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
    include: { role: true },
  });
  if (!me) throw new Error("user_not_found");
  const count = await prisma.plinkk.count({ where: { userId } });
  const maxPages = getMaxPlinkks(me);
  if (count >= maxPages) throw new Error("max_pages_reached");
  const name = (opts.name || "Page").trim() || "Page";
  const base = slugify(opts.slugBase || name);
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
      visibility: opts.visibility || "PUBLIC",
      isPublic: (opts.visibility || "PUBLIC") === "PUBLIC",
    },
  });
  try {
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
          profileConfig.neonEnable ?? profileConfig.neonEnable === 0 ? 0 : 1,
        buttonThemeEnable: profileConfig.buttonThemeEnable,
        EnableAnimationArticle: profileConfig.EnableAnimationArticle,
        EnableAnimationButton: profileConfig.EnableAnimationButton,
        EnableAnimationBackground: profileConfig.EnableAnimationBackground,
        backgroundSize: profileConfig.backgroundSize,
        selectedThemeIndex: profileConfig.selectedThemeIndex,
        selectedAnimationIndex: profileConfig.selectedAnimationIndex,
        selectedAnimationButtonIndex:
          profileConfig.selectedAnimationButtonIndex,
        selectedAnimationBackgroundIndex:
          profileConfig.selectedAnimationBackgroundIndex,
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

export const pickDefined = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
