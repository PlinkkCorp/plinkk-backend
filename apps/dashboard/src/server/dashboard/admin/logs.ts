import { FastifyInstance } from "fastify";
import { Prisma, prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { logAdminAction } from "../../../lib/adminLogger";
import { requireAuthRedirect, requireAuth } from "../../../middleware/auth";

interface LogsQuery {
  page?: string;
  limit?: string;
  adminId?: string;
  targetId?: string;
  action?: string;
  from?: string;
  to?: string;
  sort?: "asc" | "desc";
}

interface EnrichedAdminLog {
  id: string;
  adminId: string;
  adminName: string;
  adminImage: string | null;
  action: string;
  targetId: string | null;
  targetUser: {
    id: string;
    userName: string;
    email: string;
    image: string | null;
  } | null;
  details: any;
  createdAt: Date;
  ip: string | null;
}

interface EnrichedUserLog {
  id: string;
  userId: string;
  userName: string;
  userImage: string | null;
  action: string;
  targetId: string | null;
  targetUser: {
    id: string;
    userName: string;
    email: string;
    image: string | null;
  } | null;
  details: any;
  createdAt: Date;
  ip: string | null;
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

    const query = request.query;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const sortOrder = query.sort === "asc" ? "asc" : "desc";

    const where: any = {};
    if (query.adminId && typeof query.adminId === 'string' && query.adminId.trim()) {
      where.adminId = query.adminId.trim();
    }
    if (query.targetId && typeof query.targetId === 'string' && query.targetId.trim()) {
      where.targetId = query.targetId.trim();
    }
    if (query.action && typeof query.action === 'string' && query.action.trim()) {
      where.action = query.action.trim();
    }
    
    if (query.from || query.to) {
      const dateFilter: any = {};
      if (query.from) {
        const d = new Date(query.from);
        if (!isNaN(d.getTime())) dateFilter.gte = d;
      }
      if (query.to) {
        const d = new Date(query.to);
        if (!isNaN(d.getTime())) dateFilter.lte = d;
      }
      if (Object.keys(dateFilter).length > 0) {
        where.createdAt = dateFilter;
      }
    }

    const total = await prisma.adminLog.count({ where });
    const logs = await prisma.adminLog.findMany({
      where,
      orderBy: { createdAt: sortOrder as Prisma.SortOrder },
      skip: skip < 0 ? 0 : skip,
      take: limit <= 0 ? 50 : limit,
    });

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

    const adminMap = new Map<string, any>(admins.map((a) => [a.id, a]));
    const targetMap = new Map<string, any>(targetUsers.map((u) => [u.id, u]));

    const enriched: EnrichedAdminLog[] = logs.map((l) => {
      const admin = adminMap.get(l.adminId);
      const targetUser = l.targetId ? targetMap.get(l.targetId) : null;
      
      return {
        ...l,
        adminName: admin?.userName || l.adminId,
        adminImage: admin?.image || null,
        targetUser: targetUser ? {
          id: targetUser.id,
          userName: targetUser.userName,
          email: targetUser.email,
          image: targetUser.image
        } : null
      };
    });

    return reply.send({ logs: enriched, total });
  });

  fastify.get<{ Querystring: LogsQuery }>("/user-api", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_ADMIN_LOGS");
    if (!ok) return;

    const query = request.query;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const sortOrder = query.sort === "asc" ? "asc" : "desc";

    const where: Prisma.UserLogWhereInput = {};
    const adminIdInput = query.adminId && typeof query.adminId === 'string' ? query.adminId.trim() : null;
    if (adminIdInput) {
      where.userId = adminIdInput;
    }
    
    const targetIdInput = query.targetId && typeof query.targetId === 'string' ? query.targetId.trim() : null;
    if (targetIdInput) {
      where.targetId = targetIdInput;
    }
    
    const actionInput = query.action && typeof query.action === 'string' ? query.action.trim() : null;
    if (actionInput) {
      where.action = actionInput;
    }
    
    if (query.from || query.to) {
      const dateFilter: Prisma.DateTimeFilter<"UserLog"> = {};
      if (query.from) {
        const d = new Date(query.from);
        if (!isNaN(d.getTime())) dateFilter.gte = d.toISOString();
      }
      if (query.to) {
        const d = new Date(query.to);
        if (!isNaN(d.getTime())) dateFilter.lte = d.toISOString();
      }
      if (Object.keys(dateFilter).length > 0) {
        where.createdAt = dateFilter;
      }
    }

    try {
      const [total, logs] = await Promise.all([
        prisma.userLog.count({ where }),
        prisma.userLog.findMany({
          where,
          orderBy: { createdAt: sortOrder as Prisma.SortOrder },
          skip: skip < 0 ? 0 : skip,
          take: limit <= 0 ? 50 : limit,
        })
      ]);

      const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean) as string[])];
      const targetIds = [...new Set(logs.filter(l => l.targetId).map(l => l.targetId!) as string[])];

      const [users, targetUsers] = await Promise.all([
        prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, userName: true, image: true },
        }),
        prisma.user.findMany({
          where: { id: { in: targetIds } },
          select: { id: true, userName: true, email: true, image: true }
        })
      ]);

      const userMap = new Map<string, any>(users.map((u) => [u.id, u]));
      const targetMap = new Map<string, any>(targetUsers.map((u) => [u.id, u]));

      const enriched: EnrichedUserLog[] = logs.map((l) => {
        const user = userMap.get(l.userId);
        const targetUser = l.targetId ? targetMap.get(l.targetId) : null;
        
        return {
          ...l,
          userName: user?.userName || l.userId,
          userImage: user?.image || null,
          targetUser: targetUser ? {
            id: targetUser.id,
            userName: targetUser.userName,
            email: targetUser.email,
            image: targetUser.image
          } : null
        };
      });

      return reply.send({ logs: enriched, total });
    } catch (err) {
      console.error("Erreur critique /user-api:", err);
      const errorMessage = err instanceof Error ? err.stack || err.message : String(err);
      return reply.code(500).send({ error: "INTERNAL_SERVER_ERROR", message: errorMessage });
    }
  });
}
