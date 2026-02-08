import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { logAdminAction } from "../../../lib/adminLogger";
import { requireAuthRedirect, requireAuth } from "../../../middleware/auth";

export function adminRolesRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_ROLES", { mode: "redirect" });
    if (!ok) return;

    let roles: any[] = [];
    try {
      roles = await prisma.role.findMany({
        include: { permissions: true },
        orderBy: [{ priority: "desc" }, { name: "asc" }],
      });
    } catch {
      roles = [];
    }

    const perms = await prisma.permission.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    const grouped: Record<string, any[]> = {};
    for (const p of perms) {
      grouped[p.category] = grouped[p.category] || [];
      grouped[p.category].push(p);
    }

    const rolesForPayload = roles.map((r) => ({
      id: r.id,
      name: r.name,
      isStaff: !!r.isStaff,
      priority: r.priority ?? 0,
      color: r.color ?? null,
      maxPlinkks: r.maxPlinkks ?? 1,
      maxThemes: r.maxThemes ?? 0,
      maxRedirects: r.maxRedirects ?? 5,
      permissions: Array.isArray(r.permissions)
        ? r.permissions.map((rp: any) => rp.permissionKey || rp.permission?.key).filter(Boolean)
        : [],
    }));

    let rolesB64 = "";
    try {
      rolesB64 = Buffer.from(JSON.stringify(rolesForPayload), "utf8").toString("base64");
    } catch {}

    return replyView(reply, "dashboard/admin/roles.ejs", request.currentUser!, {
      rolesB64,
      permissionsGrouped: grouped,
      publicPath: request.publicPath,
    });
  });
}
