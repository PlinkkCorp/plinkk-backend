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
    });
    if (!userInfo) return reply.redirect("/login");
    return reply.view("dashboard/stats.ejs", { user: userInfo });
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
    // Dérive les préférences depuis cosmetics json (pour éviter une migration)
    const cosmetics = (userInfo.cosmetics as any) || {};
    const privacy = cosmetics.settings || {};
    const isEmailPublic = Boolean(privacy.isEmailPublic);
    return reply.view("dashboard/account.ejs", {
      user: userInfo,
      isEmailPublic,
    });
  });

  // Dashboard: Admin (gestion user)
  fastify.get("/admin", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.redirect("/login");

    const userInfo = await prisma.user.findFirst({
      where: { id: userId },
      omit: { password: true },
    });
    if (!userInfo) return reply.redirect("/login");
    // if (userInfo.role !== Role.ADMIN) return reply.redirect("/login");
    const users = await prisma.user.findMany({
        where: { isPublic: true },
        select: {
          id: true,
          userName: true,
          email: true,
          role: true,
          cosmetics: true,
          profileImage: true,
        },
        orderBy: { createdAt: "asc" },
      });
    return reply.view("dashboard/admin.ejs", {
      users: users,
      user: userInfo,
    });
  });
}
