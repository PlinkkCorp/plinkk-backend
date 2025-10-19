import { FastifyInstance } from "fastify";
import { PrismaClient } from "@plinkk/prisma/generated/prisma/client";
import {
  verifyRoleIsStaff,
  verifyRoleAdmin,
  verifyRoleDeveloper,
} from "../../lib/verifyRole";

const prisma = new PrismaClient();

export function apiUsersRoutes(fastify: FastifyInstance) {
  // API: lecture d'un utilisateur (infos minimales + plinkks + settings)
  fastify.get("/:id", async (request, reply) => {
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
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        userName: true,
        email: true,
        publicEmail: true,
        isPublic: true,
        views: true,
        role: { select: { id: true, name: true } },
        plinkks: {
          select: {
            id: true,
            name: true,
            slug: true,
            isDefault: true,
            isPublic: true,
            isActive: true,
            views: true,
            settings: { select: { affichageEmail: true } },
          },
          orderBy: { index: "asc" },
        },
      },
    });
    if (!user)
      return reply.code(404).send({ error: "Utilisateur introuvable" });
    return reply.send(user);
  });

  // ====== API de ban par email (par utilisateur) ======
  // Lire l'état de ban de l'email de l'utilisateur
  fastify.get("/:id/ban-email", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: String(meId) },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role)))
      return reply.code(403).send({ error: "Forbidden" });
    const { id } = request.params as { id: string };
    const u = await prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });
    if (!u) return reply.code(404).send({ error: "Utilisateur introuvable" });
    const ban = await prisma.bannedEmail.findFirst({
      where: { email: u.email, revoquedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return reply.send({
      active: !!ban,
      ban,
      // date de fin théorique si time>0 (time en minutes)
      until:
        ban && typeof ban.time === "number" && ban.time! > 0
          ? new Date(
              new Date(ban.createdAt).getTime() + (ban.time || 0) * 60 * 1000
            ).toISOString()
          : null,
    });
  });

  // Bannir par email l'utilisateur ciblé
  fastify.post("/:id/ban-email", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: String(meId) },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role)))
      return reply.code(403).send({ error: "Forbidden" });
    const { id } = request.params as { id: string };
    const body =
      (request.body as {
        reason?: string;
        time?: number;
        deletePlinkk?: boolean;
      }) || {};
    const u = await prisma.user.findUnique({
      where: { id },
      select: { email: true, id: true, role: { select: { name: true } } },
    });
    if (!u) return reply.code(404).send({ error: "Utilisateur introuvable" });
    // Interdictions: pas d'auto-ban, pas de ban d'admins, pas de ban d'un rôle >= au sien
    const actor = await prisma.user.findUnique({
      where: { id: String(meId) },
      select: { id: true, role: { select: { name: true } } },
    });
    if (!actor) return reply.code(401).send({ error: "Unauthorized" });
    if (actor.id === u.id)
      return reply.code(403).send({ error: "cannot_self_ban" });
    const rank: Record<string, number> = {
      USER: 0,
      MODERATOR: 1,
      DEVELOPER: 2,
      ADMIN: 3,
    };
    const targetRole = u.role?.name || "USER";
    if (targetRole === "ADMIN")
      return reply.code(403).send({ error: "cannot_ban_admin" });
    const actorRole = actor.role?.name || "USER";
    if ((rank[actorRole] ?? 0) <= (rank[targetRole] ?? 0))
      return reply.code(403).send({ error: "forbidden_role" });
    // Check s'il y a déjà un ban actif
    const existing = await prisma.bannedEmail.findFirst({
      where: { email: u.email, revoquedAt: null },
    });
    if (existing) return reply.code(409).send({ error: "already_banned" });
    // Réactive un ancien ban si présent (évite P2002), sinon crée
    const ban = await prisma.bannedEmail.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        reason: (body.reason || "").slice(0, 500),
        deletePlinkk: !!body.deletePlinkk,
        time:
          typeof body.time === "number"
            ? Math.max(-1, Math.floor(body.time))
            : -1,
      },
      update: {
        reason: (body.reason || "").slice(0, 500),
        deletePlinkk: !!body.deletePlinkk,
        time:
          typeof body.time === "number"
            ? Math.max(-1, Math.floor(body.time))
            : -1,
        revoquedAt: null,
        createdAt: new Date(),
      },
    });
    return reply.send({ ok: true, ban });
  });

  // Révoquer le ban (lever l'interdiction)
  fastify.delete("/:id/ban-email", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: String(meId) },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role)))
      return reply.code(403).send({ error: "Forbidden" });
    const { id } = request.params as { id: string };
    const u = await prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });
    if (!u) return reply.code(404).send({ error: "Utilisateur introuvable" });
    const ban = await prisma.bannedEmail.findFirst({
      where: { email: u.email, revoquedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!ban) return reply.code(404).send({ error: "no_active_ban" });
    await prisma.bannedEmail.update({
      where: { email: ban.email },
      data: { revoquedAt: new Date() },
    });
    return reply.send({ ok: true });
  });

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
    const { role } = request.body as { role: string };
    // Valider contre la table Role
    const dbRole = await prisma.role.findFirst({
      where: { OR: [{ id: role }, { name: role }] },
      select: { id: true, name: true },
    });
    if (!dbRole) return reply.code(400).send({ error: "Invalid role" });
    // Enforce role hierarchy rules:
    // hierarchy: USER(0) < MODERATOR(1) < DEVELOPER(2) < ADMIN(3)
    const rank: Record<string, number> = {
      USER: 0,
      MODERATOR: 1,
      DEVELOPER: 2,
      ADMIN: 3,
    };
    const meRole = me.role.name as string;
    const targetRole = dbRole.name as string;

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
      data: { roleId: dbRole.id },
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
    const cosmetics = request.body;
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

  // API: basculer la visibilité publique/privée du profil d'un utilisateur (admin/dev/moderator)
  fastify.post("/:id/visibility", async (request, reply) => {
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
    const { isPublic } = (request.body as { isPublic?: boolean }) ?? {};
    if (typeof isPublic !== "boolean") {
      return reply.code(400).send({ error: "Invalid payload" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isPublic: Boolean(isPublic) },
      select: { id: true, isPublic: true },
    });
    return reply.send(updated);
  });

  // API: basculer la visibilité publique de l'email d'un utilisateur (admin/dev/moderator)
  fastify.post("/:id/email-visibility", async (request, reply) => {
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
    const { isEmailPublic } = (request.body as { isEmailPublic?: boolean }) ?? {};
    if (typeof isEmailPublic !== "boolean") {
      return reply.code(400).send({ error: "Invalid payload" });
    }

    // Lire l'email courant pour exposer publiquement si demandé
    const u = await prisma.user.findUnique({
      where: { id },
      select: { email: true, publicEmail: true },
    });
    if (!u) return reply.code(404).send({ error: "Utilisateur introuvable" });

    const newPublicEmail = isEmailPublic ? (u.publicEmail || u.email) : null;
    const updated = await prisma.user.update({
      where: { id },
      data: { publicEmail: newPublicEmail },
      select: { id: true, publicEmail: true },
    });
    return reply.send({ id: updated.id, isEmailPublic: Boolean(updated.publicEmail) });
  });

  // API: forcer la réinitialisation du mot de passe (admin/dev/moderator)
  fastify.post("/:id/force-password-reset", async (request, reply) => {
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
    const { mustChange } = (request.body as { mustChange?: boolean }) ?? {};
    if (typeof mustChange !== "boolean") {
      return reply.code(400).send({ error: "Invalid payload" });
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { mustChangePassword: mustChange },
      select: { id: true, mustChangePassword: true },
    });
    return reply.send({ id: updated.id, mustChangePassword: updated.mustChangePassword });
  });
}
