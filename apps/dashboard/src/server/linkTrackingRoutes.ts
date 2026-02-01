import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { recordRedirectClick } from "../services/redirectService";

/**
 * Routes pour le tracking des clics sur les liens et les redirections
 * Ces routes permettent de :
 * 1. Tracker les clics via /go/:linkId (redirection avec tracking pour Plinkks)
 * 2. Gérer les redirections courtes via /r/:slug
 * 3. Enregistrer les clics côté API pour les liens affichés
 */
export function linkTrackingRoutes(fastify: FastifyInstance) {
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
      return reply.code(404).view("erreurs/404.ejs", { currentUser: null });
    }
    
    if (redirect.expiresAt && redirect.expiresAt < new Date()) {
      return reply.code(410).view("erreurs/410.ejs", { 
        title: "Lien expiré", 
        message: "Ce lien de redirection a expiré." 
      });
    }
    
    // Enregistrer le clic
    await recordRedirectClick(redirect.id, request);
    
    // Rediriger vers l'URL cible
    return reply.redirect(redirect.targetUrl);
  });

  /**
   * GET /go/:linkId
   * Redirige vers l'URL du lien tout en enregistrant le clic
   * Le lien affiché à l'utilisateur montre l'URL finale mais passe par ce endpoint
   */
  fastify.get("/go/:linkId", async (request, reply) => {
    const { linkId } = request.params as { linkId: string };
    
    if (!linkId) {
      return reply.code(400).send({ error: "missing_link_id" });
    }
    
    // Récupérer le lien
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      include: {
        plinkk: {
          select: { isActive: true, isPublic: true },
        },
      },
    });
    
    if (!link) {
      return reply.code(404).view("erreurs/404.ejs", { currentUser: null });
    }
    
    // Vérifier que la plinkk est active et publique
    if (link.plinkk && (!link.plinkk.isActive || !link.plinkk.isPublic)) {
      return reply.code(404).view("erreurs/404.ejs", { currentUser: null });
    }
    
    // Enregistrer le clic
    await recordLinkClick(linkId, request);
    
    // Rediriger vers l'URL cible
    return reply.redirect(link.url);
  });
  
  /**
   * POST /api/links/:linkId/click
   * Endpoint pour enregistrer un clic sans redirection (pour les clics JS)
   */
  fastify.post("/api/links/:linkId/click", async (request, reply) => {
    const { linkId } = request.params as { linkId: string };
    
    if (!linkId) {
      return reply.code(400).send({ error: "missing_link_id" });
    }
    
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { id: true },
    });
    
    if (!link) {
      return reply.code(404).send({ error: "link_not_found" });
    }
    
    await recordLinkClick(linkId, request);
    
    return reply.send({ ok: true });
  });
}

/**
 * Enregistre un clic sur un lien
 */
async function recordLinkClick(linkId: string, request: any) {
  // Incrémenter le compteur global
  await prisma.link.update({
    where: { id: linkId },
    data: { clicks: { increment: 1 } },
  });
  
  // Enregistrer dans les stats journalières
  try {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate();
    const dateObj = new Date(Date.UTC(y, m, d));
    
    await prisma.linkClickDaily.upsert({
      where: { linkId_date: { linkId, date: dateObj } },
      create: { linkId, date: dateObj, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch (e) {
    request?.log?.warn({ err: e }, "recordLinkClick.daily failed");
  }
}
