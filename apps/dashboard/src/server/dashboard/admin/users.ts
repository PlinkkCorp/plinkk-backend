import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { logAdminAction } from "../../../lib/adminLogger";
import { requireAuthRedirect, requireAuth } from "../../../middleware/auth";

interface UserSearchQuery {
  q?: string;
  limit?: number;
}

export function adminUsersRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: UserSearchQuery }>("/search", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_USERS");
    if (!ok) return;

    const q = String(request.query.q || "").trim();
    if (!q) return reply.send({ users: [] });

    const take = Math.min(10, Math.max(1, Number(request.query.limit || 8)));

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { id: { contains: q, mode: "insensitive" } },
          { userName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        userName: true,
        email: true,
        role: true,
        image: true,
      },
      take,
      orderBy: { createdAt: "asc" },
    });

    return reply.send({ users });
  });

  fastify.post("/:id/impersonate", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "IMPERSONATE_USER");
    if (!ok) return;

    const { id } = request.params as { id: string };
    const target = await prisma.user.findUnique({ where: { id } });

    if (!target) return reply.code(404).send({ error: "not_found" });

    await logAdminAction(request.userId!, "IMPERSONATE", id, { targetName: target.userName }, request.ip);

    request.session.set("data", target.id);
    return reply.send({ ok: true, redirectUrl: "/dashboard" });
  });
}
