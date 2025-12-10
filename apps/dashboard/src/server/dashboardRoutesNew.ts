import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../lib/replyView";
import { requireAuthRedirect, requireAuth } from "../middleware/auth";
import { dashboardAdminRoutes } from "./dashboard/admin/index";
import dashboardUserSessionsRoutes from "./dashboard/user/sessions";
import { dashboardStatsRoutes } from "./dashboard/stats";
import { dashboardCosmeticsRoutes } from "./dashboard/cosmetics";
import { dashboardEditRoutes } from "./dashboard/edit";
import { dashboardAccountRoutes } from "./dashboard/account";
import { dashboardThemesRoutes } from "./dashboard/themes";
import { dashboardVersionsRoutes } from "./dashboard/versions";
import { getPublicPath } from "../services/plinkkService";

export function dashboardRoutes(fastify: FastifyInstance) {
  fastify.register(dashboardAdminRoutes, { prefix: "/admin" });
  fastify.register(dashboardUserSessionsRoutes, { prefix: "/sessions" });
  fastify.register(dashboardStatsRoutes, { prefix: "/stats" });
  fastify.register(dashboardCosmeticsRoutes, { prefix: "/cosmetics" });
  fastify.register(dashboardEditRoutes, { prefix: "/edit" });
  fastify.register(dashboardAccountRoutes, { prefix: "/account" });
  fastify.register(dashboardThemesRoutes, { prefix: "/themes" });
  fastify.register(dashboardVersionsRoutes, { prefix: "/versions" });

  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const userInfo = request.currentUser!;
    const userId = request.userId!;

    const [linksCount, socialsCount, labelsCount, recentLinks, plinkks] = await Promise.all([
      prisma.link.count({ where: { userId } }),
      prisma.socialIcon.count({ where: { userId } }),
      prisma.label.count({ where: { userId } }),
      prisma.link.findMany({
        where: { userId },
        orderBy: { id: "desc" },
        take: 10,
      }),
      prisma.plinkk.findMany({
        where: { userId },
        select: { id: true, name: true, slug: true, isDefault: true },
        orderBy: [{ isDefault: "desc" }, { index: "asc" }],
      }),
    ]);

    return replyView(reply, "dashboard.ejs", userInfo, {
      stats: { links: linksCount, socials: socialsCount, labels: labelsCount },
      links: recentLinks,
      plinkks,
      publicPath: request.publicPath,
    });
  });

  fastify.get("/settings", async function (request, reply) {
    return reply.redirect("/account");
  });

  fastify.get("/appearance", async function (request, reply) {
    return reply.redirect("/cosmetics");
  });
}
