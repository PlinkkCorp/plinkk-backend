import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../lib/replyView";
import { requireAuthRedirect } from "../../middleware/auth";

export function dashboardThemesRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const userInfo = request.currentUser!;
    const userId = request.userId!;

    const myThemes = await prisma.theme.findMany({
      where: { authorId: userId },
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

    return replyView(reply, "dashboard/user/themes.ejs", userInfo, {
      myThemes,
      selectedCustomThemeId: userInfo.selectedCustomThemeId || null,
      publicPath: request.publicPath,
    });
  });
}
