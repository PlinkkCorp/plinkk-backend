import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { recordRedirectClick } from "@plinkk/shared";

export function redirectRoutes(fastify: FastifyInstance) {
  /**
   * GET /r/:slug
   * Redirection publique via slug personnalisé (ex: plinkk.fr/r/github)
   */
  fastify.get("/r/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    
    if (!slug) {
      return reply.code(400).send({ error: "missing_slug" });
    }
    
    const redirect = await prisma.redirect.findUnique({
      where: { slug: slug.toLowerCase() },
    });
    
    if (!redirect) {
      return reply.code(404).send({ error: "not_found" });
    }

    if (!redirect.isActive) {
       return reply.code(410).send({ error: "inactive" });
    }
    
    if (redirect.expiresAt && redirect.expiresAt < new Date()) {
       return reply.code(410).send({ error: "expired" });
    }
    
    recordRedirectClick(redirect.id, request).catch(err => {
        request.log.error(err);
    });
    
    return reply.redirect(redirect.targetUrl);
  });
}
