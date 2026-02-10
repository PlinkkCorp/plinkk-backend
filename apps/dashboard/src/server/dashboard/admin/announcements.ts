import { FastifyInstance } from "fastify";
import { Announcement, prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { logAdminAction } from "../../../lib/adminLogger";
import { requireAuthRedirect, requireAuth } from "../../../middleware/auth";

export function adminAnnouncementsRoutes(fastify: FastifyInstance) {
  // ── Page admin ──
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_ANNOUNCEMENTS", { mode: "redirect" });
    if (!ok) return;

    const roles = await prisma.role.findMany({ orderBy: { priority: "desc" } });

    return replyView(reply, "dashboard/admin/message.ejs", request.currentUser!, {
      publicPath: request.publicPath,
      roles,
    });
  });

  // ── GET all announcements (admin view, not filtered by user) ──
  fastify.get("/api", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_ANNOUNCEMENTS");
    if (!ok) return;

    const messages = await prisma.announcement.findMany({
      include: {
        targets: { select: { userId: true } },
        roleTargets: { select: { roleId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Flatten targets for frontend consumption
    const result = messages.map((m) => ({
      id: m.id,
      level: m.level,
      text: m.text,
      dismissible: m.dismissible,
      startAt: m.startAt,
      endAt: m.endAt,
      global: m.global,
      displayType: m.displayType,
      platform: m.platform,
      createdAt: m.createdAt,
      targetUserIds: m.targets.map((t) => t.userId),
      targetRoles: m.roleTargets.map((rt) => rt.roleId),
    }));

    return reply.send({ messages: result });
  });

  // ── CREATE or UPDATE ──
  fastify.post("/api", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_ANNOUNCEMENTS");
    if (!ok) return;

    const body = request.body as {
      id?: string;
      targetUserIds?: string[];
      targetRoles?: string[];
      level?: string;
      text?: string;
      dismissible?: boolean;
      startAt?: string;
      endAt?: string;
      global?: boolean;
      displayType?: string;
      platform?: string;
    };

    const id = body.id || undefined;
    const targetUserIds: string[] = Array.isArray(body.targetUserIds) ? body.targetUserIds : [];
    const targetRoleIds: string[] = Array.isArray(body.targetRoles) ? body.targetRoles : [];

    const validDisplayTypes = ["banner", "notification", "popup"];
    const validPlatforms = ["dashboard", "public", "all"];

    const payload = {
      level: String(body.level || "info"),
      text: String(body.text || ""),
      dismissible: body.dismissible === true,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
      global: body.global === true,
      displayType: validDisplayTypes.includes(String(body.displayType)) ? String(body.displayType) : "banner",
      platform: validPlatforms.includes(String(body.platform)) ? String(body.platform) : "all",
    };

    if (!payload.text.trim()) {
      return reply.code(400).send({ error: "Le contenu du message est requis." });
    }

    let ann: Announcement;
    if (!id) {
      ann = await prisma.announcement.create({ data: { ...payload } });
      await logAdminAction(request.userId!, "CREATE_ANNOUNCEMENT", ann.id, payload, request.ip);
    } else {
      ann = await prisma.announcement.update({ where: { id }, data: { ...payload } });
      await prisma.announcementTarget.deleteMany({ where: { announcementId: ann.id } });
      await prisma.announcementRoleTarget.deleteMany({ where: { announcementId: ann.id } });
      await logAdminAction(request.userId!, "UPDATE_ANNOUNCEMENT", ann.id, payload, request.ip);
    }

    if (!payload.global) {
      if (targetUserIds.length) {
        await prisma.announcementTarget.createMany({
          data: targetUserIds.map((uid) => ({ announcementId: ann.id, userId: uid })),
          skipDuplicates: true,
        });
      }
      if (targetRoleIds.length) {
        await prisma.announcementRoleTarget.createMany({
          data: targetRoleIds.map((rid) => ({ announcementId: ann.id, roleId: rid })),
          skipDuplicates: true,
        });
      }
    }

    return reply.send({
      ok: true,
      message: {
        id: ann.id,
        ...payload,
        targetUserIds,
        targetRoles: targetRoleIds,
      },
    });
  });

  // ── DELETE ──
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
