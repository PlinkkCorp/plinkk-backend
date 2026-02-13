import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import {
  reindexNonDefault,
  slugify,
  isReservedSlug,
  createPlinkkForUser,
} from "../../../../lib/plinkkUtils";
import {
  getMaxPlinkks,
  isUserPremium,
  PREMIUM_MAX_PLINKKS,
} from "@plinkk/shared";
import { logUserAction } from "../../../../lib/userLogger";

export function plinkksCrudRoutes(fastify: FastifyInstance) {
  fastify.patch("/:id", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const { id } = request.params as { id: string };
    const p = await prisma.plinkk.findUnique({ where: { id } });
    if (!p || p.userId !== userId)
      return reply.code(404).send({ error: "not_found" });
    const body = request.body as { isPublic: boolean; isDefault: boolean };
    const patch: { isPublic?: boolean; visibility?: "PUBLIC" | "PRIVATE" } = {};
    if (typeof body.isPublic === "boolean") {
      patch.isPublic = Boolean(body.isPublic);
      patch.visibility = body.isPublic ? "PUBLIC" : "PRIVATE";
    }
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
    await logUserAction(userId, "UPDATE_PLINKK", id, patch, request.ip);
    return reply.send({ ok: true });
  });

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
    await logUserAction(userId, "DELETE_PLINKK", id, {}, request.ip);
    return reply.send({ ok: true });
  });

  fastify.post("/", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const body = request.body as { slug: string; name: string };
    const rawSlug = typeof body.slug === "string" ? body.slug : "";
    const rawName = typeof body.name === "string" ? body.name : "";
    try {
      const base = slugify(rawSlug || rawName || "page");
      if (!base || (await isReservedSlug(prisma, base)))
        return reply.code(400).send({ error: "invalid_or_reserved_slug" });
      const userConflict = await prisma.user.findUnique({
        where: { id: base },
        select: { id: true },
      });
      if (userConflict)
        return reply.code(409).send({ error: "slug_conflicts_with_user" });

      // Vérification préventive de la limite pour un message personnalisé
      const me = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });
      if (me) {
        const count = await prisma.plinkk.count({ where: { userId } });
        const maxPages = getMaxPlinkks(me);
        if (count >= maxPages) {
          const isPremium = isUserPremium(me);
          const canUpgrade = !isPremium && PREMIUM_MAX_PLINKKS > maxPages;
          return reply.code(403).send({
            error: "max_pages_reached",
            current: count,
            max: maxPages,
            canUpgrade,
            premiumLimit: canUpgrade ? PREMIUM_MAX_PLINKKS : undefined,
            message: canUpgrade
              ? `Limite atteinte. Passez Premium pour créer jusqu'à ${PREMIUM_MAX_PLINKKS} pages.`
              : "Limite de pages Plinkk atteinte.",
          });
        }
      }

      const created = await createPlinkkForUser(prisma, userId, {
        name: rawName,
        slugBase: base,
      });
      await logUserAction(userId, "CREATE_PLINKK", created.id, { slug: created.slug, name: created.name }, request.ip);
      return reply
        .code(201)
        .send({ id: created.id, slug: created.slug, name: created.name });
    } catch (e: unknown) {
      const error = e as { message?: string };
      if (error.message === "max_pages_reached")
        return reply.code(400).send({ error: "max_pages_reached" });
      if (error.message === "user_not_found")
        return reply.code(401).send({ error: "unauthorized" });
      return reply.code(500).send({ error: "internal_error" });
    }
  });
}
