import { FastifyRequest } from "fastify";

/**
 * Cache en mémoire pour limiter les écritures BDD par IP.
 * Clé: `${type}:${scope}:${ip}` - Valeur: timestamp de la dernière écriture.
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
 * Retourne true si l'action doit être enregistrée en BDD.
 * Cette fonction est non bloquante: elle ne renvoie jamais de 429.
 */
function shouldTrackByIp(
  request: FastifyRequest,
  type: "view" | "click",
  scope: string,
  cooldownMs: number = 60 * 60 * 1000 // 1 heure par défaut
) {
  const ip = (
    (request.headers["x-forwarded-for"] as string) ||
    (request.headers["x-real-ip"] as string) ||
    request.ip ||
    ""
  )
    .split(",")[0]
    .trim();

  if (!ip) {
    // Si l'IP est introuvable, on privilégie la comptabilisation.
    return true;
  }

  const cacheKey = `${type}:${scope}:${ip}`;
  const now = Date.now();
  const lastAction = ipCache.get(cacheKey);

  if (lastAction && now - lastAction < cooldownMs) {
    return false;
  }

  ipCache.set(cacheKey, now);
  return true;
}

/**
 * Indique si une vue de profil doit être enregistrée en BDD.
 */
export function shouldRecordProfileView(
  request: FastifyRequest,
  plinkkId: string,
  cooldownMs: number = 60 * 60 * 1000,
) {
  return shouldTrackByIp(request, "view", plinkkId, cooldownMs);
}

/**
 * Indique si un clic de lien doit être enregistré en BDD.
 */
export function shouldRecordLinkClick(
  request: FastifyRequest,
  linkId: string,
  cooldownMs: number = 60 * 60 * 1000,
) {
  return shouldTrackByIp(request, "click", linkId, cooldownMs);
}
