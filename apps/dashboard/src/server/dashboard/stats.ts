import { FastifyInstance } from "fastify";
import { prisma, User } from "@plinkk/prisma";
import { replyView } from "../../lib/replyView";
import { requireAuthRedirect, requireAuth } from "../../middleware/auth";
import {
  getPublicPath,
  getPlinkksByUserId,
  getSelectedPlinkk,
  formatPlinkkForView,
  formatPagesForView,
} from "../../services/plinkkService";
import { isUserPremium, getMaxStatsDays, getUserLimits, FREE_MAX_STATS_DAYS } from "@plinkk/shared";

export function dashboardStatsRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const userInfo = request.currentUser!;
    const userId = request.userId!;

    const q = request.query as { plinkkId: string };
    const pages = await getPlinkksByUserId(userId);
    const selected = getSelectedPlinkk(pages, q?.plinkkId);
    const selectedForView = formatPlinkkForView(selected);
    const autoOpenPlinkkModal = !q?.plinkkId && pages.length > 1;

    const now = new Date();
    const end = now;
    const start = new Date(end.getTime() - 29 * 86400000);

    let preSeries: { date: Date; count: number }[] = [];
    let redirectSeries: { date: Date; count: number }[] = [];
    let totalViews = 0;
    let totalClicks = 0;
    let totalRedirectClicks = 0;

    try {
      if (selected) {
        const rows = await prisma.plinkkViewDaily.findMany({
          where: { plinkkId: selected.id, date: { gte: start, lte: end } },
          select: { date: true, count: true },
          orderBy: { date: "asc" },
        });

        const byDate = new Map<string, number>();
        for (const r of rows) {
          try {
            const key = new Date(r.date).toISOString().slice(0, 10);
            byDate.set(key, Number(r.count));
          } catch (e) { }
        }

        for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + 86400000)) {
          const key = t.toISOString().slice(0, 10);
          preSeries.push({ date: t, count: byDate.get(key) || 0 });
        }
        totalViews = await prisma.pageStat.count({ where: { plinkkId: selected.id, eventType: "view" } });
        totalClicks = await prisma.pageStat.count({ where: { plinkkId: selected.id, eventType: "click" } });
      }

      // REDIRECT STATS
      const redirectStats = await prisma.redirectClickDaily.groupBy({
        by: ['date'],
        where: {
          redirect: { userId },
          date: { gte: start, lte: end }
        },
        _sum: { count: true }
      });

      const redirectByDate = new Map<string, number>();
      for (const r of redirectStats) {
        try {
          const key = new Date(r.date).toISOString().slice(0, 10);
          redirectByDate.set(key, Number(r._sum.count || 0));
        } catch (e) { }
      }

      for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + 86400000)) {
        const key = t.toISOString().slice(0, 10);
        redirectSeries.push({ date: t, count: redirectByDate.get(key) || 0 });
      }

      const rawTotalRedirectClicks = await prisma.redirect.aggregate({
        where: { userId },
        _sum: { clicks: true }
      });
      totalRedirectClicks = rawTotalRedirectClicks._sum.clicks || 0;

    } catch (e) {
      request.log.error(e);
    }

    const links = await prisma.link.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      take: 100,
    });

    const redirects = await prisma.redirect.findMany({
      where: { userId },
      orderBy: { clicks: "desc" },
      take: 100
    });

    const premiumInfo = getUserLimits(userInfo);

    return replyView(reply, "dashboard/user/stats.ejs", userInfo, {
      plinkk: selectedForView,
      pages: formatPagesForView(pages),
      autoOpenPlinkkModal,
      viewsDaily30d: preSeries,
      totalViews,
      totalClicks,
      links,
      // Add redirection data
      redirects,
      totalRedirectClicks,
      redirectReturns: redirectSeries,
      publicPath: request.publicPath,
      // Premium info
      isPremium: premiumInfo.isPremium,
      maxStatsDays: premiumInfo.maxStatsDays,
      premiumLimits: premiumInfo,
    });
  });

  fastify.get("/views", { preHandler: [requireAuth] }, async function (request, reply) {
    const userId = request.userId!;
    const { from, to, granularity = "day", plinkkId: qPlinkkId } = request.query as { from?: string; to?: string; granularity?: "day" | "hour" | "minute" | "second"; plinkkId?: string };

    // Charger l'utilisateur pour vérifier les limites premium
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    const maxDays = getMaxStatsDays(user);

    const now = new Date();
    const end = to ? new Date(to) : now;
    let start = from ? new Date(from) : new Date(end.getTime() - 29 * 86400000);

    // Limiter la plage de dates selon le statut premium
    const maxStart = new Date(end.getTime() - (maxDays - 1) * 86400000);
    if (start < maxStart) start = maxStart;

    const fmt = (dt: Date, gran = granularity) => {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dt.getUTCDate()).padStart(2, "0");
      const h = String(dt.getUTCHours()).padStart(2, "0");
      const min = String(dt.getUTCMinutes()).padStart(2, "0");
      const s = String(dt.getUTCSeconds()).padStart(2, "0");
      if (gran === "second") return `${y}-${m}-${d} ${h}:${min}:${s}`;
      if (gran === "minute") return `${y}-${m}-${d} ${h}:${min}:00`;
      if (gran === "hour") return `${y}-${m}-${d} ${h}:00:00`;
      return `${y}-${m}-${d}`;
    };
    const s = fmt(start, "day");
    const e = fmt(end, "day");

    try {
      let rows: Array<{ date: string | Date; count: number }> = [];

      if (granularity === "day") {
        if (qPlinkkId) {
          // Use plinkkViewDaily for a specific plinkk (overview chart)
          const verifyOwner = await prisma.plinkk.findFirst({ where: { id: qPlinkkId, userId } });
          if (verifyOwner) {
            rows = (await prisma.plinkkViewDaily.findMany({
              where: { plinkkId: qPlinkkId, date: { gte: start, lte: end } },
              select: { date: true, count: true },
              orderBy: { date: "asc" },
            })).map(r => ({ date: r.date, count: Number(r.count) }));
          }
        } else {
          await prisma.$executeRawUnsafe(
            'CREATE TABLE IF NOT EXISTS "UserViewDaily" ("userId" TEXT NOT NULL, "date" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("userId","date"))'
          );
          rows = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
            SELECT "date", "count"
            FROM "UserViewDaily"
            WHERE "userId" = ${userId} AND "date" BETWEEN ${s} AND ${e}
            ORDER BY "date" ASC
          `;
        }
      } else {
        // Find raw events for finer granularity
        // Need to query plinkks from this user first
        const userPlinkks = await prisma.plinkk.findMany({ where: { userId }, select: { id: true } });
        const plinkkIds = userPlinkks.map(p => p.id);

        if (plinkkIds.length > 0) {
          const rawEvents = await prisma.pageStat.findMany({
            where: {
              plinkkId: { in: plinkkIds },
              eventType: "view",
              createdAt: { gte: start, lte: end }
            },
            select: { createdAt: true }
          });

          rows = rawEvents.map(ev => ({ date: ev.createdAt, count: 1 }));
        }
      }

      const byDate = new Map<string, number>();
      for (const r of rows) {
        const key = fmt(new Date(r.date));
        byDate.set(key, (byDate.get(key) || 0) + Number(r.count || 1));
      }

      const series: { date: string; count: number }[] = [];
      let step = 86400000;
      if (granularity === "hour") step = 3600000;
      else if (granularity === "minute") step = 60000;
      else if (granularity === "second") step = 1000;

      const limit = 10000;
      let count = 0;
      for (let t = new Date(start.getTime()); t <= end && count < limit; t = new Date(t.getTime() + step)) {
        const key = fmt(t);
        series.push({ date: key, count: byDate.get(key) || 0 });
        count++;
      }
      return reply.send({ from: s, to: e, series });
    } catch (err) {
      request.log?.error({ err }, "Failed to query daily views");
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  fastify.get("/clicks", { preHandler: [requireAuth] }, async function (request, reply) {
    const userId = request.userId!;
    const { from, to, granularity = "day" } = request.query as { from?: string; to?: string; granularity?: "day" | "hour" | "minute" | "second" };

    // Charger l'utilisateur pour vérifier les limites premium
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    const maxDays = getMaxStatsDays(user);

    const now = new Date();
    const end = to ? new Date(to) : now;
    let start = from ? new Date(from) : new Date(end.getTime() - 29 * 86400000);

    // Limiter la plage de dates selon le statut premium
    const maxStart = new Date(end.getTime() - (maxDays - 1) * 86400000);
    if (start < maxStart) start = maxStart;

    const fmt = (dt: Date, gran = granularity) => {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dt.getUTCDate()).padStart(2, "0");
      const h = String(dt.getUTCHours()).padStart(2, "0");
      const min = String(dt.getUTCMinutes()).padStart(2, "0");
      const s = String(dt.getUTCSeconds()).padStart(2, "0");
      if (gran === "second") return `${y}-${m}-${d} ${h}:${min}:${s}`;
      if (gran === "minute") return `${y}-${m}-${d} ${h}:${min}:00`;
      if (gran === "hour") return `${y}-${m}-${d} ${h}:00:00`;
      return `${y}-${m}-${d}`;
    };
    const s = fmt(start, "day");
    const e = fmt(end, "day");

    try {
      const linkIds = (await prisma.link.findMany({ where: { userId }, select: { id: true } })).map((x) => x.id);
      if (linkIds.length === 0) return reply.send({ from: s, to: e, series: [] });

      let rows: Array<{ date: string | Date; count: number }> = [];

      if (granularity === "day") {
        rows = (
          await prisma.linkClickDaily.groupBy({
            by: ["date"],
            where: { linkId: { in: linkIds }, date: { gte: start, lte: end } },
            _sum: { count: true },
            orderBy: { date: "asc" },
          })
        ).map((r) => ({ date: r.date, count: r._sum.count ?? 0 }));
      } else {
        const userPlinkks = await prisma.plinkk.findMany({ where: { userId }, select: { id: true } });
        const plinkkIds = userPlinkks.map(p => p.id);

        if (plinkkIds.length > 0) {
          const rawEvents = await prisma.pageStat.findMany({
            where: {
              plinkkId: { in: plinkkIds },
              eventType: "click",
              createdAt: { gte: start, lte: end }
            },
            select: { createdAt: true }
          });
          rows = rawEvents.map(ev => ({ date: ev.createdAt, count: 1 }));
        }
      }

      const byDate = new Map<string, number>();
      for (const r of rows) {
        const key = fmt(new Date(r.date));
        byDate.set(key, (byDate.get(key) || 0) + Number(r.count || 1));
      }

      const series: { date: string; count: number }[] = [];
      let step = 86400000;
      if (granularity === "hour") step = 3600000;
      else if (granularity === "minute") step = 60000;
      else if (granularity === "second") step = 1000;

      const limit = 10000;
      let count = 0;
      for (let t = new Date(start.getTime()); t <= end && count < limit; t = new Date(t.getTime() + step)) {
        const key = fmt(t);
        series.push({ date: key, count: byDate.get(key) || 0 });
        count++;
      }
      return reply.send({ from: s, to: e, series });
    } catch (err) {
      request.log?.error({ err }, "Failed to query daily clicks");
      return reply.code(500).send({ error: "internal_error" });
    }
  });
}
