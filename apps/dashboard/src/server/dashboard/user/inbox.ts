import { FastifyInstance } from "fastify";
import { replyView } from "../../../lib/replyView";
import { requireAuthRedirect } from "../../../middleware/auth";
import { getUserInboxItems } from "../../../services/inboxService";

export default async function dashboardUserInboxRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async (request, reply) => {
    const userInfo = request.currentUser!;
    const userId = request.userId!;

    const feed = await getUserInboxItems(userId, { page: 1, limit: 60, type: "all" });

    return replyView(reply, "dashboard/user/inbox.ejs", userInfo, {
      active: "inbox",
      inboxItems: feed.items,
      inboxPagination: feed.pagination,
      publicPath: request.publicPath,
    });
  });
}
