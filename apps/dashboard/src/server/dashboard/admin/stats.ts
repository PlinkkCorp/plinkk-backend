import { FastifyInstance } from "fastify";
import { Prisma, prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { verifyRoleIsStaff } from "../../../lib/verifyRole";
import { requireAuthRedirect, requireAuth } from "../../../middleware/auth";

interface StatsQuery {
  from?: string;
  to?: string;
  role?: string;
  visibility?: string;
  granularity?: "day" | "hour" | "minute" | "second";
}

interface LimitQuery {
  limit?: number;
}

interface TopPlinkksQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
}

function formatDate(dt: Date, granularity: "day" | "hour" | "minute" | "second" = "day"): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  const h = String(dt.getUTCHours()).padStart(2, "0");
  const min = String(dt.getUTCMinutes()).padStart(2, "0");
  const s = String(dt.getUTCSeconds()).padStart(2, "0");

  if (granularity === "second") return `${y}-${m}-${d} ${h}:${min}:${s}`;
  if (granularity === "minute") return `${y}-${m}-${d} ${h}:${min}:00`;
  if (granularity === "hour") return `${y}-${m}-${d} ${h}:00:00`;
  return `${y}-${m}-${d}`;
}

function getDateRange(from?: string, to?: string) {
  const now = new Date();
  const end = to
    ? new Date(to + "T23:59:59.999Z")
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const start = from ? new Date(from + "T00:00:00.000Z") : new Date(end.getTime() - 29 * 86400000);
  return { start, end };
}

function initDateMap<T>(start: Date, end: Date, granularity: "day" | "hour" | "minute" | "second", defaultValue: () => T): Map<string, T> {
  const map = new Map<string, T>();

  let step = 86400000; // day
  if (granularity === "hour") step = 3600000;
  else if (granularity === "minute") step = 60000;
  else if (granularity === "second") step = 1000;

  // Prevent enormous maps if someone asks for seconds over a year
  const limit = 10000;
  let count = 0;

  for (let t = new Date(start.getTime()); t <= end && count < limit; t = new Date(t.getTime() + step)) {
    map.set(formatDate(t, granularity), defaultValue());
    count++;
  }
  return map;
}

export function adminStatsRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS", { mode: "redirect" });
    if (!ok) return;

    return replyView(reply, "dashboard/admin/stats.ejs", request.currentUser!, {
      publicPath: request.publicPath,
    });
  });

  fastify.get<{ Querystring: StatsQuery }>("/users/series", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;

    const { from, to, role = "all", visibility = "all", granularity = "day" } = request.query;
    const { start, end } = getDateRange(from, to);

    const where: Prisma.UserWhereInput = { createdAt: { gte: start, lte: end } };
    if (role && role !== "all") where.role = { name: role };
    if (visibility && visibility !== "all") where.isPublic = visibility === "public";

    const users = await prisma.user.findMany({ where, select: { createdAt: true } });

    const byDate = initDateMap(start, end, granularity, () => 0);
    for (const u of users) {
      const key = formatDate(new Date(u.createdAt), granularity);
      if (byDate.has(key)) byDate.set(key, (byDate.get(key) || 0) + 1);
    }

    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return reply.send({ from: formatDate(start, "day"), to: formatDate(end, "day"), series });
  });

  fastify.get<{ Querystring: StatsQuery }>("/users/summary", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;

    const { from, to, role = "all", visibility = "all" } = request.query;
    const { start, end } = getDateRange(from, to);

    const where: Prisma.UserWhereInput = { createdAt: { gte: start, lte: end } };
    if (role && role !== "all") where.role = { name: role };
    if (visibility && visibility !== "all") where.isPublic = visibility === "public";

    const rows = await prisma.user.findMany({ where, include: { role: true } });

    const total = rows.length;
    const publics = rows.filter((r) => r.isPublic).length;
    const privates = total - publics;
    const byRole: Record<string, number> = {};
    rows.forEach((r) => {
      const name = r.role?.name || "UNKNOWN";
      byRole[name] = (byRole[name] || 0) + 1;
    });

    return reply.send({ total, publics, privates, byRole });
  });

  fastify.get<{ Querystring: StatsQuery }>("/logins/series", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;

    const { from, to, granularity = "day" } = request.query;
    const { start, end } = getDateRange(from, to);

    const rows = await prisma.user.findMany({
      where: { lastLogin: { gte: start, lte: end } },
      select: { lastLogin: true },
    });

    const byDate = initDateMap(start, end, granularity, () => 0);
    for (const r of rows) {
      const key = formatDate(new Date(r.lastLogin), granularity);
      if (byDate.has(key)) byDate.set(key, (byDate.get(key) || 0) + 1);
    }

    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return reply.send({ from: formatDate(start, "day"), to: formatDate(end, "day"), series });
  });

  fastify.get<{ Querystring: LimitQuery }>("/logins/recent", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;

    const limit = Math.min(50, Math.max(1, Number(request.query.limit || 20)));

    const rows = await prisma.user.findMany({
      select: { id: true, userName: true, email: true, lastLogin: true, role: true },
      orderBy: { lastLogin: "desc" },
      take: limit,
    });

    return reply.send({ users: rows });
  });

  fastify.get<{ Querystring: StatsQuery }>("/bans/series", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;

    const { from, to, granularity = "day" } = request.query;
    const { start, end } = getDateRange(from, to);

    const [bansCreated, bansRevoked, bansAll] = await Promise.all([
      prisma.bannedEmail.findMany({ where: { createdAt: { gte: start, lte: end } }, select: { createdAt: true } }),
      prisma.bannedEmail.findMany({ where: { revoquedAt: { not: null, gte: start, lte: end } }, select: { revoquedAt: true } }),
      prisma.bannedEmail.findMany(),
    ]);

    const byDate = initDateMap(start, end, granularity, () => ({ created: 0, revoked: 0 }));

    for (const b of bansCreated) {
      const key = formatDate(new Date(b.createdAt), granularity);
      const v = byDate.get(key);
      if (v) v.created += 1;
    }

    for (const b of bansRevoked) {
      const key = formatDate(new Date(b.revoquedAt as Date), granularity);
      const v = byDate.get(key);
      if (v) v.revoked += 1;
    }

    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, created: v.created, revoked: v.revoked }));

    const nowTs = Date.now();
    let activeNow = 0;
    for (const b of bansAll) {
      if (b.revoquedAt) continue;
      if (b.time == null || b.time < 0) {
        activeNow++;
        continue;
      }
      const until = new Date(b.createdAt).getTime() + b.time * 60000;
      if (until > nowTs) activeNow++;
    }

    return reply.send({
      from: formatDate(start, "day"),
      to: formatDate(end, "day"),
      series,
      summary: {
        activeNow,
        totalBanned: bansAll.length,
        totalRevoked: bansAll.filter((b) => !!b.revoquedAt).length,
      },
    });
  });

  fastify.get<{ Querystring: StatsQuery }>("/users/series/by-visibility", { preHandler: [requireAuth] }, async function (request, reply) {
    const me = await prisma.user.findFirst({ where: { id: request.userId }, select: { role: true } });
    if (!(me && verifyRoleIsStaff(me.role))) return reply.code(403).send({ error: "forbidden" });

    const { from, to, granularity = "day" } = request.query;
    const { start, end } = getDateRange(from, to);

    const rows = await prisma.user.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true, isPublic: true },
    });

    const byDate = initDateMap(start, end, granularity, () => ({ public: 0, private: 0 }));

    for (const r of rows) {
      const key = formatDate(new Date(r.createdAt), granularity);
      const bucket = byDate.get(key);
      if (bucket) {
        if (r.isPublic) bucket.public += 1;
        else bucket.private += 1;
      }
    }

    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, public: v.public, private: v.private }));

    return reply.send({ from: formatDate(start, "day"), to: formatDate(end, "day"), series });
  });

  fastify.get<{ Querystring: StatsQuery }>("/users/series/by-role", { preHandler: [requireAuth] }, async function (request, reply) {
    const me = await prisma.user.findFirst({ where: { id: request.userId }, select: { role: true } });
    if (!(me && verifyRoleIsStaff(me.role))) return reply.code(403).send({ error: "forbidden" });

    const { from, to, granularity = "day" } = request.query;
    const { start, end } = getDateRange(from, to);

    const rows = await prisma.user.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true, role: { select: { name: true } } },
    });

    const roleSet = new Set<string>();
    for (const r of rows) if (r.role?.name) roleSet.add(r.role.name);
    const roles = Array.from(roleSet.values()).sort();

    const makeZero = () => Object.fromEntries(roles.map((r) => [r, 0])) as Record<string, number>;
    const byDate = initDateMap(start, end, granularity, makeZero);

    for (const r of rows) {
      const key = formatDate(new Date(r.createdAt), granularity);
      const bucket = byDate.get(key);
      if (bucket && r.role?.name) {
        const name = r.role.name;
        if (bucket[name] === undefined) bucket[name] = 0;
        bucket[name] += 1;
      }
    }

    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, ...v }));

    return reply.send({ from: formatDate(start, "day"), to: formatDate(end, "day"), roles, series });
  });

  fastify.get<{ Querystring: StatsQuery }>("/plinkks/series", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;

    const { from, to, granularity = "day" } = request.query;
    const { start, end } = getDateRange(from, to);

    const rows = await prisma.plinkk.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    });

    const byDate = initDateMap(start, end, granularity, () => 0);
    for (const r of rows) {
      const key = formatDate(new Date(r.createdAt), granularity);
      if (byDate.has(key)) byDate.set(key, (byDate.get(key) || 0) + 1);
    }

    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return reply.send({ from: formatDate(start, "day"), to: formatDate(end, "day"), series });
  });

  fastify.get<{ Querystring: TopPlinkksQuery }>("/plinkks/top", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;

    const { page = 1, limit = 20, sort = "views", order = "desc", search = "" } = request.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.PlinkkWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { user: { userName: { contains: search } } },
      ];
    }

    const [plinkks, total] = await Promise.all([
      prisma.plinkk.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          views: true,
          createdAt: true,
          user: { select: { userName: true, image: true } },
        },
        orderBy: { [sort]: order },
        skip,
        take,
      }),
      prisma.plinkk.count({ where }),
    ]);

    return reply.send({ plinkks, total });
  });

  fastify.get("/plinkks/total", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;

    const agg = await prisma.plinkk.aggregate({ _sum: { views: true } });
    return reply.send({ total: agg._sum.views || 0 });
  });

  // ─── Premium & Paiements ──────────────────────────────────────────────────

  fastify.get("/premium/summary", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;

    const now = new Date();

    const [totalPremium, activePremium, allPurchases] = await Promise.all([
      prisma.user.count({ where: { isPremium: true } }),
      prisma.user.count({ where: { isPremium: true, premiumUntil: { gt: now } } }),
      prisma.purchase.findMany({ select: { type: true, amount: true, quantity: true } }),
    ]);

    const expiredPremium = totalPremium - activePremium;
    const totalRevenue = allPurchases.reduce((sum, p) => sum + p.amount * p.quantity, 0);
    const purchasesByType: Record<string, { count: number; revenue: number }> = {};
    for (const p of allPurchases) {
      if (!purchasesByType[p.type]) purchasesByType[p.type] = { count: 0, revenue: 0 };
      purchasesByType[p.type].count += p.quantity;
      purchasesByType[p.type].revenue += p.amount * p.quantity;
    }

    return reply.send({
      totalPremium,
      activePremium,
      expiredPremium,
      totalRevenue,
      totalPurchases: allPurchases.length,
      purchasesByType,
    });
  });

  fastify.get<{ Querystring: StatsQuery }>("/premium/series", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;

    const { from, to, granularity = "day" } = request.query;
    const { start, end } = getDateRange(from, to);

    const purchases = await prisma.purchase.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true, type: true, amount: true, quantity: true },
    });

    const byDate = initDateMap(start, end, granularity, () => ({ count: 0, revenue: 0, extra_plinkk: 0, extra_redirects: 0 }));
    for (const p of purchases) {
      const key = formatDate(new Date(p.createdAt), granularity);
      const bucket = byDate.get(key);
      if (bucket) {
        bucket.count += 1;
        bucket.revenue += p.amount * p.quantity;
        if (p.type === "extra_plinkk") bucket.extra_plinkk += p.quantity;
        if (p.type === "extra_redirects") bucket.extra_redirects += p.quantity;
      }
    }

    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, ...v }));

    return reply.send({ from: formatDate(start, "day"), to: formatDate(end, "day"), series });
  });

  // ─── Comptes & Connexions OAuth ───────────────────────────────────────────

  fastify.get("/connections/summary", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;

    const [connections, withPassword, withoutPassword, totalUsers, with2FA, without2FA] = await Promise.all([
      prisma.connection.groupBy({
        by: ["provider"],
        _count: { provider: true },
      }),
      prisma.user.count({ where: { hasPassword: true } }),
      prisma.user.count({ where: { hasPassword: false } }),
      prisma.user.count(),
      prisma.user.count({ where: { twoFactorEnabled: true } }),
      prisma.user.count({ where: { twoFactorEnabled: false } }),
    ]);

    const identityConnections = await prisma.connection.groupBy({
      by: ["provider"],
      where: { isIdentity: true },
      _count: { provider: true },
    });

    const byProvider: Record<string, { total: number; identity: number }> = {};
    for (const c of connections) {
      byProvider[c.provider] = { total: c._count.provider, identity: 0 };
    }
    for (const c of identityConnections) {
      if (byProvider[c.provider]) byProvider[c.provider].identity = c._count.provider;
      else byProvider[c.provider] = { total: c._count.provider, identity: c._count.provider };
    }

    return reply.send({
      byProvider,
      withPassword,
      withoutPassword,
      totalUsers,
      with2FA,
      without2FA,
    });
  });

  // ─── Aggregated Endpoints for Dashboard ──────────────────────────────────

  fastify.get<{ Querystring: StatsQuery }>("/signups", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;
    const { from, to, granularity = "day" } = request.query;
    const { start, end } = getDateRange(from, to);

    const [totalCount, visibleCount, staffCount, seriesData] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isPublic: true } }),
      prisma.user.count({
        where: {
          role: {
            OR: [
              { isStaff: true },
              { name: { in: ["ADMIN", "DEVELOPER", "MODERATOR"] } }
            ]
          }
        }
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { role: true }
      })
    ]);

    const visible = visibleCount;
    const staff = staffCount;

    const byDate = initDateMap(start, end, granularity, () => ({ count: 0, pub: 0, priv: 0, user: 0, staff: 0, cumul: 0 }));
    let runningTotal = await prisma.user.count({ where: { createdAt: { lt: start } } });

    for (const u of seriesData) {
      const key = formatDate(new Date(u.createdAt), granularity);
      const b = byDate.get(key);
      if (b) {
        b.count++;
        if (u.isPublic) b.pub++; else b.priv++;
        if (verifyRoleIsStaff(u.role)) b.staff++; else b.user++;
      }
    }

    const series = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, b]) => {
      runningTotal += b.count;
      return { date, ...b, cumul: runningTotal };
    });

    return reply.send({
      stats: {
        total: totalCount,
        visible,
        invisible: totalCount - visible,
        staff
      },
      series
    });
  });

  fastify.get<{ Querystring: StatsQuery }>("/logins", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;
    const { from, to, granularity = "day" } = request.query;
    const { start, end } = getDateRange(from, to);

    const rows = await prisma.user.findMany({
      where: { lastLogin: { gte: start, lte: end } },
      select: { lastLogin: true },
    });

    const byDate = initDateMap(start, end, granularity, () => 0);
    for (const r of rows) {
      if (!r.lastLogin) continue;
      const key = formatDate(new Date(r.lastLogin), granularity);
      if (byDate.has(key)) byDate.set(key, (byDate.get(key) || 0) + 1);
    }

    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    const total = rows.length;
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    const average = Math.round(total / days);

    return reply.send({ total, average, series });
  });

  fastify.get<{ Querystring: StatsQuery }>("/plinkks", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;
    const { from, to, granularity = "day" } = request.query;
    const { start, end } = getDateRange(from, to);

    const [totalViewsAgg, totalPlinkks] = await Promise.all([
      prisma.plinkk.aggregate({ _sum: { views: true } }),
      prisma.plinkk.count(),
    ]);

    // Use UserViewDaily if granularity is day (optimisation)
    let dailyViews: { date: Date, count: number }[] = [];
    if (granularity === "day") {
      dailyViews = await prisma.plinkkViewDaily.findMany({
        where: { date: { gte: start, lte: end } }
      });
    } else {
      const rawStats = await prisma.pageStat.findMany({
        where: { eventType: "view", createdAt: { gte: start, lte: end } },
        select: { createdAt: true }
      });
      dailyViews = rawStats.map(r => ({ date: r.createdAt, count: 1 }));
    }

    const byDate = initDateMap(start, end, granularity, () => 0);
    for (const r of dailyViews) {
      const key = formatDate(new Date(r.date), granularity);
      if (byDate.has(key)) {
        byDate.set(key, (byDate.get(key) || 0) + (granularity === "day" ? r.count : 1));
      }
    }

    let topVal = 0;
    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => {
        if (count > topVal) topVal = count;
        return { date, count };
      });

    return reply.send({
      totalViews: totalViewsAgg._sum.views || 0,
      totalPlinkks,
      topViewInPeriod: topVal,
      series
    });
  });

  fastify.get<{ Querystring: StatsQuery }>("/redirections", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;
    const { from, to, granularity = "day" } = request.query;
    const { start, end } = getDateRange(from, to);

    const [totalClicksAgg, totalRedirects] = await Promise.all([
      prisma.redirect.aggregate({ _sum: { clicks: true } }),
      prisma.redirect.count(),
    ]);

    let dailyClicks: { date: Date, count: number }[] = [];
    if (granularity === "day") {
      dailyClicks = await prisma.redirectClickDaily.findMany({
        where: { date: { gte: start, lte: end } }
      });
    } else {
      // NOTE: Here we lack a raw events table for redirects, 
      // RedirectClickDaily is the only table available, 
      // preventing minute/second granularity for this specific stat
      dailyClicks = await prisma.redirectClickDaily.findMany({
        where: { date: { gte: start, lte: end } }
      });
      // the date in redirectClickDaily is grouped by day, so mapping to lower granularities will look like a spike at 00:00:00
    }

    const byDate = initDateMap(start, end, granularity, () => 0);
    for (const r of dailyClicks) {
      const key = formatDate(new Date(r.date), granularity);
      if (byDate.has(key)) {
        byDate.set(key, (byDate.get(key) || 0) + r.count);
      }
    }

    let topVal = 0;
    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => {
        if (count > topVal) topVal = count;
        return { date, count };
      });

    return reply.send({
      totalClicks: totalClicksAgg._sum.clicks || 0,
      totalRedirects,
      topViewInPeriod: topVal,
      series
    });
  });

  fastify.get<{ Querystring: TopPlinkksQuery }>("/redirections/top", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;

    const { page = 1, limit = 20, sort = "clicks", order = "desc", search = "" } = request.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.RedirectWhereInput = {};
    if (search) {
      where.OR = [
        { slug: { contains: search } },
        { targetUrl: { contains: search } },
        { user: { userName: { contains: search } } },
      ];
    }

    const [redirects, total] = await Promise.all([
      prisma.redirect.findMany({
        where,
        select: {
          id: true,
          slug: true,
          targetUrl: true,
          clicks: true,
          createdAt: true,
          user: { select: { userName: true, image: true } },
        },
        orderBy: { [sort]: order },
        skip,
        take,
      }),
      prisma.redirect.count({ where }),
    ]);

    return reply.send({ redirects, total });
  });

  fastify.get<{ Querystring: StatsQuery }>("/premium", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;
    const { from, to, granularity = "day" } = request.query;
    const { start, end } = getDateRange(from, to);

    const [totalHistory, activeNow, purchases] = await Promise.all([
      prisma.user.count({ where: { isPremium: true } }),
      prisma.user.count({ where: { isPremium: true, premiumUntil: { gt: new Date() } } }),
      prisma.purchase.findMany({
        where: { createdAt: { gte: start, lte: end } }
      })
    ]);

    const periodPurchases = purchases.length;
    const revenue = purchases.reduce((a, b) => a + (b.amount * b.quantity), 0);

    const byDate = initDateMap(start, end, granularity, () => 0);
    for (const p of purchases) {
      const key = formatDate(new Date(p.createdAt), granularity);
      if (byDate.has(key)) byDate.set(key, (byDate.get(key) || 0) + 1);
    }

    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return reply.send({
      totalHistory,
      activeNow,
      periodPurchases,
      estimatedTotalRevenue: revenue,
      series
    });
  });

  fastify.get<{ Querystring: StatsQuery }>("/bans", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;
    const { from, to, granularity = "day" } = request.query;
    const { start, end } = getDateRange(from, to);

    const [created, revoked] = await Promise.all([
      prisma.bannedEmail.findMany({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.bannedEmail.findMany({ where: { revoquedAt: { not: null, gte: start, lte: end } } })
    ]);

    const byDate = initDateMap(start, end, granularity, () => ({ bans: 0, revokes: 0 }));
    for (const b of created) {
      const key = formatDate(new Date(b.createdAt), granularity);
      const bucket = byDate.get(key);
      if (bucket) bucket.bans++;
    }
    for (const b of revoked) {
      const key = formatDate(new Date(b.revoquedAt as Date), granularity);
      const bucket = byDate.get(key);
      if (bucket) bucket.revokes++;
    }

    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, ...v }));

    const totalActions = created.length + revoked.length;
    const revokeRate = totalActions > 0 ? Math.round((revoked.length / totalActions) * 100) : 0;

    return reply.send({ totalActions, revokeRate, series });
  });

  fastify.get("/accounts", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;

    const [connections, withPassword, totalUsers] = await Promise.all([
      prisma.connection.groupBy({ by: ["provider"], _count: { provider: true } }),
      prisma.user.count({ where: { hasPassword: true } }),
      prisma.user.count()
    ]);

    const totalConnections = connections.reduce((a, b) => a + b._count.provider, 0);
    const oauthOnly = totalUsers - withPassword;

    return reply.send({
      summary: {
        totalUsers,
        withPassword,
        oauthOnly,
        totalConnections
      },
      providers: connections.map(c => ({ provider: c.provider, count: c._count.provider }))
    });
  });
  // ─── Tunnel d'acquisition ──────────────────────────────────────────────────

  fastify.get("/funnel", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;

    const [
      totalUsers,
      usersWithPlinkk,
      totalPlinkks,
      totalViewsAgg,
      totalClicksAgg,
      premiumUsers,
      totalPurchases,
      allPurchases,
      usersWithLinks,
      churned,
      // FunnelEvent counts
      landingVisits,
      signups,
      premiumViews,
      configViews,
      funnelPurchases,
      funnelCancels,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plinkks: { some: {} } } }),
      prisma.plinkk.count(),
      prisma.plinkk.aggregate({ _sum: { views: true } }),
      prisma.pageStat.count({ where: { eventType: "click" } }),
      prisma.user.count({ where: { isPremium: true } }),
      prisma.purchase.count(),
      prisma.purchase.findMany({ select: { amount: true, quantity: true } }),
      prisma.user.count({ where: { links: { some: {} } } }),
      prisma.user.count({ where: { isPremium: false, purchases: { some: {} } } }),
      // FunnelEvent tracking data
      prisma.funnelEvent.count({ where: { event: "landing_visit" } }),
      prisma.funnelEvent.count({ where: { event: "signup" } }),
      prisma.funnelEvent.count({ where: { event: "premium_view" } }),
      prisma.funnelEvent.count({ where: { event: "config_view" } }),
      prisma.funnelEvent.count({ where: { event: "purchase" } }),
      prisma.funnelEvent.count({ where: { event: "cancel" } }),
    ]);

    const totalViews = totalViewsAgg._sum.views || 0;
    const totalRevenue = allPurchases.reduce((sum, p) => sum + p.amount * p.quantity, 0);

    return reply.send({
      plinkk: {
        totalUsers,
        usersWithPlinkk,
        totalPlinkks,
        usersWithLinks,
        totalViews,
        totalClicks: totalClicksAgg,
      },
      purchase: {
        totalUsers,
        premiumUsers,
        totalPurchases,
        totalRevenue,
        churned,
        activePremium: premiumUsers,
        retention: premiumUsers > 0 && (premiumUsers + churned) > 0
          ? Math.round((premiumUsers / (premiumUsers + churned)) * 100)
          : 100,
      },
      funnel: {
        landingVisits,
        signups,
        premiumViews,
        configViews,
        purchases: funnelPurchases,
        cancels: funnelCancels,
      },
    });
  });
}
