/**
 * Lib Permissions
 * - getUserPermissionKeys -> Promise<Set<string>>
 * - userHasPermission     -> Promise<boolean>
 * - userHasAnyPermission  -> Promise<boolean>
 * - userHasAllPermissions -> Promise<boolean>
 * - ensurePermission      -> Promise<boolean>
 * - SessionData           -> Type
 */

import { prisma } from "@plinkk/prisma";
import { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedError, ForbiddenError, replyView } from "@plinkk/shared";

/**
 * Interface for session data
 * @property id - The ID of the session
 */
declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

/**
 * Interface for session data
 * @property id - The ID of the session
 */
export interface SessionData {
  id?: string;
}

/**
 * Gets the permission keys for a user
 * @param userId The ID of the user
 * @returns A promise that resolves to a set of permission keys
 */
export async function getUserPermissionKeys(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { permissions: { select: { permissionKey: true } } } } },
  });
  const keys = (u?.role?.permissions || []).map((p) => p.permissionKey).filter(Boolean) as string[];
  return new Set(keys);
}

/**
 * Checks if a user has a specific permission
 * @param userId The ID of the user
 * @param key The permission key
 * @returns True if the user has the permission, false otherwise
 */
export async function userHasPermission(userId: string, key: string): Promise<boolean> {
  const keys = await getUserPermissionKeys(userId);
  return keys.has(key);
}

/**
 * Checks if a user has any of the specified permissions
 * @param userId The ID of the user
 * @param keys The permission keys to check
 * @returns True if the user has any of the permissions, false otherwise
 */
export async function userHasAnyPermission(userId: string, keys: string[]): Promise<boolean> {
  const set = await getUserPermissionKeys(userId);
  return keys.some((k) => set.has(k));
}

/**
 * Checks if a user has all of the specified permissions
 * @param userId The ID of the user
 * @param keys The permission keys to check
 * @returns True if the user has all of the permissions, false otherwise
 */
export async function userHasAllPermissions(userId: string, keys: string[]): Promise<boolean> {
  const set = await getUserPermissionKeys(userId);
  return keys.every((k) => set.has(k));
}

/**
 * Ensures that a user has the specified permission
 * @param request The fastify request
 * @param reply The fastify reply
 * @param keyOrKeys The permission key or keys
 * @param options Options for ensuring the permission
 * @returns True if the user has the permission, false otherwise
 */
export async function ensurePermission(
  request: FastifyRequest,
  reply: FastifyReply,
  keyOrKeys: string | string[],
  options?: { mode?: "json" | "redirect" | "view"; redirectTo?: string; all?: boolean; active?: string }
): Promise<boolean> {
  const mode = options?.mode || "json";
  const all = options?.all || false;

  let meId = request.userId;
  if (!meId) {
    const sessionData = request.session.get("data") as string | SessionData | undefined;
    if (sessionData) {
      if (typeof sessionData === "object" && sessionData.id) {
        meId = sessionData.id;
      } else if (typeof sessionData === "string") {
        meId = sessionData;
      }
    }
  }

  if (!meId) {
    if (mode === "redirect" || mode === "view") {
      const ret = request.url || "/";
      reply.redirect(`/login?returnTo=${encodeURIComponent(ret)}`);
      return false;
    } else {
      throw new UnauthorizedError();
    }
  }
  const ok = Array.isArray(keyOrKeys)
    ? (all ? await userHasAllPermissions(meId, keyOrKeys) : await userHasAnyPermission(meId, keyOrKeys))
    : await userHasPermission(meId, keyOrKeys);
  if (!ok) {
    if (mode === "view" && request.currentUser) {
      await replyView(reply, "dashboard/admin/forbidden.ejs", request.currentUser, { active: options?.active || "" }, {}, 403);
      return false;
    } else if (mode === "redirect") {
      return reply.redirect(options?.redirectTo || "/");
    } else {
      throw new ForbiddenError();
    }
  }
  return true;
}
