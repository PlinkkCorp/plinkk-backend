import { prisma } from "@plinkk/prisma";

export async function getPublicPath(userId: string): Promise<string> {
  const defaultPlinkk = await prisma.plinkk.findFirst({
    where: { userId, isDefault: true },
    select: { slug: true },
  });
  return defaultPlinkk?.slug || userId;
}

export async function getPlinkksByUserId(userId: string) {
  return prisma.plinkk.findMany({
    where: { userId },
    include: { settings: true },
    orderBy: [{ isDefault: "desc" }, { index: "asc" }, { createdAt: "asc" }],
  });
}

export async function getPlinkkWithDetails(id: string, userId: string) {
  return prisma.plinkk.findFirst({
    where: { id, userId },
    include: {
      user: true,
      settings: true,
      links: true,
      background: true,
      labels: true,
      neonColors: true,
      socialIcons: true,
      statusbar: true,
      categories: true,
    },
  });
}

export async function getPlinkkConfig(plinkkId: string, userId: string) {
  const [settings, user, background, neonColors, labels, socialIcon, statusbar, links, categories] =
    await Promise.all([
      prisma.plinkkSettings.findUnique({ where: { plinkkId } }),
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.backgroundColor.findMany({ where: { userId, plinkkId } }),
      prisma.neonColor.findMany({ where: { userId, plinkkId } }),
      prisma.label.findMany({ where: { userId, plinkkId } }),
      prisma.socialIcon.findMany({ where: { userId, plinkkId } }),
      prisma.plinkkStatusbar.findUnique({ where: { plinkkId } }),
      prisma.link.findMany({ where: { userId, plinkkId } }),
      prisma.category.findMany({ where: { plinkkId }, orderBy: { order: "asc" } }),
    ]);

  return {
    settings,
    user,
    background: background.map((c) => ({ color: c.color, stop: c.stop })),
    neonColors,
    labels,
    socialIcon,
    statusbar,
    links,
    categories,
  };
}

export function getSelectedPlinkk(pages: any[], plinkkId?: string) {
  if (plinkkId) {
    const found = pages.find((p) => p.id === plinkkId);
    if (found) return found;
  }
  return pages.find((p) => p.isDefault) || pages.find((p) => p.index === 0) || pages[0] || null;
}

export function formatPlinkkForView(plinkk: any) {
  if (!plinkk) return null;
  const s = plinkk.settings || {};
  return {
    ...plinkk,
    affichageEmail: s.affichageEmail ?? null,
    backgroundType: s.backgroundType ?? 'color',
    backgroundImage: s.backgroundImage ?? '',
    backgroundVideo: s.backgroundVideo ?? '',
    canvaEnable: s.canvaEnable ?? 0,
    selectedCanvasIndex: s.selectedCanvasIndex ?? 0,
    selectedThemeIndex: s.selectedThemeIndex ?? 0,
    selectedAnimationIndex: s.selectedAnimationIndex ?? 0,
    selectedAnimationButtonIndex: s.selectedAnimationButtonIndex ?? 0,
    selectedAnimationBackgroundIndex: s.selectedAnimationBackgroundIndex ?? 0,
    fontFamily: s.fontFamily ?? '',
    buttonStyle: s.buttonStyle ?? 'rounded',
  };
}

export function formatPagesForView(pages: any[]) {
  return pages.map((p) => formatPlinkkForView(p));
}
