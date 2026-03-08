/**
 * Routes d'onboarding — Création guidée du premier Plinkk
 * GET  /onboarding         → page wizard multi-étapes
 * POST /onboarding/draft   → auto-save du brouillon
 * POST /onboarding/complete → finalisation et création du Plinkk
 */
import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../lib/replyView";
import { requireAuthRedirect, requireAuth, requireAuthWithUser } from "../middleware/auth";
import { createPlinkkForUser, slugify, isReservedSlug } from "@plinkk/shared";
import { logUserAction } from "../lib/userLogger";
import profileConfig from "../public/config/profileConfig";

interface OnboardingData {
  step?: number;
  displayName?: string;
  slug?: string;
  category?: string;
  bio?: string;
  accentColor?: string;
  themeIndex?: number;
  avatarUrl?: string;
  firstLinkTitle?: string;
  firstLinkUrl?: string;
  firstLinkIcon?: string;
}

export function onboardingRoutes(fastify: FastifyInstance) {
  // ─── GET /onboarding ────────────────────────────────────────────────────────
  fastify.get(
    "/onboarding",
    { preHandler: [requireAuthRedirect] },
    async (request, reply) => {
      const user = request.currentUser!;

      if (user.onboardingCompleted) {
        return reply.redirect("/");
      }

      // Charger le brouillon s'il existe
      const draft = await prisma.onboardingDraft.findUnique({
        where: { userId: user.id },
      });

      // Pré-remplir le slug depuis le plinkk déjà créé lors de l'inscription
      const draftData: Record<string, unknown> = Object.assign({}, (draft?.data && typeof draft.data === 'object' && !Array.isArray(draft.data)) ? draft.data as Record<string, unknown> : {});
      if (!draftData.slug) {
        const existingPlinkk = await prisma.plinkk.findFirst({
          where: { userId: user.id },
          select: { slug: true },
          orderBy: { index: "asc" },
        });
        if (existingPlinkk?.slug) {
          draftData.slug = existingPlinkk.slug;
        }
      }

      return replyView(reply, "onboarding.ejs", user, {
        draft: draftData,
        step: draft?.step ?? 1,
      });
    }
  );

  // ─── POST /onboarding/draft ─────────────────────────────────────────────────
  fastify.post(
    "/onboarding/draft",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.userId!;
      const body = request.body as OnboardingData & { step?: number };

      const safeData: OnboardingData = {};
      if (body.displayName !== undefined) safeData.displayName = String(body.displayName).slice(0, 50);
      if (body.slug !== undefined) safeData.slug = String(body.slug).slice(0, 30);
      if (body.category !== undefined) safeData.category = String(body.category).slice(0, 30);
      if (body.bio !== undefined) safeData.bio = String(body.bio).slice(0, 160);
      if (body.accentColor !== undefined) safeData.accentColor = String(body.accentColor).slice(0, 10);
      if (body.themeIndex !== undefined) safeData.themeIndex = Number(body.themeIndex);
      if (body.avatarUrl !== undefined) safeData.avatarUrl = String(body.avatarUrl).slice(0, 500);
      if (body.firstLinkTitle !== undefined) safeData.firstLinkTitle = String(body.firstLinkTitle).slice(0, 80);
      if (body.firstLinkUrl !== undefined) safeData.firstLinkUrl = String(body.firstLinkUrl).slice(0, 500);
      if (body.firstLinkIcon !== undefined) safeData.firstLinkIcon = String(body.firstLinkIcon).slice(0, 500);

      const step = Number(body.step) || 1;

      await prisma.onboardingDraft.upsert({
        where: { userId },
        create: { userId, step, data: safeData as any },
        update: { step, data: safeData as any },
      });

      return reply.send({ ok: true });
    }
  );

  // ─── POST /onboarding/check-slug ─────────────────────────────────────────────
  fastify.get(
    "/onboarding/check-slug",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { slug } = request.query as { slug?: string };
      if (!slug) return reply.send({ available: false, reason: "missing" });

      const normalized = slugify(slug);
      if (!normalized || normalized.length < 2) {
        return reply.send({ available: false, reason: "too_short" });
      }
      if (normalized.length > 30) {
        return reply.send({ available: false, reason: "too_long" });
      }

      const reserved = await isReservedSlug(prisma, normalized);
      if (reserved) return reply.send({ available: false, reason: "reserved" });

      const conflict = await prisma.plinkk.findFirst({
        where: { slug: normalized },
        select: { id: true },
      });

      return reply.send({ available: !conflict, slug: normalized });
    }
  );

  // ─── POST /onboarding/complete ───────────────────────────────────────────────
  fastify.post(
    "/onboarding/complete",
    { preHandler: [requireAuthWithUser] },
    async (request, reply) => {
      const userId = request.userId!;
      const user = request.currentUser!;

      if (user.onboardingCompleted) {
        return reply.send({ ok: true, redirect: "/" });
      }

      const body = request.body as OnboardingData;
      const displayName = (body.displayName || "").trim().slice(0, 50) || user.userName;
      const rawSlug = (body.slug || "").trim();
      const bio = (body.bio || "").trim().slice(0, 160);
      const accentColor = (body.accentColor || "#8b5cf6").trim();
      const themeIndex = typeof body.themeIndex === 'number' ? body.themeIndex : 0;
      const avatarUrl = (body.avatarUrl || "").trim();
      const category = (body.category || "").trim();
      const firstLinkTitle = (body.firstLinkTitle || "").trim().slice(0, 80);
      const firstLinkUrl = (body.firstLinkUrl || "").trim().slice(0, 500);
      const firstLinkIcon = (body.firstLinkIcon || "").trim().slice(0, 500);
      const canPublishNow = !(user.hasPassword && !user.emailVerified);

      const slugBase = rawSlug || displayName;
      const normalized = slugify(slugBase);

      if (!normalized || normalized.length < 2) {
        return reply.code(400).send({ error: "slug_invalid" });
      }

      const reserved = await isReservedSlug(prisma, normalized);
      if (reserved) {
        return reply.code(400).send({ error: "slug_reserved" });
      }

      // Vérifier le conflit de slug (en excluant le plinkk existant de l'user)
      const existingPlinkk = await prisma.plinkk.findFirst({
        where: { userId },
        select: { id: true, slug: true },
        orderBy: { index: "asc" },
      });

      const conflict = await prisma.plinkk.findFirst({
        where: {
          slug: normalized,
          ...(existingPlinkk ? { NOT: { id: existingPlinkk.id } } : {}),
        },
        select: { id: true },
      });
      if (conflict) {
        return reply.code(400).send({ error: "slug_taken" });
      }

      // Mettre à jour le profil utilisateur
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: displayName,
          userName: normalized, // Le slug = identifiant public (@slug)
          ...(avatarUrl ? { image: avatarUrl } : {}),
        },
      });

      let plinkk: { id: string; slug: string };

      if (existingPlinkk) {
        // L'user a déjà un plinkk (créé pendant l'inscription) → on le met à jour
        plinkk = await prisma.plinkk.update({
          where: { id: existingPlinkk.id },
          data: {
            name: displayName,
            slug: normalized,
            isActive: canPublishNow,
            visibility: canPublishNow ? "PUBLIC" : "PRIVATE",
            isPublic: canPublishNow,
          },
          select: { id: true, slug: true },
        });

        // Mettre à jour ou créer les PlinkkSettings
        await prisma.plinkkSettings.upsert({
          where: { plinkkId: plinkk.id },
          create: {
            plinkkId: plinkk.id,
            profileLink: profileConfig.profileLink,
            profileImage: avatarUrl || profileConfig.profileImage,
            profileIcon: profileConfig.profileIcon,
            profileSiteText: profileConfig.profileSiteText,
            userName: displayName,
            iconUrl: profileConfig.iconUrl,
            description: bio || "",
            profileHoverColor: accentColor,
            degBackgroundColor: profileConfig.degBackgroundColor,
            neonEnable: profileConfig.neonEnable ?? 1,
            buttonThemeEnable: profileConfig.buttonThemeEnable,
            EnableAnimationArticle: profileConfig.EnableAnimationArticle,
            EnableAnimationButton: profileConfig.EnableAnimationButton,
            EnableAnimationBackground: profileConfig.EnableAnimationBackground,
            backgroundSize: profileConfig.backgroundSize,
            selectedThemeIndex: themeIndex,
            selectedAnimationIndex: profileConfig.selectedAnimationIndex,
            selectedAnimationButtonIndex: profileConfig.selectedAnimationButtonIndex,
            selectedAnimationBackgroundIndex: profileConfig.selectedAnimationBackgroundIndex,
            animationDurationBackground: profileConfig.animationDurationBackground,
            delayAnimationButton: profileConfig.delayAnimationButton,
            canvaEnable: 0,
            selectedCanvasIndex: profileConfig.selectedCanvasIndex,
            backgroundType: "color",
          },
          update: {
            userName: displayName,
            description: bio || "",
            profileHoverColor: accentColor,
            selectedThemeIndex: themeIndex,
            canvaEnable: 0,
            backgroundType: "color",
            ...(avatarUrl ? { profileImage: avatarUrl } : {}),
          },
        });
      } else {
        // Pas encore de plinkk (flux OTP/Magic Link) → on en crée un
        plinkk = await createPlinkkForUser(prisma, userId, {
          name: displayName,
          slugBase: normalized,
          visibility: canPublishNow ? "PUBLIC" : "PRIVATE",
          isActive: canPublishNow,
        });

        // PlinkkSettings
        try {
          await prisma.plinkkSettings.upsert({
            where: { plinkkId: plinkk.id },
            create: {
              plinkkId: plinkk.id,
              profileLink: profileConfig.profileLink,
              profileImage: avatarUrl || profileConfig.profileImage,
              profileIcon: profileConfig.profileIcon,
              profileSiteText: profileConfig.profileSiteText,
              userName: displayName,
              iconUrl: profileConfig.iconUrl,
              description: bio || "",
              profileHoverColor: accentColor,
              degBackgroundColor: profileConfig.degBackgroundColor,
              neonEnable: profileConfig.neonEnable ?? 1,
              buttonThemeEnable: profileConfig.buttonThemeEnable,
              EnableAnimationArticle: profileConfig.EnableAnimationArticle,
              EnableAnimationButton: profileConfig.EnableAnimationButton,
              EnableAnimationBackground: profileConfig.EnableAnimationBackground,
              backgroundSize: profileConfig.backgroundSize,
              selectedThemeIndex: themeIndex,
              selectedAnimationIndex: profileConfig.selectedAnimationIndex,
              selectedAnimationButtonIndex: profileConfig.selectedAnimationButtonIndex,
              selectedAnimationBackgroundIndex: profileConfig.selectedAnimationBackgroundIndex,
              animationDurationBackground: profileConfig.animationDurationBackground,
              delayAnimationButton: profileConfig.delayAnimationButton,
              canvaEnable: 0,
              selectedCanvasIndex: profileConfig.selectedCanvasIndex,
              backgroundType: "color",
            },
            update: {
              userName: displayName,
              description: bio || "",
              profileHoverColor: accentColor,
              selectedThemeIndex: themeIndex,
              canvaEnable: 0,
              backgroundType: "color",
              ...(avatarUrl ? { profileImage: avatarUrl } : {}),
            },
          });
        } catch { }
      }

      // Fond onboarding = couleur du thème sélectionné (sans canva)
      try {
        await prisma.backgroundColor.deleteMany({ where: { userId, plinkkId: plinkk.id } });
        await prisma.backgroundColor.createMany({
          data: [
            { userId, plinkkId: plinkk.id, color: accentColor, stop: 0 },
            { userId, plinkkId: plinkk.id, color: accentColor, stop: 100 },
          ],
        });
      } catch { }

      // Créer le premier lien si fourni
      if (plinkk && firstLinkTitle && firstLinkUrl) {
        try {
          await prisma.link.create({
            data: {
              userId: userId,
              plinkkId: plinkk.id,
              url: firstLinkUrl,
              text: firstLinkTitle,
              icon: firstLinkIcon || undefined,
              description: null,
              showDescription: false,
              showDescriptionOnHover: false,
              index: 0,
            },
          });
        } catch (error) {
          console.error("Erreur lors de la création du premier lien:", error);
        }
      }

      // Marquer l'onboarding comme terminé
      await prisma.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
      });

      // Supprimer le brouillon
      try {
        await prisma.onboardingDraft.delete({ where: { userId } });
      } catch { }

      // Tracking funnel
      try {
        const trackingId =
          (request.cookies as Record<string, string>)?.["plinkk_tid"] || userId;
        await prisma.funnelEvent.create({
          data: {
            event: "onboarding_complete",
            sessionId: trackingId,
            userId,
            ip: request.ip,
            userAgent: request.headers["user-agent"] || null,
            meta: { category },
          },
        });
      } catch { }

      await logUserAction(userId, "ONBOARDING_COMPLETE", null, { slug: plinkk.slug }, request.ip);

      return reply.send({
        ok: true,
        redirect: "/?welcome=1",
        slug: plinkk.slug,
        emailVerificationRequired: !canPublishNow,
      });
    }
  );
}
