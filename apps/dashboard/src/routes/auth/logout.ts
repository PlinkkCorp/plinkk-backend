/**
 * Routes de déconnexion
 * GET  /logout → déconnexion
 */

import { FastifyInstance } from "fastify";
import { deleteUserSession } from "../../services/sessionService";
import { logUserAction } from "../../lib/userLogger";

/**
 * Enregistre les routes de déconnexion
 * @param fastify - L'instance fastify
 */
export function logoutRoutes(fastify: FastifyInstance) {
  /**
   * Gère la déconnexion de l'utilisateur
   * @param request - La requête
   * @param reply - La réponse
   */
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
