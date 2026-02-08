import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import bcrypt from "bcrypt";
import { canUsePasswordProtectedPlinkk, canUseScheduledLinks } from "@plinkk/shared";

async function validatePlinkkOwnership(userId: string | undefined, plinkkId: string) {
  if (!userId) return null;
  return prisma.plinkk.findFirst({ where: { id: plinkkId, userId: String(userId) } });
}

async function loadUserForPremiumCheck(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
}

export function plinkksPremiumRoutes(fastify: FastifyInstance) {
  // ─────────────────────────────────────────────────────────────────────────
  // Feature 13 : Plinkk protégé par mot de passe
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * PUT /:id/password — Définir ou mettre à jour le mot de passe d'un Plinkk
   */
  fastify.put("/:id/password", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });

    const { id } = request.params as { id: string };
    const body = request.body as { password: string };

    if (!body.password || typeof body.password !== "string" || body.password.length < 4) {
      return reply.code(400).send({ error: "password_too_short", message: "Le mot de passe doit contenir au moins 4 caractères" });
    }

    // Vérifier que le plinkk appartient à l'utilisateur
    const plinkk = await validatePlinkkOwnership(userId, id);
    if (!plinkk) return reply.code(404).send({ error: "not_found" });

    // Vérifier le premium
    const user = await loadUserForPremiumCheck(userId);
    if (!canUsePasswordProtectedPlinkk(user)) {
      return reply.code(403).send({
        error: "premium_required",
        feature: "password_protected_plinkk",
        message: "La protection par mot de passe nécessite un abonnement premium",
      });
    }

    const hash = await bcrypt.hash(body.password, 10);
    await prisma.plinkk.update({
      where: { id },
      data: { passwordHash: hash },
    });

    return reply.send({ ok: true, hasPassword: true });
  });

  /**
   * DELETE /:id/password — Supprimer le mot de passe d'un Plinkk
   */
  fastify.delete("/:id/password", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });

    const { id } = request.params as { id: string };
    const plinkk = await validatePlinkkOwnership(userId, id);
    if (!plinkk) return reply.code(404).send({ error: "not_found" });

    await prisma.plinkk.update({
      where: { id },
      data: { passwordHash: null },
    });

    return reply.send({ ok: true, hasPassword: false });
  });

  /**
   * GET /:id/password/status — Vérifier si un Plinkk a un mot de passe
   */
  fastify.get("/:id/password/status", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });

    const { id } = request.params as { id: string };
    const plinkk = await validatePlinkkOwnership(userId, id);
    if (!plinkk) return reply.code(404).send({ error: "not_found" });

    return reply.send({ hasPassword: !!plinkk.passwordHash });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Feature 14 : Scheduled links (activation / expiration programmées)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * PUT /:id/links/:linkId/schedule — Programmer un lien (scheduledAt / expiresAt)
   */
  fastify.put("/:id/links/:linkId/schedule", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });

    const { id, linkId } = request.params as { id: string; linkId: string };
    const body = request.body as {
      scheduledAt?: string | null;
      expiresAt?: string | null;
    };

    // Vérifier que le plinkk appartient à l'utilisateur
    const plinkk = await validatePlinkkOwnership(userId, id);
    if (!plinkk) return reply.code(404).send({ error: "not_found" });

    // Vérifier le premium
    const user = await loadUserForPremiumCheck(userId);
    if (!canUseScheduledLinks(user)) {
      return reply.code(403).send({
        error: "premium_required",
        feature: "scheduled_links",
        message: "La programmation de liens nécessite un abonnement premium",
      });
    }

    // Vérifier que le lien existe et appartient à ce plinkk
    const link = await prisma.link.findFirst({
      where: { id: linkId, plinkkId: id, userId },
    });
    if (!link) return reply.code(404).send({ error: "link_not_found" });

    // Valider les dates
    const data: { scheduledAt?: Date | null; expiresAt?: Date | null } = {};

    if (body.scheduledAt !== undefined) {
      if (body.scheduledAt === null) {
        data.scheduledAt = null;
      } else {
        const d = new Date(body.scheduledAt);
        if (isNaN(d.getTime())) return reply.code(400).send({ error: "invalid_scheduled_at" });
        data.scheduledAt = d;
      }
    }

    if (body.expiresAt !== undefined) {
      if (body.expiresAt === null) {
        data.expiresAt = null;
      } else {
        const d = new Date(body.expiresAt);
        if (isNaN(d.getTime())) return reply.code(400).send({ error: "invalid_expires_at" });
        data.expiresAt = d;
      }
    }

    // Vérifier la cohérence des dates
    if (data.scheduledAt && data.expiresAt && data.scheduledAt >= data.expiresAt) {
      return reply.code(400).send({ error: "scheduled_at_must_be_before_expires_at" });
    }

    const updated = await prisma.link.update({
      where: { id: linkId },
      data,
      select: { id: true, scheduledAt: true, expiresAt: true },
    });

    return reply.send({ ok: true, link: updated });
  });

  /**
   * DELETE /:id/links/:linkId/schedule — Supprimer la programmation d'un lien
   */
  fastify.delete("/:id/links/:linkId/schedule", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });

    const { id, linkId } = request.params as { id: string; linkId: string };

    const plinkk = await validatePlinkkOwnership(userId, id);
    if (!plinkk) return reply.code(404).send({ error: "not_found" });

    const link = await prisma.link.findFirst({
      where: { id: linkId, plinkkId: id, userId },
    });
    if (!link) return reply.code(404).send({ error: "link_not_found" });

    const updated = await prisma.link.update({
      where: { id: linkId },
      data: { scheduledAt: null, expiresAt: null },
      select: { id: true, scheduledAt: true, expiresAt: true },
    });

    return reply.send({ ok: true, link: updated });
  });
}
