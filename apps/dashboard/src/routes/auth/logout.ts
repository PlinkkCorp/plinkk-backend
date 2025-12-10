import { FastifyInstance } from "fastify";
import { deleteUserSession } from "../../services/sessionService";

export function logoutRoutes(fastify: FastifyInstance) {
  fastify.get("/logout", async (request, reply) => {
    const sessionId = request.session.get("sessionId") as string | undefined;
    
    await deleteUserSession(sessionId);
    request.session.delete();

    return reply.redirect("/login");
  });
}
