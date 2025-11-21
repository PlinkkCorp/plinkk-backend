import { FastifyInstance } from "fastify";
import { PrismaClient } from "@plinkk/prisma/generated/prisma/client";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { logAdminAction } from "../../../lib/adminLogger";

const prisma = new PrismaClient();

export function dashboardAdminSessionsRoutes(fastify: FastifyInstance) {
  
  // View: Sessions List
  fastify.get("/", async function (request, reply) {
    const userId = request.session.get("data");
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

  // API: List Sessions
  fastify.get("/api", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    
    const ok = await ensurePermission(request, reply, 'VIEW_ADMIN');
    if (!ok) return;

    const { page = 1, limit = 20, search, sort = 'desc' } = request.query as any;
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

    // Clean up expired sessions first (optional, but good hygiene)
    // await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });

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

  // API: Revoke Session
  fastify.delete("/:id", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    
    const ok = await ensurePermission(request, reply, 'MANAGE_USERS');
    if (!ok) return;

    const { id } = request.params as { id: string };

    try {
      await prisma.session.delete({ where: { id } });
      await logAdminAction(userId, 'REVOKE_SESSION', id, {}, request.ip);
      return reply.send({ ok: true });
    } catch (e) {
      return reply.code(404).send({ error: "not_found" });
    }
  });
  
  // API: Revoke All for User
  fastify.delete("/user/:userId", async function (request, reply) {
    const adminId = request.session.get("data");
    if (!adminId) return reply.code(401).send({ error: "unauthorized" });
    
    const ok = await ensurePermission(request, reply, 'MANAGE_USERS');
    if (!ok) return;

    const { userId } = request.params as { userId: string };

    try {
      const count = await prisma.session.deleteMany({ where: { userId } });
      await logAdminAction(adminId, 'REVOKE_ALL_SESSIONS', userId, { count: count.count }, request.ip);
      return reply.send({ ok: true, count: count.count });
    } catch (e) {
      return reply.code(500).send({ error: "internal_error" });
    }
  });
}
