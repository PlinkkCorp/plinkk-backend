import { FastifyInstance } from "fastify";
import { PrismaClient } from "../../../generated/prisma/client";
import { coerceThemeData } from "../../lib/theme";
import { verifyRoleIsStaff } from "../../lib/verifyRole";
import { builtInThemes } from "../../lib/builtInThemes";

const prisma = new PrismaClient();

export function apiThemeRoutes(fastify: FastifyInstance) {
  // THEME APIs
  // List approved themes (public)
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
    // Ensure data has the shape expected by front
    const list = themes.map((t) => {
      let full: any;
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

  // List all themes: built-in + approved community themes (and optionally owner's themes if requested)
  fastify.get("/list", async (request, reply) => {
    let builtIns: any[] = [];
    try {
      if (Array.isArray(builtInThemes)) builtIns = builtInThemes;
    } catch (e) {
      builtIns = [];
    }

    // Load approved community themes from DB
    const community = await prisma.theme.findMany({
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
    const list = [];
    // normalize community themes using coerceThemeData
    for (const t of community) {
      let full: any;
      try {
        full = coerceThemeData(t.data);
      } catch {
        full = t.data;
      }
      list.push({
        id: t.id,
        name: t.name,
        description: t.description || "",
        source: "community",
        author: t.author,
        ...(full || {}),
      });
    }

    // Optionally include user's own themes when query userId is provided (for editor)
    const userId = (request.query as { userId: string })?.userId;
    if (userId && typeof userId === "string") {
      const mine = await prisma.theme.findMany({
        where: { authorId: userId },
        select: {
          id: true,
          name: true,
          description: true,
          data: true,
          status: true,
        },
      });
      for (const t of mine) {
        let full: any;
        try {
          full = coerceThemeData(t.data);
        } catch {
          full = t.data;
        }
        list.push({
          id: t.id,
          name: t.name,
          description: t.description || "",
          source: "mine",
          status: t.status,
          ...(full || {}),
        });
      }
    }

    // Return built-ins first, then community and mine
    return reply.send({ builtIns, themes: list });
  });

  // Admin: approve a pending update -> replace data and clear pending
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

  // Admin: unarchive (republish) -> sets status APPROVED
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

  // Admin: archive a theme (any status) -> sets status ARCHIVED
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

  // Admin: approve / reject
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

  // Admin: delete a theme (any status)
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