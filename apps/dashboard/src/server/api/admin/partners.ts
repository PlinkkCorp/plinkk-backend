import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { verifyRoleIsStaff } from "../../../lib/verifyRole";
import { getS3Client } from "../../../lib/fileUtils";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "crypto";
import sharp from "sharp";
import { logAdminAction } from "../../../lib/adminLogger";

interface S3ClientWithSend extends S3Client {
  send(command: any): Promise<any>;
}

export function apiAdminPartnersRoutes(fastify: FastifyInstance) {
  // Middleware to check admin role
  fastify.addHook("preHandler", async (request, reply) => {
    const sessionData = request.session.get("data");
    if (!sessionData) return reply.code(401).send({ error: "unauthorized" });
    const userId = typeof sessionData === "object" ? sessionData.id : sessionData;
    const me = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role))) {
      return reply.code(403).send({ error: "forbidden" });
    }
    // Store userId for later use in routes
    (request as any).adminId = String(userId);
  });

  // --- UPLOAD ---
  fastify.post("/upload", async (request, reply) => {
    const file = await request.file();
    if (!file) return reply.code(400).send({ error: "Aucun fichier reçu" });

    const type = (request.query as { type?: string }).type || "misc";
    const allowedTypes = ["logo", "banner"];
    if (!allowedTypes.includes(type)) return reply.code(400).send({ error: "Type invalide" });

    const buf = await file.toBuffer();
    // Logic similar to api/me.ts:729
    const isImage = file.mimetype.startsWith("image/");
    if (!isImage) return reply.code(400).send({ error: "Format non supporté" });

    if (buf.byteLength > 5 * 1024 * 1024)
      return reply.code(413).send({ error: "Fichier trop lourd (max 5 Mo)" });

    const size = type === "banner" ? 1200 : 256;
    const processed = await sharp(buf)
      .resize({ width: size, height: type === "banner" ? undefined : size, fit: "cover", withoutEnlargement: true })
      .webp()
      .toBuffer();

    const hash = crypto.randomBytes(8).toString("hex");
    const key = `partners/uploads/${type}-${hash}.webp`;

    const command = new PutObjectCommand({
      Bucket: "plinkk-image",
      Key: key,
      Body: processed,
      ContentType: "image/webp",
    });

    try {
      await (getS3Client() as unknown as S3ClientWithSend).send(command);
      const url = `https://cdn.marvideo.fr/${key}`;
      return reply.send({ ok: true, url });
    } catch (e) {
      request.log.error(e);
      return reply.code(500).send({ error: "upload_failed" });
    }
  });

  // --- PARTNERS ---

  fastify.get("/", async (request, reply) => {
    const partners = await prisma.partner.findMany({
      include: {
        _count: {
          select: { quests: true }
        }
      },
      orderBy: { order: 'asc' }
    });
    return reply.send({ partners });
  });

  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: { quests: true }
    });
    if (!partner) return reply.code(404).send({ error: "not_found" });
    return reply.send({ partner });
  });

  // --- STATS ---
  fastify.get("/:id/stats", async (request, reply) => {
    const { id } = request.params as { id: string };
    const partner = await prisma.partner.findUnique({ where: { id }, include: { quests: true } });
    if (!partner) return reply.code(404).send({ error: "not_found" });

    try {
      // Aggregate partner daily stats
      const stats = await prisma.partnerStatDaily.findMany({ where: { partnerId: id }, orderBy: { date: 'asc' } });

      // Gems per quest (total and daily series)
      const quests = partner.quests || [];
      const questIds = quests.map(q => q.id);

      const gemsTotals = questIds.length > 0 ? await prisma.userQuest.groupBy({
        by: ['partnerQuestId'],
        where: { partnerQuestId: { in: questIds } },
        _sum: { gemsRewarded: true }
      }) : [] as any[];

      const gemsTotalsMap: Record<string, number> = {};
      gemsTotals.forEach(g => { gemsTotalsMap[g.partnerQuestId] = g._sum.gemsRewarded || 0; });

      // Daily gems per quest (simple approach: count completed by date)
      const dailyByQuest = await prisma.$queryRawUnsafe(`
        SELECT "partnerQuestId" as "questId", DATE("completedAt") as "date", SUM("gemsRewarded") as "gems"
        FROM "UserQuest"
        WHERE "partnerQuestId" IN (${questIds.map(() => '?').join(',')})
        GROUP BY "partnerQuestId", DATE("completedAt")
        ORDER BY DATE("completedAt") ASC
      `, ...questIds);

      return reply.send({ partner: { id: partner.id, name: partner.name }, stats, quests: quests.map(q => ({ id: q.id, title: q.title, gemsAwarded: gemsTotalsMap[q.id] || 0 })), dailyByQuest });
    } catch (e) {
      request.log?.error?.(e);
      return reply.code(500).send({ error: 'failed_to_aggregate' });
    }
  });

  fastify.post("/", async (request, reply) => {
    const body = request.body as { name: string; description?: string; logoUrl?: string; bannerUrl?: string; url?: string; isActive?: boolean; order?: number; userId?: string };
    if (!body.name) return reply.code(400).send({ error: "missing_name" });

    const partner = await prisma.partner.create({
      data: {
        name: body.name,
        description: body.description,
        logoUrl: body.logoUrl,
        bannerUrl: body.bannerUrl,
        url: body.url,
        userId: body.userId || null,
        isActive: body.isActive ?? true,
        order: body.order ?? 0,
      }
    });

    await logAdminAction((request as any).adminId, 'CREATE_PARTNER', partner.id, body, request.ip);

    return reply.send({ ok: true, partner });
  });

  fastify.put("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; description?: string; logoUrl?: string; bannerUrl?: string; url?: string; isActive?: boolean; order?: number; userId?: string };

    try {
      const partner = await prisma.partner.update({
        where: { id },
        data: {
          name: body.name,
          description: body.description,
          logoUrl: body.logoUrl,
          bannerUrl: body.bannerUrl,
          url: body.url,
          userId: body.userId === "" ? null : body.userId,
          isActive: body.isActive,
          order: body.order,
        }
      });

      await logAdminAction((request as any).adminId, 'UPDATE_PARTNER', id, body, request.ip);

      return reply.send({ ok: true, partner });
    } catch (e) {
      return reply.code(404).send({ error: "not_found" });
    }
  });

  fastify.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.partner.delete({ where: { id } });
      await logAdminAction((request as any).adminId, 'DELETE_PARTNER', id, {}, request.ip);
      return reply.send({ ok: true });
    } catch (e) {
      return reply.code(404).send({ error: "not_found" });
    }
  });

  // --- QUESTS ---

  fastify.post("/:partnerId/quests", async (request, reply) => {
    const { partnerId } = request.params as { partnerId: string };
    const body = request.body as { title: string; description?: string; rewardGems?: number; actionUrl: string; type?: string; isActive?: boolean };

    if (!body.title || !body.actionUrl) return reply.code(400).send({ error: "missing_fields" });

    try {
      const quest = await prisma.partnerQuest.create({
        data: {
          partnerId,
          title: body.title,
          description: body.description,
          rewardGems: body.rewardGems ?? 10,
          actionUrl: body.actionUrl,
          type: body.type ?? "link",
          isActive: body.isActive ?? true,
        }
      });

      await logAdminAction((request as any).adminId, 'CREATE_QUEST', quest.id, { ...body, partnerId }, request.ip);

      return reply.send({ ok: true, quest });
    } catch (e) {
      return reply.code(400).send({ error: "creation_failed" });
    }
  });

  fastify.put("/:partnerId/quests/:questId", async (request, reply) => {
    const { partnerId, questId } = request.params as { partnerId: string, questId: string };
    const body = request.body as { title?: string; description?: string; rewardGems?: number; actionUrl?: string; type?: string; isActive?: boolean };

    try {
      const quest = await prisma.partnerQuest.update({
        where: { id: questId },
        data: {
          title: body.title,
          description: body.description,
          rewardGems: body.rewardGems,
          actionUrl: body.actionUrl,
          type: body.type,
          isActive: body.isActive,
        }
      });

      await logAdminAction((request as any).adminId, 'UPDATE_QUEST', questId, { ...body, partnerId }, request.ip);

      return reply.send({ ok: true, quest });
    } catch (e) {
      return reply.code(404).send({ error: "not_found" });
    }
  });

  fastify.delete("/:partnerId/quests/:questId", async (request, reply) => {
    const { partnerId, questId } = request.params as { partnerId: string, questId: string };
    try {
      await prisma.partnerQuest.delete({ where: { id: questId } });
      await logAdminAction((request as any).adminId, 'DELETE_QUEST', questId, { partnerId }, request.ip);
      return reply.send({ ok: true });
    } catch (e) {
      return reply.code(404).send({ error: "not_found" });
    }
  });
}
