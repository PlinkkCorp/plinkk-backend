import { FastifyInstance } from "fastify";
import { PrismaClient } from "@plinkk/prisma/generated/prisma/client";
import { verifyRoleIsStaff } from "../../../lib/verifyRole";
import { isReservedSlug, slugify, reindexNonDefault } from "../../../lib/plinkkUtils";

const prisma = new PrismaClient();

export function apiAdminPlinkksRoutes(fastify: FastifyInstance) {
  // Update plinkk fields: slug, isPublic, isDefault
  fastify.patch("/:id", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findUnique({ where: { id: String(meId) }, select: { role: true } });
    if (!(me && verifyRoleIsStaff(me.role))) return reply.code(403).send({ error: "forbidden" });

    const { id } = request.params as { id: string };
    const body = request.body as { slug?: string; isPublic?: boolean; isDefault?: boolean; name?: string };
    const page = await prisma.plinkk.findUnique({ where: { id }, include: { user: true } });
    if (!page) return reply.code(404).send({ error: "not_found" });

    // Accumulate updates
    const set: any = {};
    if (typeof body.isPublic === "boolean") {
      set.isPublic = Boolean(body.isPublic);
      set.visibility = body.isPublic ? "PUBLIC" : "PRIVATE";
    }
    if (typeof body.name === "string" && body.name.trim()) {
      set.name = body.name.trim();
    }
    // Slug change
    if (typeof body.slug === "string") {
      const raw = body.slug.trim();
      const s = slugify(raw);
      if (!s) return reply.code(400).send({ error: "invalid_slug" });
      if (await isReservedSlug(prisma, s)) return reply.code(400).send({ error: "reserved_slug" });
      // Ensure uniqueness within user
      const conflict = await prisma.plinkk.findFirst({ where: { userId: page.userId, slug: s, NOT: { id } }, select: { id: true } });
      if (conflict) return reply.code(409).send({ error: "slug_conflict" });
      set.slug = s;
    }

    // Set default requires transaction to clear previous default
    if (body.isDefault === true && !page.isDefault) {
      const prev = await prisma.plinkk.findFirst({ where: { userId: page.userId, isDefault: true } });
      // Trouver un index élevé libre pour éviter tout conflit unique (userId,index)
      const agg = await prisma.plinkk.aggregate({
        where: { userId: page.userId },
        _max: { index: true },
      });
      const maxIndex = (agg._max.index ?? 0) + 10; // marge de sécurité

      await prisma.$transaction([
        // 1) Déplacer un éventuel index 0 existant (hors page courante) vers un index temporaire élevé
        prisma.plinkk.updateMany({
          where: { userId: page.userId, index: 0, NOT: { id } },
          data: { index: maxIndex + 1 },
        }),
        // 2) Si une ancienne par défaut existe, la passer non défaut et la mettre très loin pour éviter collisions
        ...(prev
          ? [
              prisma.plinkk.update({
                where: { id: prev.id },
                data: { isDefault: false, index: maxIndex + 2 },
              }),
            ]
          : []),
        // 3) Passer la page courante en défaut avec index 0 et appliquer les autres modifications éventuelles
        prisma.plinkk.update({
          where: { id },
          data: { isDefault: true, index: 0, ...(Object.keys(set).length ? set : {}) },
        }),
      ]);
      // 4) Repacker les index des non défaut proprement
      await reindexNonDefault(prisma, page.userId);
      return reply.send({ ok: true, id, isDefault: true });
    }

    if (Object.keys(set).length) {
      await prisma.plinkk.update({ where: { id }, data: set });
    }
    return reply.send({ ok: true, id });
  });

  // Toggle active (freeze/unfreeze)
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

  // Delete plinkk (prevent deleting default if others exist)
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

  // Minimal settings update for affichageEmail (per-Plinkk public email)
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
