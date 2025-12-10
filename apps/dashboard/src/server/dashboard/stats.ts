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
    let totalViews = 0;
    let totalClicks = 0;

    try {
      if (selected) {
        const rows = await prisma.plinkkViewDaily.findMany({
          where: { plinkkId: selected.id, date: { gte: start, lte: end } },
          select: { date: true, count: true },
          orderBy: { date: "asc" },
        });
        const byDate = new Map(rows.map((r) => [r.date, Number(r.count)]));
        for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + 86400000)) {
          preSeries.push({ date: t, count: byDate.get(t) || 0 });
        }
        totalViews = await prisma.pageStat.count({ where: { plinkkId: selected.id, eventType: "view" } });
        totalClicks = await prisma.pageStat.count({ where: { plinkkId: selected.id, eventType: "click" } });
      }
    } catch {}

    const links = await prisma.link.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      take: 100,
    });

    return replyView(reply, "dashboard/user/stats.ejs", userInfo, {
      plinkk: selectedForView,
      pages: formatPagesForView(pages),
      autoOpenPlinkkModal,
      viewsDaily30d: preSeries,
      totalViews,
      totalClicks,
      links,
      publicPath: request.publicPath,
    });
  });

  fastify.get("/views", { preHandler: [requireAuth] }, async function (request, reply) {
    const userId = request.userId!;
    const { from, to } = request.query as { from?: string; to?: string };

    const now = new Date();
    const end = to ? new Date(to) : now;
    const start = from ? new Date(from) : new Date(end.getTime() - 29 * 86400000);

    const fmt = (dt: Date) => {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dt.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };
    const s = fmt(start);
    const e = fmt(end);

    try {
      await prisma.$executeRawUnsafe(
        'CREATE TABLE IF NOT EXISTS "UserViewDaily" ("userId" TEXT NOT NULL, "date" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("userId","date"))'
      );
      const rows = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT "date", "count"
        FROM "UserViewDaily"
        WHERE "userId" = ${userId} AND "date" BETWEEN ${s} AND ${e}
        ORDER BY "date" ASC
      `;

      const byDate = new Map(rows.map((r) => [r.date, r.count]));
      const series: { date: string; count: number }[] = [];
      for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + 86400000)) {
        const key = fmt(t);
        series.push({ date: key, count: byDate.get(key) || 0 });
      }
      return reply.send({ from: s, to: e, series });
    } catch (err) {
      request.log?.error({ err }, "Failed to query daily views");
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  fastify.get("/clicks", { preHandler: [requireAuth] }, async function (request, reply) {
    const userId = request.userId!;
    const { from, to } = request.query as { from?: string; to?: string };

    const now = new Date();
    const end = to ? new Date(to) : now;
    const start = from ? new Date(from) : new Date(end.getTime() - 29 * 86400000);

    const fmt = (dt: Date) => {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dt.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };
    const s = fmt(start);
    const e = fmt(end);

    try {
      const linkIds = (await prisma.link.findMany({ where: { userId }, select: { id: true } })).map((x) => x.id);
      if (linkIds.length === 0) return reply.send({ from: s, to: e, series: [] });

      const rows = (
        await prisma.linkClickDaily.groupBy({
          by: ["date"],
          where: { linkId: { in: linkIds }, date: { gte: start, lte: end } },
          _sum: { count: true },
          orderBy: { date: "asc" },
        })
      ).map((r) => ({ date: r.date, count: r._sum.count ?? 0 }));

      const byDate = new Map(rows.map((r) => [r.date, Number(r.count)]));
      const series: { date: Date; count: number }[] = [];
      for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + 86400000)) {
        series.push({ date: t, count: byDate.get(t) || 0 });
      }
      return reply.send({ from: s, to: e, series });
    } catch (err) {
      request.log?.error({ err }, "Failed to query daily clicks");
      return reply.code(500).send({ error: "internal_error" });
    }
  });
}
