import { FastifyInstance } from "fastify";
import { PrismaClient, Role } from "../../generated/prisma/client";
import fs from "fs";
import { getActiveAnnouncementsForUser, replyView } from "../lib/replyView";
import { verifyRoleAdmin, verifyRoleIsStaff, verifyRoleDeveloper } from "../lib/verifyRole";

const prisma = new PrismaClient();

export function dashboardRoutes(fastify: FastifyInstance) {

  fastify.get("/", async function (request, reply) {
    request.log?.info(
      {
        cookies: request.headers.cookie,
        sessionData: request.session.get("data"),
      },
      "dashboard root: incoming request"
    );
    const userId = request.session.get("data");
    if (!userId) {
      // Ne redirigez pas vers /dashboard lui-même comme returnTo pour éviter un ping-pong
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard")}`
      );
    }

    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true }
    });
    if (!userInfo) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard")}`
      );
    }

    const [linksCount, socialsCount, labelsCount, recentLinks, plinkks] =
      await Promise.all([
        prisma.link.count({ where: { userId: userId as string } }),
        prisma.socialIcon.count({ where: { userId: userId as string } }),
        prisma.label.count({ where: { userId: userId as string } }),
        prisma.link.findMany({
          where: { userId: userId as string },
          orderBy: { id: "desc" },
          take: 10,
        }),
        prisma.plinkk.findMany({ where: { userId: userId as string }, select: { id: true, name: true, slug: true, isDefault: true }, orderBy: [{ isDefault: 'desc' }, { index: 'asc' }] }),
      ]);

    // compute publicPath for user views (prefer default plinkk slug if present)
    let publicPath;
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}

    return await replyView(reply, "dashboard.ejs", userInfo, {
      stats: { links: linksCount, socials: socialsCount, labels: labelsCount },
      links: recentLinks,
      plinkks,
      publicPath
    });
  });

  // Dashboard: Cosmétiques (aperçu et sélection)
  fastify.get("/cosmetics", async function (request, reply) {
    request.log?.info(
      {
        cookies: request.headers.cookie,
        sessionData: request.session.get("data"),
      },
      "dashboard cosmetics: incoming request"
    );
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/cosmetics")}`
      );
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { cosmetics: true, role: true },
    });
    if (!userInfo) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/cosmetics")}`
      );
    }
    const cosmetics = userInfo.cosmetics;
    // Petit catalogue par défaut (certaines entrées "verrouillées" selon le rôle)
    const catalog = {
      flairs: [
        { key: "OG", label: "OG", locked: false },
        { key: "PARTNER", label: "PARTNER", locked: false },
        {
          key: "ADMIN",
          label: "ADMIN",
          locked: !(
            verifyRoleAdmin(userInfo.role) || verifyRoleDeveloper(userInfo.role)
          ),
        },
        {
          key: "DEVELOPER",
          label: "DEVELOPER",
          locked: !(
            verifyRoleAdmin(userInfo.role) || verifyRoleDeveloper(userInfo.role)
          ),
        },
        {
          key: "FOUNDER",
          label: "FOUNDER",
          locked: !(
            verifyRoleAdmin(userInfo.role) || verifyRoleDeveloper(userInfo.role)
          ),
        },
      ],
      frames: [
        { key: "none", label: "Aucun", locked: false },
        { key: "neon", label: "Néon", locked: false },
        { key: "glow", label: "Glow", locked: false },
        { key: "gold", label: "Gold", locked: false },
      ],
      themes: [
        { key: "system", label: "Système", locked: false },
        { key: "dark-emerald", label: "Dark Emerald", locked: false },
        { key: "midnight", label: "Midnight", locked: false },
        { key: "plasma", label: "Plasma", locked: false },
      ],
      banners: [
        { key: "none", label: "Aucune", url: "", locked: false },
        {
          key: "gradient-emerald",
          label: "Dégradé Émeraude",
          url: "",
          locked: false,
        },
        {
          key: "gradient-fuchsia",
          label: "Dégradé Fuchsia",
          url: "",
          locked: false,
        },
      ],
    };
    let publicPath;
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath = defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return await replyView(reply, "dashboard/user/cosmetics.ejs", userInfo, {
      cosmetics,
      catalog,
      publicPath
    });
  });

  // Page d'édition (classique) avec sélection de Plinkk (par défaut si non fourni)
  fastify.get("/edit", async function (request, reply) {
    request.log?.info(
      {
        cookies: request.headers.cookie,
        sessionData: request.session.get("data"),
      },
      "dashboard edit: incoming request"
    );
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/edit")}`
      );
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true }
    });
    if (!userInfo) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/edit")}`
      );
    }
    // Sélection de la page Plinkk à éditer
    const q = request.query as { plinkkId: string };
    const pages = await prisma.plinkk.findMany({
      where: { userId: String(userId) },
      include: { settings: true },
      orderBy: [{ isDefault: "desc" }, { index: "asc" }, { createdAt: "asc" }],
    });
    let selected = null;
    if (q?.plinkkId)
      selected = pages.find((p) => p.id === String(q.plinkkId)) || null;
    if (!selected)
      selected =
        pages.find((p) => p.isDefault) ||
        pages.find((p) => p.index === 0) ||
        pages[0] ||
        null;
    const selectedForView = selected
      ? {
          ...selected,
          affichageEmail: selected.settings?.affichageEmail ?? null,
        }
      : null;
    const autoOpenPlinkkModal = !q?.plinkkId && pages.length > 1;
    let publicPath
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath = defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    // Ajout d'un champ top-level `affichageEmail` par page pour simplifier l'usage côté client
    const pagesForView = pages.map((p) => ({
      ...p,
      affichageEmail: p.settings?.affichageEmail ?? null,
    }));
    return reply.view("dashboard/user/edit.ejs", {
      user: userInfo,
      plinkk: selectedForView,
      pages: pagesForView,
      autoOpenPlinkkModal,
      publicPath
    });
  });

  // Dashboard: Statistiques (classique) avec sélection de Plinkk (par défaut si non fourni)
  fastify.get("/stats", async function (request, reply) {
    request.log?.info(
      {
        cookies: request.headers.cookie,
        sessionData: request.session.get("data"),
      },
      "dashboard stats: incoming request"
    );
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/stats")}`
      );
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: {
        links: true,
        role: true
      },
    });
    if (!userInfo) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/stats")}`
      );
    }
    // Pages de l'utilisateur et sélection
    const q = request.query as { plinkkId: string };
    const pages = await prisma.plinkk.findMany({
      where: { userId: String(userId) },
      include: { settings: true },
      orderBy: [{ isDefault: "desc" }, { index: "asc" }, { createdAt: "asc" }],
    });
    let selected = null;
    if (q?.plinkkId)
      selected = pages.find((p) => p.id === String(q.plinkkId)) || null;
    if (!selected)
      selected =
        pages.find((p) => p.isDefault) ||
        pages.find((p) => p.index === 0) ||
        pages[0] ||
        null;
    const selectedForView = selected
      ? {
          ...selected,
          affichageEmail: selected.settings?.affichageEmail ?? null,
        }
      : null;
    const autoOpenPlinkkModal = !q?.plinkkId && pages.length > 1;

    // Précharger la série par jour (plinkk)
    const now = new Date();
    const end = now;
    const start = new Date(end.getTime() - 29 * 86400000);
    const fmt = (dt: Date) => {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dt.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };
    const s = fmt(start);
    const e = fmt(end);
    let preSeries: { date: string; count: number }[] = [];
    let totalViews = 0;
    let totalClicks = 0;
    try {
      if (selected) {
        await prisma.$executeRawUnsafe(
          'CREATE TABLE IF NOT EXISTS "PlinkkViewDaily" ("plinkkId" TEXT NOT NULL, "date" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("plinkkId","date"))'
        );
        const rows = (await prisma.$queryRawUnsafe(
          `SELECT "date", "count" FROM "PlinkkViewDaily" WHERE "plinkkId" = ? AND "date" BETWEEN ? AND ? ORDER BY "date" ASC`,
          selected.id,
          s,
          e
        )) as Array<{ date: string; count: number }>;
        const byDate = new Map(rows.map((r) => [r.date, Number(r.count)]));
        for (
          let t = new Date(start.getTime());
          t <= end;
          t = new Date(t.getTime() + 86400000)
        ) {
          const key = fmt(t);
          preSeries.push({ date: key, count: byDate.get(key) || 0 });
        }
        totalViews = await prisma.pageStat.count({
          where: { plinkkId: selected.id, eventType: "view" },
        });
        totalClicks = await prisma.pageStat.count({
          where: { plinkkId: selected.id, eventType: "click" },
        });
      }
    } catch (e) {
      request.log?.warn({ err: e }, "Failed to preload daily series");
    }
    const links = await prisma.link.findMany({
      where: { userId: String(userId) },
      orderBy: { id: "desc" },
      take: 100,
    });
    let publicPath
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    const pagesForView = pages.map((p) => ({
      ...p,
      affichageEmail: p.settings?.affichageEmail ?? null,
    }));
    return reply.view("dashboard/user/stats.ejs", {
      user: userInfo,
      plinkk: selectedForView,
      pages: pagesForView,
      autoOpenPlinkkModal,
      viewsDaily30d: preSeries,
      totalViews,
      totalClicks,
      links,
      publicPath
    });
  });

  // API: Vues journalières (pour graphiques)
  fastify.get("/stats/views", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const { from, to } = request.query as { from?: string; to?: string };
    // bornes par défaut: 30 derniers jours (UTC)
    const now = new Date();
    const end = to ? new Date(to) : now;
    const start = from
      ? new Date(from)
      : new Date(end.getTime() - 29 * 86400000);
    const fmt = (dt: Date) => {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dt.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };
    const s = fmt(start);
    const e = fmt(end);
    try {
      // Assurer l'existence de la table
      await prisma.$executeRawUnsafe(
        'CREATE TABLE IF NOT EXISTS "UserViewDaily" ("userId" TEXT NOT NULL, "date" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("userId","date"))'
      );
      const rows = await prisma.$queryRaw<
        Array<{ date: string; count: number }>
      >`
        SELECT "date", "count"
        FROM "UserViewDaily"
        WHERE "userId" = ${String(userId)} AND "date" BETWEEN ${s} AND ${e}
        ORDER BY "date" ASC
      `;

      // Remplir les jours manquants à 0
      const byDate = new Map(rows.map((r) => [r.date, r.count]));
      const series: { date: string; count: number }[] = [];
      for (
        let t = new Date(start.getTime());
        t <= end;
        t = new Date(t.getTime() + 86400000)
      ) {
        const key = fmt(t);
        series.push({ date: key, count: byDate.get(key) || 0 });
      }
      return reply.send({ from: s, to: e, series });
    } catch (e) {
      request.log?.error({ err: e }, "Failed to query daily views");
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  // API: Clics journaliers (somme de tous les liens de l'utilisateur)
  fastify.get("/stats/clicks", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const { from, to } = request.query as { from?: string; to?: string };
    const now = new Date();
    const end = to ? new Date(to) : now;
    const start = from
      ? new Date(from)
      : new Date(end.getTime() - 29 * 86400000);
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
        'CREATE TABLE IF NOT EXISTS "LinkClickDaily" ("linkId" TEXT NOT NULL, "date" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("linkId","date"))'
      );
      // agréger par jour pour tous les liens de l'utilisateur (via sous-sélection des linkId)
      const linkIds = (
        await prisma.link.findMany({
          where: { userId: String(userId) },
          select: { id: true },
        })
      ).map((x) => x.id);
      if (linkIds.length === 0)
        return reply.send({ from: s, to: e, series: [] });
      // Construire la liste pour clause IN
      const placeholders = linkIds.map(() => "?").join(",");
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT "date", SUM("count") as count FROM "LinkClickDaily" WHERE "linkId" IN (${placeholders}) AND "date" BETWEEN ? AND ? GROUP BY "date" ORDER BY "date" ASC`,
        ...linkIds,
        s,
        e
      )) as Array<{ date: string; count: number }>;
      const byDate = new Map(rows.map((r) => [r.date, Number(r.count)]));
      const series: { date: string; count: number }[] = [];
      for (
        let t = new Date(start.getTime());
        t <= end;
        t = new Date(t.getTime() + 86400000)
      ) {
        const key = fmt(t);
        series.push({ date: key, count: byDate.get(key) || 0 });
      }
      return reply.send({ from: s, to: e, series });
    } catch (e) {
      request.log?.error({ err: e }, "Failed to query daily clicks");
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  // Dashboard: Versions (vue dédiée)
  fastify.get("/versions", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      const dest = `/login?returnTo=${encodeURIComponent(
        "/dashboard/versions"
      )}`;
      request.log?.info(
        { returnTo: request.raw.url },
        "redirecting to login with returnTo"
      );
      return reply.redirect(dest);
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true }
    });
    if (!userInfo) {
      const dest = `/login?returnTo=${encodeURIComponent(
        "/dashboard/versions"
      )}`;
      request.log?.info(
        { returnTo: request.raw.url },
        "redirecting to login with returnTo"
      );
      return reply.redirect(dest);
    }
    let publicPath
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return replyView(reply, "dashboard/user/versions.ejs", userInfo, { publicPath });
  });

  // Dashboard: Compte (gestion infos, confidentialité, cosmétiques)
  fastify.get("/account", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/account")}`
      );
    }
    let userInfo: any = null;
    try {
      // Try to include `host` if the table exists in the DB/schema
      userInfo = await prisma.user.findFirst({
        where: { id: userId },
        include: { cosmetics: true, host: true, role: true },
      });
    } catch (e: any) {
      // If the Host table is missing (e.g. migrations not applied), fallback to query without it
      request.log?.warn({ err: e }, 'Failed to include host when fetching userInfo; retrying without host (fallback)');
      userInfo = await prisma.user.findFirst({ where: { id: userId }, include: { cosmetics: true, role: true } });
    }
    if (!userInfo) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/account")}`
      );
    }
    // Dérive la visibilité d'email depuis le champ `publicEmail` (présent
    // dans le schéma Prisma). Si publicEmail est défini -> l'email est public.
    const isEmailPublic = Boolean(userInfo.publicEmail);
    let publicPath
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return replyView(reply, "dashboard/user/account.ejs", userInfo, {
      isEmailPublic,
      publicPath
    });
  });

  // Dashboard: Admin (gestion avancée)
  fastify.get("/admin", async function (request, reply) {
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
    const [users, totals] = await Promise.all([
      prisma.user.findMany({
        // Voir tous les utilisateurs pour l'admin (pas seulement isPublic)
        select: {
          id: true,
          userName: true,
          email: true,
          publicEmail: true,
          role: true,
          isPublic: true,
          cosmetics: true,
          createdAt: true,
          twoFactorEnabled: true,
          twoFactorSecret: true,
          plinkks: { select: { id: true, name: true, slug: true, isDefault: true } },
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
            id: { in: ["ADMIN", "DEVELOPER", "MODERATOR"] }
          },
          include: {
            users: true
          }
        })
        const moderators = allRoles[0].users.length
        return { totalUsers, totalPublic, totalPrivate, moderators };
      })(),
    ]);

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
    return reply.view("dashboard/admin/dash.ejs", {
      users,
      totals,
      user: userInfo,
      pendingThemes,
      publicPath
    });
  });

  // Admin: Page statistiques utilisateurs
  fastify.get("/admin/stats", async function (request, reply) {
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
  fastify.get("/admin/stats/users/series", async function (request, reply) {
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
    const where: any = { createdAt: { gte: start, lte: end } };
    if (role && role !== "all") where.role = role;
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
  fastify.get("/admin/stats/users/summary", async function (request, reply) {
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
    const where: any = { createdAt: { gte: start, lte: end } };
    if (role && role !== "all") where.role = role;
    if (visibility && visibility !== "all")
      where.isPublic = visibility === "public";
    const rows = await prisma.user.findMany({
      where,
      select: { id: true, role: true, isPublic: true },
    });
    const total = rows.length;
    const publics = rows.filter((r) => r.isPublic).length;
    const privates = total - publics;
    const byRole: Record<string, number> = {
      USER: 0,
      MODERATOR: 0,
      DEVELOPER: 0,
      ADMIN: 0,
    };
    rows.forEach((r) => {
      byRole[r.role.name as string] = (byRole[r.role.name as string] || 0) + 1;
    });
    return reply.send({ total, publics, privates, byRole });
  });

  // Dashboard: Mes thèmes (création / soumission)
  fastify.get("/themes", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/themes")}`
      );
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      omit: { password: true },
      include: { role: true }
    });
    if (!userInfo) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/themes")}`
      );
    }
    const myThemes = await prisma.theme.findMany({
      where: { authorId: userId as string },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        updatedAt: true,
        data: true,
        pendingUpdate: true,
        pendingUpdateAt: true,
        pendingUpdateMessage: true,
        isPrivate: true,
      },
    });
    let publicPath
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return reply.view("dashboard/user/themes.ejs", {
      user: userInfo,
      myThemes,
      selectedCustomThemeId: (userInfo as any).selectedCustomThemeId || null,
      publicPath
    });
  });

  // Admin: Liste des thèmes soumis
  fastify.get("/admin/themes", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/themes")}`
      );
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      omit: { password: true },
      include: { role: true }
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
    const approvedWithPending = approved.filter(
      (t) => t.pendingUpdate
    );
    const approvedFiltered = approved.filter(
      (t) => !t.pendingUpdate
    );
    const submittedNormalized = submitted.map((s) => ({
      ...s,
      pendingUpdate: false,
    }));
    const mergedSubmitted = [...submittedNormalized, ...approvedWithPending];
    let publicPath
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return reply.view("dashboard/admin/themes.ejs", {
      user: userInfo,
      submitted: mergedSubmitted,
      approved: approvedFiltered,
      archived,
      publicPath
    });
  });

  // Admin: Prévisualisation d'un thème
  fastify.get("/admin/themes/:id", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/themes")}`
      );
    }
    const userInfo = await prisma.user.findFirst({ where: { id: userId }, include: { role: true } });
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
    let publicPath
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return await replyView(reply, "dashboard/admin/preview.ejs", userInfo, {
      theme: themeForView,
      publicPath
    });
  });

  // Admin: Message global (page)
  fastify.get("/admin/message", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/message")}`
      );
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true }
    });
    if (!userInfo)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/message")}`
      );
    if (!verifyRoleIsStaff(userInfo.role)) return reply.redirect("/dashboard");
    let publicPath
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return replyView(reply, "dashboard/admin/message.ejs", userInfo, { publicPath });
  });

  // Admin API: get current message
  fastify.get("/admin/message/api", async function (request, reply) {
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
    )
      return reply.code(403).send({ error: "forbidden" });
    const list = await getActiveAnnouncementsForUser(userId as string);
    return reply.send({ messages: list });
  });

  // Admin API: search users for mentions (@autocomplete)
  fastify.get("/admin/users/search", async function (request, reply) {
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
    )
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
  fastify.post("/admin/message/api", async function (request, reply) {
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
    )
      return reply.code(403).send({ error: "forbidden" });
    const body = request.body as { id: string, targetUserIds: any[], targetRoles: any[], level: string, text: string, dismissible: string, startAt: string, endAt: string, global: string};
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
    let ann: any;
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
        await (prisma as any).announcementRoleTarget.createMany({
          data: targetRoles.map((r) => ({ announcementId: ann.id, role: r })),
        });
      }
    }
    return reply.send({ ok: true, message: { id: ann.id, ...payload } });
  });

  // Admin API: delete message (DB only)
  fastify.delete("/admin/message/api", async function (request, reply) {
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
    )
      return reply.code(403).send({ error: "forbidden" });
    const { id } = request.query as { id: string };
    if (!id) return reply.code(400).send({ error: "missing_id" });
    try {
      await (prisma as any).bannedSlug.delete({ where: { id: String(id) } });
      return reply.send({ ok: true });
    } catch (e) {
      return reply.code(404).send({ error: "not_found" });
    }
  });

  fastify.get("/admin/bans", async function (request, reply) {
    const userId = request.session.get("data");

    if (!userId)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/bans")}`
      );

    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true }
    });

    if (!userInfo)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/admin/bans")}`
      );

    if (!verifyRoleIsStaff(userInfo.role)) return reply.redirect("/dashboard");

    let publicPath
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });

      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}

    return replyView(reply, "dashboard/admin/bans.ejs", userInfo, { publicPath });
  });
  // NOTE: /api/bans endpoints are implemented in apiRoutes (mounted under /api)
}
