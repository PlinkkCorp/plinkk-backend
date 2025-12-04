import { FastifyInstance } from "fastify";
import {
  Label,
  Link,
  NeonColor,
  PlinkkSettings,
  PlinkkStatusbar,
  SocialIcon,
  User,
  prisma,
} from "@plinkk/prisma";
import {
  reindexNonDefault,
  slugify,
  isReservedSlug,
  createPlinkkForUser,
  pickDefined,
} from "../../../lib/plinkkUtils";
import { generateBundle } from "../../../lib/generateBundle";
import { generateProfileConfig } from "../../../lib/generateConfig";
import path from "path";
import archiver from "archiver"
import ejs from "ejs";
import { fetchRemoteFile } from "../../../lib/fileUtils";
import { canvaData } from "../../../public/config/canvaConfig"
import { generateTheme } from "../../../lib/generateTheme";

// const prisma = new PrismaClient();

export function apiMePlinkksRoutes(fastify: FastifyInstance) {
  fastify.patch("/:id", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const { id } = request.params as { id: string };
    const p = await prisma.plinkk.findUnique({ where: { id } });
    if (!p || p.userId !== userId)
      return reply.code(404).send({ error: "not_found" });
    const body = request.body as { isPublic: boolean; isDefault: boolean };
    const patch: { isPublic?: boolean; visibility?: "PUBLIC" | "PRIVATE" } = {};
    if (typeof body.isPublic === "boolean") {
      patch.isPublic = Boolean(body.isPublic);
      patch.visibility = body.isPublic ? "PUBLIC" : "PRIVATE";
    }
    if (body.isDefault === true && !p.isDefault) {
      const prev = await prisma.plinkk.findFirst({
        where: { userId, isDefault: true },
      });
      await prisma.$transaction([
        ...(prev
          ? [
              prisma.plinkk.update({
                where: { id: prev.id },
                data: { isDefault: false, index: Math.max(1, prev.index || 1) },
              }),
            ]
          : []),
        prisma.plinkk.update({
          where: { id },
          data: { isDefault: true, index: 0 },
        }),
      ]);
      await reindexNonDefault(prisma, userId);
    }
    if (Object.keys(patch).length) {
      await prisma.plinkk.update({ where: { id }, data: patch });
    }
    return reply.send({ ok: true });
  });

  // Delete plinkk
  fastify.delete("/:id", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findUnique({ where: { id } });
    if (!page || page.userId !== userId)
      return reply.code(404).send({ error: "not_found" });
    if (page.isDefault) {
      const others = await prisma.plinkk.count({
        where: { userId, NOT: { id } },
      });
      if (others > 0)
        return reply.code(400).send({ error: "cannot_delete_default" });
    }
    await prisma.plinkk.delete({ where: { id } });
    await reindexNonDefault(prisma, userId);
    return reply.send({ ok: true });
  });

  fastify.post("/", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const body = request.body as { slug: string; name: string };
    const rawSlug = typeof body.slug === "string" ? body.slug : "";
    const rawName = typeof body.name === "string" ? body.name : "";
    try {
      const base = slugify(rawSlug || rawName || "page");
      if (!base || (await isReservedSlug(prisma, base)))
        return reply.code(400).send({ error: "invalid_or_reserved_slug" });
      const userConflict = await prisma.user.findUnique({
        where: { id: base },
        select: { id: true },
      });
      if (userConflict)
        return reply.code(409).send({ error: "slug_conflicts_with_user" });
      const created = await createPlinkkForUser(prisma, userId, {
        name: rawName,
        slugBase: base,
      });
      return reply
        .code(201)
        .send({ id: created.id, slug: created.slug, name: created.name });
    } catch (e) {
      if (e?.message === "max_pages_reached")
        return reply.code(400).send({ error: "max_pages_reached" });
      if (e?.message === "user_not_found")
        return reply.code(401).send({ error: "unauthorized" });
      return reply.code(500).send({ error: "internal_error" });
    }
  });

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
      prisma.backgroundColor.findMany({
        where: { userId: String(userId), plinkkId: id },
      }),
      prisma.neonColor.findMany({
        where: { userId: String(userId), plinkkId: id },
      }),
      prisma.label.findMany({
        where: { userId: String(userId), plinkkId: id },
      }),
      prisma.socialIcon.findMany({
        where: { userId: String(userId), plinkkId: id },
      }),
      prisma.plinkkStatusbar.findUnique({ where: { plinkkId: id } }),
      prisma.link.findMany({ where: { userId: String(userId), plinkkId: id } }),
      prisma.category.findMany({ where: { plinkkId: id }, orderBy: { order: "asc" } }),
    ]);

    const cfg = {
      profileLink: settings != null ? settings.profileLink : null,
      profileImage: settings != null ? settings.profileImage : null,
      profileIcon: settings != null ? settings.profileIcon : null,
      profileSiteText: settings != null ? settings.profileSiteText : null,
      userName: settings != null ? settings.userName : user?.userName ?? null,
      email:
        settings != null &&
        Object.prototype.hasOwnProperty.call(settings, "affichageEmail")
          ? settings.affichageEmail
          : user?.publicEmail ?? user?.email ?? "",
      publicPhone: settings?.publicPhone ?? null,
      showVerifiedBadge: settings?.showVerifiedBadge ?? true,
      showPartnerBadge: settings?.showPartnerBadge ?? true,
      enableVCard: settings?.enableVCard ?? true,
      enableLinkCategories: settings?.enableLinkCategories ?? false,
      iconUrl: settings != null ? settings.iconUrl : null,
      description: settings != null ? settings.description : null,
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
      selectedAnimationButtonIndex:
        settings?.selectedAnimationButtonIndex ?? null,
      selectedAnimationBackgroundIndex:
        settings?.selectedAnimationBackgroundIndex ?? null,
      animationDurationBackground:
        settings?.animationDurationBackground ?? null,
      delayAnimationButton: settings?.delayAnimationButton ?? null,
      canvaEnable: settings?.canvaEnable ?? 0,
      selectedCanvasIndex: settings?.selectedCanvasIndex ?? null,
      layoutOrder: settings?.layoutOrder ?? null,
      background: background.map((c) => c.color),
      neonColors: neonColors.map((c) => c.color),
      labels: labels.map((l) => ({
        data: l.data,
        color: l.color,
        fontColor: l.fontColor,
      })),
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
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        order: c.order,
      })),
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
    const page = await prisma.plinkk.findFirst({
      where: { id, userId: String(userId) },
    });
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
    const page = await prisma.plinkk.findFirst({
      where: { id, userId: String(userId) },
    });
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { layoutOrder?: any };
    const layoutOrder = body?.layoutOrder;
    if (layoutOrder !== undefined) {
      await prisma.plinkkSettings.upsert({
        where: { plinkkId: id },
        create: { plinkkId: id, layoutOrder },
        update: { layoutOrder },
      });
    }
    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/background", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({
      where: { id, userId: String(userId) },
    });
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { background: any[] };
    const list = Array.isArray(body?.background) ? body.background : [];
    const colors = list
      .map((item) =>
        typeof item === 'string'
          ? item
          : item && typeof item.color === 'string'
          ? item.color
          : null
      )
      .filter((c): c is string => !!c && typeof c === 'string' && c.trim() !== '');
    await prisma.backgroundColor.deleteMany({
      where: { userId: String(userId), plinkkId: id },
    });
    if (colors.length > 0) {
      await prisma.backgroundColor.createMany({
        data: colors.map((color: string) => ({
          color,
          userId: String(userId),
          plinkkId: id,
        })),
      });
    }

    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/labels", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({
      where: { id, userId: String(userId) },
    });
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { labels: Label[] };

    // Labels
    if (Array.isArray(body.labels)) {
      await prisma.label.deleteMany({
        where: { userId: String(userId), plinkkId: id },
      });
      if (body.labels.length > 0) {
        await prisma.label.createMany({
          data: body.labels.map((l: Label) => ({
            data: l.data,
            color: l.color,
            fontColor: l.fontColor,
            userId: String(userId),
            plinkkId: id,
          })),
        });
      }
    }

    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/socialIcon", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({
      where: { id, userId: String(userId) },
    });
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { socialIcon: SocialIcon[] };

    if (Array.isArray(body.socialIcon)) {
      await prisma.socialIcon.deleteMany({
        where: { userId: String(userId), plinkkId: id },
      });
      if (body.socialIcon.length > 0) {
        await prisma.socialIcon.createMany({
          data: body.socialIcon.map((s: SocialIcon) => ({
            url: s.url,
            icon: s.icon,
            userId: String(userId),
            plinkkId: id,
          })),
        });
      }
    }

    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/links", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({
      where: { id, userId: String(userId) },
    });
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { links: Link[] };

    if (Array.isArray(body.links)) {
      const existing = await prisma.link.findMany({
        where: { userId: String(userId), plinkkId: id },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((l) => l.id));
      const incomingIds = new Set(
        body.links.map((l: Link) => l.id).filter(Boolean)
      );
      const toDelete = Array.from(existingIds).filter(
        (x) => !incomingIds.has(x)
      );
      if (toDelete.length > 0)
        await prisma.link.deleteMany({ where: { id: { in: toDelete } } });
      for (const l of body.links) {
        if (l.id && existingIds.has(l.id)) {
          await prisma.link.update({
            where: { id: l.id },
            data: {
              icon: l.icon ?? undefined,
              url: l.url,
              text: l.text ?? undefined,
              name: (l).name === null
                ? null
                : (typeof (l).name === 'string' ? (l).name : undefined),
              description: l.description ?? undefined,
              showDescriptionOnHover: l.showDescriptionOnHover ?? undefined,
              showDescription: l.showDescription ?? undefined,
              categoryId: l.categoryId ?? null,
            },
          });
        } else {
          await prisma.link.create({
            data: {
              icon: l.icon ?? undefined,
              url: l.url,
              text: l.text ?? undefined,
              name: (l).name === null
                ? null
                : (typeof (l).name === 'string' ? (l).name : undefined),
              description: l.description ?? undefined,
              showDescriptionOnHover: l.showDescriptionOnHover ?? undefined,
              showDescription: l.showDescription ?? undefined,
              userId: String(userId),
              plinkkId: id,
              categoryId: l.categoryId ?? null,
            },
          });
        }
      }
    }

    const updatedLinks = await prisma.link.findMany({
      where: { userId: String(userId), plinkkId: id },
    });

    return reply.send({ 
      ok: true, 
      links: updatedLinks.map(l => ({
        id: l.id,
        icon: l.icon,
        url: l.url,
        text: l.text,
        name: l.name,
        description: l.description,
        showDescriptionOnHover: l.showDescriptionOnHover,
        showDescription: l.showDescription,
        categoryId: l.categoryId,
      }))
    });
  });

  fastify.put("/:id/config/categories", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({
      where: { id, userId: String(userId) },
    });
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { categories: { id?: string, name: string, order: number }[] };

    if (Array.isArray(body.categories)) {
      const existing = await prisma.category.findMany({
        where: { plinkkId: id },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((c) => c.id));
      const incomingIds = new Set(
        body.categories.map((c) => c.id).filter(Boolean)
      );
      const toDelete = Array.from(existingIds).filter(
        (x) => !incomingIds.has(x as string)
      );
      if (toDelete.length > 0)
        await prisma.category.deleteMany({ where: { id: { in: toDelete as string[] } } });
      
      for (const c of body.categories) {
        if (c.id && existingIds.has(c.id)) {
          await prisma.category.update({
            where: { id: c.id },
            data: {
              name: c.name,
              order: c.order,
            },
          });
        } else {
          await prisma.category.create({
            data: {
              name: c.name,
              order: c.order,
              plinkkId: id,
            },
          });
        }
      }
    }

    const updatedCategories = await prisma.category.findMany({
      where: { plinkkId: id },
      orderBy: { order: "asc" },
    });

    return reply.send({ 
      ok: true, 
      categories: updatedCategories.map(c => ({
        id: c.id,
        name: c.name,
        order: c.order,
      }))
    });
  });

  fastify.put("/:id/config/statusBar", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({
      where: { id, userId: String(userId) },
    });
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { statusbar: PlinkkStatusbar };

    if (body.statusbar !== undefined) {
      const s = body.statusbar;
      if (s === null) {
        await prisma.plinkkStatusbar.deleteMany({ where: { plinkkId: id } });
      } else {
        await prisma.plinkkStatusbar.upsert({
          where: { plinkkId: id },
          create: {
            plinkkId: id,
            text: s.text ?? undefined,
            colorBg: s.colorBg ?? undefined,
            fontTextColor: s.fontTextColor ?? undefined,
            statusText: s.statusText ?? undefined,
          },
          update: pickDefined({
            text: s.text ?? undefined,
            colorBg: s.colorBg ?? undefined,
            fontTextColor: s.fontTextColor ?? undefined,
            statusText: s.statusText ?? undefined,
          }),
        });
      }
    }

    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/neonColor", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({
      where: { id, userId: String(userId) },
    });
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { neonColors: NeonColor[] };

    if (Array.isArray(body.neonColors)) {
      await prisma.neonColor.deleteMany({
        where: { userId: String(userId), plinkkId: id },
      });
      if (body.neonColors.length > 0) {
        await prisma.neonColor.createMany({
          data: body.neonColors.map((neonColor: NeonColor) => ({
            color: neonColor.color,
            userId: String(userId),
            plinkkId: id,
          })),
        });
      }
    }

    return reply.send({ ok: true });
  });

  fastify.get("/:id/export.zip", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({
      where: { id, userId: String(userId) },
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
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });
    const js = await generateBundle();
    const settings = page.settings;
    const pageProfile: User & PlinkkSettings = {
      plinkkId: null,
      ...page.user,
      profileLink: settings?.profileLink ?? "",
      profileImage: settings?.profileImage ?? "",
      profileIcon: settings?.profileIcon ?? "",
      profileSiteText: settings?.profileSiteText ?? "",
      userName: settings?.userName ?? page.user.userName,
      iconUrl: settings?.iconUrl ?? "",
      description: settings?.description ?? "",
      profileHoverColor: settings?.profileHoverColor ?? "",
      degBackgroundColor: settings?.degBackgroundColor ?? 45,
      neonEnable: settings?.neonEnable ?? 1,
      buttonThemeEnable: settings?.buttonThemeEnable ?? 1,
      EnableAnimationArticle: settings?.EnableAnimationArticle ?? 1,
      EnableAnimationButton: settings?.EnableAnimationButton ?? 1,
      EnableAnimationBackground: settings?.EnableAnimationBackground ?? 1,
      backgroundSize: settings?.backgroundSize ?? 50,
      selectedThemeIndex: settings?.selectedThemeIndex ?? 13,
      selectedAnimationIndex: settings?.selectedAnimationIndex ?? 0,
      selectedAnimationButtonIndex:
        settings?.selectedAnimationButtonIndex ?? 10,
      selectedAnimationBackgroundIndex:
        settings?.selectedAnimationBackgroundIndex ?? 0,
      animationDurationBackground: settings?.animationDurationBackground ?? 30,
      delayAnimationButton: settings?.delayAnimationButton ?? 0.1,
      affichageEmail: settings?.affichageEmail ?? null,
      publicEmail:
        settings &&
        Object.prototype.hasOwnProperty.call(settings, "affichageEmail")
          ? settings.affichageEmail
          : page.user.publicEmail ?? null,
      publicPhone: settings?.publicPhone ?? null,
      showVerifiedBadge: settings?.showVerifiedBadge ?? true,
      showPartnerBadge: settings?.showPartnerBadge ?? true,
      enableVCard: settings?.enableVCard ?? true,
      enableLinkCategories: settings?.enableLinkCategories ?? false,
      canvaEnable: settings?.canvaEnable ?? 1,
      selectedCanvasIndex: settings?.selectedCanvasIndex ?? 16,
      layoutOrder: settings?.layoutOrder ?? null,
    };
    const config = await generateProfileConfig(
      pageProfile,
      page.links,
      page.background,
      page.labels,
      page.neonColors,
      page.socialIcons,
      page.statusbar,
      undefined,
      page.categories
    );

    const themes = await generateTheme(page.userId)

    const archive = archiver("zip", { zlib: { level: 9 } });

    reply
      .header("Content-Type", "application/zip")
      .header("Content-Disposition", "attachment; filename=plinkk_" + page.name + ".zip");

    archive.pipe(reply.raw);

    archive.append(await ejs.renderFile(path.join(__dirname, "..", "..", "..", "views", "plinkk", "show.ejs"), { page: page, userId: page.userId, username: page.userId }), { name: "index.html" });
    archive.append(js, { name: page.slug + ".js" });
    archive.append(config, { name: "config.js" });
    archive.append(JSON.stringify(themes), { name: "themes.json" });
    const analyticsScript = await fetchRemoteFile("https://analytics.plinkk.fr/script.js");
    archive.append(analyticsScript, { name: "umami_script.js" });
    const canvaId = page.settings.canvaEnable ? page.settings.selectedCanvasIndex : null
    if (canvaId !== null) {
      archive.file(path.join(__dirname, "..", "..", "..", "public", "canvaAnimation", canvaData[canvaId].fileNames), { name: "canvaAnimation/" + canvaData[canvaId].fileNames })
    }

    archive.file(path.join(__dirname, "..", "..", "..", "public", "css", "styles.css"), { name: "css/styles.css" });
    archive.file(path.join(__dirname, "..", "..", "..", "public", "css", "button.css"), { name: "css/button.css" });

    if (page.settings.profileImage.startsWith("/public/")) archive.file(path.join(__dirname, "..", "..", "..", ...page.settings.profileImage.split("/")), { name: page.settings.profileImage})
    if (page.settings.profileIcon.startsWith("/public/")) archive.file(path.join(__dirname, "..", "..", "..", ...page.settings.profileIcon.split("/")), { name: page.settings.profileIcon})
    if (page.settings.iconUrl.startsWith("/public/")) archive.file(path.join(__dirname, "..", "..", "..", ...page.settings.iconUrl.split("/")), { name: page.settings.iconUrl})

    for (const link of page.links) {
      if (link.icon.startsWith("/public/")) archive.file(path.join(__dirname, "..", "..", "..", ...link.icon.split("/")), { name: link.icon });
    }
    for (const socialIcon of page.socialIcons) {
      archive.file(path.join(__dirname, "..", "..", "..", "public", "images", "icons", socialIcon.icon + ".svg"), { name: "public/images/icons/" + socialIcon.icon + ".svg" });
    }

    await archive.finalize();
  });
}
