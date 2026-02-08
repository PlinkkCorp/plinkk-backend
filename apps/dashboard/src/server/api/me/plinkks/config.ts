import { FastifyInstance } from "fastify";
import { PlinkkSettings, prisma } from "@plinkk/prisma";
import { pickDefined } from "../../../../lib/plinkkUtils";

export function plinkksConfigRoutes(fastify: FastifyInstance) {
  fastify.get("/:id/config", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({
      where: { id, userId: String(userId) },
    });
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });

    const [
      settings,
      user,
      background,
      neonColors,
      labels,
      socialIcon,
      statusbar,
      links,
      categories,
    ] = await Promise.all([
      prisma.plinkkSettings.findUnique({ where: { plinkkId: id } }),
      prisma.user.findUnique({ where: { id: String(userId) } }),
      prisma.backgroundColor.findMany({ where: { userId: String(userId), plinkkId: id } }),
      prisma.neonColor.findMany({ where: { userId: String(userId), plinkkId: id } }),
      prisma.label.findMany({ where: { userId: String(userId), plinkkId: id } }),
      prisma.socialIcon.findMany({ where: { userId: String(userId), plinkkId: id } }),
      prisma.plinkkStatusbar.findUnique({ where: { plinkkId: id } }),
      prisma.link.findMany({ where: { userId: String(userId), plinkkId: id } }),
      prisma.category.findMany({ where: { plinkkId: id }, orderBy: { order: "asc" } }),
    ]);

    const cfg = {
      profileLink: settings?.profileLink ?? null,
      profileImage: settings?.profileImage ?? null,
      profileIcon: settings?.profileIcon ?? null,
      profileSiteText: settings?.profileSiteText ?? null,
      userName: settings?.userName ?? user?.userName ?? null,
      email: settings?.affichageEmail ?? user?.publicEmail ?? user?.email ?? "",
      publicPhone: settings?.publicPhone ?? null,
      showVerifiedBadge: settings?.showVerifiedBadge ?? true,
      showPartnerBadge: settings?.showPartnerBadge ?? true,
      enableVCard: settings?.enableVCard ?? true,
      enableLinkCategories: settings?.enableLinkCategories ?? false,
      iconUrl: settings?.iconUrl ?? null,
      description: settings?.description ?? null,
      profileHoverColor: settings?.profileHoverColor ?? null,
      degBackgroundColor: settings?.degBackgroundColor ?? null,
      neonEnable: settings?.neonEnable ?? 0,
      buttonThemeEnable: settings?.buttonThemeEnable ?? 0,
      EnableAnimationArticle: settings?.EnableAnimationArticle ?? 0,
      EnableAnimationButton: settings?.EnableAnimationButton ?? 0,
      EnableAnimationBackground: settings?.EnableAnimationBackground ?? 0,
      backgroundSize: settings?.backgroundSize ?? null,
      selectedThemeIndex: settings?.selectedThemeIndex ?? null,
      selectedAnimationIndex: settings?.selectedAnimationIndex ?? null,
      selectedAnimationButtonIndex: settings?.selectedAnimationButtonIndex ?? null,
      selectedAnimationBackgroundIndex: settings?.selectedAnimationBackgroundIndex ?? null,
      animationDurationBackground: settings?.animationDurationBackground ?? null,
      delayAnimationButton: settings?.delayAnimationButton ?? null,
      canvaEnable: settings?.canvaEnable ?? 0,
      selectedCanvasIndex: settings?.selectedCanvasIndex ?? null,
      layoutOrder: settings?.layoutOrder ?? null,
      background: background.map((c) => c.color),
      neonColors: neonColors.map((c) => c.color),
      labels: labels.map((l) => ({ data: l.data, color: l.color, fontColor: l.fontColor })),
      socialIcon: socialIcon.map((s) => ({ url: s.url, icon: s.icon })),
      links: links.map((l) => ({
        id: l.id,
        icon: l.icon,
        url: l.url,
        text: l.text,
        name: l.name,
        description: l.description,
        showDescriptionOnHover: l.showDescriptionOnHover,
        showDescription: l.showDescription,
        categoryId: l.categoryId,
      })),
      categories: categories.map((c) => ({ id: c.id, name: c.name, order: c.order })),
      statusbar: statusbar
        ? {
            text: statusbar.text,
            colorBg: statusbar.colorBg,
            fontTextColor: statusbar.fontTextColor,
            statusText: statusbar.statusText,
          }
        : null,
    };
    return reply.send(cfg);
  });

  fastify.put("/:id/config/plinkk", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({ where: { id, userId: String(userId) } });
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as PlinkkSettings;

    const data = pickDefined({
      profileLink: body.profileLink,
      profileImage: body.profileImage,
      profileIcon: body.profileIcon,
      profileSiteText: body.profileSiteText,
      userName: body.userName,
      affichageEmail: body.affichageEmail,
      publicPhone: body.publicPhone,
      showVerifiedBadge: body.showVerifiedBadge,
      showPartnerBadge: body.showPartnerBadge,
      enableVCard: body.enableVCard,
      enableLinkCategories: body.enableLinkCategories,
      iconUrl: body.iconUrl,
      description: body.description,
      profileHoverColor: body.profileHoverColor,
      degBackgroundColor: body.degBackgroundColor,
      neonEnable: body.neonEnable,
      buttonThemeEnable: body.buttonThemeEnable,
      EnableAnimationArticle: body.EnableAnimationArticle,
      EnableAnimationButton: body.EnableAnimationButton,
      EnableAnimationBackground: body.EnableAnimationBackground,
      backgroundSize: body.backgroundSize,
      selectedThemeIndex: body.selectedThemeIndex,
      selectedAnimationIndex: body.selectedAnimationIndex,
      selectedAnimationButtonIndex: body.selectedAnimationButtonIndex,
      selectedAnimationBackgroundIndex: body.selectedAnimationBackgroundIndex,
      animationDurationBackground: body.animationDurationBackground,
      delayAnimationButton: body.delayAnimationButton,
      canvaEnable: body.canvaEnable,
      selectedCanvasIndex: body.selectedCanvasIndex,
      layoutOrder: body.layoutOrder,
    });

    if (Object.keys(data).length > 0) {
      await prisma.plinkkSettings.upsert({
        where: { plinkkId: id },
        create: { plinkkId: id, ...data },
        update: data,
      });
    }
    if (typeof body.userName === "string" && body.userName.trim()) {
      await prisma.plinkk.update({
        where: { id },
        data: { name: body.userName.trim() },
      });
    }

    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/layout", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({ where: { id, userId: String(userId) } });
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { layoutOrder?: string[] };
    if (body?.layoutOrder !== undefined) {
      await prisma.plinkkSettings.upsert({
        where: { plinkkId: id },
        create: { plinkkId: id, layoutOrder: body.layoutOrder },
        update: { layoutOrder: body.layoutOrder },
      });
    }
    return reply.send({ ok: true });
  });
}
