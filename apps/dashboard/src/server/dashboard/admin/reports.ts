import { FastifyInstance } from "fastify";
import { PrismaClient } from "@plinkk/prisma/generated/prisma/client";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { logAdminAction } from "../../../lib/adminLogger";

const prisma = new PrismaClient();

interface ReportsQuery {
  page?: number;
  limit?: number;
  status?: string;
  sort?: 'asc' | 'desc';
}

export function dashboardAdminReportsRoutes(fastify: FastifyInstance) {
  
  // View: Reports List
  fastify.get("/", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.redirect(`/login?returnTo=${encodeURIComponent("/admin/reports")}`);
    
    const userInfo = await prisma.user.findFirst({ where: { id: userId }, include: { role: true } });
    if (!userInfo) return reply.redirect(`/login?returnTo=${encodeURIComponent("/admin/reports")}`);
    
    const ok = await ensurePermission(request, reply, 'VIEW_ADMIN', { mode: 'redirect' });
    if (!ok) return;

    let publicPath;
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({ where: { userId: userInfo.id, isDefault: true } });
      publicPath = defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}

    return replyView(reply, "dashboard/admin/reports.ejs", userInfo, { publicPath });
  });

  // API: List Reports
  fastify.get<{ Querystring: ReportsQuery }>("/api", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    
    const ok = await ensurePermission(request, reply, 'VIEW_ADMIN');
    if (!ok) return;

    const { page = 1, limit = 20, status, sort = 'desc' } = request.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, userName: true, image: true } },
          reportedUser: { select: { id: true, userName: true, image: true } },
          reportedPlinkk: { select: { id: true, name: true, slug: true } }
        },
        orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' },
        skip,
        take
      }),
      prisma.report.count({ where })
    ]);

    return reply.send({ reports, total });
  });

  // API: Update Status
  fastify.post("/:id/status", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    
    const ok = await ensurePermission(request, reply, 'MANAGE_USERS'); // Or MANAGE_REPORTS if exists
    if (!ok) return;

    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    if (!['PENDING', 'RESOLVED', 'DISMISSED'].includes(status)) {
      return reply.code(400).send({ error: "invalid_status" });
    }

    const report = await prisma.report.update({
      where: { id },
      data: { status }
    });

    await logAdminAction(userId, 'UPDATE_REPORT', id, { status }, request.ip);

    return reply.send({ ok: true, report });
  });
}
