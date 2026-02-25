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

import { dashboardRedirectsRoutes } from "./dashboard/redirects";
import { dashboardLeadsRoutes } from "./dashboard/leads";
import { dashboardPartnershipRoutes } from "./dashboard/partnership";
import { getPublicPath } from "../services/plinkkService";

export function dashboardRoutes(fastify: FastifyInstance) {
  fastify.register(dashboardAdminRoutes, { prefix: "/admin" });
  fastify.register(dashboardUserSessionsRoutes, { prefix: "/sessions" });
  fastify.register(dashboardStatsRoutes, { prefix: "/stats" });
  fastify.register(dashboardCosmeticsRoutes, { prefix: "/cosmetics" });
  fastify.register(dashboardEditRoutes, { prefix: "/edit" });
  fastify.register(dashboardAccountRoutes, { prefix: "/account" });
  fastify.register(dashboardThemesRoutes, { prefix: "/themes" });

  fastify.register(dashboardRedirectsRoutes, { prefix: "/redirects" });
  fastify.register(dashboardLeadsRoutes, { prefix: "/leads" });
  fastify.register(dashboardPartnershipRoutes, { prefix: "/partnership" });

  fastify.get("/premium", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const userInfo = request.currentUser!;
    return replyView(reply, "dashboard/premium.ejs", userInfo, { mode: 'preview' });
  });

  fastify.get("/premium/configure", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    // Page de configuration de l'abonnement
    const userInfo = request.currentUser!;
    return replyView(reply, "dashboard/premium.ejs", userInfo, { mode: 'configure' });
  });

  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const userInfo = request.currentUser!;
    const userId = request.userId!;

    const plinkks = await prisma.plinkk.findMany({
      where: { userId },
      select: { id: true, name: true, slug: true, isDefault: true, views: true },
      orderBy: [{ isDefault: "desc" }, { index: "asc" }],
    });

    return replyView(reply, "dashboard.ejs", userInfo, {
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
