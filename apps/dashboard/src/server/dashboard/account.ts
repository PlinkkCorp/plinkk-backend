import { FastifyInstance } from "fastify";
import { prisma, User } from "@plinkk/prisma";
import { replyView } from "../../lib/replyView";
import { requireAuthRedirect } from "../../middleware/auth";

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
      },
      orderBy: [{ isDefault: "desc" }, { index: "asc" }, { createdAt: "asc" }],
    });

    const connections = await prisma.connection.findMany({
      where: { userId: userInfo.id },
      select: { provider: true, createdAt: true, name: true, email: true },
    });

    console.log("Serving Account Page with Client ID:", process.env.ID_CLIENT);
    return replyView(reply, "dashboard/user/account.ejs", userInfo, {
      isEmailPublic,
      publicPath: request.publicPath,
      pages,
      plinkks: pages,
      connections,
      googleClientId: process.env.ID_CLIENT,
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

    return reply.send({ success: true });
  });
}
