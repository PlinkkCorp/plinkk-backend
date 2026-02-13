import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { coerceThemeData } from "../../lib/theme";
import { verifyRoleIsStaff } from "../../lib/verifyRole";
import { ensurePermission } from "../../lib/permissions";
import { generateTheme } from "../../lib/generateTheme";
import { logUserAction } from "../../lib/userLogger";
import { logAdminAction } from "../../lib/adminLogger";

// const prisma = new PrismaClient();

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
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'APPROVE_THEME');
    if (!ok) return;
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({
      where: { id },
      select: { pendingUpdate: true, authorId: true, name: true },
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
    if (t.authorId) {
      await logUserAction(t.authorId, "THEME_UPDATE_APPROVED", meId, { themeId: id, themeName: t.name }, request.ip);
      await logAdminAction(meId, "APPROVE_THEME_UPDATE", t.authorId, { themeId: id }, request.ip);
    }
    return reply.send({ ok: true });
  });

  fastify.post("/:id/reject-update", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'APPROVE_THEME');
    if (!ok) return;
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({
      where: { id },
      select: { pendingUpdate: true, authorId: true, name: true },
    });
    if (!t || !t.pendingUpdate)
      return reply.code(400).send({ error: "Aucune mise à jour en attente" });
    await prisma.theme.update({
      where: { id },
      data: {
        pendingUpdate: null,
        pendingUpdateAt: null,
        pendingUpdateMessage: null,
      },
    });
    if (t.authorId) {
      await logUserAction(t.authorId, "THEME_UPDATE_REJECTED", meId, { themeId: id, themeName: t.name }, request.ip);
      await logAdminAction(meId, "REJECT_THEME_UPDATE", t.authorId, { themeId: id }, request.ip);
    }
    return reply.send({ ok: true });
  });

  fastify.post("/:id/unarchive", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'ARCHIVE_THEME');
    if (!ok) return;
    const { id } = request.params as { id: string };
    const updated = await prisma.theme.update({
      where: { id },
      data: { status: "APPROVED" },
      select: { id: true, status: true, authorId: true, name: true },
    });
    if (updated.authorId) {
      await logUserAction(updated.authorId, "THEME_UNARCHIVED", meId, { themeId: id, themeName: updated.name }, request.ip);
      await logAdminAction(meId, "UNARCHIVE_THEME", updated.authorId, { themeId: id }, request.ip);
    }
    return reply.send({ ok: true });
  });

  fastify.post("/:id/archive", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'ARCHIVE_THEME');
    if (!ok) return;
    const { id } = request.params as { id: string };
    const updated = await prisma.theme.update({
      where: { id },
      data: { status: "ARCHIVED" },
      select: { id: true, status: true, authorId: true, name: true },
    });
    if (updated.authorId) {
      await logUserAction(updated.authorId, "THEME_ARCHIVED", meId, { themeId: id, themeName: updated.name }, request.ip);
      await logAdminAction(meId, "ARCHIVE_THEME", updated.authorId, { themeId: id }, request.ip);
    }
    return reply.send({ ok: true });
  });

  fastify.post("/:id/approve", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'APPROVE_THEME');
    if (!ok) return;
    const { id } = request.params as { id: string };
    const updated = await prisma.theme.update({
      where: { id },
      data: { status: "APPROVED" },
      select: { id: true, status: true, authorId: true, name: true },
    });
    if (updated.authorId) {
      await logUserAction(updated.authorId, "THEME_APPROVED", meId, { themeId: id, themeName: updated.name }, request.ip);
      await logAdminAction(meId, "APPROVE_THEME", updated.authorId, { themeId: id }, request.ip);
    }
    return reply.send(updated);
  });

  fastify.post("/:id/reject", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'APPROVE_THEME');
    if (!ok) return;
    const { id } = request.params as { id: string };
    const updated = await prisma.theme.update({
      where: { id },
      data: { status: "REJECTED" },
      select: { id: true, status: true, authorId: true, name: true },
    });
    if (updated.authorId) {
      await logUserAction(updated.authorId, "THEME_REJECTED", meId, { themeId: id, themeName: updated.name }, request.ip);
      await logAdminAction(meId, "REJECT_THEME", updated.authorId, { themeId: id }, request.ip);
    }
    return reply.send(updated);
  });

  fastify.delete("/:id", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'DELETE_ANY_THEME');
    if (!ok) return;
    const { id } = request.params as { id: string };
    try {
      const t = await prisma.theme.findUnique({ where: { id }, select: { authorId: true, name: true } });
      await prisma.theme.delete({ where: { id } });
      if (t && t.authorId) {
        await logUserAction(t.authorId, "THEME_DELETED", meId, { themeId: id, themeName: t.name }, request.ip);
        await logAdminAction(meId, "DELETE_THEME", t.authorId, { themeId: id }, request.ip);
      }
      return reply.send({ ok: true });
    } catch (e) {
      return reply.code(404).send({ error: "Not found" });
    }
  });
}