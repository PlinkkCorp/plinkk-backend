import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../lib/replyView";
import { requireAuthRedirect } from "../middleware/auth";
import { dashboardAdminRoutes } from "./dashboard/admin/index";
import dashboardUserSessionsRoutes from "./dashboard/user/sessions";
import dashboardUserInboxRoutes from "./dashboard/user/inbox";
import { dashboardStatsRoutes } from "./dashboard/stats";
import { dashboardCosmeticsRoutes } from "./dashboard/cosmetics";
import { dashboardAccountRoutes } from "./dashboard/account";
import { dashboardThemesRoutes } from "./dashboard/themes";

import { dashboardRedirectsRoutes } from "./dashboard/redirects";
import { dashboardLeadsRoutes } from "./dashboard/leads";
import { dashboardPartnershipRoutes } from "./dashboard/partnership";
import { dashboardQrCodesRoutes } from "./dashboard/qrcodes";

export function dashboardRoutes(fastify: FastifyInstance) {
  fastify.register(dashboardAdminRoutes, { prefix: "/admin" });
  fastify.register(dashboardUserSessionsRoutes, { prefix: "/sessions" });
  fastify.register(dashboardUserInboxRoutes, { prefix: "/inbox" });
  fastify.register(dashboardStatsRoutes, { prefix: "/stats" });
  fastify.register(dashboardCosmeticsRoutes, { prefix: "/cosmetics" });
  fastify.register(dashboardAccountRoutes, { prefix: "/account" });
  fastify.register(dashboardThemesRoutes, { prefix: "/themes" });

  fastify.register(dashboardRedirectsRoutes, { prefix: "/redirects" });
  fastify.register(dashboardLeadsRoutes, { prefix: "/leads" });
  fastify.register(dashboardPartnershipRoutes, { prefix: "/partnership" });
  fastify.register(dashboardQrCodesRoutes, { prefix: "/qrcodes" });

  fastify.get("/qrcode/edit", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const userInfo = request.currentUser!;
    const userId = request.userId!;
    const query = request.query as { plinkkId?: string; qrId?: string };
    const plinkkId = query.plinkkId ? String(query.plinkkId) : "";
    const qrId = query.qrId ? String(query.qrId) : "";

    if (!plinkkId) {
      return reply.redirect("/qrcodes");
    }

    const plinkk = await prisma.plinkk.findFirst({
      where: { id: plinkkId, userId },
      select: { id: true, name: true, slug: true },
    });

    if (!plinkk) {
      return reply.code(404).view("erreurs/404.ejs", { user: { id: userId } });
    }

    if (qrId) {
      const qrCode = await prisma.qrCode.findFirst({
        where: {
          id: qrId,
          plinkkId,
          userId,
        },
        select: { id: true },
      });

      if (!qrCode) {
        return reply.code(404).view("erreurs/404.ejs", { user: { id: userId } });
      }
    }

    return replyView(reply, "dashboard/user/qrcode-edit.ejs", userInfo, {
      plinkk,
      publicPath: request.publicPath,
    });
  });


  fastify.get(
    "/partners",
    { preHandler: [requireAuthRedirect] },
    async function (request, reply) {
      const userInfo = request.currentUser!;
      const userId = request.userId!;
      const partners = await prisma.partner.findMany({
        include: { quests: true, _count: { select: { quests: true } } },
        orderBy: { order: 'asc' }
      });

      const completed = await prisma.userQuest.findMany({
        where: { userId },
        select: { partnerQuestId: true }
      });
      const userQuests = completed.map(uq => uq.partnerQuestId);

      return replyView(reply, "dashboard/user/partners.ejs", userInfo, { partners, userQuests });
    }
  );

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

    const defaultPlinkk = plinkks.find((p) => p.isDefault) ?? plinkks[0] ?? null;

    return replyView(reply, "dashboard.ejs", userInfo, {
      plinkks,
      plinkk: defaultPlinkk,
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
