import { prisma } from "@plinkk/prisma";
import { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedError, ForbiddenError } from "@plinkk/shared";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

export interface SessionData {
  id?: string;
}

export async function getUserPermissionKeys(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { permissions: { select: { permissionKey: true } } } } },
  });
  const keys = (u?.role?.permissions || []).map((p) => p.permissionKey).filter(Boolean) as string[];
  return new Set(keys);
}

export async function userHasPermission(userId: string, key: string): Promise<boolean> {
  const keys = await getUserPermissionKeys(userId);
  return keys.has(key);
}

export async function userHasAnyPermission(userId: string, keys: string[]): Promise<boolean> {
  const set = await getUserPermissionKeys(userId);
  return keys.some((k) => set.has(k));
}

export async function userHasAllPermissions(userId: string, keys: string[]): Promise<boolean> {
  const set = await getUserPermissionKeys(userId);
  return keys.every((k) => set.has(k));
}

export async function ensurePermission(
  request: FastifyRequest,
  reply: FastifyReply,
  keyOrKeys: string | string[],
  options?: { mode?: "json" | "redirect"; redirectTo?: string; all?: boolean }
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
    if (mode === "redirect") {
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
    if (mode === "redirect") {
      reply.redirect(options?.redirectTo || "/");
      return false;
    } else {
      throw new ForbiddenError();
    }
  }
  return true;
}
