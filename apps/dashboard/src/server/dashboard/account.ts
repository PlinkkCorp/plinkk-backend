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

    return replyView(reply, "dashboard/user/account.ejs", userInfo, {
      isEmailPublic,
      publicPath: request.publicPath,
      pages,
      plinkks: pages,
    });
  });
}
