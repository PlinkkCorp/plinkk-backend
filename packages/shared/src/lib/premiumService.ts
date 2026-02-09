import { Role } from "@plinkk/prisma";
import { verifyRoleAdmin, verifyRoleDeveloper, verifyRolePartner, verifyRoleIsStaff } from "./verifyRole";

// ─────────────────────────────────────────────────────────────────────────────
// Limites par défaut (utilisateurs gratuits)
// ─────────────────────────────────────────────────────────────────────────────
export const FREE_MAX_STATS_DAYS = 30;
export const FREE_MAX_PLINKKS = 1;
export const FREE_MAX_THEMES = 10;
export const FREE_MAX_REDIRECTS = 5;
export const FREE_MAX_LINKS = 15;

// ─────────────────────────────────────────────────────────────────────────────
// Limites premium
// ─────────────────────────────────────────────────────────────────────────────
export const PREMIUM_MAX_STATS_DAYS = 365;
export const PREMIUM_MAX_PLINKKS = 2;
export const PREMIUM_MAX_THEMES = 20;
export const PREMIUM_MAX_REDIRECTS = 10;
export const PREMIUM_MAX_LINKS = 30;

// ─────────────────────────────────────────────────────────────────────────────
// Limites staff / extended
// ─────────────────────────────────────────────────────────────────────────────
export const STAFF_MAX_STATS_DAYS = 365;
export const STAFF_MAX_PLINKKS = 100;
export const STAFF_MAX_THEMES = 100;
export const STAFF_MAX_REDIRECTS = 100;
export const STAFF_MAX_LINKS = 100;

// ─────────────────────────────────────────────────────────────────────────────
// Liste des fonctionnalités premium
// ─────────────────────────────────────────────────────────────────────────────
export const PREMIUM_FEATURES = [
  { key: "extended_stats", label: "Statistiques étendues (jusqu'à 365 jours)", icon: "chart" },
  { key: "extended_redirects", label: "Limite de redirections étendue", icon: "redirect" },
  { key: "extended_plinkks", label: "Plus de Plinkks", icon: "plinkk" },
  { key: "extended_themes", label: "Plus de thèmes personnalisés", icon: "theme" },
  { key: "gif_banner", label: "Bannières GIF / Image personnalisées", icon: "image" },
  { key: "visual_effects", label: "Effets visuels (animations, canvas, néon)", icon: "sparkles" },
  { key: "password_protected_plinkk", label: "Plinkk protégé par mot de passe", icon: "lock" },
  { key: "scheduled_links", label: "Liens programmés (activation/expiration)", icon: "clock" },
  { key: "csv_export", label: "Export CSV avancé", icon: "export" },
  { key: "priority_support", label: "Support prioritaire", icon: "support" },
] as const;

export type PremiumFeatureKey = (typeof PREMIUM_FEATURES)[number]["key"];

// ─────────────────────────────────────────────────────────────────────────────
// Interface utilisateur minimale pour la vérification premium
// ─────────────────────────────────────────────────────────────────────────────
export interface PremiumCheckUser {
  isPremium?: boolean;
  premiumUntil?: Date | string | null;
  isPartner?: boolean;
  role?: Role | null;
  extraPlinkks?: number;
  extraRedirects?: number;
}

/**
 * Vérifie si un utilisateur a le statut premium actif.
 * Premium = isPremium && (pas d'expiration OU expiration future)
 * OU staff (admin, dev, modérateur)
 * OU partner
 */
export function isUserPremium(user?: PremiumCheckUser | null): boolean {
  if (!user) return false;

  // Staff toujours premium
  if (verifyRoleIsStaff(user.role)) return true;

  // Partner premium par défaut
  if (verifyRolePartner(user.role) || user.isPartner) return true;

  // isPremium avec vérification d'expiration
  if (user.isPremium) {
    if (!user.premiumUntil) return true; // pas de date d'expiration = premium permanent
    const until = user.premiumUntil instanceof Date ? user.premiumUntil : new Date(user.premiumUntil);
    return until.getTime() > Date.now();
  }

  return false;
}

/**
 * Retourne le nombre maximum de jours de statistiques visibles
 */
export function getMaxStatsDays(user?: PremiumCheckUser | null): number {
  if (!user) return FREE_MAX_STATS_DAYS;
  if (verifyRoleIsStaff(user.role)) return STAFF_MAX_STATS_DAYS;
  if (isUserPremium(user)) return PREMIUM_MAX_STATS_DAYS;
  return FREE_MAX_STATS_DAYS;
}

/**
 * Retourne le nombre maximum de Plinkks autorisées
 */
export function getMaxPlinkks(user?: PremiumCheckUser | null): number {
  if (!user) return FREE_MAX_PLINKKS;
  let limit = FREE_MAX_PLINKKS;
  if (user.role?.maxPlinkks != null && user.role.maxPlinkks > 0) limit = Math.max(limit, user.role.maxPlinkks);
  if (verifyRoleIsStaff(user.role)) limit = Math.max(limit, STAFF_MAX_PLINKKS);
  if (isUserPremium(user)) limit = Math.max(limit, PREMIUM_MAX_PLINKKS);
  // Ajout des plinkks achetées à l'unité
  if (user.extraPlinkks && user.extraPlinkks > 0) limit += user.extraPlinkks;
  return limit;
}

/**
 * Retourne le nombre maximum de thèmes privés autorisés
 */
export function getMaxThemes(user?: PremiumCheckUser | null): number {
  if (!user) return FREE_MAX_THEMES;
  let limit = FREE_MAX_THEMES;
  if (user.role?.maxThemes != null && user.role.maxThemes > 0) limit = Math.max(limit, user.role.maxThemes);
  if (verifyRoleIsStaff(user.role)) limit = Math.max(limit, STAFF_MAX_THEMES);
  if (isUserPremium(user)) limit = Math.max(limit, PREMIUM_MAX_THEMES);
  return limit;
}

/**
 * Retourne le nombre maximum de redirections autorisées
 */
export function getMaxRedirects(user?: PremiumCheckUser | null): number {
  if (!user) return FREE_MAX_REDIRECTS;
  let limit = FREE_MAX_REDIRECTS;
  if (user.role?.maxRedirects != null && user.role.maxRedirects > 0) limit = Math.max(limit, user.role.maxRedirects);
  if (verifyRoleIsStaff(user.role)) limit = Math.max(limit, STAFF_MAX_REDIRECTS);
  if (isUserPremium(user)) limit = Math.max(limit, PREMIUM_MAX_REDIRECTS);
  // Ajout des packs de redirections achetés (+5 par achat)
  if (user.extraRedirects && user.extraRedirects > 0) limit += user.extraRedirects;
  return limit;
}

/**
 * Retourne le nombre maximum de liens autorisés par Plinkk
 */
export function getMaxLinks(user?: PremiumCheckUser | null): number {
  if (!user) return FREE_MAX_LINKS;
  let limit = FREE_MAX_LINKS;
  if (verifyRoleIsStaff(user.role)) limit = Math.max(limit, STAFF_MAX_LINKS);
  if (isUserPremium(user)) limit = Math.max(limit, PREMIUM_MAX_LINKS);
  return limit;
}

/**
 * Vérifie si un utilisateur a accès à une fonctionnalité premium spécifique
 */
export function hasFeatureAccess(user: PremiumCheckUser | null | undefined, _feature: PremiumFeatureKey): boolean {
  // Pour l'instant, toutes les features premium suivent le même check
  return isUserPremium(user);
}

/**
 * Vérifie si l'utilisateur peut utiliser les bannières GIF/image personnalisées
 */
export function canUseGifBanner(user?: PremiumCheckUser | null): boolean {
  return isUserPremium(user);
}

/**
 * Vérifie si l'utilisateur peut utiliser les effets visuels (animations, canvas, néon)
 */
export function canUseVisualEffects(user?: PremiumCheckUser | null): boolean {
  return isUserPremium(user);
}

/**
 * Vérifie si l'utilisateur peut protéger un Plinkk par mot de passe
 */
export function canUsePasswordProtectedPlinkk(user?: PremiumCheckUser | null): boolean {
  return isUserPremium(user);
}

/**
 * Vérifie si l'utilisateur peut programmer l'activation/désactivation de liens
 */
export function canUseScheduledLinks(user?: PremiumCheckUser | null): boolean {
  return isUserPremium(user);
}

/**
 * Filtre les liens selon leur programmation (scheduledAt / expiresAt).
 * Retourne uniquement les liens actuellement visibles.
 */
export function filterScheduledLinks<T extends { scheduledAt?: Date | string | null; expiresAt?: Date | string | null }>(links: T[]): T[] {
  const now = Date.now();
  return links.filter((link) => {
    if (link.scheduledAt) {
      const start = link.scheduledAt instanceof Date ? link.scheduledAt.getTime() : new Date(link.scheduledAt).getTime();
      if (start > now) return false; // pas encore actif
    }
    if (link.expiresAt) {
      const end = link.expiresAt instanceof Date ? link.expiresAt.getTime() : new Date(link.expiresAt).getTime();
      if (end < now) return false; // expiré
    }
    return true;
  });
}

/**
 * Retourne un résumé des limites de l'utilisateur
 */
export function getUserLimits(user?: PremiumCheckUser | null) {
  return {
    isPremium: isUserPremium(user),
    maxStatsDays: getMaxStatsDays(user),
    maxPlinkks: getMaxPlinkks(user),
    maxThemes: getMaxThemes(user),
    maxRedirects: getMaxRedirects(user),
    maxLinks: getMaxLinks(user),
    canUseGifBanner: canUseGifBanner(user),
    canUseVisualEffects: canUseVisualEffects(user),
    canUsePasswordProtectedPlinkk: canUsePasswordProtectedPlinkk(user),
    canUseScheduledLinks: canUseScheduledLinks(user),
    extraPlinkks: user?.extraPlinkks ?? 0,
    extraRedirects: user?.extraRedirects ?? 0,
  };
}
