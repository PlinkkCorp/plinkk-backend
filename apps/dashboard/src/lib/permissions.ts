import { prisma } from "@plinkk/prisma";
import { FastifyReply, FastifyRequest } from "fastify";

// const prisma = new PrismaClient();

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
  const meId = request.session.get("data") as string | undefined;
  if (!meId) {
    if (mode === "redirect") {
      const ret = request.url || "/";
      reply.redirect(`/login?returnTo=${encodeURIComponent(ret)}`);
    } else {
      reply.code(401).send({ error: "unauthorized" });
    }
    return false;
  }
  const ok = Array.isArray(keyOrKeys)
    ? (all ? await userHasAllPermissions(meId, keyOrKeys) : await userHasAnyPermission(meId, keyOrKeys))
    : await userHasPermission(meId, keyOrKeys);
  if (!ok) {
    if (mode === "redirect") reply.redirect("/");
    else reply.code(403).send({ error: "forbidden" });
    return false;
  }
  return true;
}
