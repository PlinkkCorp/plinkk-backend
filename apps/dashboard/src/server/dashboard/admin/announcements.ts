import { FastifyInstance } from "fastify";
import { Announcement, prisma } from "@plinkk/prisma";
import { replyView, getActiveAnnouncementsForUser } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { logAdminAction } from "../../../lib/adminLogger";
import { requireAuthRedirect, requireAuth } from "../../../middleware/auth";

export function adminAnnouncementsRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_ANNOUNCEMENTS", { mode: "redirect" });
    if (!ok) return;

    const roles = await prisma.role.findMany({ orderBy: { priority: "desc" } });

    return replyView(reply, "dashboard/admin/message.ejs", request.currentUser!, {
      publicPath: request.publicPath,
      roles,
    });
  });

  fastify.get("/api", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_ANNOUNCEMENTS");
    if (!ok) return;

    const list = await getActiveAnnouncementsForUser(request.userId!);
    return reply.send({ messages: list });
  });

  fastify.post("/api", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_ANNOUNCEMENTS");
    if (!ok) return;

    const body = request.body as {
      id: string;
      targetUserIds: string[];
      targetRoles: string[];
      level: string;
      text: string;
      dismissible: string;
      startAt: string;
      endAt: string;
      global: string;
    };

    const id = body.id as string | undefined;
    const targetUserIds: string[] = Array.isArray(body.targetUserIds) ? body.targetUserIds : [];
    const targetRoleIds: string[] = Array.isArray(body.targetRoles) ? body.targetRoles : [];

    const payload = {
      level: String(body.level || "info"),
      text: String(body.text || ""),
      dismissible: !!body.dismissible,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
      global: !!body.global,
    };

    let ann: Announcement;
    if (!id) {
      ann = await prisma.announcement.create({ data: { ...payload } });
    } else {
      ann = await prisma.announcement.update({ where: { id }, data: { ...payload } });
      await prisma.announcementTarget.deleteMany({ where: { announcementId: ann.id } });
      await prisma.announcementRoleTarget.deleteMany({ where: { announcementId: ann.id } });
    }

    if (!payload.global) {
      if (targetUserIds.length) {
        await prisma.announcementTarget.createMany({
          data: targetUserIds.map((uid) => ({ announcementId: ann.id, userId: uid })),
        });
      }
      if (targetRoleIds.length) {
        await prisma.announcementRoleTarget.createMany({
          data: targetRoleIds.map((rid) => ({ announcementId: ann.id, roleId: rid })),
        });
      }
    }

    return reply.send({ ok: true, message: { id: ann.id, ...payload } });
  });

  fastify.delete("/api", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_ANNOUNCEMENTS");
    if (!ok) return;

    const { id } = request.query as { id: string };
    if (!id) return reply.code(400).send({ error: "missing_id" });

    try {
      await prisma.announcement.delete({ where: { id } });
      await logAdminAction(request.userId!, "DELETE_ANNOUNCEMENT", id, {}, request.ip);
      return reply.send({ ok: true });
    } catch {
      return reply.code(404).send({ error: "not_found" });
    }
  });
}
