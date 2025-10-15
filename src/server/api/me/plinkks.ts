import { FastifyInstance } from "fastify";
import {
  BackgroundColor,
  Label,
  Link,
  NeonColor,
  PlinkkSettings,
  PlinkkStatusbar,
  PrismaClient,
  SocialIcon,
  User,
} from "../../../../generated/prisma/client";
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
import { readdirSync } from "fs";
import archiver from "archiver"
import ejs from "ejs";

const prisma = new PrismaClient();

export function apiMePlinkksRoutes(fastify: FastifyInstance) {
  // Update plinkk (toggle default/public)
  fastify.patch("/:id", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const { id } = request.params as { id: string };
    const p = await prisma.plinkk.findUnique({ where: { id } });
    if (!p || p.userId !== userId)
      return reply.code(404).send({ error: "not_found" });
    const body = request.body as { isPublic: boolean; isDefault: boolean };
    const patch: { isPublic?: boolean; visibility?: "PUBLIC" | "PRIVATE" } = {};
    // Toggle public
    if (typeof body.isPublic === "boolean") {
      patch.isPublic = Boolean(body.isPublic);
      patch.visibility = body.isPublic ? "PUBLIC" : "PRIVATE";
    }
    // Set default
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

  // Create plinkk
  fastify.post("/", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const body = request.body as { slug: string; name: string };
    const rawSlug = typeof body.slug === "string" ? body.slug : "";
    const rawName = typeof body.name === "string" ? body.name : "";
    try {
      // Normaliser la base; éviter mots réservés
      const base = slugify(rawSlug || rawName || "page");
      if (!base || (await isReservedSlug(prisma, base)))
        return reply.code(400).send({ error: "invalid_or_reserved_slug" });
      // Interdire conflit avec un @ d'utilisateur
      const userConflict = await prisma.user.findUnique({
        where: { id: base },
        select: { id: true },
      });
      if (userConflict)
        return reply.code(409).send({ error: "slug_conflicts_with_user" });
      // Interdire conflit direct avec un autre plinkk (suggestion générera une variante de toute façon)
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

  // API: Récupérer la configuration complète du profil pour l'éditeur
  // Version par Plinkk (édition indépendante par page)
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
    ]);

    const cfg = {
      // Champs d'identité/texte: si un enregistrement PlinkkSettings existe, on respecte ses valeurs
      // même si elles valent null (ce qui signifie "effacé"), sinon on fallback vers user.
      profileLink: settings != null ? settings.profileLink : null,
      profileImage: settings != null ? settings.profileImage : null,
      profileIcon: settings != null ? settings.profileIcon : null,
      profileSiteText: settings != null ? settings.profileSiteText : null,
      userName: settings != null ? settings.userName : user?.userName ?? null,
      // Email public spécifique à la Plinkk : si settings présent ET que la
      // propriété `affichageEmail` est définie, l'utiliser (même si null =>
      // effacement explicite). Sinon fallback vers user.publicEmail || user.email.
      email:
        settings != null &&
        Object.prototype.hasOwnProperty.call(settings, "affichageEmail")
          ? settings.affichageEmail
          : user?.publicEmail ?? user?.email ?? "",
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

    // Upsert des réglages de page
    const data = pickDefined({
      profileLink: body.profileLink,
      profileImage: body.profileImage,
      profileIcon: body.profileIcon,
      profileSiteText: body.profileSiteText,
      userName: body.userName,
      // affichageEmail: valeur publique spécifique à cette Plinkk
      affichageEmail: body.affichageEmail,
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

  fastify.put("/:id/config/background", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({
      where: { id, userId: String(userId) },
    });
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { background: BackgroundColor[] };
    // Couleurs de fond
    if (Array.isArray(body.background)) {
      await prisma.backgroundColor.deleteMany({
        where: { userId: String(userId), plinkkId: id },
      });
      if (body.background.length > 0) {
        await prisma.backgroundColor.createMany({
          data: body.background.map((backgroundColor: BackgroundColor) => ({
            color: backgroundColor.color,
            userId: String(userId),
            plinkkId: id,
          })),
        });
      }
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

    // Icônes sociales
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

    // Liens
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
              name: l.name ?? undefined,
              description: l.description ?? undefined,
              showDescriptionOnHover: l.showDescriptionOnHover ?? undefined,
              showDescription: l.showDescription ?? undefined,
            },
          });
        } else {
          await prisma.link.create({
            data: {
              icon: l.icon ?? undefined,
              url: l.url,
              text: l.text ?? undefined,
              name: l.name ?? undefined,
              description: l.description ?? undefined,
              showDescriptionOnHover: l.showDescriptionOnHover ?? undefined,
              showDescription: l.showDescription ?? undefined,
              userId: String(userId),
              plinkkId: id,
            },
          });
        }
      }
    }

    return reply.send({ ok: true });
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

    // Statusbar dédié à la page
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

    // Néon
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
      // Support for per-Plinkk public email: if a PlinkkSettings.affichageEmail
      // exists we must prefer it for the generated profile config. We expose it
      // both as `affichageEmail` and override `publicEmail` so generateProfileConfig
      // (which reads profile.publicEmail) will pick up the page-specific value.
      affichageEmail: settings?.affichageEmail ?? null,
      publicEmail:
        settings &&
        Object.prototype.hasOwnProperty.call(settings, "affichageEmail")
          ? settings.affichageEmail
          : page.user.publicEmail ?? null,
      canvaEnable: settings?.canvaEnable ?? 1,
      selectedCanvasIndex: settings?.selectedCanvasIndex ?? 16,
    };
    const config = await generateProfileConfig(
      pageProfile,
      page.links,
      page.background,
      page.labels,
      page.neonColors,
      page.socialIcons,
      page.statusbar
    );

    // Création du flux d’archive
    const archive = archiver("zip", { zlib: { level: 9 } }); // niveau max de compression

    // Définition des headers HTTP pour le téléchargement
    reply
      .header("Content-Type", "application/zip")
      .header("Content-Disposition", "attachment; filename=plinkk_" + page.name + ".zip");

    // Piping direct de l’archive dans la réponse (stream)
    archive.pipe(reply.raw);

    // --- FICHIERS DYNAMIQUES ---
    archive.append(await ejs.renderFile(path.join(__dirname, "..", "..", "..", "views", "plinkk", "show.ejs"), { page: page, userId: page.userId, username: page.userId }), { name: "index.html" });
    archive.append(js, { name: "bundle.js" });
    archive.append(config, { name: "config.js" });

    // --- FICHIERS CSS (statiques) ---
    archive.file(path.join(__dirname, "..", "..", "..", "public", "css", "styles.css"), { name: "style.css" });
    archive.file(path.join(__dirname, "..", "..", "..", "public", "css", "button.css"), { name: "button.css" });

    // --- LOGOS (statiques) ---
    const logosPath = path.join(__dirname, "..", "..", "..", "public", "images", "icons");
    const logos = readdirSync(logosPath);
    for (const logo of logos) {
      archive.file(path.join(logosPath, logo), { name: `images/${logo}` });
    }

    // Finaliser le ZIP
    await archive.finalize();
  });
}
