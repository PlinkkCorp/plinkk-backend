import { FastifyInstance } from "fastify";
import { Prisma, prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { logAdminAction } from "../../../lib/adminLogger";
import { requireAuthRedirect, requireAuth } from "../../../middleware/auth";

interface LogsQuery {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: string;
  from?: string;
  to?: string;
  sort?: "asc" | "desc";
}

export function adminLogsRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_ADMIN_LOGS", { mode: "redirect" });
    if (!ok) return;

    return replyView(reply, "dashboard/admin/logs.ejs", request.currentUser!, {
      publicPath: request.publicPath,
    });
  });

  fastify.get<{ Querystring: LogsQuery }>("/api", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_ADMIN_LOGS");
    if (!ok) return;

    const { page = 1, limit = 50, adminId, action, from, to, sort = "desc" } = request.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.AdminLogWhereInput = {};
    if (adminId) where.adminId = adminId;
    if (action) where.action = action;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
        skip,
        take,
      }),
      prisma.adminLog.count({ where }),
    ]);

    const adminIds = [...new Set(logs.map((l) => l.adminId))];
    const targetIds = [...new Set(logs.filter(l => l.targetId).map(l => l.targetId!))];

    const [admins, targetUsers] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, userName: true, image: true },
      }),
      prisma.user.findMany({
        where: { id: { in: targetIds } },
        select: { id: true, userName: true, email: true, image: true }
      })
    ]);

    const adminMap = new Map(admins.map((a) => [a.id, a]));
    const targetMap = new Map(targetUsers.map((u) => [u.id, u]));

    const enriched = logs.map((l) => {
      const admin = adminMap.get(l.adminId);
      const targetUser = targetMap.get(l.targetId!);
      
      return {
        ...l,
        adminName: admin?.userName || l.adminId,
        adminImage: admin?.image,
        targetUser: targetUser ? {
          id: targetUser.id,
          userName: targetUser.userName,
          email: targetUser.email,
          image: targetUser.image
        } : (l.details as any)?.targetUser || null
      };
    });

    return reply.send({ logs: enriched, total });
  });
}
