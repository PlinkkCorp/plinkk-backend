import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../lib/replyView";
import { requireAuthRedirect } from "../../middleware/auth";

export function dashboardVersionsRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const userId = request.userId!;
    const plinkks = await prisma.plinkk.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { versions: true }
        }
      }
    });

    return replyView(reply, "dashboard/user/versions.ejs", request.currentUser!, {
      publicPath: request.publicPath,
      plinkks,
    });
  });
}
