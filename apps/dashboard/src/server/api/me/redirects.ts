import { FastifyInstance } from "fastify";
import "../../../types/index";
import { prisma } from "@plinkk/prisma";
import { requireAuth, requireAuthWithUser } from "../../../middleware/auth";
import {
  isRedirectSlugAvailable,
  createRedirect,
  updateRedirect,
  deleteRedirect,
  getUserRedirects,
  getRedirectStats,
  countUserRedirects,
} from "../../../services/redirectService";
import { slugify } from "../../../lib/plinkkUtils";
import {
  getMaxRedirects,
  isUserPremium,
  PREMIUM_MAX_REDIRECTS,
} from "@plinkk/shared";
import z from "zod";
import { logUserAction, logDetailedAction } from "../../../lib/userLogger";
import { calculateObjectDiff } from "../../../lib/diffUtils";

const createRedirectSchema = z.object({
  slug: z.string().min(2).max(50),
  targetUrl: z.string().url(),
  title: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
});

const updateRedirectSchema = z.object({
  slug: z.string().min(2).max(50).optional(),
  targetUrl: z.string().url().optional(),
  title: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export function apiMeRedirectsRoutes(fastify: FastifyInstance) {
  // Liste des redirections de l'utilisateur
  fastify.get("/", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId!;

    const redirects = await getUserRedirects(userId);
    return reply.send({ redirects });
  });

  // Vérifier la disponibilité d'un slug
  fastify.get("/check-slug", { preHandler: requireAuth }, async (request, reply) => {
    const { slug } = request.query as { slug?: string };

    if (!slug) {
      return reply.code(400).send({ error: "missing_slug" });
    }

    const normalizedSlug = slugify(slug);
    const result = await isRedirectSlugAvailable(normalizedSlug);

    return reply.send({
      slug: normalizedSlug,
      available: result.available,
      reason: result.reason,
    });
  });

  // Créer une redirection
  fastify.post("/", { preHandler: requireAuthWithUser }, async (request, reply) => {
    const userId = request.userId!;
    const user = request.currentUser!;

    // Valider les données
    let data;
    try {
      data = createRedirectSchema.parse(request.body);
    } catch (e) {
      return reply.code(400).send({ error: "invalid_data", details: (e as z.ZodError<unknown>).issues });
    }

    // Vérifier la limite de redirections
    const currentCount = await countUserRedirects(userId);
    const maxRedirects = getMaxRedirects(user);

    if (currentCount >= maxRedirects) {
      const isPremium = isUserPremium(user);
      const canUpgrade = !isPremium && PREMIUM_MAX_REDIRECTS > maxRedirects;

      return reply.code(403).send({
        error: "redirect_limit_reached",
        current: currentCount,
        max: maxRedirects,
        canUpgrade,
        premiumLimit: canUpgrade ? PREMIUM_MAX_REDIRECTS : undefined,
        message: canUpgrade
          ? `Limite atteinte. Passez Premium pour obtenir jusqu'à ${PREMIUM_MAX_REDIRECTS} redirections.`
          : "Limite de redirections atteinte.",
      });
    }

    // Normaliser et vérifier le slug
    const normalizedSlug = slugify(data.slug);
    const slugCheck = await isRedirectSlugAvailable(normalizedSlug);

    if (!slugCheck.available) {
      return reply.code(409).send({
        error: "slug_unavailable",
        reason: slugCheck.reason,
      });
    }

    // Créer la redirection
    try {
      const redirect = await createRedirect(userId, normalizedSlug, data.targetUrl, {
        title: data.title,
        description: data.description,
      });
      await logDetailedAction(userId, "CREATE_REDIRECT", redirect.id, {}, redirect, request.ip, {
        formatted: `Created redirect '${redirect.slug}' -> '${redirect.targetUrl}'`
      });
      return reply.code(201).send({ redirect });
    } catch (e) {
      request.log?.error(e, "createRedirect failed");
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  // Récupérer une redirection spécifique
  fastify.get("/:redirectId", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId!;
    const { redirectId } = request.params as { redirectId: string };

    const redirect = await prisma.redirect.findUnique({
      where: { id: redirectId },
    });

    if (!redirect) {
      return reply.code(404).send({ error: "redirect_not_found" });
    }

    if (redirect.userId !== userId) {
      return reply.code(403).send({ error: "forbidden" });
    }

    return reply.send({ redirect });
  });

  // Mettre à jour une redirection
  fastify.patch("/:redirectId", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId!;
    const { redirectId } = request.params as { redirectId: string };

    // Valider les données
    let data;
    try {
      data = updateRedirectSchema.parse(request.body);
    } catch (e) {
      return reply.code(400).send({ error: "invalid_data", details: (e as z.ZodError<unknown>).issues });
    }

    // Vérifier que la redirection appartient à l'utilisateur
    const existing = await prisma.redirect.findUnique({
      where: { id: redirectId },
    });

    if (!existing) {
      return reply.code(404).send({ error: "redirect_not_found" });
    }

    if (existing.userId !== userId) {
      return reply.code(403).send({ error: "forbidden" });
    }

    // Si le slug change, vérifier sa disponibilité
    if (data.slug && data.slug !== existing.slug) {
      const normalizedSlug = slugify(data.slug);
      const slugCheck = await isRedirectSlugAvailable(normalizedSlug, redirectId);

      if (!slugCheck.available) {
        return reply.code(409).send({
          error: "slug_unavailable",
          reason: slugCheck.reason,
        });
      }

      data.slug = normalizedSlug;
    }

    try {
      const redirect = await updateRedirect(redirectId, data);

      await logDetailedAction(userId, "UPDATE_REDIRECT", redirectId, existing, redirect, request.ip, {
        formatted: `Updated redirect '${redirect.slug}'`
      });
      return reply.send({ redirect });
    } catch (e) {
      request.log?.error(e, "updateRedirect failed");
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  // Supprimer une redirection
  fastify.delete("/:redirectId", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId!;
    const { redirectId } = request.params as { redirectId: string };

    // Vérifier que la redirection appartient à l'utilisateur
    const existing = await prisma.redirect.findUnique({
      where: { id: redirectId },
    });

    if (!existing) {
      return reply.code(404).send({ error: "redirect_not_found" });
    }

    if (existing.userId !== userId) {
      return reply.code(403).send({ error: "forbidden" });
    }

    try {
      await deleteRedirect(redirectId);
      await logDetailedAction(userId, "DELETE_REDIRECT", redirectId, existing, {}, request.ip, {
        formatted: `Deleted redirect '${existing.slug}'`
      });
      return reply.send({ ok: true });
    } catch (e) {
      request.log?.error(e, "deleteRedirect failed");
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  // Statistiques d'une redirection
  fastify.get("/:redirectId/stats", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId!;
    const { redirectId } = request.params as { redirectId: string };
    const { days } = request.query as { days?: string };

    // Vérifier que la redirection appartient à l'utilisateur
    const existing = await prisma.redirect.findUnique({
      where: { id: redirectId },
    });

    if (!existing) {
      return reply.code(404).send({ error: "redirect_not_found" });
    }

    if (existing.userId !== userId) {
      return reply.code(403).send({ error: "forbidden" });
    }

    const stats = await getRedirectStats(redirectId, days ? parseInt(days, 10) : 30);
    return reply.send({ stats });
  });

  // Informations sur les limites
  fastify.get("/limits", { preHandler: requireAuthWithUser }, async (request, reply) => {
    const userId = request.userId!;
    const user = request.currentUser!;

    const currentCount = await countUserRedirects(userId);
    const maxRedirects = getMaxRedirects(user);

    return reply.send({
      current: currentCount,
      max: maxRedirects,
      remaining: Math.max(0, maxRedirects - currentCount),
    });
  });
}
