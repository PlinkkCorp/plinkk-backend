import { FastifyInstance } from "fastify";
import { PrismaClient, User } from "@plinkk/prisma/generated/prisma/client";
import { replyView } from "../lib/replyView";
import { verifyRoleAdmin, verifyRoleDeveloper } from "../lib/verifyRole";
import { dashboardAdminRoutes } from "./dashboard/admin";

const prisma = new PrismaClient();

export function dashboardRoutes(fastify: FastifyInstance) {
  fastify.register(dashboardAdminRoutes, { prefix: "/admin" });

  fastify.get("/", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(`/login?returnTo=${encodeURIComponent("/")}`);
    }

    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true },
    });
    if (!userInfo) {
      return reply.redirect(`/login?returnTo=${encodeURIComponent("/")}`);
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
        prisma.plinkk.findMany({
          where: { userId: userId as string },
          select: { id: true, name: true, slug: true, isDefault: true },
          orderBy: [{ isDefault: "desc" }, { index: "asc" }],
        }),
      ]);

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
      publicPath,
    });
  });

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
        `/login?returnTo=${encodeURIComponent("/cosmetics")}`
      );
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { cosmetics: true, role: true },
    });
    if (!userInfo) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/cosmetics")}`
      );
    }
    const cosmetics = userInfo.cosmetics;
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
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return await replyView(reply, "dashboard/user/cosmetics.ejs", userInfo, {
      cosmetics,
      catalog,
      publicPath,
    });
  });

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
      return reply.redirect(`/login?returnTo=${encodeURIComponent("/edit")}`);
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true },
    });
    if (!userInfo) {
      return reply.redirect(`/login?returnTo=${encodeURIComponent("/edit")}`);
    }
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
    let publicPath;
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
    return replyView(reply, "dashboard/user/edit.ejs", userInfo, {
      plinkk: selectedForView,
      pages: pagesForView,
      autoOpenPlinkkModal,
      publicPath,
    });
  });

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
      return reply.redirect(`/login?returnTo=${encodeURIComponent("/stats")}`);
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: {
        links: true,
        role: true,
      },
    });
    if (!userInfo) {
      return reply.redirect(`/login?returnTo=${encodeURIComponent("/stats")}`);
    }
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
    let preSeries: { date: Date; count: number }[] = [];
    let totalViews = 0;
    let totalClicks = 0;
    try {
      if (selected) {
        const rows = await prisma.plinkkViewDaily.findMany({
          where: {
            plinkkId: selected.id,
            date: {
              gte: start,
              lte: end,
            },
          },
          select: {
            date: true,
            count: true,
          },
          orderBy: { date: "asc" },
        });
        const byDate = new Map(rows.map((r) => [r.date, Number(r.count)]));
        for (
          let t = new Date(start.getTime());
          t <= end;
          t = new Date(t.getTime() + 86400000)
        ) {
          const key = t;
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
    let publicPath;
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
    return replyView(reply, "dashboard/user/stats.ejs", userInfo, {
      plinkk: selectedForView,
      pages: pagesForView,
      autoOpenPlinkkModal,
      viewsDaily30d: preSeries,
      totalViews,
      totalClicks,
      links,
      publicPath,
    });
  });

  fastify.get("/stats/views", async function (request, reply) {
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
      const linkIds = (
        await prisma.link.findMany({
          where: { userId: String(userId) },
          select: { id: true },
        })
      ).map((x) => x.id);
      if (linkIds.length === 0)
        return reply.send({ from: s, to: e, series: [] });
      const placeholders = linkIds.map(() => "?").join(",");
      const rows = (
        await prisma.linkClickDaily.groupBy({
          by: ["date"],
          where: {
            linkId: {
              in: linkIds,
            },
            date: { gte: start, lte: end },
          },
          _sum: {
            count: true,
          },
          orderBy: { date: "asc" },
        })
      ).map((r) => ({
        date: r.date,
        count: r._sum.count ?? 0,
      }));

      const byDate = new Map(rows.map((r) => [r.date, Number(r.count)]));
      const series: { date: Date; count: number }[] = [];
      for (
        let t = new Date(start.getTime());
        t <= end;
        t = new Date(t.getTime() + 86400000)
      ) {
        series.push({ date: t, count: byDate.get(t) || 0 });
      }
      return reply.send({ from: s, to: e, series });
    } catch (e) {
      request.log?.error({ err: e }, "Failed to query daily clicks");
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  fastify.get("/versions", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      const dest = `/login?returnTo=${encodeURIComponent("/versions")}`;
      request.log?.info(
        { returnTo: request.raw.url },
        "redirecting to login with returnTo"
      );
      return reply.redirect(dest);
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true },
    });
    if (!userInfo) {
      const dest = `/login?returnTo=${encodeURIComponent("/versions")}`;
      request.log?.info(
        { returnTo: request.raw.url },
        "redirecting to login with returnTo"
      );
      return reply.redirect(dest);
    }
    let publicPath;
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return replyView(reply, "dashboard/user/versions.ejs", userInfo, {
      publicPath,
    });
  });

  fastify.get("/settings", async function (request, reply) {
    return reply.redirect("/account");
  });

  fastify.get("/appearance", async function (request, reply) {
    return reply.redirect("/cosmetics");
  });

  fastify.get("/account", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/account")}`
      );
    }
    let userInfo: User = null;
    try {
      userInfo = await prisma.user.findFirst({
        where: { id: userId },
        include: { cosmetics: true, role: true },
      });
    } catch (e) {
      request.log?.warn(
        { err: e },
        "Failed to include host when fetching userInfo; retrying without host (fallback)"
      );
      userInfo = await prisma.user.findFirst({
        where: { id: userId },
        include: { cosmetics: true, role: true },
      });
    }
    if (!userInfo) {
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/account")}`
      );
    }
    const isEmailPublic = Boolean(userInfo.publicEmail);
    const pages = await prisma.plinkk.findMany({
      where: { userId: userInfo.id },
      select: {
        id: true,
        name: true,
        slug: true,
        isDefault: true,
        index: true,
        createdAt: true,
      },
      orderBy: [{ isDefault: "desc" }, { index: "asc" }, { createdAt: "asc" }],
    });
    let publicPath;
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return replyView(reply, "dashboard/user/account.ejs", userInfo, {
      isEmailPublic,
      publicPath,
      pages,
      plinkks: pages,
    });
  });

  fastify.get("/themes", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.redirect(`/login?returnTo=${encodeURIComponent("/themes")}`);
    }
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { role: true },
    });
    if (!userInfo) {
      return reply.redirect(`/login?returnTo=${encodeURIComponent("/themes")}`);
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
    let publicPath;
    try {
      const defaultPlinkk = await prisma.plinkk.findFirst({
        where: { userId: userInfo.id, isDefault: true },
      });
      publicPath =
        defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : userInfo.id;
    } catch (e) {}
    return replyView(reply, "dashboard/user/themes.ejs", userInfo, {
      myThemes,
      selectedCustomThemeId: userInfo.selectedCustomThemeId || null,
      publicPath,
    });
  });
}
