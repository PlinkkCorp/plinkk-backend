import { FastifyRequest, FastifyReply } from "fastify";

/**
 * Cache en mémoire pour le rate limiting par IP  
 * Clé: `${type}:${ip}` - Valeur: timestamp de la dernière action
 */
const ipCache = new Map<string, number>();

/**
 * Nettoie les entrées expirées du cache (exécuté périodiquement)
 */
function cleanupExpiredEntries(maxAgeMs: number) {
  const now = Date.now();
  const expiredKeys: string[] = [];
  
  for (const [key, timestamp] of ipCache.entries()) {
    if (now - timestamp > maxAgeMs) {
      expiredKeys.push(key);
    }
  }
  
  for (const key of expiredKeys) {
    ipCache.delete(key);
  }
}

// Nettoyer le cache toutes les 10 minutes
setInterval(() => cleanupExpiredEntries(60 * 60 * 1000), 10 * 60 * 1000);

/**
 * Middleware de rate limiting par IP
 * 
 * @param type - Type d'action ('view' ou 'click')
 * @param cooldownMs - Temps de cooldown en millisecondes (par défaut 1 heure)
 * @returns Middleware Fastify
 */
export function createIpRateLimiter(
  type: "view" | "click",
  cooldownMs: number = 60 * 60 * 1000 // 1 heure par défaut
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Récupérer l'IP réelle (en tenant compte des proxies)
    const ip = (
      request.headers["x-forwarded-for"] as string ||
      request.headers["x-real-ip"] as string ||
      request.ip ||
      ""
    ).split(",")[0].trim();

    if (!ip) {
      // Si on ne peut pas déterminer l'IP, on laisse passer
      // (mieux vaut permettre l'accès que de bloquer tout le monde)
      return;
    }

    const cacheKey = `${type}:${ip}`;
    const now = Date.now();
    const lastAction = ipCache.get(cacheKey);

    if (lastAction) {
      const timeElapsed = now - lastAction;
      
      if (timeElapsed < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeElapsed) / 1000);
        const remainingMinutes = Math.ceil(remainingSeconds / 60);
        
        return reply.code(429).send({
          error: "rate_limit_exceeded",
          message: `Trop de requêtes. Veuillez réessayer dans ${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""}.`,
          retryAfter: remainingSeconds,
        });
      }
    }

    // Enregistrer le timestamp de cette action
    ipCache.set(cacheKey, now);
  };
}

/**
 * Middleware pour limiter les vues de profils
 */
export const limitProfileViews = createIpRateLimiter("view", 60 * 60 * 1000); // 1 heure

/**
 * Middleware pour limiter les clics de liens
 */
export const limitLinkClicks = createIpRateLimiter("click", 60 * 60 * 1000); // 1 heure
