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
    const admins = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, userName: true },
    });
    const adminMap = new Map(admins.map((a) => [a.id, a.userName]));

    const enriched = logs.map((l) => ({
      ...l,
      adminName: adminMap.get(l.adminId) || l.adminId,
    }));

    return reply.send({ logs: enriched, total });
  });
}
