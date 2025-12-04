import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import {
  verifyRoleIsStaff,
  verifyRoleAdmin,
  verifyRoleDeveloper,
} from "../../lib/verifyRole";
import { ensurePermission } from "../../lib/permissions";
import { logAdminAction } from "../../lib/adminLogger";

// const prisma = new PrismaClient();

export function apiUsersRoutes(fastify: FastifyInstance) {
  fastify.get("/:id", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_USERS');
    if (!ok) return;
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
        isVerified: true,
        isPartner: true,
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

  fastify.get("/:id/ban-email", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'BAN_USER');
    if (!ok) return;
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
      until:
        ban && typeof ban.time === "number" && ban.time! > 0
          ? new Date(
              new Date(ban.createdAt).getTime() + (ban.time || 0) * 60 * 1000
            ).toISOString()
          : null,
    });
  });

  fastify.post("/:id/ban-email", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'BAN_USER');
    if (!ok) return;
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
    const existing = await prisma.bannedEmail.findFirst({
      where: { email: u.email, revoquedAt: null },
    });
    if (existing) return reply.code(409).send({ error: "already_banned" });
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
    await logAdminAction(meId, 'BAN_USER', id, { email: u.email, reason: body.reason, time: body.time }, request.ip);
    return reply.send({ ok: true, ban });
  });

  fastify.delete("/:id/ban-email", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'UNBAN_USER');
    if (!ok) return;
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
    await logAdminAction(meId, 'UNBAN_USER', id, { email: u.email }, request.ip);
    return reply.send({ ok: true });
  });

  fastify.post("/:id/role", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_ROLES');
    if (!ok) return;
    const me = await prisma.user.findUnique({
      where: { id: meId as string },
      select: { role: true },
    });
    if (!me) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const { role } = request.body as { role: string };
    const dbRole = await prisma.role.findFirst({
      where: { OR: [{ id: role }, { name: role }] },
      select: { id: true, name: true },
    });
    if (!dbRole) return reply.code(400).send({ error: "Invalid role" });
    const rank: Record<string, number> = {
      USER: 0,
      MODERATOR: 1,
      DEVELOPER: 2,
      ADMIN: 3,
    };
    const meRole = me.role.name as string;
    const targetRole = dbRole.name as string;

    if (!verifyRoleAdmin(me.role)) {
      if (verifyRoleDeveloper(me.role)) {
        if (verifyRoleAdmin(me.role))
          return reply.code(403).send({ error: "Forbidden" });
      } else {
        if (rank[targetRole] >= rank[meRole])
          return reply.code(403).send({ error: "Forbidden" });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { roleId: dbRole.id },
      include: { role: true },
    });
    await logAdminAction(meId, 'UPDATE_USER_ROLE', id, { oldRole: meRole, newRole: targetRole }, request.ip);
    return reply.send({ id: updated.id, role: updated.role });
  });

  fastify.post("/:id/cosmetics", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_USERS');
    if (!ok) return;
    const { id } = request.params as { id: string };
    const cosmetics = request.body;
    const updated = await prisma.user.update({
      where: { id },
      data: { cosmetics },
      include: { cosmetics: true },
    });
    await logAdminAction(meId, 'UPDATE_USER_COSMETICS', id, { cosmetics }, request.ip);
    return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
  });

  fastify.delete("/:id", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_USERS');
    if (!ok) return;
    const { id } = request.params as { id: string };
    await prisma.user.delete({ where: { id } });
    await logAdminAction(meId, 'DELETE_USER', id, {}, request.ip);
    return reply.send({ ok: true });
  });

  fastify.post("/:id/2fa/disable", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'RESET_2FA_USER');
    if (!ok) return;
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
    await logAdminAction(meId, 'RESET_2FA_USER', id, {}, request.ip);
    return reply.send({ ok: true, changed: true });
  });

  fastify.post("/:id/visibility", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_USERS');
    if (!ok) return;

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
    await logAdminAction(meId, 'UPDATE_USER_VISIBILITY', id, { isPublic }, request.ip);
    return reply.send(updated);
  });

  fastify.post("/:id/email-visibility", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_USERS');
    if (!ok) return;

    const { id } = request.params as { id: string };
    const { isEmailPublic } = (request.body as { isEmailPublic?: boolean }) ?? {};
    if (typeof isEmailPublic !== "boolean") {
      return reply.code(400).send({ error: "Invalid payload" });
    }

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
    await logAdminAction(meId, 'UPDATE_USER_EMAIL_VISIBILITY', id, { isEmailPublic }, request.ip);
    return reply.send({ id: updated.id, isEmailPublic: Boolean(updated.publicEmail) });
  });

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
    await logAdminAction(meId, 'FORCE_PASSWORD_RESET', id, { mustChange }, request.ip);
    return reply.send({ id: updated.id, mustChangePassword: updated.mustChangePassword });
  });

  fastify.get("/bans/emails", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_BANNED_EMAILS');
    if (!ok) return;
    const bans = await prisma.bannedEmail.findMany({
      where: { revoquedAt: null },
      select: { email: true, reason: true, time: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return reply.send({ bans });
  });

  fastify.post("/bans/emails", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_BANNED_EMAILS');
    if (!ok) return;
    const me = await prisma.user.findFirst({
      where: { id: userId },
      select: { id: true, role: { select: { name: true } } },
    });
    if (!me) return reply.code(401).send({ error: "unauthorized" });
    const body = request.body as {
      email?: string;
      reason?: string;
      time?: number;
    };
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    if (!email || !email.includes("@") || email.length < 3) {
      return reply.code(400).send({ error: "invalid_email" });
    }
    const targetUser = await prisma.user.findFirst({
      where: { email },
      select: { id: true, role: { select: { name: true } } },
    });
    const rank: Record<string, number> = {
      USER: 0,
      MODERATOR: 1,
      DEVELOPER: 2,
      ADMIN: 3,
    };
    if (targetUser) {
      if (targetUser.id === me.id)
        return reply.code(403).send({ error: "cannot_self_ban" });
      const targetRole = targetUser.role?.name || "USER";
      if (targetRole === "ADMIN")
        return reply.code(403).send({ error: "cannot_ban_admin" });
      const actorRole = me.role?.name || "USER";
      if ((rank[actorRole] ?? 0) <= (rank[targetRole] ?? 0))
        return reply.code(403).send({ error: "forbidden_role" });
    }
    const existing = await prisma.bannedEmail.findFirst({
      where: { email, revoquedAt: null },
    });
    if (existing) return reply.code(409).send({ error: "already_banned" });
    const reason = String(body?.reason || "").slice(0, 500);
    const time =
      typeof body?.time === "number"
        ? Math.max(-1, Math.floor(body!.time!))
        : -1;
    const created = await prisma.bannedEmail.create({
      data: { email, reason, time },
    });
    await logAdminAction(userId, 'BAN_EMAIL', undefined, { email, reason, time }, request.ip);
    return reply.send({
      ok: true,
      ban: {
        email: created.email,
        reason: created.reason,
        time: created.time,
        createdAt: created.createdAt,
      },
    });
  });

  fastify.delete("/bans/emails", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_BANNED_EMAILS');
    if (!ok) return;
    const { email } = request.query as { email?: string };
    const target = String(email || "")
      .trim()
      .toLowerCase();
    if (!target) return reply.code(400).send({ error: "missing_email" });
    const res = await prisma.bannedEmail.updateMany({
      where: { email: target, revoquedAt: null },
      data: { revoquedAt: new Date() },
    });
    if (!res.count) return reply.code(404).send({ error: "not_found" });
    await logAdminAction(userId, 'UNBAN_EMAIL', undefined, { email: target }, request.ip);
    return reply.send({ ok: true, count: res.count });
  });

  fastify.post("/bans/emails/bulk", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_BANNED_EMAILS');
    if (!ok) return;
    const me = await prisma.user.findFirst({
      where: { id: userId },
      select: { id: true, role: { select: { name: true } } },
    });
    if (!me) return reply.code(401).send({ error: "unauthorized" });
    const body = request.body as {
      emails?: string[];
      reason?: string;
      time?: number;
    };
    const list = Array.isArray(body?.emails) ? body!.emails! : [];
    const reason = String(body?.reason || "").slice(0, 500);
    const time =
      typeof body?.time === "number"
        ? Math.max(-1, Math.floor(body!.time!))
        : -1;
    const re = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    const emails = Array.from(
      new Set(
        list
          .map((e) =>
            String(e || "")
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      )
    );
    const invalid: string[] = [];
    const toCreate: string[] = [];
    for (const e of emails) {
      if (!re.test(e)) invalid.push(e);
      else toCreate.push(e);
    }
    const alreadyBanned: string[] = [];
    const created: string[] = [];
    const existing = await prisma.bannedEmail.findMany({
      where: { email: { in: toCreate }, revoquedAt: null },
      select: { email: true },
    });
    const existingSet = new Set(existing.map((x) => x.email.toLowerCase()));
    const targets = await prisma.user.findMany({
      where: { email: { in: toCreate } },
      select: { email: true, id: true, role: { select: { name: true } } },
    });
    const rank: Record<string, number> = {
      USER: 0,
      MODERATOR: 1,
      DEVELOPER: 2,
      ADMIN: 3,
    };
    const forbidden = new Set<string>();
    for (const t of targets) {
      if (t.id === me.id) {
        forbidden.add(t.email.toLowerCase());
        continue;
      }
      const role = t.role?.name || "USER";
      if (role === "ADMIN") {
        forbidden.add(t.email.toLowerCase());
        continue;
      }
      const actorRole = me.role?.name || "USER";
      if ((rank[actorRole] ?? 0) <= (rank[role] ?? 0)) {
        forbidden.add(t.email.toLowerCase());
        continue;
      }
    }
    const final = toCreate.filter(
      (e) => !existingSet.has(e) && !forbidden.has(e)
    );
    if (final.length) {
      await prisma.bannedEmail.createMany({
        data: final.map((email) => ({ email, reason, time })),
      });
      created.push(...final);
    }
    alreadyBanned.push(...toCreate.filter((e) => existingSet.has(e)));
    const skippedForbidden = toCreate.filter((e) => forbidden.has(e));
    await logAdminAction(userId, 'BULK_BAN_EMAILS', undefined, { created, alreadyBanned, skippedForbidden, reason }, request.ip);
    return reply.send({
      ok: true,
      created,
      alreadyBanned,
      invalid,
      skippedForbidden,
    });
  });

  fastify.post("/:id/badges", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_USERS');
    if (!ok) return;

    const { id } = request.params as { id: string };
    const { type, value } = request.body as { type: 'VERIFIED' | 'PARTNER', value: boolean };

    const data: any = {};
    if (type === 'VERIFIED') data.isVerified = value;
    if (type === 'PARTNER') data.isPartner = value;

    if (Object.keys(data).length === 0) return reply.send({ ok: true }); // Nothing to update

    await prisma.user.update({ where: { id }, data });
    await logAdminAction(userId, 'UPDATE_BADGES', id, { ...data, type }, request.ip);

    return reply.send({ ok: true });
  });
}
