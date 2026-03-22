import { randomBytes } from "crypto";

/**
 * Génère un identifiant aléatoire URL-safe de longueur donnée.
 * Utilise le rejection sampling pour éviter le biais du modulo.
 */
export function generateNanoId(length = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const mask = 63; // nearest power of 2 minus 1 >= chars.length (36)
  let result = "";
  while (result.length < length) {
    const bytes = randomBytes(Math.max(length - result.length, 1) * 2);
    for (let i = 0; i < bytes.length && result.length < length; i++) {
      const idx = bytes[i] & mask;
      if (idx < chars.length) result += chars[idx];
    }
  }
  return result;
}
