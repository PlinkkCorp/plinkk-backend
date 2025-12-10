import { prisma, Prisma } from "@plinkk/prisma";
import { formatDateYMD, getDateRange, generateDateSeries } from "../utils/dateUtils";

export async function getUserRegistrationSeries(from?: string, to?: string) {
  const { start, end } = getDateRange(from, to);
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { createdAt: true },
  });

  const byDate = generateDateSeries(start, end, () => 0);
  for (const u of users) {
    const key = formatDateYMD(new Date(u.createdAt));
    if (byDate.has(key)) byDate.set(key, (byDate.get(key) || 0) + 1);
  }

  return {
    from: formatDateYMD(start),
    to: formatDateYMD(end),
    series: Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count })),
  };
}

export async function getUserSummary(
  from?: string,
  to?: string,
  role?: string,
  visibility?: string
) {
  const { start, end } = getDateRange(from, to);
  const where: Prisma.UserWhereInput = {
    createdAt: { gte: start, lte: end },
  };

  if (role && role !== "all") {
    where.role = { name: role };
  }
  if (visibility && visibility !== "all") {
    where.isPublic = visibility === "public";
  }

  const rows = await prisma.user.findMany({
    where,
    include: { role: true },
  });

  const total = rows.length;
  const publics = rows.filter((r) => r.isPublic).length;
  const privates = total - publics;
  const byRole: Record<string, number> = {};
  rows.forEach((r) => {
    const name = r.role?.name || "UNKNOWN";
    byRole[name] = (byRole[name] || 0) + 1;
  });

  return { total, publics, privates, byRole };
}

export async function getLoginSeries(from?: string, to?: string) {
  const { start, end } = getDateRange(from, to);
  const rows = await prisma.user.findMany({
    where: { lastLogin: { gte: start, lte: end } },
    select: { lastLogin: true },
  });

  const byDate = generateDateSeries(start, end, () => 0);
  for (const r of rows) {
    const key = formatDateYMD(new Date(r.lastLogin));
    if (byDate.has(key)) byDate.set(key, (byDate.get(key) || 0) + 1);
  }

  return {
    from: formatDateYMD(start),
    to: formatDateYMD(end),
    series: Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count })),
  };
}

export async function getRecentLogins(limit: number = 20) {
  const take = Math.min(50, Math.max(1, limit));
  return prisma.user.findMany({
    select: {
      id: true,
      userName: true,
      email: true,
      lastLogin: true,
      role: true,
    },
    orderBy: { lastLogin: "desc" },
    take,
  });
}

export async function getBanSeries(from?: string, to?: string) {
  const { start, end } = getDateRange(from, to);

  const [bansCreated, bansRevoked] = await Promise.all([
    prisma.bannedEmail.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    }),
    prisma.bannedEmail.findMany({
      where: { revoquedAt: { not: null, gte: start, lte: end } },
      select: { revoquedAt: true },
    }),
  ]);

  const byDate = generateDateSeries(start, end, () => ({ created: 0, revoked: 0 }));

  for (const b of bansCreated) {
    const key = formatDateYMD(new Date(b.createdAt));
    const v = byDate.get(key);
    if (v) v.created += 1;
  }

  for (const b of bansRevoked) {
    const dt = b.revoquedAt as Date;
    const key = formatDateYMD(new Date(dt));
    const v = byDate.get(key);
    if (v) v.revoked += 1;
  }

  return {
    from: formatDateYMD(start),
    to: formatDateYMD(end),
    series: Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, created: v.created, revoked: v.revoked })),
  };
}

export async function getActiveBansCount() {
  const bansAll = await prisma.bannedEmail.findMany();
  const now = new Date();
  return bansAll.filter((b) => {
    if (b.revoquedAt && b.revoquedAt <= now) return false;
    if (b.time != null && b.time > 0) {
      const expiresAt = new Date(b.createdAt.getTime() + b.time * 60000);
      if (expiresAt <= now) return false;
    }
    return true;
  }).length;
}

export async function getViewsSeries(userId: string, plinkkId: string, from?: string, to?: string) {
  const { start, end } = getDateRange(from, to);

  const rows = await prisma.plinkkViewDaily.findMany({
    where: {
      plinkkId,
      date: { gte: start, lte: end },
    },
    select: { date: true, count: true },
    orderBy: { date: "asc" },
  });

  const byDate = new Map(rows.map((r) => [r.date, Number(r.count)]));
  const series: { date: Date; count: number }[] = [];

  for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + 86400000)) {
    series.push({ date: new Date(t), count: byDate.get(t) || 0 });
  }

  return series;
}

export async function getClicksSeries(userId: string, from?: string, to?: string) {
  const { start, end } = getDateRange(from, to);

  const linkIds = (
    await prisma.link.findMany({
      where: { userId },
      select: { id: true },
    })
  ).map((x) => x.id);

  if (linkIds.length === 0) {
    return { from: formatDateYMD(start), to: formatDateYMD(end), series: [] };
  }

  const rows = (
    await prisma.linkClickDaily.groupBy({
      by: ["date"],
      where: {
        linkId: { in: linkIds },
        date: { gte: start, lte: end },
      },
      _sum: { count: true },
      orderBy: { date: "asc" },
    })
  ).map((r) => ({
    date: r.date,
    count: r._sum.count ?? 0,
  }));

  const byDate = new Map(rows.map((r) => [r.date, Number(r.count)]));
  const series: { date: Date; count: number }[] = [];

  for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + 86400000)) {
    series.push({ date: t, count: byDate.get(t) || 0 });
  }

  return { from: formatDateYMD(start), to: formatDateYMD(end), series };
}

export async function getTotalViewsAndClicks(plinkkId: string) {
  const [totalViews, totalClicks] = await Promise.all([
    prisma.pageStat.count({ where: { plinkkId, eventType: "view" } }),
    prisma.pageStat.count({ where: { plinkkId, eventType: "click" } }),
  ]);
  return { totalViews, totalClicks };
}

export async function getTopPlinkks(
  page: number = 1,
  limit: number = 20,
  sort: string = "views",
  order: "asc" | "desc" = "desc",
  search?: string
) {
  const skip = (page - 1) * limit;
  const where: Prisma.PlinkkWhereInput = search
    ? {
        OR: [
          { name: { contains: search } },
          { slug: { contains: search } },
          { user: { userName: { contains: search } } },
        ],
      }
    : {};

  const orderBy: Prisma.PlinkkOrderByWithRelationInput =
    sort === "createdAt" ? { createdAt: order } : { views: order };

  const [plinkks, total] = await Promise.all([
    prisma.plinkk.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        views: true,
        createdAt: true,
        user: { select: { id: true, userName: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.plinkk.count({ where }),
  ]);

  return { plinkks, total, page, limit, totalPages: Math.ceil(total / limit) };
}
