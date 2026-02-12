import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { logAdminAction } from "../../../lib/adminLogger";

// const prisma = new PrismaClient();

interface SessionsQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'asc' | 'desc';
}

export function dashboardAdminSessionsRoutes(fastify: FastifyInstance) {
  
  // View: Sessions List
  fastify.get("/", async function (request, reply) {
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!userId) return reply.redirect(`/login?returnTo=${encodeURIComponent("/admin/sessions")}`);
    
    const userInfo = await prisma.user.findFirst({ where: { id: userId }, include: { role: true } });
    if (!userInfo) return reply.redirect(`/login?returnTo=${encodeURIComponent("/admin/sessions")}`);
    
    const ok = await ensurePermission(request, reply, 'VIEW_ADMIN', { mode: 'redirect' });
    if (!ok) return;

    let publicPath;
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({ where: { userId: userInfo.id, isDefault: true } });
      publicPath = defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}

    return replyView(reply, "dashboard/admin/sessions.ejs", userInfo, { publicPath });
  });


  fastify.get<{ Querystring: SessionsQuery }>("/api", async function (request, reply) {
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    
    const ok = await ensurePermission(request, reply, 'VIEW_ADMIN');
    if (!ok) return;

    const { page = 1, limit = 20, search, sort = 'desc' } = request.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (search) {
      where.user = {
        OR: [
          { userName: { contains: search } },
          { email: { contains: search } }
        ]
      };
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: {
          user: { select: { id: true, userName: true, image: true, email: true } }
        },
        orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' },
        skip,
        take
      }),
      prisma.session.count({ where })
    ]);

    const currentSessionId = request.session.get("sessionId");
    return reply.send({ sessions, total, currentSessionId });
  });

  fastify.delete("/:id", async function (request, reply) {
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    
    const ok = await ensurePermission(request, reply, 'MANAGE_USERS');
    if (!ok) return;

    const { id } = request.params as { id: string };

    try {
      const session = await prisma.session.findUnique({
        where: { id },
        include: { user: { select: { id: true, userName: true, email: true } } }
      });
      if (!session) return reply.code(404).send({ error: "not_found" });

      await prisma.session.delete({ where: { id } });
      await logAdminAction(userId, 'REVOKE_SESSION', session.user.id, { 
        sessionId: id, 
        targetUser: { id: session.user.id, name: session.user.userName, email: session.user.email } 
      }, request.ip);
      return reply.send({ ok: true });
    } catch (e) {
      return reply.code(404).send({ error: "not_found" });
    }
  });
  
  fastify.delete("/user/:userId", async function (request, reply) {
    const sessionData = request.session.get("data");
    const adminId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!adminId) return reply.code(401).send({ error: "unauthorized" });
    
    const ok = await ensurePermission(request, reply, 'MANAGE_USERS');
    if (!ok) return;

    const { userId: targetUserId } = request.params as { userId: string };

    try {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, userName: true, email: true }
      });
      if (!targetUser) return reply.code(404).send({ error: "user_not_found" });

      const count = await prisma.session.deleteMany({ where: { userId: targetUserId } });
      await logAdminAction(adminId, 'REVOKE_ALL_SESSIONS', targetUserId, { 
        count: count.count,
        targetUser: { id: targetUser.id, name: targetUser.userName, email: targetUser.email }
      }, request.ip);
      return reply.send({ ok: true, count: count.count });
    } catch (e) {
      return reply.code(500).send({ error: "internal_error" });
    }
  });
}
