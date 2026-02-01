import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { requireStaff } from "../../../middleware/auth";
import { logAdminAction } from "../../../lib/adminLogger";
import { getRedirectStats } from "../../../services/redirectService";

export function apiAdminRedirectsRoutes(fastify: FastifyInstance) {
  // Liste toutes les redirections (avec pagination)
  fastify.get("/", { preHandler: requireStaff }, async (request, reply) => {
    const { page = "1", limit = "50", search, userId } = request.query as {
      page?: string;
      limit?: string;
      search?: string;
      userId?: string;
    };
    
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { slug: { contains: search, mode: "insensitive" } },
        { targetUrl: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    const [redirects, total] = await Promise.all([
      prisma.redirect.findMany({
        where,
        include: {
          user: { select: { id: true, userName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.redirect.count({ where }),
    ]);
    
    return reply.send({
      redirects,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  });

  // Détails d'une redirection
  fastify.get("/:redirectId", { preHandler: requireStaff }, async (request, reply) => {
    const { redirectId } = request.params as { redirectId: string };
    
    const redirect = await prisma.redirect.findUnique({
      where: { id: redirectId },
      include: {
        user: { select: { id: true, userName: true, email: true } },
      },
    });
    
    if (!redirect) {
      return reply.code(404).send({ error: "redirect_not_found" });
    }
    
    return reply.send({ redirect });
  });

  // Statistiques d'une redirection (admin)
  fastify.get("/:redirectId/stats", { preHandler: requireStaff }, async (request, reply) => {
    const { redirectId } = request.params as { redirectId: string };
    const { days } = request.query as { days?: string };
    
    const redirect = await prisma.redirect.findUnique({
      where: { id: redirectId },
    });
    
    if (!redirect) {
      return reply.code(404).send({ error: "redirect_not_found" });
    }
    
    const stats = await getRedirectStats(redirectId, days ? parseInt(days, 10) : 30);
    return reply.send({ stats });
  });

  // Modifier une redirection (admin)
  fastify.patch("/:redirectId", { preHandler: requireStaff }, async (request, reply) => {
    const adminId = request.userId!;
    const { redirectId } = request.params as { redirectId: string };
    const body = request.body as {
      slug?: string;
      targetUrl?: string;
      title?: string;
      description?: string;
      isActive?: boolean;
    };
    
    const existing = await prisma.redirect.findUnique({
      where: { id: redirectId },
    });
    
    if (!existing) {
      return reply.code(404).send({ error: "redirect_not_found" });
    }
    
    try {
      const redirect = await prisma.redirect.update({
        where: { id: redirectId },
        data: body,
      });
      
      await logAdminAction(adminId, "EDIT_REDIRECT", redirectId, {
        changes: body,
        previousSlug: existing.slug,
      }, request.ip);
      
      return reply.send({ redirect });
    } catch (e) {
      request.log?.error(e, "admin updateRedirect failed");
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  // Supprimer une redirection (admin)
  fastify.delete("/:redirectId", { preHandler: requireStaff }, async (request, reply) => {
    const adminId = request.userId!;
    const { redirectId } = request.params as { redirectId: string };
    
    const existing = await prisma.redirect.findUnique({
      where: { id: redirectId },
      include: { user: { select: { id: true, userName: true } } },
    });
    
    if (!existing) {
      return reply.code(404).send({ error: "redirect_not_found" });
    }
    
    try {
      await prisma.redirect.delete({ where: { id: redirectId } });
      
      await logAdminAction(adminId, "DELETE_REDIRECT", redirectId, {
        slug: existing.slug,
        targetUrl: existing.targetUrl,
        ownerId: existing.userId,
        ownerName: existing.user?.userName,
      }, request.ip);
      
      return reply.send({ ok: true });
    } catch (e) {
      request.log?.error(e, "admin deleteRedirect failed");
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  // Désactiver/activer une redirection (admin)
  fastify.post("/:redirectId/toggle", { preHandler: requireStaff }, async (request, reply) => {
    const adminId = request.userId!;
    const { redirectId } = request.params as { redirectId: string };
    
    const existing = await prisma.redirect.findUnique({
      where: { id: redirectId },
    });
    
    if (!existing) {
      return reply.code(404).send({ error: "redirect_not_found" });
    }
    
    const redirect = await prisma.redirect.update({
      where: { id: redirectId },
      data: { isActive: !existing.isActive },
    });
    
    await logAdminAction(adminId, existing.isActive ? "DISABLE_REDIRECT" : "ENABLE_REDIRECT", redirectId, {
      slug: existing.slug,
    }, request.ip);
    
    return reply.send({ redirect });
  });

  // Statistiques globales des redirections
  fastify.get("/stats/global", { preHandler: requireStaff }, async (request, reply) => {
    const { days = "30" } = request.query as { days?: string };
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days, 10));
    
    const [
      totalRedirects,
      activeRedirects,
      totalClicks,
      topRedirects,
      dailyStats,
    ] = await Promise.all([
      prisma.redirect.count(),
      prisma.redirect.count({ where: { isActive: true } }),
      prisma.redirect.aggregate({ _sum: { clicks: true } }),
      prisma.redirect.findMany({
        orderBy: { clicks: "desc" },
        take: 10,
        select: {
          id: true,
          slug: true,
          targetUrl: true,
          clicks: true,
          user: { select: { id: true, userName: true } },
        },
      }),
      prisma.redirectClickDaily.groupBy({
        by: ["date"],
        where: { date: { gte: since } },
        _sum: { count: true },
        orderBy: { date: "asc" },
      }),
    ]);
    
    return reply.send({
      totalRedirects,
      activeRedirects,
      totalClicks: totalClicks._sum.clicks || 0,
      topRedirects,
      dailyStats: dailyStats.map((s) => ({
        date: s.date.toISOString().split("T")[0],
        count: s._sum.count || 0,
      })),
    });
  });
}
