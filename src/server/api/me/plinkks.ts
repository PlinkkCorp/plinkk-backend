import { FastifyInstance } from "fastify";
import { PlinkkSettings, PrismaClient } from "../../../../generated/prisma/client";
import { reindexNonDefault, slugify, isReservedSlug, createPlinkkForUser } from "../../../lib/plinkkUtils";

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
    const body = (request.body as { isPublic: boolean, isDefault: boolean });
    const patch: { isPublic?: boolean, visibility?: "PUBLIC" | "PRIVATE" } = {};
    // Toggle public
    if (typeof body.isPublic === "boolean") {
      patch.isPublic = Boolean(body.isPublic);
      patch.visibility = (body.isPublic ? "PUBLIC" : "PRIVATE");
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
    const body = request.body as { slug: string, name: string };
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
    } catch (e: any) {
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
      profileLink:
        settings != null
          ? settings.profileLink
          : null,
      profileImage:
        settings != null
          ? settings.profileImage
          : null,
      profileIcon:
        settings != null
          ? settings.profileIcon
          : null,
      profileSiteText:
        settings != null
          ? settings.profileSiteText
          : null,
      userName:
        settings != null ? settings.userName : user?.userName ?? null,
      // Email public spécifique à la Plinkk : si settings présent ET que la
      // propriété `affichageEmail` est définie, l'utiliser (même si null =>
      // effacement explicite). Sinon fallback vers user.publicEmail || user.email.
      email:
        settings != null &&
        Object.prototype.hasOwnProperty.call(settings, "affichageEmail")
          ? settings.affichageEmail
          : user?.publicEmail ?? user?.email ?? "",
      iconUrl:
        settings != null ? settings.iconUrl : null,
      description:
        settings != null
          ? settings.description
          : null,
      profileHoverColor:
        settings?.profileHoverColor ?? null,
      degBackgroundColor:
        settings?.degBackgroundColor ?? null,
      neonEnable: settings?.neonEnable ?? 0,
      buttonThemeEnable:
        settings?.buttonThemeEnable ?? 0,
      EnableAnimationArticle:
        settings?.EnableAnimationArticle ?? 0,
      EnableAnimationButton:
        settings?.EnableAnimationButton ?? 0,
      EnableAnimationBackground:
        settings?.EnableAnimationBackground ?? 0,
      backgroundSize:
        settings?.backgroundSize ?? null,
      selectedThemeIndex:
        settings?.selectedThemeIndex ?? null,
      selectedAnimationIndex:
        settings?.selectedAnimationIndex ?? null,
      selectedAnimationButtonIndex:
        settings?.selectedAnimationButtonIndex ?? null,
      selectedAnimationBackgroundIndex:
        settings?.selectedAnimationBackgroundIndex ?? null,
      animationDurationBackground:
        settings?.animationDurationBackground ?? null,
      delayAnimationButton:
        settings?.delayAnimationButton ?? null,
      canvaEnable: settings?.canvaEnable ?? 0,
      selectedCanvasIndex:
        settings?.selectedCanvasIndex ?? null,
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

  // API: Mettre à jour la configuration du profil depuis l'éditeur (par Plinkk)
  fastify.put("/:id/config", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({
      where: { id, userId: String(userId) },
    });
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as PlinkkSettings;
    const pickDefined = (obj: Record<string, any>) =>
      Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined)
      );

    await prisma.$transaction(async (tx) => {
      // Upsert des réglages de page
      const data = pickDefined({
        profileLink: body.profileLink,
        profileImage: body.profileImage,
        profileIcon: body.profileIcon,
        profileSiteText: body.profileSiteText,
        userName: body.userName,
        // affichageEmail: valeur publique spécifique à cette Plinkk
        affichageEmail: body.email,
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
        await tx.plinkkSettings.upsert({
          where: { plinkkId: id },
          create: { plinkkId: id, ...data },
          update: data,
        });
      }

      // If the editor submitted a userName, persist it as the plinkk's public name
      // so that the "Nom affiché" shown in the editor is the canonical plinkk.name.
      if (typeof body.userName === "string" && body.userName.trim()) {
        await tx.plinkk.update({
          where: { id },
          data: { name: body.userName.trim() },
        });
      }

      // NOTE: email for a specific Plinkk must be stored on PlinkkSettings.affichageEmail
      // so that it is detached per page. The global publicEmail on User is only
      // updated via account-level endpoints (/me/config or /me/email).

      // Couleurs de fond
      if (Array.isArray(body.background)) {
        await tx.backgroundColor.deleteMany({
          where: { userId: String(userId), plinkkId: id },
        });
        if (body.background.length > 0) {
          await tx.backgroundColor.createMany({
            data: body.background.map((color: string) => ({
              color,
              userId: String(userId),
              plinkkId: id,
            })),
          });
        }
      }

      // Néon
      if (Array.isArray(body.neonColors)) {
        await tx.neonColor.deleteMany({
          where: { userId: String(userId), plinkkId: id },
        });
        if (body.neonColors.length > 0) {
          await tx.neonColor.createMany({
            data: body.neonColors.map((color: string) => ({
              color,
              userId: String(userId),
              plinkkId: id,
            })),
          });
        }
      }

      // Labels
      if (Array.isArray(body.labels)) {
        await tx.label.deleteMany({
          where: { userId: String(userId), plinkkId: id },
        });
        if (body.labels.length > 0) {
          await tx.label.createMany({
            data: body.labels.map((l: any) => ({
              data: l.data,
              color: l.color,
              fontColor: l.fontColor,
              userId: String(userId),
              plinkkId: id,
            })),
          });
        }
      }

      // Icônes sociales
      if (Array.isArray(body.socialIcon)) {
        await tx.socialIcon.deleteMany({
          where: { userId: String(userId), plinkkId: id },
        });
        if (body.socialIcon.length > 0) {
          await tx.socialIcon.createMany({
            data: body.socialIcon.map((s: any) => ({
              url: s.url,
              icon: s.icon,
              userId: String(userId),
              plinkkId: id,
            })),
          });
        }
      }

      // Liens
      if (Array.isArray(body.links)) {
        const existing = await tx.link.findMany({
          where: { userId: String(userId), plinkkId: id },
          select: { id: true },
        });
        const existingIds = new Set(existing.map((l) => l.id));
        const incomingIds = new Set(
          body.links.map((l: any) => l.id).filter(Boolean)
        );
        const toDelete = Array.from(existingIds).filter(
          (x) => !incomingIds.has(x)
        );
        if (toDelete.length > 0)
          await tx.link.deleteMany({ where: { id: { in: toDelete } } });
        for (const l of body.links) {
          if (l.id && existingIds.has(l.id)) {
            await tx.link.update({
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
            await tx.link.create({
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

      // Statusbar dédié à la page
      if (body.statusbar !== undefined) {
        const s = body.statusbar;
        if (s === null) {
          await tx.plinkkStatusbar.deleteMany({ where: { plinkkId: id } });
        } else {
          await tx.plinkkStatusbar.upsert({
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
    });

    return reply.send({ ok: true });
  });
}
