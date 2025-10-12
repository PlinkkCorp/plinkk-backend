import { FastifyInstance } from "fastify";
import { PrismaClient } from "../../../generated/prisma/client";
import { verifyRoleIsStaff, verifyRoleAdmin, verifyRoleDeveloper } from "../../lib/verifyRole";

const prisma = new PrismaClient();

export function apiUsersRoutes(fastify: FastifyInstance) {
  // API: mise à jour de rôle (admin/dev/moderator)
  fastify.post("/:id/role", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: meId as string },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    const { role } = (request.body as any) || {};
    if (!Object.values("").includes(role))
      return reply.code(400).send({ error: "Invalid role" });
    // Enforce role hierarchy rules:
    // hierarchy: USER(0) < MODERATOR(1) < DEVELOPER(2) < ADMIN(3)
    const rank: Record<string, number> = {
      USER: 0,
      MODERATOR: 1,
      DEVELOPER: 2,
      ADMIN: 3,
    };
    const meRole = me.role.name as string;
    const targetRole = role as string;

    // Admin may do anything
    if (!verifyRoleAdmin(me.role)) {
      // Developer cannot promote to ADMIN
      if (verifyRoleDeveloper(me.role)) {
        if (verifyRoleAdmin(me.role))
          return reply.code(403).send({ error: "Forbidden" });
      } else {
        // Others (moderator) cannot set a role equal or higher than themselves
        if (rank[targetRole] >= rank[meRole])
          return reply.code(403).send({ error: "Forbidden" });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      include: { role: true },
    });
    return reply.send({ id: updated.id, role: updated.role });
  });

  // API: régler les cosmétiques (ex: flair, bannerUrl, frame) — admin/dev/moderator
  fastify.post("/:id/cosmetics", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: meId as string },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    const cosmetics = (request.body as any) ?? null;
    const updated = await prisma.user.update({
      where: { id },
      data: { cosmetics },
      include: { cosmetics: true },
    });
    return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
  });

  // API: suppression d'un utilisateur (admin/dev/moderator)
  fastify.delete("/:id", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: meId as string },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    await prisma.$transaction([
      prisma.link.deleteMany({ where: { userId: id } }),
      prisma.label.deleteMany({ where: { userId: id } }),
      prisma.socialIcon.deleteMany({ where: { userId: id } }),
      prisma.backgroundColor.deleteMany({ where: { userId: id } }),
      prisma.neonColor.deleteMany({ where: { userId: id } }),
      prisma.statusbar.deleteMany({ where: { userId: id } }),
      prisma.cosmetic.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);
    return reply.send({ ok: true });
  });

  // API: désactiver la 2FA d'un utilisateur (admin/dev/moderator)
  fastify.post("/:id/2fa/disable", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: meId as string },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, twoFactorEnabled: true, twoFactorSecret: true },
    });
    if (!target)
      return reply.code(404).send({ error: "Utilisateur introuvable" });

    const alreadyDisabled = !target.twoFactorEnabled && !target.twoFactorSecret;
    if (alreadyDisabled) return reply.send({ ok: true, changed: false });

    await prisma.user.update({
      where: { id },
      data: { twoFactorSecret: "", twoFactorEnabled: false },
    });
    return reply.send({ ok: true, changed: true });
  });
}