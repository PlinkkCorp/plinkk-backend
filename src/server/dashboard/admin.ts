import { FastifyInstance } from "fastify";
import { Announcement, Prisma, PrismaClient, Role } from "../../../generated/prisma/client";
import { replyView, getActiveAnnouncementsForUser } from "../../lib/replyView";
import { verifyRoleIsStaff } from "../../lib/verifyRole";

const prisma = new PrismaClient();

export function dashboardAdminRoutes(fastify: FastifyInstance) {
  // Admin: Liste des thèmes soumis
  fastify.get("/themes", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/themes")}`
      );
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true },
    });
    if (!userInfo) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/themes")}`
      );
    }
    if (!verifyRoleIsStaff(userInfo.role)) {
      request.log?.info(
        { userId: userInfo.id, role: userInfo.role },
        "non-staff attempted admin themes page - redirecting to user dashboard"
      );
      return reply.redirect("/dashboard");
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
    // Move approved themes that have pending updates into submitted list so admins
    // can validate updates from the top "À valider" section.
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

  // Admin: Prévisualisation d'un thème
  fastify.get("/themes/:id", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/themes")}`
      );
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true },
    });
    if (!userInfo) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/themes")}`
      );
    }
    if (!verifyRoleIsStaff(userInfo.role)) {
      request.log?.info(
        { userId: userInfo.id, role: userInfo.role },
        "non-staff attempted admin theme preview - redirecting to user dashboard"
      );
      return reply.redirect("/dashboard");
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
    // Expose convenient booleans expected by the preview template
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

  // Admin: Message global (page)
  fastify.get("/message", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/message")}`
      );
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true },
    });
    if (!userInfo)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/message")}`
      );
    if (!verifyRoleIsStaff(userInfo.role)) return reply.redirect("/dashboard");
    let publicPath;
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return replyView(reply, "dashboard/admin/message.ejs", userInfo, {
      publicPath,
    });
  });

  // Admin API: get current message
  fastify.get("/message/api", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role)))
      return reply.code(403).send({ error: "forbidden" });
    const list = await getActiveAnnouncementsForUser(userId as string);
    return reply.send({ messages: list });
  });

  // Admin API: search users for mentions (@autocomplete)
  fastify.get("/users/search", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role)))
      return reply.code(403).send({ error: "forbidden" });
    const q = String((request.query as { q: string })?.q as string).trim();
    if (!q) return reply.send({ users: [] });
    const take = Math.min(
      10,
      Math.max(1, Number((request.query as { limit: number })?.limit || 8))
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

  // Admin API: set message (DB only)
  fastify.post("/message/api", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role)))
      return reply.code(403).send({ error: "forbidden" });
    const body = request.body as {
      id: string;
      targetUserIds: string[];
      targetRoles: Role[];
      level: string;
      text: string;
      dismissible: string;
      startAt: string;
      endAt: string;
      global: string;
    };
    // Create/update DB announcement with targets
    const id = body.id as string | undefined;
    const targetUserIds: string[] = Array.isArray(body.targetUserIds)
      ? body.targetUserIds
      : [];
    const targetRoles: Role[] = Array.isArray(body.targetRoles)
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
      if (targetRoles.length) {
        await prisma.announcementRoleTarget.createMany({
          data: targetRoles.map((r) => ({ announcementId: ann.id, roleId: r.id })),
        });
      }
    }
    return reply.send({ ok: true, message: { id: ann.id, ...payload } });
  });

  // Admin API: delete message (DB only)
  fastify.delete("/message/api", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role)))
      return reply.code(403).send({ error: "forbidden" });
    const { id } = request.query as { id: string };
    if (!id) return reply.code(400).send({ error: "missing_id" });
    try {
      await prisma.bannedSlug.delete({ where: { slug: String(id) } });
      return reply.send({ ok: true });
    } catch (e) {
      return reply.code(404).send({ error: "not_found" });
    }
  });

  fastify.get("/bans", async function (request, reply) {
    const userId = request.session.get("data");

    if (!userId)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/bans")}`
      );

    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true },
    });

    if (!userInfo)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/bans")}`
      );

    if (!verifyRoleIsStaff(userInfo.role)) return reply.redirect("/dashboard");

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

  // Dashboard: Admin (gestion avancée)
  fastify.get("/", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin")}`
      );
    }

    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true }
    });
    if (!userInfo) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin")}`
      );
    }
    if (!verifyRoleIsStaff(userInfo.role)) {
      request.log?.info(
        { userId: userInfo.id, role: userInfo.role },
        "non-staff attempted admin page - redirecting to user dashboard"
      );
      return reply.redirect("/dashboard");
    }
    const [usersRaw, totals] = await Promise.all([
      prisma.user.findMany({
        // Voir tous les utilisateurs pour l'admin (pas seulement isPublic)
        select: {
          id: true,
          userName: true,
          email: true,
          publicEmail: true,
          role: true,
          isPublic: true,
          views: true,
          mustChangePassword: true,
          cosmetics: true,
          createdAt: true,
          twoFactorEnabled: true,
          twoFactorSecret: true,
          plinkks: { select: { id: true, name: true, slug: true, isDefault: true, isActive: true, views: true } },
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
            name: { in: ["ADMIN", "DEVELOPER", "MODERATOR"] }
          },
          include: {
            users: true
          }
        })
        // Sum users for role 'MODERATOR' if present, otherwise fallback to 0
        const moderatorsRole = allRoles.find(r => r.name === 'MODERATOR');
        const moderators = moderatorsRole ? (moderatorsRole.users?.length || 0) : 0;
        return { totalUsers, totalPublic, totalPrivate, moderators };
      })(),
    ]);
    // Exclure les utilisateurs bannis par email (bans actifs uniquement)
    let users = usersRaw;
    try {
      const bans = await prisma.bannedEmail.findMany({ where: { revoquedAt: null } });
      const now = Date.now();
      const activeEmails = new Set(
        bans
          .filter((b) => {
            if (b.revoquedAt) return false;
            if (b.time == null || b.time < 0) return true; // permanent
            const until = new Date(b.createdAt).getTime() + b.time * 60000;
            return until > now;
          })
          .map((b) => String(b.email).toLowerCase())
      );
      users = users.filter((u) => !activeEmails.has(String(u.email).toLowerCase()));
    } catch (e) {
      request.log?.warn({ e }, "Failed to filter banned users");
    }

    // Also fetch recent submitted themes for quick moderation view
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

    let publicPath
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
      publicPath
    });
  });

  // Admin: Page statistiques utilisateurs
  fastify.get("/stats", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/stats")}`
      );
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true }
    });
    if (!userInfo) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/stats")}`
      );
    }
    if (!verifyRoleIsStaff(userInfo.role)) {
      request.log?.info(
        { userId: userInfo.id, role: userInfo.role },
        "non-staff attempted admin stats page - redirecting to user dashboard"
      );
      return reply.redirect("/dashboard");
    }
    let publicPath
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return replyView(reply, "dashboard/admin/stats.ejs", userInfo, { publicPath });
  });

  // Admin API: séries d'inscriptions d'utilisateurs par jour (filtrable)
  fastify.get("/stats/users/series", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    if (
      !(
        me &&
        (verifyRoleIsStaff(me.role))
      )
    ) {
      return reply.code(403).send({ error: "forbidden" });
    }
    const {
      from,
      to,
      role = "all",
      visibility = "all",
    } = request.query as { from: string, to: string, role: string, visibility: string };
    // default range: dernière 30j (UTC)
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
    const where: Prisma.UserWhereInput = { createdAt: { gte: start, lte: end } };
    if (role && role !== "all") where.role.name = role;
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

  // Admin API: résumé (totaux) selon filtres
  fastify.get("/stats/users/summary", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    if (
      !(
        me &&
        (verifyRoleIsStaff(me.role))
      )
    ) {
      return reply.code(403).send({ error: "forbidden" });
    }
    const {
      from,
      to,
      role = "all",
      visibility = "all",
    } = request.query as { from: string, to: string, role: string, visibility: string };
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
    const where: Prisma.UserWhereInput = { createdAt: { gte: start, lte: end } };
    if (role && role !== "all") where.role.name = role;
    if (visibility && visibility !== "all")
      where.isPublic = visibility === "public";
    const rows = await prisma.user.findMany({
      where,
      include: { role: true }
    });
    const total = rows.length;
    const publics = rows.filter((r) => r.isPublic).length;
    const privates = total - publics;
    const byRole: Record<string, number> = {};
    rows.forEach((r) => {
      const name = r.role?.name || 'UNKNOWN';
      byRole[name] = (byRole[name] || 0) + 1;
    });
    return reply.send({ total, publics, privates, byRole });
  });

  // Admin API: séries de connexions (basées sur lastLogin, une fois par utilisateur dans l'intervalle)
  fastify.get("/stats/logins/series", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findFirst({ where: { id: userId }, select: { role: true } });
    if (!(me && verifyRoleIsStaff(me.role))) return reply.code(403).send({ error: "forbidden" });
    const { from, to } = request.query as { from?: string; to?: string };
    const now = new Date();
    const end = to
      ? new Date(to + "T23:59:59.999Z")
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const start = from ? new Date(from + "T00:00:00.000Z") : new Date(end.getTime() - 29 * 86400000);
    const fmt = (dt: Date) => {
      const y = dt.getUTCFullYear(); const m = String(dt.getUTCMonth()+1).padStart(2,'0'); const d = String(dt.getUTCDate()).padStart(2,'0');
      return `${y}-${m}-${d}`;
    };
    const rows = await prisma.user.findMany({ where: { lastLogin: { gte: start, lte: end } }, select: { lastLogin: true } });
    const byDate = new Map<string, number>();
    for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + 86400000)) byDate.set(fmt(t), 0);
    for (const r of rows) { const key = fmt(new Date(r.lastLogin)); if (byDate.has(key)) byDate.set(key, (byDate.get(key) || 0) + 1); }
    const series = Array.from(byDate.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,count])=>({date, count}));
    return reply.send({ from: fmt(start), to: fmt(end), series });
  });

  // Admin API: liste des connexions récentes (top N)
  fastify.get("/stats/logins/recent", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findFirst({ where: { id: userId }, select: { role: true } });
    if (!(me && verifyRoleIsStaff(me.role))) return reply.code(403).send({ error: "forbidden" });
    const limit = Math.min(50, Math.max(1, Number((request.query as any)?.limit || 20)));
    const rows = await prisma.user.findMany({
      select: { id: true, userName: true, email: true, lastLogin: true, role: true },
      orderBy: { lastLogin: 'desc' },
      take: limit,
    });
    return reply.send({ users: rows });
  });

  // Admin API: séries des bans (créés/révoqués par jour) + résumé
  fastify.get("/stats/bans/series", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findFirst({ where: { id: userId }, select: { role: true } });
    if (!(me && verifyRoleIsStaff(me.role))) return reply.code(403).send({ error: "forbidden" });
    const { from, to } = request.query as { from?: string; to?: string };
    const now = new Date();
    const end = to
      ? new Date(to + "T23:59:59.999Z")
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const start = from ? new Date(from + "T00:00:00.000Z") : new Date(end.getTime() - 29 * 86400000);
    const fmt = (dt: Date) => { const y=dt.getUTCFullYear(); const m=String(dt.getUTCMonth()+1).padStart(2,'0'); const d=String(dt.getUTCDate()).padStart(2,'0'); return `${y}-${m}-${d}`; };
    const bansCreated = await prisma.bannedEmail.findMany({ where: { createdAt: { gte: start, lte: end } }, select: { createdAt: true } });
    const bansRevoked = await prisma.bannedEmail.findMany({ where: { revoquedAt: { not: null, gte: start, lte: end } }, select: { revoquedAt: true } });
    const byDate = new Map<string, { created: number; revoked: number }>();
    for (let t=new Date(start.getTime()); t<=end; t=new Date(t.getTime()+86400000)) byDate.set(fmt(t), {created:0, revoked:0});
    for (const b of bansCreated) { const key = fmt(new Date(b.createdAt)); const v = byDate.get(key); if (v) v.created += 1; }
    for (const b of bansRevoked) { const dt = (b).revoquedAt as Date; const key = fmt(new Date(dt)); const v = byDate.get(key); if (v) v.revoked += 1; }
    const series = Array.from(byDate.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,v])=>({ date, created: v.created, revoked: v.revoked }));
    // résumé actuel
    const bansAll = await prisma.bannedEmail.findMany();
    const activeNow = (()=>{
      const nowTs = Date.now();
      let c=0; for (const b of bansAll) {
        if (b.revoquedAt) continue;
        if (b.time == null || b.time < 0) { c++; continue; }
        const until = new Date(b.createdAt).getTime() + b.time*60000; if (until > nowTs) c++;
      }
      return c;
    })();
    const totalBanned = bansAll.length;
    const totalRevoked = bansAll.filter(b=>!!b.revoquedAt).length;
    return reply.send({ from: fmt(start), to: fmt(end), series, summary: { activeNow, totalBanned, totalRevoked } });
  });

  // Admin API: séries par visibilité (public/privé) par jour
  fastify.get("/stats/users/series/by-visibility", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findFirst({ where: { id: userId }, select: { role: true } });
    if (!(me && verifyRoleIsStaff(me.role))) return reply.code(403).send({ error: "forbidden" });
    const { from, to } = request.query as { from?: string; to?: string };
    const now = new Date();
    const end = to
      ? new Date(to + "T23:59:59.999Z")
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const start = from ? new Date(from + "T00:00:00.000Z") : new Date(end.getTime() - 29 * 86400000);
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
    for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + 86400000)) {
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
  });

  // Admin API: séries par rôle par jour (rôles dynamiques selon BDD)
  fastify.get("/stats/users/series/by-role", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findFirst({ where: { id: userId }, select: { role: true } });
    if (!(me && verifyRoleIsStaff(me.role))) return reply.code(403).send({ error: "forbidden" });
    const { from, to } = request.query as { from?: string; to?: string };
    const now = new Date();
    const end = to
      ? new Date(to + "T23:59:59.999Z")
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const start = from ? new Date(from + "T00:00:00.000Z") : new Date(end.getTime() - 29 * 86400000);
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
    // Découvrir dynamiquement tous les rôles présents dans l'intervalle
    const roleSet = new Set<string>();
    for (const r of rows) { if (r.role?.name) roleSet.add(r.role.name); }
    const roles = Array.from(roleSet.values()).sort();
    const makeZero = () => Object.fromEntries(roles.map(r=>[r,0])) as Record<string, number>;
    const byDate = new Map<string, Record<string, number>>();
    for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + 86400000)) {
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
}