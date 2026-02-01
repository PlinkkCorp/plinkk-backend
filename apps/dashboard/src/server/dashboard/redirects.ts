import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../lib/replyView";
import { requireAuthRedirect } from "../../middleware/auth";
import { getMaxRedirectsForRole, countUserRedirects } from "../../services/redirectService";

export function dashboardRedirectsRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const userInfo = request.currentUser!;
    const userId = request.userId!;

    const [redirects, redirectCount, totalClicks] = await Promise.all([
      prisma.redirect.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { dailyStats: true }
          }
        }
      }),
      countUserRedirects(userId),
      prisma.redirect.aggregate({
        where: { userId },
        _sum: { clicks: true }
      })
    ]);

    const maxRedirects = getMaxRedirectsForRole(userInfo.role);

    return replyView(reply, "dashboard/user/redirects.ejs", userInfo, {
      redirects,
      redirectCount,
      maxRedirects,
      totalClicks: totalClicks._sum.clicks || 0,
      publicPath: request.publicPath,
    });
  });

  fastify.get("/:id/stats", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const userInfo = request.currentUser!;
    const userId = request.userId!;
    const { id } = request.params as { id: string };

    const redirect = await prisma.redirect.findUnique({
      where: { id },
      include: {
        dailyStats: {
          orderBy: { date: "desc" },
          take: 30
        }
      }
    });

    if (!redirect || redirect.userId !== userId) {
      return reply.code(404).view("erreurs/404.ejs", { currentUser: userInfo });
    }

    // Préparer les données pour le graphique (30 derniers jours)
    const last30Days: { date: string; count: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayStats = redirect.dailyStats.find(
        d => d.date.toISOString().split('T')[0] === dateStr
      );
      last30Days.push({
        date: dateStr,
        count: dayStats?.count || 0
      });
    }

    return replyView(reply, "dashboard/user/redirect-stats.ejs", userInfo, {
      redirect,
      chartData: last30Days,
      publicPath: request.publicPath,
    });
  });
}
