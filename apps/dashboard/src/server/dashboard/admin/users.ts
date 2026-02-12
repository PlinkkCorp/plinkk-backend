import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { logAdminAction } from "../../../lib/adminLogger";
import { requireAuth, requireAuthWithUser } from "../../../middleware/auth";

interface UserSearchQuery {
  q?: string;
  limit?: number;
}

export function adminUsersRoutes(fastify: FastifyInstance) {
  
  // Search Users
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

  // Get User Details (View)
  fastify.get("/:id", { preHandler: [requireAuthWithUser] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_USERS");
    if (!ok) return;

    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({
        where: { id },
        include: { 
            role: true, 
            cosmetics: true,
            _count: {
                select: { sessions: true, plinkks: true, links: true }
            }
        }
    });

    if (!user) return reply.code(404).send({ error: "User not found" });

    // Calculate Rank
    const rank = await prisma.user.count({
        where: { createdAt: { lt: user.createdAt } }
    }) + 1;

    // Get Plinkks & Views
    const plinkks = await prisma.plinkk.findMany({
        where: { userId: user.id },
        include: { settings: true },
        orderBy: { isDefault: 'desc' }
    });

    // Total Views
    const totalViews = plinkks.reduce((acc, p) => acc + (p.views || 0), 0);

    // Clicks (Links + Redirects)
    const [linkClicksAgg, redirectClicksAgg] = await Promise.all([
        prisma.link.aggregate({ where: { userId: user.id }, _sum: { clicks: true } }),
        prisma.redirect.aggregate({ where: { userId: user.id }, _sum: { clicks: true } })
    ]);
    const totalLinkClicks = (linkClicksAgg._sum.clicks || 0) + (redirectClicksAgg._sum.clicks || 0);

    // CTR
    const ctr = totalViews > 0 ? ((totalLinkClicks / totalViews) * 100).toFixed(2) + '%' : '0%';

    // Ban info
    const banInfo = await prisma.bannedEmail.findFirst({
        where: { email: user.email, revoquedAt: null },
        orderBy: { createdAt: 'desc' }
    });
    
    // Check available roles
    const roles = await prisma.role.findMany({ orderBy: { priority: 'desc' } });

    // API / Modal Response (JSON)
    const isModal = (request.query as { modal?: string }).modal === 'true';
    
    if (isModal || request.headers.accept?.includes('application/json')) {
        return reply.send({
            targetUser: user,
            stats: {
              rank,
              sessionCount: user._count.sessions,
              totalViews,
              totalLinkClicks,
              ctr,
              plinkkCount: user._count.plinkks
            },
            plinkks,
            banInfo,
            roles,
            publicPath: request.publicPath || process.env.FRONTEND_URL || "https://plinkk.fr"
        });
    }

    // Direct access -> Redirect to dashboard with openUser param
    return reply.redirect(`/admin?openUser=${id}`);
  });

  // Update Profile
  fastify.post("/:id/update-profile", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_USERS");
    if (!ok) return;

    const { id } = request.params as { id: string };
    const { email, userName } = request.body as { email: string, userName: string };

    await prisma.user.update({
        where: { id },
        data: { email, userName }
    });
    
    await logAdminAction(request.userId!, "UPDATE_PROFILE", id, { email, userName }, request.ip);
    return reply.redirect(`/admin/users/${id}`);
  });
  
  // Update Plinkk Slug
  fastify.post("/:id/update-slug", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_USERS");
    if (!ok) return;
    
    const { id } = request.params as { id: string };
    const { plinkkId, slug } = request.body as { plinkkId: string, slug: string };

    try {
        await prisma.plinkk.update({
            where: { id: plinkkId },
            data: { slug }
        });
        await logAdminAction(request.userId!, "UPDATE_SLUG", id, { plinkkId, slug }, request.ip);
    } catch (e) {
        // likely unique constraint
        // request.flash?.("error", "Slug indisponible");
        request.log.error(e);
    }
    return reply.redirect(`/admin/users/${id}`);
  });


  // Role Update
  fastify.post("/:id/role", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_USERS");
    if (!ok) return;

    const { id } = request.params as { id: string };
    const { role } = request.body as { role: string | { id: string } };
    const roleId = typeof role === 'string' ? role : role?.id; 

    if (!roleId) return reply.code(400).send({ error: "Missing role" });

    const roleObj = await prisma.role.findFirst({ where: { OR: [{ id: roleId }, { name: roleId }] } });
    if (!roleObj) return reply.code(400).send({ error: "Invalid role" });

    await prisma.user.update({
        where: { id },
        data: { roleId: roleObj.id }
    });
    
    await logAdminAction(request.userId!, "UPDATE_ROLE", id, { role: roleObj.name }, request.ip);
    return reply.send({ success: true });
  });

  // Badges Update
  fastify.post("/:id/badges", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_USERS");
    if (!ok) return;

    const { id } = request.params as { id: string };
    const { type, value } = request.body as { type: string, value: boolean };

    const data: any = {};

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

    await prisma.user.update({ where: { id }, data });
    await logAdminAction(request.userId!, "UPDATE_BADGES", id, { type, value }, request.ip);
    return reply.send({ success: true });
  });

  // 2FA Disable
  fastify.post("/:id/2fa/disable", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_USERS");
    if (!ok) return;

    const { id } = request.params as { id: string };
    await prisma.user.update({
        where: { id },
        data: { twoFactorEnabled: false, twoFactorSecret: null }
    });
    
    await logAdminAction(request.userId!, "DISABLE_2FA", id, {}, request.ip);
    return reply.send({ success: true });
  });

  // Force Password Reset
  fastify.post("/:id/force-password-reset", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_USERS");
    if (!ok) return;

    const { id } = request.params as { id: string };
    const { mustChange } = request.body as { mustChange: boolean };
    
    await prisma.user.update({
        where: { id },
        data: { mustChangePassword: !!mustChange }
    });
    
    await logAdminAction(request.userId!, "FORCE_PASSWORD_RESET", id, { mustChange }, request.ip);
    return reply.send({ success: true });
  });

  // Ban Email
  fastify.post("/:id/ban-email", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "BAN_USER");
    if (!ok) return;

    const { id } = request.params as { id: string };
    const { reason, time, deletePlinkk } = request.body as { reason: string, time?: number, deletePlinkk?: boolean };
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return reply.code(404).send({ error: "User not found" });

    const existing = await prisma.bannedEmail.findFirst({ where: { email: user.email, revoquedAt: null } });
    if (existing) return reply.code(400).send({ error: "already_banned" });

    await prisma.bannedEmail.create({
        data: {
            email: user.email,
            reason: reason || "Admin Ban",
            time: time || -1,
            deletePlinkk: !!deletePlinkk
        }
    });

    await logAdminAction(request.userId!, "BAN_USER", id, { reason, time }, request.ip);
    return reply.send({ success: true });
  });

  // Unban Email
  fastify.delete("/:id/ban-email", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "UNBAN_USER");
    if (!ok) return;

    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return reply.code(404).send({ error: "User not found" });

    const updated = await prisma.bannedEmail.updateMany({
        where: { email: user.email, revoquedAt: null },
        data: { revoquedAt: new Date() }
    });

    if (updated.count === 0) return reply.code(400).send({ error: "no_active_ban" });

    await logAdminAction(request.userId!, "UNBAN_USER", id, {}, request.ip);
    return reply.send({ success: true });
  });

  // Get Ban Status
  fastify.get("/:id/ban-email", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_USERS");
    if (!ok) return;
    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return reply.code(404).send({});

    const ban = await prisma.bannedEmail.findFirst({
        where: { email: user.email, revoquedAt: null },
        orderBy: { createdAt: 'desc' }
    });

    return reply.send({ active: !!ban, ban, until: (ban && ban.time > 0) ? new Date(ban.createdAt.getTime() + ban.time * 60000) : null });
  });

  // Impersonate
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

  // Delete User
  fastify.delete("/:id", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_USERS");
    if (!ok) return;

    const { id } = request.params as { id: string };
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return reply.code(404).send({ ok: false });
    
    await prisma.user.delete({ where: { id } });
    await logAdminAction(request.userId!, "DELETE_USER", id, { email: target.email }, request.ip);

    return reply.send({ success: true });
  });
}
