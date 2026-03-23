import { FastifyInstance } from "fastify";
import { prisma, Prisma } from "@plinkk/prisma";
import { recordPlinkkView } from "@plinkk/shared";
import { shouldRecordProfileView, shouldRecordLinkClick } from "../middleware/ipRateLimit";

/**
 * Routes API pour le tracking des vues/clics (appelées depuis le client)
 */
export function trackingRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/track-view/:plinkkId
   * Enregistre une vue de profil (appelé depuis le client via localStorage)
   */
  fastify.post("/api/track-view/:plinkkId", async (request, reply) => {
    const { plinkkId } = request.params as { plinkkId: string };

    if (!plinkkId) {
      return reply.code(400).send({ error: "missing_plinkk_id" });
    }

    // Vérifier que le plinkk existe et récupérer l'userId
    const plinkk = await prisma.plinkk.findUnique({
      where: { id: plinkkId },
      select: { id: true, userId: true },
    });

    if (!plinkk) {
      return reply.code(404).send({ error: "plinkk_not_found" });
    }

    // Protection anti-spam par IP (mais sans bloquer la requête)
    if (!shouldRecordProfileView(request, plinkkId)) {
      return reply.send({ ok: true, tracked: false, reason: "ip_cooldown" });
    }

    // Enregistrer la vue
    await recordPlinkkView(prisma, plinkkId, plinkk.userId, request);

    return reply.send({ ok: true, tracked: true });
  });

  /**
   * POST /api/track-click/:linkId
   * Enregistre un clic de lien et retourne l'URL de destination
   */
  fastify.post("/api/track-click/:linkId", async (request, reply) => {
    const { linkId } = request.params as { linkId: string };

    if (!linkId) {
      return reply.code(400).send({ error: "missing_link_id" });
    }

    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { id: true, url: true, plinkkId: true, userId: true },
    });

    if (!link) {
      return reply.code(404).send({ error: "link_not_found" });
    }

    // Protection anti-spam par IP (mais sans bloquer la requête)
    const shouldTrack = shouldRecordLinkClick(request, linkId);

    if (shouldTrack) {
      // Incrémenter le compteur de clics
      await prisma.link.update({
        where: { id: linkId },
        data: { clicks: { increment: 1 } },
      });

      // Enregistrer le clic daté (agrégation quotidienne)
      try {
        const now = new Date();
        const dateObj = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        await prisma.linkClickDaily.upsert({
          where: { linkId_date: { linkId, date: dateObj } },
          create: { linkId, date: dateObj, count: 1 },
          update: { count: { increment: 1 } },
        });
      } catch (e) {
        request.log?.warn({ err: e }, "LinkClickDaily failed");
      }

      // Enregistrer dans PageStat
      try {
        if (link.plinkkId) {
          await prisma.pageStat.create({
            data: {
              plinkkId: link.plinkkId,
              eventType: "click",
              ip: String(request.ip || request.headers?.["x-forwarded-for"] || ""),
              meta: { linkId, userId: link.userId },
            },
          });
        }
      } catch (e) {
        request.log?.warn({ err: e }, "record click pageStat failed");
      }
    }

    return reply.send({
      ok: true,
      tracked: shouldTrack,
      url: link.url,
    });
  });

  // ─── Funnel Event Tracking ──────────────────────────────────────────────────
  const ALLOWED_EVENTS = ['landing_visit', 'signup', 'premium_view', 'config_view', 'purchase', 'cancel'];

  fastify.post("/api/track", async (request, reply) => {
    const body = request.body as { event?: string; meta?: Record<string, unknown> } | undefined;
    const event = body?.event;
    if (!event || !ALLOWED_EVENTS.includes(event)) {
      return reply.code(400).send({ error: "invalid_event" });
    }

    // Session-based fingerprint
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

    // Generate or reuse a tracking session ID via cookie
    let trackingId = (request.cookies as Record<string, string>)?.["plinkk_tid"];
    if (!trackingId) {
      trackingId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      reply.setCookie("plinkk_tid", trackingId, {
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        httpOnly: true,
        sameSite: "lax",
      });
    }

    try {
      await prisma.funnelEvent.create({
        data: {
          event,
          sessionId: trackingId,
          userId: userId || null,
          ip: request.ip,
          userAgent: request.headers["user-agent"] || null,
          referrer: request.headers.referer || null,
          meta: (body?.meta as Prisma.InputJsonObject) || null,
        },
      });
    } catch (e) {
      // Silently fail — tracking should never break the page
      request.log.error(e, "Failed to save funnel event");
    }

    return reply.send({ ok: true });
  });
}
