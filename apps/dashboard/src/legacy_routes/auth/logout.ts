import { FastifyInstance } from "fastify";
import { deleteUserSession } from "../../services/sessionService";
import { logUserAction } from "../../lib/userLogger";

export function logoutRoutes(fastify: FastifyInstance) {
  fastify.get("/logout", async (request, reply) => {
    const sessionId = request.session.get("sessionId") as string | undefined;
    const userId = request.session.get("data");

    if (userId && typeof userId === "string") {
       await logUserAction(userId, "LOGOUT", undefined, undefined, request.ip);
    }
    
    await deleteUserSession(sessionId);
    request.session.delete();

    return reply.redirect("/login");
  });
}
