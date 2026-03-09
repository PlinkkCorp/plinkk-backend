import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
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
        await prisma.$executeRawUnsafe(
          'CREATE TABLE IF NOT EXISTS "LinkClickDaily" ("linkId" TEXT NOT NULL, "date" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("linkId","date"))',
        );
        const now = new Date();
        const y = now.getUTCFullYear();
        const m = String(now.getUTCMonth() + 1).padStart(2, "0");
        const d = String(now.getUTCDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${d}`;
        await prisma.$executeRawUnsafe(
          'INSERT INTO "LinkClickDaily" ("linkId","date","count") VALUES (?,?,1) ON CONFLICT("linkId","date") DO UPDATE SET "count" = "count" + 1',
          linkId,
          dateStr,
        );
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
}
