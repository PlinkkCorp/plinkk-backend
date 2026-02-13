import { FastifyInstance } from "fastify";
import { PlinkkSettings, prisma } from "@plinkk/prisma";
import { pickDefined } from "../../../../lib/plinkkUtils";
import { logUserAction, logDetailedAction } from "../../../../lib/userLogger";
// import { themeNames, themeColors } from "../../../../lib/themeNames";
// import { canUseVisualEffects } from "@plinkk/shared";

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

    // Suppression de la vérification premium pour les effets visuels (Néon, Canva, Animations)
    // Selon la demande utilisateur ces éléments doivent être gratuits.

    /*
    // Vérification premium pour les effets visuels
    const hasVisualEffectFields = (
      body.EnableAnimationArticle != null ||
      body.EnableAnimationButton != null ||
      body.EnableAnimationBackground != null ||
      body.selectedAnimationIndex != null ||
      body.selectedAnimationButtonIndex != null ||
      body.selectedAnimationBackgroundIndex != null ||
      body.canvaEnable != null ||
      body.selectedCanvasIndex != null ||
      body.neonEnable != null
    );

    if (hasVisualEffectFields) {
      const user = await prisma.user.findUnique({
        where: { id: String(userId) },
        include: { role: true },
      });
      if (!canUseVisualEffects(user)) {
        return reply.code(403).send({
          error: "premium_required",
          feature: "visual_effects",
          message: "Les effets visuels nécessitent un abonnement premium",
        });
      }
    }
    */

    const currentSettings = await prisma.plinkkSettings.findUnique({ where: { plinkkId: id } });

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

    // Construct oldData for detailed logging
    const oldData: Record<string, any> = {};
    if (currentSettings) {
      for (const key of Object.keys(data)) {
        // @ts-ignore
        oldData[key] = currentSettings[key];
      }
    }

    if (Object.keys(data).length > 0) {
      await prisma.plinkkSettings.upsert({
        where: { plinkkId: id },
        create: { plinkkId: id, ...data },
        update: data,
      });
    }

    // Check if userName (on plinkk model) changed
    // Add to data/oldData for logging purpose if changed
    if (typeof body.userName === "string" && body.userName.trim()) {
      const newName = body.userName.trim();
      if (page.name !== newName) {
        await prisma.plinkk.update({
          where: { id },
          data: { name: newName },
        });
        // Add to logging context
        // @ts-ignore
        oldData['plinkkName'] = page.name;
        // @ts-ignore
        data['plinkkName'] = newName;
      }
    }

    // Determine Action Type
    const themeFields = [
      'selectedThemeIndex', 'neonEnable', 'buttonThemeEnable',
      'EnableAnimationArticle', 'EnableAnimationButton', 'EnableAnimationBackground',
      'selectedAnimationIndex', 'selectedAnimationButtonIndex', 'selectedAnimationBackgroundIndex',
      'canvaEnable', 'selectedCanvasIndex', 'degBackgroundColor', 'backgroundSize',
      'animationDurationBackground', 'delayAnimationButton', 'profileHoverColor'
    ];

    let logAction = "UPDATE_PLINKK_CONFIG";
    const changedKeys = Object.keys(data); // data contains only fields that were sent/picked
    if (changedKeys.some(k => themeFields.includes(k))) {
      logAction = "UPDATE_PLINKK_THEME";

      // Enhance theme logging with details if index changed
      // Handle both number and string (if coming from relaxed JSON parsing)
      if (data.selectedThemeIndex !== undefined && data.selectedThemeIndex !== null) {
        try {
          // Import built-in themes (dynamic import or use what's available)
          // Since we can't easily import from shared in this context without build step issues sometimes,
          // we'll use a local mapping for names based on the shared file structure we saw.

          // Simple built-in theme colors mapping for preview
          const themeColors = [
            { bg: "rgba(255, 255, 255, 0.6)", btn: "#7289DA", text: "black" }, // 0
            { bg: "rgba(255, 223, 0, 0.6)", btn: "#FFA500", text: "black" }, // 1
            { bg: "rgba(255, 255, 255, 0.6)", btn: "#00FF00", text: "black" }, // 2
            { bg: "rgba(255, 255, 255, 0.8)", btn: "#00A0DC", text: "black" }, // 3
            { bg: "rgba(255, 0, 0, 0.6)", btn: "#FF0000", text: "black" }, // 4
            { bg: "rgba(173, 216, 230, 0.6)", btn: "#87CEFA", text: "black" }, // 5
            { bg: "rgba(255, 255, 255, 0.9)", btn: "#FF4500", text: "black" }, // 6
            { bg: "rgba(255, 165, 0, 0.6)", btn: "#FFA500", text: "black" }, // 7
            { bg: "rgba(211, 211, 211, 0.5)", btn: "#A9A9A9", text: "black" }, // 8
            { bg: "rgba(255, 255, 255, 0.6)", btn: "#00FF00", text: "black" }, // 9
            { bg: "rgba(255, 255, 255, 0.6)", btn: "#ADD8E6", text: "black" }, // 10
            { bg: "rgba(255, 255, 255, 0.6)", btn: "#A0522D", text: "black" }, // 11
            { bg: "rgba(255, 182, 193, 0.6)", btn: "#FF69B4", text: "black" }, // 12
            { bg: "rgba(255, 255, 255, 0.6)", btn: "#800080", text: "black" }, // 13
            { bg: "#e6d5d5", btn: "#8a7272", text: "black" }, // 14
          ];

          const idx = Number(data.selectedThemeIndex);
          if (!isNaN(idx)) {
            // @ts-ignore
            data['themePreview'] = themeColors[idx];
          }
        } catch (e) {
          console.error("Failed to enhance theme log", e);
        }
      }
    }

    // Use shared logger
    await logDetailedAction(userId as string, logAction, id, oldData, data, request.ip);

    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/layout", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({ where: { id, userId: String(userId) } });
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });

    const currentSettings = await prisma.plinkkSettings.findUnique({ where: { plinkkId: id } });
    const body = request.body as { layoutOrder?: string[] };

    if (body?.layoutOrder !== undefined) {
      const oldData = { layoutOrder: currentSettings?.layoutOrder };
      const newData = { layoutOrder: body.layoutOrder };

      await prisma.plinkkSettings.upsert({
        where: { plinkkId: id },
        create: { plinkkId: id, layoutOrder: body.layoutOrder },
        update: { layoutOrder: body.layoutOrder },
      });

      await logDetailedAction(userId as string, "UPDATE_PLINKK_LAYOUT", id, oldData, newData, request.ip);
    }

    return reply.send({ ok: true });
  });
}
