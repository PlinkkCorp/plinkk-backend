import { FastifyInstance } from "fastify";
import {
  Announcement,
  Prisma,
  Role,
  prisma,
} from "@plinkk/prisma";
import { replyView, getActiveAnnouncementsForUser } from "../../lib/replyView";
import { verifyRoleIsStaff } from "../../lib/verifyRole";
import { ensurePermission } from "../../lib/permissions";
import { logAdminAction } from "../../lib/adminLogger";
import { exec } from "child_process";
import * as os from "os";
import { dashboardAdminReportsRoutes } from "./admin/reports";
import { dashboardAdminSessionsRoutes } from "./admin/sessions";

// const prisma = new PrismaClient();

interface UserSearchQuery {
  q?: string;
  limit?: number;
}

interface LimitQuery {
  limit?: number;
}

interface TopPlinkksQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

interface LogsQuery {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: string;
  from?: string;
  to?: string;
  sort?: 'asc' | 'desc';
}

export function dashboardAdminRoutes(fastify: FastifyInstance) {
  fastify.register(dashboardAdminReportsRoutes, { prefix: "/reports" });
  fastify.register(dashboardAdminSessionsRoutes, { prefix: "/sessions" });

  fastify.get("/themes", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/admin/themes")}`
      );
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true },
    });
    if (!userInfo) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/admin/themes")}`
      );
    }
    {
      const ok = await ensurePermission(request, reply, 'VIEW_ADMIN', { mode: 'redirect' });
      if (!ok) return;
    }
    
    const [submitted, approved, archived] = await Promise.all([
      prisma.theme.findMany({
        where: { status: "SUBMITTED", isPrivate: false },
        select: {
          id: true,
          name: true,
          description: true,
          author: { select: { id: true, userName: true } },
          updatedAt: true,
          data: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.theme.findMany({
        where: { status: "APPROVED", isPrivate: false },
        select: {
          id: true,
          name: true,
          description: true,
          author: { select: { id: true, userName: true } },
          updatedAt: true,
          data: true,
          pendingUpdate: true,
          pendingUpdateAt: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.theme.findMany({
        where: { status: "ARCHIVED", isPrivate: false },
        select: {
          id: true,
          name: true,
          description: true,
          author: { select: { id: true, userName: true } },
          updatedAt: true,
          data: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);
    const approvedWithPending = approved.filter((t) => t.pendingUpdate);
    const approvedFiltered = approved.filter((t) => !t.pendingUpdate);
    const submittedNormalized = submitted.map((s) => ({
      ...s,
      pendingUpdate: false,
    }));
    const mergedSubmitted = [...submittedNormalized, ...approvedWithPending];
    let publicPath;
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return replyView(reply, "dashboard/admin/themes.ejs", userInfo, {
      submitted: mergedSubmitted,
      approved: approvedFiltered,
      archived,
      publicPath,
    });
  });

  fastify.get("/themes/:id", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/admin/themes")}`
      );
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true },
    });
    if (!userInfo) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/admin/themes")}`
      );
    }
    {
      const ok = await ensurePermission(request, reply, 'VIEW_ADMIN', { mode: 'redirect' });
      if (!ok) return;
    }
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        data: true,
        author: { select: { id: true, userName: true } },
        status: true,
        pendingUpdate: true,
        isPrivate: true,
      },
    });
    if (!t)
      return reply.code(404).view("erreurs/404.ejs", { currentUser: userInfo });
    const themeForView = {
      ...t,
      archived: t.status === "ARCHIVED",
      approved: t.status === "APPROVED",
      isApproved: t.status === "APPROVED",
    };
    let publicPath;
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return await replyView(reply, "dashboard/admin/preview.ejs", userInfo, {
      theme: themeForView,
      publicPath,
    });
  });

  fastify.get("/message", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/admin/message")}`
      );
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true },
    });
    if (!userInfo)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/admin/message")}`
      );
    {
      const ok = await ensurePermission(request, reply, 'MANAGE_ANNOUNCEMENTS', { mode: 'redirect' });
      if (!ok) return;
    }
    let publicPath;
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}

    const roles = await prisma.role.findMany({
      orderBy: { priority: 'desc' }
    });

    return replyView(reply, "dashboard/admin/message.ejs", userInfo, {
      publicPath,
      roles
    });
  });

  fastify.get("/message/api", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_ANNOUNCEMENTS');
    if (!ok) return;
    const list = await getActiveAnnouncementsForUser(userId as string);
    return reply.send({ messages: list });
  });

  fastify.get<{ Querystring: UserSearchQuery }>("/users/search", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_USERS');
    if (!ok) return;
    const q = String(request.query.q || "").trim();
    if (!q) return reply.send({ users: [] });
    const take = Math.min(
      10,
      Math.max(1, Number(request.query.limit || 8))
    );
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { id: { contains: q } },
          { userName: { contains: q } },
          { email: { contains: q } },
        ],
      },
      select: {
        id: true,
        userName: true,
        email: true,
        role: true,
        image: true,
      },
      take,
      orderBy: { createdAt: "asc" },
    });
    return reply.send({ users });
  });

  fastify.post("/message/api", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_ANNOUNCEMENTS');
    if (!ok) return;
    const body = request.body as {
      id: string;
      targetUserIds: string[];
      targetRoles: string[]; // Changed from Role[] to string[] (IDs)
      level: string;
      text: string;
      dismissible: string;
      startAt: string;
      endAt: string;
      global: string;
    };
    const id = body.id as string | undefined;
    const targetUserIds: string[] = Array.isArray(body.targetUserIds)
      ? body.targetUserIds
      : [];
    const targetRoleIds: string[] = Array.isArray(body.targetRoles)
      ? body.targetRoles
      : [];
    const payload = {
      level: String(body.level || "info"),
      text: String(body.text || ""),
      dismissible: !!body.dismissible,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
      global: !!body.global,
    };
    let ann: Announcement;
    if (!id) {
      ann = await prisma.announcement.create({ data: { ...payload } });
    } else {
      ann = await prisma.announcement.update({
        where: { id },
        data: { ...payload },
      });
      // clear previous targets
      await prisma.announcementTarget.deleteMany({
        where: { announcementId: ann.id },
      });
      await prisma.announcementRoleTarget.deleteMany({
        where: { announcementId: ann.id },
      });
    }
    if (!payload.global) {
      if (targetUserIds.length) {
        await prisma.announcementTarget.createMany({
          data: targetUserIds.map((uid) => ({
            announcementId: ann.id,
            userId: uid,
          })),
        });
      }
      if (targetRoleIds.length) {
        await prisma.announcementRoleTarget.createMany({
          data: targetRoleIds.map((rid) => ({
            announcementId: ann.id,
            roleId: rid,
          })),
        });
      }
    }
    return reply.send({ ok: true, message: { id: ann.id, ...payload } });
  });

  fastify.delete("/message/api", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_ANNOUNCEMENTS');
    if (!ok) return;
    const { id } = request.query as { id: string };
    if (!id) return reply.code(400).send({ error: "missing_id" });
    try {
      await prisma.announcement.delete({ where: { id } });
      await logAdminAction(userId, 'DELETE_ANNOUNCEMENT', id, {}, request.ip);
      return reply.send({ ok: true });
    } catch (e) {
      return reply.code(404).send({ error: "not_found" });
    }
  });

  fastify.get("/bans", async function (request, reply) {
    const userId = request.session.get("data");

    if (!userId)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/admin/bans")}`
      );

    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true },
    });

    if (!userInfo)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/admin/bans")}`
      );

    {
      const ok = await ensurePermission(request, reply, 'MANAGE_BANNED_EMAILS', { mode: 'redirect' });
      if (!ok) return;
    }

    let publicPath;
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });

      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}

    return replyView(reply, "dashboard/admin/bans.ejs", userInfo, {
      publicPath,
    });
  });

  fastify.get("/", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(`/login?returnTo=${encodeURIComponent("/admin")}`);
    }

    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true },
    });
    if (!userInfo) {
      return reply.redirect(`/login?returnTo=${encodeURIComponent("/admin")}`);
    }
    {
      const ok = await ensurePermission(request, reply, 'VIEW_ADMIN', { mode: 'redirect' });
      if (!ok) return;
    }
    const [usersRaw, totals] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          userName: true,
          email: true,
          publicEmail: true,
          role: true,
          isPublic: true,
          isVerified: true,
          isPartner: true,
          cosmetics: true,
          createdAt: true,
          twoFactorEnabled: true,
          twoFactorSecret: true,
          plinkks: {
            select: {
              id: true,
              name: true,
              slug: true,
              isDefault: true,
              isActive: true,
              views: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      (async () => {
        const totalUsers = await prisma.user.count();
        const totalPublic = await prisma.user.count({
          where: { isPublic: true },
        });
        const totalPrivate = totalUsers - totalPublic;
        const allRoles = await prisma.role.findMany({
          where: {
            name: { in: ["ADMIN", "DEVELOPER", "MODERATOR"] },
          },
          include: {
            users: true,
          },
        });
        const moderatorsRole = allRoles.find((r) => r.name === "MODERATOR");
        const moderators = moderatorsRole
          ? moderatorsRole.users?.length || 0
          : 0;
        return { totalUsers, totalPublic, totalPrivate, moderators };
      })(),
    ]);

    let users = usersRaw;
    try {
      const bans = await prisma.bannedEmail.findMany({
        where: { revoquedAt: null },
      });
      const now = Date.now();
      const activeEmails = new Set(
        bans
          .filter((b) => {
            if (b.revoquedAt) return false;
            if (b.time == null || b.time < 0) return true;
            const until = new Date(b.createdAt).getTime() + b.time * 60000;
            return until > now;
          })
          .map((b) => String(b.email).toLowerCase())
      );
      users = users.filter(
        (u) => !activeEmails.has(String(u.email).toLowerCase())
      );
    } catch (e) {
      request.log?.warn({ e }, "Failed to filter banned users");
    }

    const pendingThemes = await prisma.theme.findMany({
      where: { status: "SUBMITTED", isPrivate: false },
      select: {
        id: true,
        name: true,
        description: true,
        authorId: true,
        data: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    let publicPath;
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return replyView(reply, "dashboard/admin/dash.ejs", userInfo, {
      users,
      totals,
      pendingThemes,
      publicPath,
    });
  });

  fastify.get("/stats", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/admin/stats")}`
      );
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true },
    });
    if (!userInfo) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/admin/stats")}`
      );
    }
    {
      const ok = await ensurePermission(request, reply, 'VIEW_STATS', { mode: 'redirect' });
      if (!ok) return;
    }
    let publicPath;
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return replyView(reply, "dashboard/admin/stats.ejs", userInfo, {
      publicPath,
    });
  });

  fastify.get("/stats/users/series", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'VIEW_STATS');
    if (!ok) return;
    const {
      from,
      to,
      role = "all",
      visibility = "all",
    } = request.query as {
      from: string;
      to: string;
      role: string;
      visibility: string;
    };
    const now = new Date();
    const end = to
      ? new Date(to + "T23:59:59.999Z")
      : new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );
    const start = from
      ? new Date(from + "T00:00:00.000Z")
      : new Date(end.getTime() - 29 * 86400000);
    const fmt = (dt: Date) => {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dt.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };
    const where: Prisma.UserWhereInput = {
      createdAt: { gte: start, lte: end },
    };
    if (role && role !== "all") {
      where.role = { name: role };
    }
    if (visibility && visibility !== "all")
      where.isPublic = visibility === "public";
    const users = await prisma.user.findMany({
      where,
      select: { createdAt: true },
    });
    const byDate = new Map<string, number>();
    for (
      let t = new Date(start.getTime());
      t <= end;
      t = new Date(t.getTime() + 86400000)
    ) {
      byDate.set(fmt(t), 0);
    }
    for (const u of users) {
      const key = fmt(new Date(u.createdAt));
      if (byDate.has(key)) byDate.set(key, (byDate.get(key) || 0) + 1);
    }
    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
    return reply.send({ from: fmt(start), to: fmt(end), series });
  });

  fastify.get("/stats/users/summary", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'VIEW_STATS');
    if (!ok) return;
    const {
      from,
      to,
      role = "all",
      visibility = "all",
    } = request.query as {
      from: string;
      to: string;
      role: string;
      visibility: string;
    };
    const now = new Date();
    const end = to
      ? new Date(to + "T23:59:59.999Z")
      : new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );
    const start = from
      ? new Date(from + "T00:00:00.000Z")
      : new Date(end.getTime() - 29 * 86400000);
    const where: Prisma.UserWhereInput = {
      createdAt: { gte: start, lte: end },
    };
    if (role && role !== "all") {
      // Filtre correct de la relation rôle en Prisma
      where.role = { name: role };
    }
    if (visibility && visibility !== "all")
      where.isPublic = visibility === "public";
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
    return reply.send({ total, publics, privates, byRole });
  });

  fastify.get("/stats/logins/series", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'VIEW_STATS');
    if (!ok) return;
    const { from, to } = request.query as { from?: string; to?: string };
    const now = new Date();
    const end = to
      ? new Date(to + "T23:59:59.999Z")
      : new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );
    const start = from
      ? new Date(from + "T00:00:00.000Z")
      : new Date(end.getTime() - 29 * 86400000);
    const fmt = (dt: Date) => {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dt.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };
    const rows = await prisma.user.findMany({
      where: { lastLogin: { gte: start, lte: end } },
      select: { lastLogin: true },
    });
    const byDate = new Map<string, number>();
    for (
      let t = new Date(start.getTime());
      t <= end;
      t = new Date(t.getTime() + 86400000)
    )
      byDate.set(fmt(t), 0);
    for (const r of rows) {
      const key = fmt(new Date(r.lastLogin));
      if (byDate.has(key)) byDate.set(key, (byDate.get(key) || 0) + 1);
    }
    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
    return reply.send({ from: fmt(start), to: fmt(end), series });
  });

  fastify.get<{ Querystring: LimitQuery }>("/stats/logins/recent", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'VIEW_STATS');
    if (!ok) return;
    const limit = Math.min(
      50,
      Math.max(1, Number(request.query.limit || 20))
    );
    const rows = await prisma.user.findMany({
      select: {
        id: true,
        userName: true,
        email: true,
        lastLogin: true,
        role: true,
      },
      orderBy: { lastLogin: "desc" },
      take: limit,
    });
    return reply.send({ users: rows });
  });

  fastify.get("/stats/bans/series", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'VIEW_STATS');
    if (!ok) return;
    const { from, to } = request.query as { from?: string; to?: string };
    const now = new Date();
    const end = to
      ? new Date(to + "T23:59:59.999Z")
      : new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );
    const start = from
      ? new Date(from + "T00:00:00.000Z")
      : new Date(end.getTime() - 29 * 86400000);
    const fmt = (dt: Date) => {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dt.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };
    const bansCreated = await prisma.bannedEmail.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    });
    const bansRevoked = await prisma.bannedEmail.findMany({
      where: { revoquedAt: { not: null, gte: start, lte: end } },
      select: { revoquedAt: true },
    });
    const byDate = new Map<string, { created: number; revoked: number }>();
    for (
      let t = new Date(start.getTime());
      t <= end;
      t = new Date(t.getTime() + 86400000)
    )
      byDate.set(fmt(t), { created: 0, revoked: 0 });
    for (const b of bansCreated) {
      const key = fmt(new Date(b.createdAt));
      const v = byDate.get(key);
      if (v) v.created += 1;
    }
    for (const b of bansRevoked) {
      const dt = b.revoquedAt as Date;
      const key = fmt(new Date(dt));
      const v = byDate.get(key);
      if (v) v.revoked += 1;
    }
    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, created: v.created, revoked: v.revoked }));
    const bansAll = await prisma.bannedEmail.findMany();
    const activeNow = (() => {
      const nowTs = Date.now();
      let c = 0;
      for (const b of bansAll) {
        if (b.revoquedAt) continue;
        if (b.time == null || b.time < 0) {
          c++;
          continue;
        }
        const until = new Date(b.createdAt).getTime() + b.time * 60000;
        if (until > nowTs) c++;
      }
      return c;
    })();
    const totalBanned = bansAll.length;
    const totalRevoked = bansAll.filter((b) => !!b.revoquedAt).length;
    return reply.send({
      from: fmt(start),
      to: fmt(end),
      series,
      summary: { activeNow, totalBanned, totalRevoked },
    });
  });

  fastify.get("/stats/users/series/by-visibility",async function (request, reply) {
      const userId = request.session.get("data");
      if (!userId) return reply.code(401).send({ error: "unauthorized" });
      const me = await prisma.user.findFirst({
        where: { id: userId },
        select: { role: true },
      });
      if (!(me && verifyRoleIsStaff(me.role)))
        return reply.code(403).send({ error: "forbidden" });
      const { from, to } = request.query as { from?: string; to?: string };
      const now = new Date();
      const end = to
        ? new Date(to + "T23:59:59.999Z")
        : new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate(),
              23,
              59,
              59,
              999
            )
          );
      const start = from
        ? new Date(from + "T00:00:00.000Z")
        : new Date(end.getTime() - 29 * 86400000);
      const fmt = (dt: Date) => {
        const y = dt.getUTCFullYear();
        const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
        const d = String(dt.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      };
      const rows = await prisma.user.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true, isPublic: true },
      });
      const byDate = new Map<string, { public: number; private: number }>();
      for (
        let t = new Date(start.getTime());
        t <= end;
        t = new Date(t.getTime() + 86400000)
      ) {
        byDate.set(fmt(t), { public: 0, private: 0 });
      }
      for (const r of rows) {
        const key = fmt(new Date(r.createdAt));
        const bucket = byDate.get(key);
        if (bucket) {
          if (r.isPublic) bucket.public += 1;
          else bucket.private += 1;
        }
      }
      const series = Array.from(byDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, v]) => ({ date, public: v.public, private: v.private }));
      return reply.send({ from: fmt(start), to: fmt(end), series });
    }
  );

  fastify.get("/stats/users/series/by-role", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role)))
      return reply.code(403).send({ error: "forbidden" });
    const { from, to } = request.query as { from?: string; to?: string };
    const now = new Date();
    const end = to
      ? new Date(to + "T23:59:59.999Z")
      : new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );
    const start = from
      ? new Date(from + "T00:00:00.000Z")
      : new Date(end.getTime() - 29 * 86400000);
    const fmt = (dt: Date) => {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dt.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };
    const rows = await prisma.user.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true, role: { select: { name: true } } },
    });
    const roleSet = new Set<string>();
    for (const r of rows) {
      if (r.role?.name) roleSet.add(r.role.name);
    }
    const roles = Array.from(roleSet.values()).sort();
    const makeZero = () =>
      Object.fromEntries(roles.map((r) => [r, 0])) as Record<string, number>;
    const byDate = new Map<string, Record<string, number>>();
    for (
      let t = new Date(start.getTime());
      t <= end;
      t = new Date(t.getTime() + 86400000)
    ) {
      byDate.set(fmt(t), makeZero());
    }
    for (const r of rows) {
      const key = fmt(new Date(r.createdAt));
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
    return reply.send({ from: fmt(start), to: fmt(end), roles, series });
  });

  fastify.get("/stats/plinkks/series", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'VIEW_STATS');
    if (!ok) return;
    const { from, to } = request.query as { from?: string; to?: string };
    const now = new Date();
    const end = to
      ? new Date(to + "T23:59:59.999Z")
      : new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );
    const start = from
      ? new Date(from + "T00:00:00.000Z")
      : new Date(end.getTime() - 29 * 86400000);
    const fmt = (dt: Date) => {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dt.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };
    const rows = await prisma.plinkk.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    });
    const byDate = new Map<string, number>();
    for (
      let t = new Date(start.getTime());
      t <= end;
      t = new Date(t.getTime() + 86400000)
    ) {
      byDate.set(fmt(t), 0);
    }
    for (const r of rows) {
      const key = fmt(new Date(r.createdAt));
      if (byDate.has(key)) byDate.set(key, (byDate.get(key) || 0) + 1);
    }
    const series = Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
    return reply.send({ from: fmt(start), to: fmt(end), series });
  });

  fastify.get<{ Querystring: TopPlinkksQuery }>("/stats/plinkks/top", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'VIEW_STATS');
    if (!ok) return;

    const {
      page = 1,
      limit = 20,
      sort = "views",
      order = "desc",
      search = "",
    } = request.query;
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

  fastify.get("/stats/plinkks/total", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'VIEW_STATS');
    if (!ok) return;

    const agg = await prisma.plinkk.aggregate({
      _sum: { views: true },
    });
    return reply.send({ total: agg._sum.views || 0 });
  });

  fastify.get("/roles", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.redirect(`/login?returnTo=${encodeURIComponent("/admin/roles")}`);
    const userInfo = await prisma.user.findFirst({ where: { id: userId }, include: { role: true } });
    if (!userInfo) return reply.redirect(`/login?returnTo=${encodeURIComponent("/admin/roles")}`);
    {
      const ok = await ensurePermission(request, reply, 'MANAGE_ROLES', { mode: 'redirect' });
      if (!ok) return;
    }

    let roles: any[] = [];
    try {
      roles = await prisma.role.findMany({
        include: { permissions: true },
        orderBy: [{ priority: 'desc' }, { name: 'asc' }]
      });
    } catch (e) {
      request.log?.error({ err: e }, 'Failed to preload roles');
      roles = [];
    }
    const perms = await prisma.permission.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] });
    const grouped: Record<string, any[]> = {};
    for (const p of perms) { grouped[p.category] = grouped[p.category] || []; grouped[p.category].push(p); }

    const rolesForPayload = roles.map(r => ({
      id: r.id,
      name: r.name,
      isStaff: !!r.isStaff,
      priority: r.priority ?? 0,
      color: r.color ?? null,
      maxPlinkks: r.maxPlinkks ?? 1,
      maxThemes: r.maxThemes ?? 0,
      permissions: Array.isArray(r.permissions) ? r.permissions.map((rp: any) => rp.permissionKey || rp.permission?.key).filter(Boolean) : []
    }));
    let rolesB64 = '';
    try {
      rolesB64 = Buffer.from(JSON.stringify(rolesForPayload), 'utf8').toString('base64');
    } catch (e) {
      request.log?.error({ err: e }, 'Failed to stringify rolesForPayload');
    }
    request.log?.info({ rolesCount: roles.length }, 'Admin roles page preload');
    let publicPath; try { const def = await prisma.plinkk.findFirst({ where: { userId: userInfo.id, isDefault: true } }); publicPath = def && def.slug ? def.slug : userInfo.id; } catch {}
    return replyView(reply, 'dashboard/admin/roles.ejs', userInfo, { rolesB64, permissionsGrouped: grouped, publicPath });
  });

  fastify.get("/logs", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.redirect(`/login?returnTo=${encodeURIComponent("/admin/logs")}`);
    const userInfo = await prisma.user.findFirst({ where: { id: userId }, include: { role: true } });
    if (!userInfo) return reply.redirect(`/login?returnTo=${encodeURIComponent("/admin/logs")}`);
    {
      const ok = await ensurePermission(request, reply, 'VIEW_ADMIN_LOGS', { mode: 'redirect' });
      if (!ok) return;
    }
    let publicPath; try { const def = await prisma.plinkk.findFirst({ where: { userId: userInfo.id, isDefault: true } }); publicPath = def && def.slug ? def.slug : userInfo.id; } catch {}
    return replyView(reply, 'dashboard/admin/logs.ejs', userInfo, { publicPath });
  });

  fastify.get<{ Querystring: LogsQuery }>("/logs/api", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'VIEW_ADMIN_LOGS');
    if (!ok) return;
    
    const { page = 1, limit = 50, adminId, action, from, to, sort = 'desc' } = request.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.AdminLogWhereInput = {};
    if (adminId) where.adminId = adminId;
    if (action) where.action = action;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' },
        skip,
        take
      }),
      prisma.adminLog.count({ where })
    ]);
    
    const adminIds = [...new Set(logs.map(l => l.adminId))];
    const admins = await prisma.user.findMany({ where: { id: { in: adminIds } }, select: { id: true, userName: true } });
    const adminMap = new Map(admins.map(a => [a.id, a.userName]));

    const enriched = logs.map(l => ({
      ...l,
      adminName: adminMap.get(l.adminId) || l.adminId
    }));

    return reply.send({ logs: enriched, total });
  });

  fastify.post("/users/:id/impersonate", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'IMPERSONATE_USER');
    if (!ok) return;
    
    const { id } = request.params as { id: string };
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return reply.code(404).send({ error: "not_found" });

    await logAdminAction(userId, 'IMPERSONATE', id, { targetName: target.userName }, request.ip);

    request.session.set("data", target.id);
    return reply.send({ ok: true, redirectUrl: '/dashboard' });
  });



  fastify.get("/system", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.redirect(`/login?returnTo=${encodeURIComponent("/admin/system")}`);
    const userInfo = await prisma.user.findFirst({ where: { id: userId }, include: { role: true } });
    if (!userInfo) return reply.redirect(`/login?returnTo=${encodeURIComponent("/admin/system")}`);
    {
      const ok = await ensurePermission(request, reply, 'VIEW_SYSTEM_HEALTH', { mode: 'redirect' });
      if (!ok) return;
    }
    let publicPath; try { const def = await prisma.plinkk.findFirst({ where: { userId: userInfo.id, isDefault: true } }); publicPath = def && def.slug ? def.slug : userInfo.id; } catch {}
    return replyView(reply, 'dashboard/admin/system.ejs', userInfo, { publicPath });
  });

  fastify.get("/system/api", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'VIEW_SYSTEM_HEALTH');
    if (!ok) return;

    const mem = process.memoryUsage();
    const stats = {
      uptime: process.uptime(),
      memory: {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed
      },
      os: {
        freemem: os.freemem(),
        totalmem: os.totalmem(),
        loadavg: os.loadavg()
      },
      nodeVersion: process.version
    };
    return reply.send(stats);
  });

  fastify.post("/tasks/run", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'RUN_SYSTEM_TASKS');
    if (!ok) return;

    const { script } = request.body as { script: string };
    const allowedScripts = [
      'check-avatars.mjs',
      'delete_inactive_user.js',
      'check_public_endpoints.mjs',
      'check-bans.js'
    ];

    if (!allowedScripts.includes(script)) {
      return reply.code(400).send({ error: "invalid_script" });
    }

    await logAdminAction(userId, 'RUN_TASK', undefined, { script }, request.ip);

    const scriptPath = `./scripts/${script}`; 
    
    const cmd = `node apps/dashboard/scripts/${script}`;
    
    return new Promise((resolve) => {
      exec(cmd, (error, stdout, stderr) => {
        resolve({
          ok: !error,
          stdout,
          stderr,
          error: error ? error.message : null
        });
      });
    });
  });
}
