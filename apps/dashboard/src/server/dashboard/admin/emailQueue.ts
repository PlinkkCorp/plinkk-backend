import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { emailQueueService } from "../../../services/emailQueueService";
import { logAdminAction } from "../../../lib/adminLogger";

/**
 * Routes pour gérer la file d'attente des emails
 */
export function adminEmailQueueRoutes(fastify: FastifyInstance) {
  /**
  * GET /admin/emails/queue
  * Redirection vers la page emails principale
   */
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    return reply.redirect("/admin/emails");
  });

  /**
   * POST /admin/emails/queue/cancel/:id
   * Annuler un email en attente
   */
  fastify.post("/cancel/:id", async (request: FastifyRequest<{
    Params: { id: string };
  }>, reply: FastifyReply) => {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    try {
      const { id } = request.params;
      const cancelled = await emailQueueService.cancel(id);

      if (!cancelled) {
        return reply.code(404).send({ error: "Email non trouvé ou déjà traité" });
      }

      await logAdminAction(
        String(userId),
        "email_queue_cancel",
        "EmailQueue",
        `Email ${id} annulé`,
        (request as any).ip
      );

      return reply.send({ success: true, message: "Email annulé" });
    } catch (error) {
      console.error("Failed to cancel email:", error);
      return reply.code(500).send({ error: "internal_server_error" });
    }
  });

  /**
   * POST /admin/emails/queue/process
   * Traiter la queue manuellement
   */
  fastify.post("/process", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    try {
      const result = await emailQueueService.processQueue();

      await logAdminAction(
        String(userId),
        "email_queue_process",
        "EmailQueue",
        `Traitement manuel: ${result.sent} envoyés, ${result.failed} échoués`,
        (request as any).ip
      );

      return reply.send({
        success: true,
        ...result,
        message: `${result.sent} emails envoyés, ${result.failed} échoués, ${result.remaining} restants`,
      });
    } catch (error) {
      console.error("Failed to process email queue:", error);
      return reply.code(500).send({ error: "internal_server_error" });
    }
  });

  /**
   * GET /admin/emails/queue/stats
   * Obtenir les statistiques de la queue
   */
  fastify.get("/stats", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.session.get("data");
    if (!userId) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    try {
      const stats = await emailQueueService.getStats();
      return reply.send(stats);
    } catch (error) {
      console.error("Failed to get email queue stats:", error);
      return reply.code(500).send({ error: "internal_server_error" });
    }
  });
}
