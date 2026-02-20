import { FastifyInstance } from "fastify";
import { PlinkkSettings, prisma } from "@plinkk/prisma";
import { pickDefined } from "../../../../lib/plinkkUtils";
import { logUserAction, logDetailedAction } from "../../../../lib/userLogger";
import { themeNames, themeColors } from "../../../../lib/themeNames";
import { createPlinkkVersion } from "../../../services/historyService";
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
      links: links.map((l: any) => ({
        id: l.id,
        icon: l.icon,
        url: l.url,
        text: l.text,
        name: l.name,
        description: l.description,
        showDescriptionOnHover: l.showDescriptionOnHover,
        showDescription: l.showDescription,
        categoryId: l.categoryId,
        type: l.type,
        embedData: l.embedData,
        formData: l.formData,
        iosUrl: l.iosUrl,
        androidUrl: l.androidUrl,
        forceAppOpen: l.forceAppOpen,
        clickLimit: l.clickLimit,
        buttonTheme: l.buttonTheme,
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

    const currentSettings = await prisma.plinkkSettings.findUnique({ where: { plinkkId: id } });

    const toInt = (v: any) => { 
      if (v === undefined || v === null || v === "") return null;
      if (typeof v === 'boolean') return v ? 1 : 0;
      const parsed = parseInt(v);
      return isNaN(parsed) ? null : parsed;
    };

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
      degBackgroundColor: toInt(body.degBackgroundColor),
      neonEnable: toInt(body.neonEnable),
      buttonThemeEnable: toInt(body.buttonThemeEnable),
      EnableAnimationArticle: toInt(body.EnableAnimationArticle),
      EnableAnimationButton: toInt(body.EnableAnimationButton),
      EnableAnimationBackground: toInt(body.EnableAnimationBackground),
      backgroundSize: toInt(body.backgroundSize),
      selectedThemeIndex: toInt(body.selectedThemeIndex),
      selectedAnimationIndex: toInt(body.selectedAnimationIndex),
      selectedAnimationButtonIndex: toInt(body.selectedAnimationButtonIndex),
      selectedAnimationBackgroundIndex: toInt(body.selectedAnimationBackgroundIndex),
      animationDurationBackground: toInt(body.animationDurationBackground),
      delayAnimationButton: body.delayAnimationButton,
      canvaEnable: toInt(body.canvaEnable),
      selectedCanvasIndex: toInt(body.selectedCanvasIndex),
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
    let historyLabel = "Mise à jour configuration";

    // Compare data with currentSettings to find actual changes
    const realChanges: string[] = [];
    console.log('[Config] Data keys:', Object.keys(data));

    Object.keys(data).forEach(key => {
      // @ts-ignore
      const newVal = data[key];
      // @ts-ignore
      const oldVal = currentSettings ? currentSettings[key] : undefined;

      // Debug particular keys if needed
      // console.log(`[Config] Key: ${key}, New: ${newVal}, Old: ${oldVal}`);

      // Simple equality check, sufficient for primitives (strings, numbers, booleans)
      // If arrays (like layoutOrder), we need deeper check
      if (Array.isArray(newVal) && Array.isArray(oldVal)) {
        if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
          realChanges.push(key);
        }
      } else if (newVal != oldVal) { // Use loose equality to handle "1" == 1
        realChanges.push(key);
      }
    });

    console.log('[Config] Real Changes detected:', realChanges);

    if (realChanges.some(k => themeFields.includes(k))) {
      logAction = "UPDATE_PLINKK_THEME";
      historyLabel = "Modification du thème";

      // Enhance theme logging with details if index changed
      // Handle both number and string (if coming from relaxed JSON parsing)
      if (data.selectedThemeIndex !== undefined && data.selectedThemeIndex !== null) {
        try {
          const idx = Number(data.selectedThemeIndex);
          if (!isNaN(idx)) {
            // @ts-ignore
            data['themePreview'] = themeColors[idx];
          }
        } catch (e) {
          console.error("Failed to enhance theme log", e);
        }
      }
    } else if (realChanges.includes("description")) {
      historyLabel = "Mise à jour description";
    } else if (realChanges.includes("userName") || realChanges.includes("profileSiteText")) {
      historyLabel = "Mise à jour infos profil";
    }

    // Use shared logger
    await logDetailedAction(userId as string, logAction, id, oldData, data, request.ip);

    // Capture snapshot for history
    if (realChanges.length > 0) {
      console.log('[Config] Creating version with label:', historyLabel);
      const structuredChanges = realChanges.map(k => ({
        key: k,
        old: (currentSettings as any)?.[k],
        new: (data as any)?.[k],
        type: 'updated' as const
      }));
      createPlinkkVersion(id, userId as string, historyLabel, false, structuredChanges).catch(err => {
        console.error('[Config] Failed to create version:', err);
        request.log.error(err);
      });
    } else {
      console.log('[Config] No real changes, skipping version creation.');
    }

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

    let changed = false;
    const updates: any = {};
    const changesLog: any[] = [];

    if (body.layoutOrder !== undefined) {
      const oldOrder = currentSettings?.layoutOrder;
      const newOrder = body.layoutOrder;
      const orderChanged = JSON.stringify(oldOrder) !== JSON.stringify(newOrder);

      if (orderChanged) {
        updates.layoutOrder = newOrder;
        changed = true;
        changesLog.push({
          key: 'layoutOrder',
          old: oldOrder,
          new: newOrder,
          type: 'reordered' as const
        });
      }
    }


    if (changed) {
      await prisma.plinkkSettings.upsert({
        where: { plinkkId: id },
        create: { plinkkId: id, ...updates },
        update: updates,
      });

      await logDetailedAction(String(userId), "UPDATE_PLINKK_LAYOUT", id, currentSettings, updates, request.ip);

      createPlinkkVersion(id, String(userId), "Mise à jour agencement", false, changesLog).catch(err => request.log.error(err));
    }

    return reply.send({ ok: true });
  });

}
