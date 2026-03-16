import { z } from "zod";

/**
 * Strict URL validator to prevent XSS via protocol schemas.
 * Only allows http:// and https://.
 */
export const SafeUrlSchema = z.string().url().refine((url) => {
  return url.startsWith("http://") || url.startsWith("https://");
}, {
  message: "Seuls les protocoles http:// et https:// sont autorisés.",
});

/**
 * Validates a redirection path to prevent Open Redirect vulnerabilities.
 * Only allows relative paths starting with a single '/'.
 */
export function getSafeReturnTo(url: string | null | undefined, fallback: string = "/"): string {
  if (!url) return fallback;
  
  // Ensure it starts with / and not // or /\\ which can be used for absolute redirects in some browsers
  const isRelative = /^\/(?!\/|\\)/.test(url);
  
  if (isRelative) {
    return url;
  }
  
  return fallback;
}
