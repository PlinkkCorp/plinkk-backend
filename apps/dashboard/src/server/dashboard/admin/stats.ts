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

function formatDate(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
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

function initDateMap<T>(start: Date, end: Date, defaultValue: () => T): Map<string, T> {
  const map = new Map<string, T>();
  for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + 86400000)) {
    map.set(formatDate(t), defaultValue());
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

    const { from, to, role = "all", visibility = "all" } = request.query;
    const { start, end } = getDateRange(from, to);

    const where: Prisma.UserWhereInput = { createdAt: { gte: start, lte: end } };
    if (role && role !== "all") where.role = { name: role };
    if (visibility && visibility !== "all") where.isPublic = visibility === "public";

    const users = await prisma.user.findMany({ where, select: { createdAt: true } });

    const byDate = initDateMap(start, end, () => 0);
    for (const u of users) {
      const key = formatDate(new Date(u.createdAt));
      if (byDate.has(key)) byDate.set(key, (byDate.get(key) || 0) + 1);
    }

    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return reply.send({ from: formatDate(start), to: formatDate(end), series });
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

    const { from, to } = request.query;
    const { start, end } = getDateRange(from, to);

    const rows = await prisma.user.findMany({
      where: { lastLogin: { gte: start, lte: end } },
      select: { lastLogin: true },
    });

    const byDate = initDateMap(start, end, () => 0);
    for (const r of rows) {
      const key = formatDate(new Date(r.lastLogin));
      if (byDate.has(key)) byDate.set(key, (byDate.get(key) || 0) + 1);
    }

    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return reply.send({ from: formatDate(start), to: formatDate(end), series });
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

    const { from, to } = request.query;
    const { start, end } = getDateRange(from, to);

    const [bansCreated, bansRevoked, bansAll] = await Promise.all([
      prisma.bannedEmail.findMany({ where: { createdAt: { gte: start, lte: end } }, select: { createdAt: true } }),
      prisma.bannedEmail.findMany({ where: { revoquedAt: { not: null, gte: start, lte: end } }, select: { revoquedAt: true } }),
      prisma.bannedEmail.findMany(),
    ]);

    const byDate = initDateMap(start, end, () => ({ created: 0, revoked: 0 }));

    for (const b of bansCreated) {
      const key = formatDate(new Date(b.createdAt));
      const v = byDate.get(key);
      if (v) v.created += 1;
    }

    for (const b of bansRevoked) {
      const key = formatDate(new Date(b.revoquedAt as Date));
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
      from: formatDate(start),
      to: formatDate(end),
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

    const { from, to } = request.query;
    const { start, end } = getDateRange(from, to);

    const rows = await prisma.user.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true, isPublic: true },
    });

    const byDate = initDateMap(start, end, () => ({ public: 0, private: 0 }));

    for (const r of rows) {
      const key = formatDate(new Date(r.createdAt));
      const bucket = byDate.get(key);
      if (bucket) {
        if (r.isPublic) bucket.public += 1;
        else bucket.private += 1;
      }
    }

    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, public: v.public, private: v.private }));

    return reply.send({ from: formatDate(start), to: formatDate(end), series });
  });

  fastify.get<{ Querystring: StatsQuery }>("/users/series/by-role", { preHandler: [requireAuth] }, async function (request, reply) {
    const me = await prisma.user.findFirst({ where: { id: request.userId }, select: { role: true } });
    if (!(me && verifyRoleIsStaff(me.role))) return reply.code(403).send({ error: "forbidden" });

    const { from, to } = request.query;
    const { start, end } = getDateRange(from, to);

    const rows = await prisma.user.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true, role: { select: { name: true } } },
    });

    const roleSet = new Set<string>();
    for (const r of rows) if (r.role?.name) roleSet.add(r.role.name);
    const roles = Array.from(roleSet.values()).sort();

    const makeZero = () => Object.fromEntries(roles.map((r) => [r, 0])) as Record<string, number>;
    const byDate = initDateMap(start, end, makeZero);

    for (const r of rows) {
      const key = formatDate(new Date(r.createdAt));
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

    return reply.send({ from: formatDate(start), to: formatDate(end), roles, series });
  });

  fastify.get<{ Querystring: StatsQuery }>("/plinkks/series", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_STATS");
    if (!ok) return;

    const { from, to } = request.query;
    const { start, end } = getDateRange(from, to);

    const rows = await prisma.plinkk.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    });

    const byDate = initDateMap(start, end, () => 0);
    for (const r of rows) {
      const key = formatDate(new Date(r.createdAt));
      if (byDate.has(key)) byDate.set(key, (byDate.get(key) || 0) + 1);
    }

    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return reply.send({ from: formatDate(start), to: formatDate(end), series });
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
}
