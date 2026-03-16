/**
 * Middleware de rate limiting par IP
 * - cleanupExpiredEntries
 * - createIpRateLimiter
 * - limitLinkClicks
 * - limitQrScans
 * - limitRedirects
 */
import { FastifyRequest, FastifyReply } from "fastify";

const ipCache = new Map<string, number>();

/**
 * Nettoie les entrées expirées du cache
 * @param maxAgeMs - Temps de vie des entrées en millisecondes
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

setInterval(() => cleanupExpiredEntries(60 * 60 * 1000), 10 * 60 * 1000);

/**
 * Middleware de rate limiting par IP
 * 
 * @param type - Type d'action ('view' | 'click' | 'qr' | 'redirect')
 * @param cooldownMs - Temps de cooldown en millisecondes (par défaut 1 heure)
 * @returns Middleware Fastify
 */
export function createIpRateLimiter(
  type: "view" | "click" | "qr" | "redirect",
  cooldownMs: number = 60 * 60 * 1000 // 1 heure par défaut
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = (
      request.headers["x-forwarded-for"] as string ||
      request.headers["x-real-ip"] as string ||
      request.ip ||
      ""
    ).split(",")[0].trim();

    if (!ip) {
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

    ipCache.set(cacheKey, now);
  };
}

/**
 * Middleware pour limiter les clics de liens
 * @description Limite les clics de liens à 1 par heure par IP
 */
export const limitLinkClicks = createIpRateLimiter("click", 60 * 60 * 1000); // 1 heure

/**
 * Middleware pour limiter les scans de QR codes
 * @description Limite les scans de QR codes à 1 par heure par IP
 */
export const limitQrScans = createIpRateLimiter("qr", 60 * 60 * 1000); // 1 heure

/**
 * Middleware pour limiter les redirections
 * @description Limite les redirections à 1 par heure par IP
 */
export const limitRedirects = createIpRateLimiter("redirect", 60 * 60 * 1000); // 1 heure
