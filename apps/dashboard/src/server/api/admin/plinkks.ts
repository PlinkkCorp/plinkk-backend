import { FastifyInstance } from "fastify";
import { PrismaClient } from "@plinkk/prisma/generated/prisma/client";
import { verifyRoleIsStaff } from "../../../lib/verifyRole";
import { isReservedSlug, slugify, reindexNonDefault } from "../../../lib/plinkkUtils";

const prisma = new PrismaClient();

export function apiAdminPlinkksRoutes(fastify: FastifyInstance) {
  fastify.patch("/:id", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findUnique({ where: { id: String(meId) }, select: { role: true } });
    if (!(me && verifyRoleIsStaff(me.role))) return reply.code(403).send({ error: "forbidden" });

    const { id } = request.params as { id: string };
    const body = request.body as { slug?: string; isPublic?: boolean; isDefault?: boolean; name?: string };
    const page = await prisma.plinkk.findUnique({ where: { id }, include: { user: true } });
    if (!page) return reply.code(404).send({ error: "not_found" });

    const set: any = {};
    if (typeof body.isPublic === "boolean") {
      set.isPublic = Boolean(body.isPublic);
      set.visibility = body.isPublic ? "PUBLIC" : "PRIVATE";
    }
    if (typeof body.name === "string" && body.name.trim()) {
      set.name = body.name.trim();
    }
    if (typeof body.slug === "string") {
      const raw = body.slug.trim();
      const s = slugify(raw);
      if (!s) return reply.code(400).send({ error: "invalid_slug" });
      if (await isReservedSlug(prisma, s)) return reply.code(400).send({ error: "reserved_slug" });
      const conflict = await prisma.plinkk.findFirst({ where: { userId: page.userId, slug: s, NOT: { id } }, select: { id: true } });
      if (conflict) return reply.code(409).send({ error: "slug_conflict" });
      set.slug = s;
    }

    if (body.isDefault === true && !page.isDefault) {
      const prev = await prisma.plinkk.findFirst({ where: { userId: page.userId, isDefault: true } });
      const agg = await prisma.plinkk.aggregate({
        where: { userId: page.userId },
        _max: { index: true },
      });
      const maxIndex = (agg._max.index ?? 0) + 10;

      await prisma.$transaction([
        prisma.plinkk.updateMany({
          where: { userId: page.userId, index: 0, NOT: { id } },
          data: { index: maxIndex + 1 },
        }),
        ...(prev
          ? [
              prisma.plinkk.update({
                where: { id: prev.id },
                data: { isDefault: false, index: maxIndex + 2 },
              }),
            ]
          : []),
        prisma.plinkk.update({
          where: { id },
          data: { isDefault: true, index: 0, ...(Object.keys(set).length ? set : {}) },
        }),
      ]);
      await reindexNonDefault(prisma, page.userId);
      return reply.send({ ok: true, id, isDefault: true });
    }

    if (Object.keys(set).length) {
      await prisma.plinkk.update({ where: { id }, data: set });
    }
    return reply.send({ ok: true, id });
  });

  fastify.patch("/:id/active", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findUnique({ where: { id: String(meId) }, select: { role: true } });
    if (!(me && verifyRoleIsStaff(me.role))) return reply.code(403).send({ error: "forbidden" });
    const { id } = request.params as { id: string };
    const { isActive } = (request.body as { isActive?: boolean }) ?? {};
    if (typeof isActive !== "boolean") return reply.code(400).send({ error: "invalid_payload" });
    const existing = await prisma.plinkk.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ error: "not_found" });
    await prisma.plinkk.update({ where: { id }, data: { isActive: Boolean(isActive) } });
    return reply.send({ ok: true, id, isActive: Boolean(isActive) });
  });

  fastify.delete("/:id", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findUnique({ where: { id: String(meId) }, select: { role: true } });
    if (!(me && verifyRoleIsStaff(me.role))) return reply.code(403).send({ error: "forbidden" });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findUnique({ where: { id } });
    if (!page) return reply.code(404).send({ error: "not_found" });
    if (page.isDefault) {
      const others = await prisma.plinkk.count({ where: { userId: page.userId, NOT: { id } } });
      if (others > 0) return reply.code(400).send({ error: "cannot_delete_default" });
    }
    await prisma.plinkk.delete({ where: { id } });
    await reindexNonDefault(prisma, page.userId);
    return reply.send({ ok: true, id });
  });

  fastify.put("/:id/config", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findUnique({ where: { id: String(meId) }, select: { role: true } });
    if (!(me && verifyRoleIsStaff(me.role))) return reply.code(403).send({ error: "forbidden" });
    const { id } = request.params as { id: string };
    const { affichageEmail } = (request.body as { affichageEmail?: string | null }) ?? {};
    const page = await prisma.plinkk.findUnique({ where: { id }, select: { id: true } });
    if (!page) return reply.code(404).send({ error: "not_found" });
    await prisma.plinkkSettings.upsert({
      where: { plinkkId: id },
      create: { plinkkId: id, affichageEmail: affichageEmail ?? null },
      update: { affichageEmail: affichageEmail ?? null },
    });
    return reply.send({ ok: true, id });
  });
}
