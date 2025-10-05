import { FastifyInstance } from "fastify";
import { PrismaClient, Role } from "../../generated/prisma/client";

const prisma = new PrismaClient();

export function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get("/", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.redirect("/login");

    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      omit: { password: true },
    });
    if (!userInfo) return reply.redirect("/login");

    const [linksCount, socialsCount, labelsCount, recentLinks] =
      await Promise.all([
        prisma.link.count({ where: { userId: userId as string } }),
        prisma.socialIcon.count({ where: { userId: userId as string } }),
        prisma.label.count({ where: { userId: userId as string } }),
        prisma.link.findMany({
          where: { userId: userId as string },
          orderBy: { id: "desc" },
          take: 10,
        }),
      ]);

    return reply.view("dashboard.ejs", {
      user: userInfo,
      stats: { links: linksCount, socials: socialsCount, labels: labelsCount },
      links: recentLinks,
    });
  });

  // Dashboard: Cosmétiques (aperçu et sélection)
  fastify.get("/cosmetics", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.redirect("/login");
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { cosmetics: true },
      omit: { password: true },
    });
    if (!userInfo) return reply.redirect("/login");
    const cosmetics = (userInfo.cosmetics as any) || {};
    // Petit catalogue par défaut (certaines entrées "verrouillées" selon le rôle)
    const catalog = {
      flairs: [
        { key: "OG", label: "OG", locked: false },
        { key: "PARTNER", label: "PARTNER", locked: false },
        {
          key: "ADMIN",
          label: "ADMIN",
          locked: !(
            userInfo.role === Role.ADMIN || userInfo.role === Role.DEVELOPER
          ),
        },
        {
          key: "DEVELOPER",
          label: "DEVELOPER",
          locked: !(
            userInfo.role === Role.ADMIN || userInfo.role === Role.DEVELOPER
          ),
        },
        {
          key: "FOUNDER",
          label: "FOUNDER",
          locked: !(
            userInfo.role === Role.ADMIN || userInfo.role === Role.DEVELOPER
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
    return reply.view("dashboard/cosmetics.ejs", {
      user: userInfo,
      cosmetics,
      catalog,
    });
  });

  // Page d'édition du profil (éditeur complet)
  fastify.get("/edit", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.redirect("/login");
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      omit: { password: true },
    });
    if (!userInfo) return reply.redirect("/login");
    return reply.view("dashboard/edit.ejs", { user: userInfo });
  });

  // Dashboard: Statistiques (vue dédiée)
  fastify.get("/stats", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.redirect("/login");
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      omit: { password: true },
      include: {
        links: true
      }
    });
    if (!userInfo) return reply.redirect("/login");
    // Précharger la série par jour pour 30 derniers jours en fallback (si fetch échoue côté client)
    const now = new Date();
    const end = now;
    const start = new Date(end.getTime() - 29 * 86400000);
    const fmt = (dt: Date) => {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dt.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    const s = fmt(start);
    const e = fmt(end);
    let preSeries: { date: string; count: number }[] = [];
    try {
      await prisma.$executeRawUnsafe(
        'CREATE TABLE IF NOT EXISTS "UserViewDaily" ("userId" TEXT NOT NULL, "date" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("userId","date"))'
      );
      const rows = (await prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT "date", "count" FROM "UserViewDaily" WHERE "userId" = ${String(userId)} AND "date" BETWEEN ${s} AND ${e} ORDER BY "date" ASC
      `);
      const byDate = new Map(rows.map((r) => [r.date, r.count]));
      for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + 86400000)) {
        const key = fmt(t);
        preSeries.push({ date: key, count: byDate.get(key) || 0 });
      }
    } catch (e) {
      request.log?.warn({ err: e }, 'Failed to preload daily series');
    }
    return reply.view("dashboard/stats.ejs", { user: userInfo, links: userInfo.links, viewsDaily30d: preSeries });
  });

  // API: Vues journalières (pour graphiques)
  fastify.get("/stats/views", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const { from, to } = request.query as { from?: string; to?: string };
    // bornes par défaut: 30 derniers jours (UTC)
    const now = new Date();
    const end = to ? new Date(to) : now;
    const start = from ? new Date(from) : new Date(end.getTime() - 29 * 86400000);
    const fmt = (dt: Date) => {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dt.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    const s = fmt(start);
    const e = fmt(end);
    try {
      // Assurer l'existence de la table
      await prisma.$executeRawUnsafe(
        'CREATE TABLE IF NOT EXISTS "UserViewDaily" ("userId" TEXT NOT NULL, "date" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("userId","date"))'
      );
      const rows = (await prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT "date", "count"
        FROM "UserViewDaily"
        WHERE "userId" = ${String(userId)} AND "date" BETWEEN ${s} AND ${e}
        ORDER BY "date" ASC
      `);

      // Remplir les jours manquants à 0
      const byDate = new Map(rows.map((r) => [r.date, r.count]));
      const series: { date: string; count: number }[] = [];
      for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + 86400000)) {
        const key = fmt(t);
        series.push({ date: key, count: byDate.get(key) || 0 });
      }
      return reply.send({ from: s, to: e, series });
    } catch (e) {
      request.log?.error({ err: e }, 'Failed to query daily views');
      return reply.code(500).send({ error: 'internal_error' });
    }
  });

  // API: Clics journaliers (somme de tous les liens de l'utilisateur)
  fastify.get("/stats/clicks", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const { from, to } = request.query as { from?: string; to?: string };
    const now = new Date();
    const end = to ? new Date(to) : now;
    const start = from ? new Date(from) : new Date(end.getTime() - 29 * 86400000);
    const fmt = (dt: Date) => {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dt.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    const s = fmt(start);
    const e = fmt(end);
    try {
      await prisma.$executeRawUnsafe(
        'CREATE TABLE IF NOT EXISTS "LinkClickDaily" ("linkId" TEXT NOT NULL, "date" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("linkId","date"))'
      );
      // agréger par jour pour tous les liens de l'utilisateur (via sous-sélection des linkId)
      const linkIds = (await prisma.link.findMany({ where: { userId: String(userId) }, select: { id: true } })).map(x => x.id);
      if (linkIds.length === 0) return reply.send({ from: s, to: e, series: [] });
      // Construire la liste pour clause IN
      const placeholders = linkIds.map(() => '?').join(',');
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT "date", SUM("count") as count FROM "LinkClickDaily" WHERE "linkId" IN (${placeholders}) AND "date" BETWEEN ? AND ? GROUP BY "date" ORDER BY "date" ASC`,
        ...linkIds, s, e
      )) as Array<{ date: string; count: number }>;
      const byDate = new Map(rows.map((r) => [r.date, Number(r.count)]));
      const series: { date: string; count: number }[] = [];
      for (let t = new Date(start.getTime()); t <= end; t = new Date(t.getTime() + 86400000)) {
        const key = fmt(t);
        series.push({ date: key, count: byDate.get(key) || 0 });
      }
      return reply.send({ from: s, to: e, series });
    } catch (e) {
      request.log?.error({ err: e }, 'Failed to query daily clicks');
      return reply.code(500).send({ error: 'internal_error' });
    }
  });

  // Dashboard: Versions (vue dédiée)
  fastify.get("/versions", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.redirect("/login");
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      omit: { password: true },
    });
    if (!userInfo) return reply.redirect("/login");
    return reply.view("dashboard/versions.ejs", { user: userInfo });
  });

  // Dashboard: Compte (gestion infos, confidentialité, cosmétiques)
  fastify.get("/account", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.redirect("/login");
    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      include: { cosmetics: true },
      omit: { password: true },
    });
    if (!userInfo) return reply.redirect("/login");
    // Dérive la visibilité d'email depuis le champ `publicEmail` (présent
    // dans le schéma Prisma). Si publicEmail est défini -> l'email est public.
    const isEmailPublic = Boolean((userInfo as any).publicEmail);
    return reply.view("dashboard/account.ejs", {
      user: userInfo,
      isEmailPublic,
    });
  });

  // Dashboard: Admin (gestion avancée)
  fastify.get("/admin", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.redirect("/login");

    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      omit: { password: true },
    });
    if (!userInfo) return reply.redirect("/login");
    if (!(userInfo.role === Role.ADMIN || userInfo.role === Role.DEVELOPER || userInfo.role === Role.MODERATOR)) {
      return reply.code(403).view("erreurs/500.ejs", { message: "Accès refusé", currentUser: userInfo });
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
        },
        orderBy: { createdAt: "desc" },
      }),
      (async () => {
        const totalUsers = await prisma.user.count();
        const totalPublic = await prisma.user.count({ where: { isPublic: true } });
        const totalPrivate = totalUsers - totalPublic;
        const moderators = await prisma.user.count({ where: { role: { in: ["ADMIN", "DEVELOPER", "MODERATOR"] as any } as any } });
        return { totalUsers, totalPublic, totalPrivate, moderators };
      })(),
    ]);

    return reply.view("dashboard/admin.ejs", {
      users,
      totals,
      user: userInfo,
    });
  });

  // Dashboard: Mes thèmes (création / soumission)
  fastify.get("/themes", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.redirect("/login");
    const userInfo = await prisma.user.findFirst({ where: { id: userId }, omit: { password: true } });
    if (!userInfo) return reply.redirect("/login");
    const myThemes = await prisma.theme.findMany({
      where: { authorId: userId as string }, orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, description: true, status: true, updatedAt: true, data: true }
    });
    return reply.view("dashboard/themes.ejs", { user: userInfo, myThemes });
  });

  // Admin: Liste des thèmes soumis
  fastify.get("/admin/themes", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.redirect("/login");
    const userInfo = await prisma.user.findFirst({ where: { id: userId }, omit: { password: true } });
    if (!userInfo) return reply.redirect("/login");
    if (!(userInfo.role === Role.ADMIN || userInfo.role === Role.DEVELOPER || userInfo.role === Role.MODERATOR)) {
      return reply.code(403).view("erreurs/500.ejs", { message: "Accès refusé", currentUser: userInfo });
    }
    const submitted = await prisma.theme.findMany({
      where: { status: "SUBMITTED" as any },
      select: { id: true, name: true, description: true, author: { select: { id: true, userName: true } }, updatedAt: true },
      orderBy: { updatedAt: "desc" }
    });
    return reply.view("dashboard/admin-themes.ejs", { user: userInfo, themes: submitted });
  });

  // Admin: Prévisualisation d'un thème
  fastify.get("/admin/themes/:id", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.redirect("/login");
    const userInfo = await prisma.user.findFirst({ where: { id: userId }, omit: { password: true } });
    if (!userInfo) return reply.redirect("/login");
    if (!(userInfo.role === Role.ADMIN || userInfo.role === Role.DEVELOPER || userInfo.role === Role.MODERATOR)) {
      return reply.code(403).view("erreurs/500.ejs", { message: "Accès refusé", currentUser: userInfo });
    }
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({ where: { id }, select: { id: true, name: true, description: true, data: true, author: { select: { id: true, userName: true } }, status: true } });
    if (!t) return reply.code(404).view("erreurs/404.ejs", { currentUser: userInfo });
    return reply.view("dashboard/admin-theme-preview.ejs", { user: userInfo, theme: t });
  });
}
