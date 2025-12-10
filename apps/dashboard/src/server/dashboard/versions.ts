import { FastifyInstance } from "fastify";
import { replyView } from "../../lib/replyView";
import { requireAuthRedirect } from "../../middleware/auth";

export function dashboardVersionsRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    return replyView(reply, "dashboard/user/versions.ejs", request.currentUser!, {
      publicPath: request.publicPath,
    });
  });
}
