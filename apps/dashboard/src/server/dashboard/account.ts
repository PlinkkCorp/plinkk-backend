import { FastifyInstance } from "fastify";
import { prisma, User } from "@plinkk/prisma";
import { replyView } from "../../lib/replyView";
import { requireAuthRedirect } from "../../middleware/auth";
import { logUserAction } from "../../lib/userLogger";

export function dashboardAccountRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const userInfo = await prisma.user.findFirst({
      where: { id: request.userId },
      include: { cosmetics: true, role: true },
    });

    if (!userInfo) {
      return reply.redirect(`/login?returnTo=${encodeURIComponent("/account")}`);
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
        views: true,
      },
      orderBy: [{ isDefault: "desc" }, { index: "asc" }, { createdAt: "asc" }],
    });

    const connections = await prisma.connection.findMany({
      where: { userId: userInfo.id },
      select: { provider: true, createdAt: true, name: true, email: true },
    });

    // Stats calculations
    const rank = await prisma.user.count({
      where: { createdAt: { lt: userInfo.createdAt } }
    }) + 1;

    const sessionCount = await prisma.session.count({
      where: { userId: userInfo.id }
    });

    const totalViews = pages.reduce((acc, p) => acc + (p.views || 0), 0);

    const [linkClicksAgg, redirectClicksAgg] = await Promise.all([
      prisma.link.aggregate({
        where: { userId: userInfo.id },
        _sum: { clicks: true }
      }),
      prisma.redirect.aggregate({
        where: { userId: userInfo.id },
        _sum: { clicks: true }
      })
    ]);

    const totalLinkClicks = linkClicksAgg._sum.clicks || 0;
    const totalRedirectClicks = redirectClicksAgg._sum.clicks || 0;
    
    const stats = {
      rank,
      sessionCount,
      totalViews,
      totalLinkClicks,
      totalRedirectClicks,
      ctr: totalViews > 0 ? ((totalLinkClicks / totalViews) * 100).toFixed(2) : "0.00"
    };

    const googleClientId = process.env.GOOGLE_OAUTH2_ID || process.env.ID_CLIENT;
    console.log("Serving Account Page with Client ID:", googleClientId);
    return replyView(reply, "dashboard/user/account.ejs", userInfo, {
      isEmailPublic,
      publicPath: request.publicPath,
      pages,
      plinkks: pages,
      connections,
      googleClientId,
      stats,
    });
  });

  fastify.post("/connections/unlink", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const { provider } = request.body as { provider: string };
    const userId = request.userId!;

    const connection = await prisma.connection.findFirst({
      where: { userId, provider },
    });

    if (!connection) {
      return reply.code(400).send({ success: false, error: "Connexion introuvable" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.code(404).send({ success: false, error: "Utilisateur introuvable" });

    // If this is an identity connection (allows login), ensure user has another way to login.
    if (connection.isIdentity) {
         const identityConnectionsCount = await prisma.connection.count({
            where: { userId, isIdentity: true }
         });
         
         // If this is the last identity provider...
         if (identityConnectionsCount <= 1) {
             // ...and the user has no password
             if (!user.hasPassword) {
                 return reply.code(400).send({ 
                     success: false, 
                     error: "LAST_IDENTITY_NO_PASSWORD",
                     message: "Vous ne pouvez pas supprimer la dernière méthode de connexion sans définir un mot de passe." 
                 });
             }
         }
    }

    await prisma.connection.delete({
      where: { id: connection.id },
    });

    await logUserAction(userId, "UNLINK_ACCOUNT", connection.id, { provider }, request.ip);

    return reply.send({ success: true });
  });
}
