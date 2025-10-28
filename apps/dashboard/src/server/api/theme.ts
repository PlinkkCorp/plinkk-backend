import { FastifyInstance } from "fastify";
import { PrismaClient } from "@plinkk/prisma/generated/prisma/client";
import { coerceThemeData } from "../../lib/theme";
import { verifyRoleIsStaff } from "../../lib/verifyRole";
import { generateTheme } from "../../lib/generateTheme";

const prisma = new PrismaClient();

export function apiThemeRoutes(fastify: FastifyInstance) {
  fastify.get("/approved", async (request, reply) => {
    const themes = await prisma.theme.findMany({
      where: { status: "APPROVED", isPrivate: false },
      select: {
        id: true,
        name: true,
        description: true,
        data: true,
        author: { select: { id: true, userName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const list = themes.map((t) => {
      let full;
      try {
        full = coerceThemeData(t.data);
      } catch {
        full = t.data;
      }
      return {
        id: t.id,
        name: t.name,
        description: t.description || "",
        source: "community",
        author: t.author,
        ...(full || {}),
      };
    });
    return reply.send(list);
  });

  fastify.get("/list", async (request, reply) => {
    const { userId } = request.query as { userId: string };

    return reply.send(await generateTheme(userId));
  });

  fastify.post("/:id/approve-update", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: meId as string },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({
      where: { id },
      select: { pendingUpdate: true },
    });
    if (!t || !t.pendingUpdate)
      return reply.code(400).send({ error: "Aucune mise à jour en attente" });
    await prisma.theme.update({
      where: { id },
      data: {
        data: t.pendingUpdate,
        pendingUpdate: null,
        pendingUpdateAt: null,
        pendingUpdateMessage: null,
      },
    });
    return reply.send({ ok: true });
  });

  fastify.post("/:id/unarchive", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: meId as string },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    await prisma.theme.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    return reply.send({ ok: true });
  });

  fastify.post("/:id/archive", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: meId as string },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    await prisma.theme.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    return reply.send({ ok: true });
  });

  fastify.post("/:id/approve", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: meId as string },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    const updated = await prisma.theme.update({
      where: { id },
      data: { status: "APPROVED" },
      select: { id: true, status: true },
    });
    return reply.send(updated);
  });

  fastify.post("/:id/reject", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: meId as string },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    const updated = await prisma.theme.update({
      where: { id },
      data: { status: "REJECTED" },
      select: { id: true, status: true },
    });
    return reply.send(updated);
  });

  fastify.delete("/:id", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: meId as string },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    try {
      await prisma.theme.delete({ where: { id } });
      return reply.send({ ok: true });
    } catch (e) {
      return reply.code(404).send({ error: "Not found" });
    }
  });
}