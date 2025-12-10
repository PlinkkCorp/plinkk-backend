import { FastifyInstance } from "fastify";
import { Label, Link, NeonColor, PlinkkStatusbar, SocialIcon, prisma } from "@plinkk/prisma";
import { pickDefined } from "../../../../lib/plinkkUtils";

async function validatePlinkkOwnership(userId: string | undefined, plinkkId: string) {
  if (!userId) return null;
  return prisma.plinkk.findFirst({ where: { id: plinkkId, userId: String(userId) } });
}

export function plinkksSettingsRoutes(fastify: FastifyInstance) {
  fastify.put("/:id/config/background", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    if (!(await validatePlinkkOwnership(userId, id)))
      return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { background: any[] };
    const list = Array.isArray(body?.background) ? body.background : [];
    const colors = list
      .map((item) =>
        typeof item === "string"
          ? item
          : item && typeof item.color === "string"
          ? item.color
          : null
      )
      .filter((c): c is string => !!c && typeof c === "string" && c.trim() !== "");

    await prisma.backgroundColor.deleteMany({ where: { userId, plinkkId: id } });
    if (colors.length > 0) {
      await prisma.backgroundColor.createMany({
        data: colors.map((color) => ({ color, userId, plinkkId: id })),
      });
    }

    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/labels", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    if (!(await validatePlinkkOwnership(userId, id)))
      return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { labels: Label[] };

    if (Array.isArray(body.labels)) {
      await prisma.label.deleteMany({ where: { userId, plinkkId: id } });
      if (body.labels.length > 0) {
        await prisma.label.createMany({
          data: body.labels.map((l) => ({
            data: l.data,
            color: l.color,
            fontColor: l.fontColor,
            userId,
            plinkkId: id,
          })),
        });
      }
    }

    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/socialIcon", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    if (!(await validatePlinkkOwnership(userId, id)))
      return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { socialIcon: SocialIcon[] };

    if (Array.isArray(body.socialIcon)) {
      await prisma.socialIcon.deleteMany({ where: { userId, plinkkId: id } });
      if (body.socialIcon.length > 0) {
        await prisma.socialIcon.createMany({
          data: body.socialIcon.map((s) => ({
            url: s.url,
            icon: s.icon,
            userId,
            plinkkId: id,
          })),
        });
      }
    }

    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/links", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    if (!(await validatePlinkkOwnership(userId, id)))
      return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { links: Link[] };

    if (Array.isArray(body.links)) {
      const existing = await prisma.link.findMany({
        where: { userId, plinkkId: id },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((l) => l.id));
      const incomingIds = new Set(body.links.map((l) => l.id).filter(Boolean));
      const toDelete = Array.from(existingIds).filter((x) => !incomingIds.has(x));

      if (toDelete.length > 0)
        await prisma.link.deleteMany({ where: { id: { in: toDelete } } });

      for (const l of body.links) {
        const linkData = {
          icon: l.icon ?? undefined,
          url: l.url,
          text: l.text ?? undefined,
          name: (l as any).name === null ? null : typeof (l as any).name === "string" ? (l as any).name : undefined,
          description: l.description ?? undefined,
          showDescriptionOnHover: l.showDescriptionOnHover ?? undefined,
          showDescription: l.showDescription ?? undefined,
          categoryId: l.categoryId ?? null,
        };

        if (l.id && existingIds.has(l.id)) {
          await prisma.link.update({ where: { id: l.id }, data: linkData });
        } else {
          await prisma.link.create({
            data: { ...linkData, userId, plinkkId: id },
          });
        }
      }
    }

    const updatedLinks = await prisma.link.findMany({ where: { userId, plinkkId: id } });

    return reply.send({
      ok: true,
      links: updatedLinks.map((l) => ({
        id: l.id,
        icon: l.icon,
        url: l.url,
        text: l.text,
        name: l.name,
        description: l.description,
        showDescriptionOnHover: l.showDescriptionOnHover,
        showDescription: l.showDescription,
        categoryId: l.categoryId,
      })),
    });
  });

  fastify.put("/:id/config/categories", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    if (!(await validatePlinkkOwnership(userId, id)))
      return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { categories: { id?: string; name: string; order: number }[] };

    if (Array.isArray(body.categories)) {
      const existing = await prisma.category.findMany({
        where: { plinkkId: id },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((c) => c.id));
      const incomingIds = new Set(body.categories.map((c) => c.id).filter(Boolean));
      const toDelete = Array.from(existingIds).filter((x) => !incomingIds.has(x as string));

      if (toDelete.length > 0)
        await prisma.category.deleteMany({ where: { id: { in: toDelete as string[] } } });

      for (const c of body.categories) {
        if (c.id && existingIds.has(c.id)) {
          await prisma.category.update({
            where: { id: c.id },
            data: { name: c.name, order: c.order },
          });
        } else {
          await prisma.category.create({
            data: { name: c.name, order: c.order, plinkkId: id },
          });
        }
      }
    }

    const updatedCategories = await prisma.category.findMany({
      where: { plinkkId: id },
      orderBy: { order: "asc" },
    });

    return reply.send({
      ok: true,
      categories: updatedCategories.map((c) => ({ id: c.id, name: c.name, order: c.order })),
    });
  });

  fastify.put("/:id/config/statusBar", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    if (!(await validatePlinkkOwnership(userId, id)))
      return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { statusbar: PlinkkStatusbar };

    if (body.statusbar !== undefined) {
      const s = body.statusbar;
      if (s === null) {
        await prisma.plinkkStatusbar.deleteMany({ where: { plinkkId: id } });
      } else {
        await prisma.plinkkStatusbar.upsert({
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

    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/neonColor", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    if (!(await validatePlinkkOwnership(userId, id)))
      return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { neonColors: NeonColor[] };

    if (Array.isArray(body.neonColors)) {
      await prisma.neonColor.deleteMany({ where: { userId, plinkkId: id } });
      if (body.neonColors.length > 0) {
        await prisma.neonColor.createMany({
          data: body.neonColors.map((neonColor) => ({
            color: neonColor.color,
            userId,
            plinkkId: id,
          })),
        });
      }
    }

    return reply.send({ ok: true });
  });
}
