import { FastifyInstance } from "fastify";
import { UnauthorizedError } from "@plinkk/shared";
import { getUserInboxItems, InboxItemType } from "../../../services/inboxService";

export function apiMeInboxRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (request, reply) => {
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!userId) throw new UnauthorizedError();

    const query = request.query as { page?: string; limit?: string; type?: string };

    const type =
      query.type === "admin" || query.type === "bug-response" || query.type === "patch-note"
        ? (query.type as InboxItemType)
        : "all";

    const result = await getUserInboxItems(userId, {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 30,
      type,
    });

    return reply.send(result);
  });
}
