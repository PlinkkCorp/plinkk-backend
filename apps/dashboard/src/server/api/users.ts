import { FastifyInstance } from "fastify";
import { prisma, Prisma, AdminLog, UserLog } from "@plinkk/prisma";
import { logUserAction } from "../../lib/userLogger";
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
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
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
        createdAt: true,
        lastLogin: true,
        _count: { select: { sessions: true } },
        isPublic: true,
        views: true,
        isVerified: true,
        isPartner: true,
        isPremium: true,
        premiumUntil: true,
        links: { select: { clicks: true } },
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
        redirects: {
          select: {
            id: true,
            slug: true,
            targetUrl: true,
            clicks: true,
            createdAt: true
          },
          orderBy: { updatedAt: 'desc' }
        }
      },
    });
    if (!user)
      return reply.code(404).send({ error: "Utilisateur introuvable" });
    return reply.send(user);
  });

  fastify.put("/:id/profile", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_USERS');
    if (!ok) return;

    const { id } = request.params as { id: string };
    const { userName, email } = request.body as { userName?: string, email?: string };

    const data: Prisma.UserUpdateInput = {};
    if (typeof userName === 'string') {
      const uName = userName.trim();
      if (uName.length < 3 || uName.length > 50) return reply.code(400).send({ error: 'Username invalid length' });
      const exists = await prisma.user.findFirst({ where: { userName: { equals: uName, mode: 'insensitive' }, id: { not: id } } });
      if (exists) return reply.code(409).send({ error: 'Username taken' });
      data.userName = uName;
    }
    if (typeof email === 'string') {
      const mail = email.trim();
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(mail)) return reply.code(400).send({ error: 'Email invalid' });
      const exists = await prisma.user.findFirst({ where: { email: { equals: mail, mode: 'insensitive' }, id: { not: id } } });
      if (exists) return reply.code(409).send({ error: 'Email taken' });
      data.email = mail;
    }

    if (Object.keys(data).length > 0) {
      const u = await prisma.user.update({ where: { id }, data });
      await logAdminAction(meId, 'UPDATE_USER_PROFILE', id, data, request.ip);
      /* @ts-ignore */
      await logUserAction(id, "ADMIN_UPDATE_PROFILE", meId, data, request.ip);
      return reply.send({ id: u.id, userName: u.userName, email: u.email });
    }
    return reply.send({ ok: true });
  });

  fastify.get("/:id/ban-email", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
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
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
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
    await logUserAction(id, "BANNED", meId, { email: u.email, reason: body.reason, time: body.time }, request.ip);
    return reply.send({ ok: true, ban });
  });

  fastify.delete("/:id/ban-email", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
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
    await logUserAction(id, "UNBANNED", meId, { email: u.email }, request.ip);
    return reply.send({ ok: true });
  });

  fastify.post("/:id/role", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
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
    await logUserAction(id, "ADMIN_UPDATE_ROLE", meId, { oldRole: meRole, newRole: targetRole }, request.ip);
    await logAdminAction(meId, 'UPDATE_USER_ROLE', id, { oldRole: meRole, newRole: targetRole }, request.ip);
    return reply.send({ id: updated.id, role: updated.role });
  });

  fastify.post("/:id/cosmetics", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
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
    await logUserAction(id, "ADMIN_UPDATE_COSMETICS", meId, { cosmetics }, request.ip);
    await logAdminAction(meId, 'UPDATE_USER_COSMETICS', id, { cosmetics }, request.ip);
    return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
  });

  fastify.delete("/:id", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_USERS');
    if (!ok) return;
    const { id } = request.params as { id: string };
    await prisma.user.delete({ where: { id } });
    await logAdminAction(meId, 'DELETE_USER', id, {}, request.ip);
    // User is deleted, we can't log to their userLog if it cascades or if user doesn't exist.
    // However, if we keep logs, we might want to log it before deletion or check cascade rules.
    // Usually logs should be kept. Assuming userLog might be deleted if it has foreign key.
    // Let's assume we log it before deletion if we want to keep trace, but if user is gone...
    // Actually, if the user is deleted, their logs might be deleted too depending on schema.
    // Let's skip user log for total deletion or log it before if schema allows standalone logs (unlikely with relation).
    // If Relation is User -> UserLog[], deleting User deletes logs.
    // So logging a "DELETED" action to a user about to be deleted is moot unless we keep logs.
    // I will skip logUserAction for DELETE_USER for now as the user is gone.
    return reply.send({ ok: true });
  });

  fastify.post("/:id/2fa/disable", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
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
    await logUserAction(id, "ADMIN_RESET_2FA", meId, {}, request.ip);
    return reply.send({ ok: true, changed: true });
  });

  fastify.post("/:id/visibility", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
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
    await logUserAction(id, "ADMIN_UPDATE_VISIBILITY", meId, { isPublic }, request.ip);
    await logAdminAction(meId, 'UPDATE_USER_VISIBILITY', id, { isPublic }, request.ip);
    return reply.send(updated);
  });

  fastify.post("/:id/email-visibility", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
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
    await logUserAction(id, "ADMIN_UPDATE_EMAIL_VISIBILITY", meId, { isEmailPublic }, request.ip);
    await logAdminAction(meId, 'UPDATE_USER_EMAIL_VISIBILITY', id, { isEmailPublic }, request.ip);
    return reply.send({ id: updated.id, isEmailPublic: Boolean(updated.publicEmail) });
  });

  fastify.post("/:id/force-password-reset", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
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
    await logUserAction(id, "ADMIN_FORCE_PASSWORD_RESET", meId, { mustChange }, request.ip);
    await logAdminAction(meId, 'FORCE_PASSWORD_RESET', id, { mustChange }, request.ip);
    return reply.send({ id: updated.id, mustChangePassword: updated.mustChangePassword });
  });

  fastify.get("/bans/emails", async (request, reply) => {
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
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
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
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
    if (targetUser) {
      await logUserAction(targetUser.id, "BANNED_EMAIL", userId, { email, reason, time }, request.ip);
    }
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
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
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
    const targetUser = await prisma.user.findFirst({ where: { email: target }, select: { id: true } });
    if (targetUser) {
      await logUserAction(targetUser.id, "UNBANNED_EMAIL", userId, { email: target }, request.ip);
    }
    return reply.send({ ok: true, count: res.count });
  });

  fastify.post("/bans/emails/bulk", async (request, reply) => {
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
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
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const ok = await ensurePermission(request, reply, 'MANAGE_USERS');
    if (!ok) return;

    const { id } = request.params as { id: string };
    const { type, value } = request.body as { type: 'VERIFIED' | 'PARTNER' | 'PREMIUM', value: boolean };

    const data: Prisma.UserUpdateInput = {};

    if (type === 'VERIFIED') {
      data.isVerified = value;
    }
    else if (type === 'PARTNER') {
      data.isPartner = value;
    }
    else if (type === 'PREMIUM') {
      // Get current user to check for Stripe subscription
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { isPremium: true, premiumSource: true, premiumUntil: true, stripeCustomerId: true }
      });

      if (!currentUser) {
        return reply.code(404).send({ error: "User not found" });
      }

      // Prevent modifying Stripe-managed premium
      if (currentUser.premiumSource === 'STRIPE') {
        return reply.code(403).send({
          error: "Cannot toggle premium badge for Stripe subscribers",
          details: "This user has an active Stripe subscription. Premium status is managed automatically."
        });
      }

      if (value) {
        // Granting premium manually
        data.isPremium = true;
        data.premiumSource = 'MANUAL';
        // Set 1 year expiry for manual grants
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        data.premiumUntil = oneYearFromNow;
      } else {
        // Revoking premium (only if manual)
        data.isPremium = false;
        data.premiumSource = null;
        data.premiumUntil = null;
      }
    }

    if (Object.keys(data).length === 0) {
      return reply.send({ ok: true });
    }

    await prisma.user.update({ where: { id }, data });
    await logAdminAction(userId, 'UPDATE_BADGES', id, { ...data, type }, request.ip);

    return reply.send({ ok: true });
  });

  // Admin subscription management endpoint
  fastify.post("/:id/subscription-admin", async function (request, reply) {
    const sessionData = request.session.get("data");
    const adminId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!adminId) return reply.code(401).send({ error: "unauthorized" });

    const ok = await ensurePermission(request, reply, 'MANAGE_SUBSCRIPTIONS');
    if (!ok) return;

    const { id } = request.params as { id: string };
    const { action, premiumUntil, reason } = request.body as {
      action: 'GRANT' | 'REVOKE' | 'EXTEND',
      premiumUntil?: string,
      reason?: string
    };

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isPremium: true, premiumSource: true, premiumUntil: true, userName: true }
    });

    if (!user) return reply.code(404).send({ error: "User not found" });

    // Prevent modifying Stripe subscriptions
    if (user.premiumSource === 'STRIPE') {
      return reply.code(403).send({
        error: "Cannot modify Stripe subscription through admin panel",
        details: "User must cancel via their account settings. Stripe subscriptions are managed automatically."
      });
    }

    const data: Prisma.UserUpdateInput = {};

    if (action === 'GRANT') {
      data.isPremium = true;
      data.premiumSource = 'MANUAL';
      data.premiumUntil = premiumUntil ? new Date(premiumUntil) : null;
    } else if (action === 'REVOKE') {
      data.isPremium = false;
      data.premiumSource = null;
      data.premiumUntil = null;
    } else if (action === 'EXTEND') {
      if (!user.isPremium || user.premiumSource !== 'MANUAL') {
        return reply.code(400).send({ error: "Can only extend manual premium grants" });
      }
      data.premiumUntil = premiumUntil ? new Date(premiumUntil) : null;
    }

    await prisma.user.update({ where: { id }, data });

    await logAdminAction(adminId, `SUBSCRIPTION_${action}`, id, {
      ...data,
      reason: reason || 'No reason provided',
      affectedUser: user.userName
    }, request.ip);

    return reply.send({ ok: true, data });
  });

  interface LogQuery {
    page?: string;
    limit?: string;
    source?: string;
    search?: string;
    from?: string;
    to?: string;
  }

  fastify.get<{ Querystring: LogQuery }>("/:id/logs", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? (sessionData as { id: string })?.id : sessionData) as string | undefined;
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const ok = await ensurePermission(request, reply, "MANAGE_USERS");
    if (!ok) return;

    const { id } = request.params as { id: string };
    const query = request.query;
    const page = Math.max(1, parseInt(query.page || "1") || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit || "20") || 20));
    const source = (query.source || "ALL").toUpperCase(); // ALL, ADMIN, USER
    const search = (query.search || "").trim();
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;

    // Common Date Filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (from && !isNaN(from.getTime())) dateFilter.gte = from;
    if (to && !isNaN(to.getTime())) dateFilter.lte = to;

    // Admin Logs Query Construction
    const adminWhere: Prisma.AdminLogWhereInput = {
      OR: [{ adminId: id }, { targetId: id }],
    };
    if (Object.keys(dateFilter).length > 0) adminWhere.createdAt = dateFilter;
    if (search) {
      adminWhere.AND = {
        OR: [
          { action: { contains: search, mode: "insensitive" } },
        ]
      };
    }

    // User Logs Query Construction
    const userWhere: Prisma.UserLogWhereInput = {
      OR: [{ userId: id }, { targetId: id }],
    };
    if (Object.keys(dateFilter).length > 0) userWhere.createdAt = dateFilter;
    if (search) {
      userWhere.AND = {
        OR: [
          { action: { contains: search, mode: "insensitive" } },
        ]
      };
    }

    // Execution strategy: Fetch (page * limit) from permitted sources, merge, sort, slice.
    const fetchLimit = page * limit;

    let adminLogs: AdminLog[] = [];
    let userLogs: UserLog[] = [];

    if (source === "ALL" || source === "ADMIN") {
      adminLogs = await prisma.adminLog.findMany({
        where: adminWhere,
        take: fetchLimit,
        orderBy: { createdAt: "desc" },
      });
    }

    if (source === "ALL" || source === "USER") {
      userLogs = await prisma.userLog.findMany({
        where: userWhere,
        take: fetchLimit,
        orderBy: { createdAt: "desc" },
      });
    }

    // Normalize and Merge
    const combined = [
      ...adminLogs.map(l => ({ ...l, type: 'ADMIN', actorId: l.adminId })),
      ...userLogs.map(l => ({ ...l, type: 'USER', actorId: l.userId }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination slice
    const startIndex = (page - 1) * limit;
    const paginated = combined.slice(startIndex, startIndex + limit);

    // Enrich with Actor Names
    const actorIds = new Set<string>();
    paginated.forEach(l => {
      if (l.actorId && l.actorId !== id) actorIds.add(l.actorId);
      if (l.targetId && l.targetId !== id) actorIds.add(l.targetId);
    });

    const actors = await prisma.user.findMany({
      where: { id: { in: Array.from(actorIds) } },
      select: { id: true, userName: true, image: true, role: { select: { name: true } } }
    });
    const actorMap = new Map(actors.map(a => [a.id, a]));

    const enriched = paginated.map(l => {
      const actorObj = actorMap.get(l.actorId);
      const targetObj = actorMap.get(l.targetId || '');

      const actorName = l.actorId === id ? 'Cet utilisateur' : (actorObj?.userName || l.actorId);
      const actorRole = l.actorId === id ? null : actorObj?.role?.name;
      const targetName = l.targetId === id ? 'Cet utilisateur' : (targetObj?.userName || l.targetId);

      return {
        ...l,
        actorName,
        actorRole,
        targetName,
      };
    });

    return reply.send({
      logs: enriched,
      meta: {
        page,
        limit,
        hasMore: combined.length > startIndex + limit
      }
    });
  });
}
