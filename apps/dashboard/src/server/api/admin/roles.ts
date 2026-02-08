import { FastifyInstance } from 'fastify';
import { prisma } from "@plinkk/prisma";
import { ensurePermission } from '../../../lib/permissions';
import { logAdminAction } from '../../../lib/adminLogger';

// const prisma = new PrismaClient();

export function apiAdminRolesRoutes(fastify: FastifyInstance) {

  fastify.get('/', async (request, reply) => {
    const ok = await ensurePermission(request, reply, 'MANAGE_ROLES');
    if (!ok) return;
    const roles = await prisma.role.findMany({
      include: { permissions: { include: { permission: true } }, users: { select: { id: true } } },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }]
    });
    const payload = roles.map(r => ({
      id: r.id,
      name: r.name,
      isStaff: r.isStaff,
      priority: r.priority,
      color: r.color,
      maxPlinkks: r.maxPlinkks,
      maxThemes: r.maxThemes,
      maxRedirects: r.maxRedirects,
      limits: r.limits,
      meta: r.meta,
      usersCount: r.users.length,
      permissions: r.permissions.map(p => p.permissionKey)
    }));
    return reply.send({ roles: payload });
  });

  fastify.get('/permissions', async (request, reply) => {
    const ok = await ensurePermission(request, reply, 'MANAGE_ROLES');
    if (!ok) return;
    const perms = await prisma.permission.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] });
    const grouped: Record<string, any[]> = {};
    for (const p of perms) {
      grouped[p.category] = grouped[p.category] || [];
      grouped[p.category].push({ key: p.key, description: p.description, system: p.system });
    }
    return reply.send({ permissions: grouped });
  });

  fastify.post('/', async (request, reply) => {
    const ok = await ensurePermission(request, reply, 'MANAGE_ROLES');
    if (!ok) return;
    const userId = request.session.get("data");
    const body = request.body as { name: string; isStaff?: boolean; priority?: number; color?: string; maxPlinkks?: number; maxThemes?: number; maxRedirects?: number; permissions?: string[] };
    const name = (body.name || '').trim().toUpperCase();
    if (!name) return reply.code(400).send({ error: 'missing_name' });
    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) return reply.code(409).send({ error: 'role_exists' });
    const role = await prisma.role.create({ data: { name, id: name, isStaff: !!body.isStaff, priority: body.priority || 0, color: body.color || null, maxPlinkks: body.maxPlinkks ?? 1, maxThemes: body.maxThemes ?? 0, maxRedirects: body.maxRedirects ?? 5 } });

    let permKeys = Array.isArray(body.permissions) ? body.permissions : [];
    if (!permKeys.length) {
      try {
        const userRole = await prisma.role.findUnique({ where: { name: 'USER' }, include: { permissions: true } });
        permKeys = (userRole?.permissions || []).map(p => p.permissionKey);
      } catch {}
    }
    if (permKeys.length) {
      for (const pk of permKeys) {
        try {
          await prisma.rolePermission.create({ data: { roleId: role.id, permissionKey: pk } });
        } catch {}
      }
    }
    await logAdminAction(userId, 'CREATE_ROLE', role.id, { name: role.name, ...body }, request.ip);
    return reply.send({ ok: true, roleId: role.id });
  });

  fastify.post('/reorder', async (request, reply) => {
    const ok = await ensurePermission(request, reply, 'MANAGE_ROLES');
    if (!ok) return;
    const userId = request.session.get("data");
    const body = request.body as { ids: string[] };
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
    if (!ids.length) return reply.code(400).send({ error: 'missing_ids' });
    const n = ids.length;
    const updates = ids.map((id, idx) => prisma.role.update({ where: { id }, data: { priority: (n - idx) } }));
    await prisma.$transaction(updates);
    await logAdminAction(userId, 'REORDER_ROLES', undefined, { ids }, request.ip);
    return reply.send({ ok: true });
  });

  fastify.patch('/:id', async (request, reply) => {
    const ok = await ensurePermission(request, reply, 'MANAGE_ROLES');
    if (!ok) return;
    const userId = request.session.get("data");
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; isStaff?: boolean; priority?: number; color?: string | null; maxPlinkks?: number; maxThemes?: number; maxRedirects?: number; addPermissions?: string[]; removePermissions?: string[] };
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return reply.code(404).send({ error: 'not_found' });
    const update: any = {};
    if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim().toUpperCase();
    if (typeof body.isStaff === 'boolean') update.isStaff = body.isStaff;
    if (typeof body.priority === 'number') update.priority = body.priority;
    if (typeof body.color === 'string') update.color = body.color.trim() || null;
    if (typeof body.maxPlinkks === 'number') update.maxPlinkks = body.maxPlinkks;
    if (typeof body.maxThemes === 'number') update.maxThemes = body.maxThemes;
    if (typeof body.maxRedirects === 'number') update.maxRedirects = body.maxRedirects;
    if (Object.keys(update).length) await prisma.role.update({ where: { id }, data: update });
    const add = Array.isArray(body.addPermissions) ? body.addPermissions : [];
    const remove = Array.isArray(body.removePermissions) ? body.removePermissions : [];
    if (add.length) {
      for (const pk of add) {
        try { await prisma.rolePermission.create({ data: { roleId: id, permissionKey: pk } }); } catch {}
      }
    }
    if (remove.length) {
      for (const pk of remove) {
        await prisma.rolePermission.deleteMany({ where: { roleId: id, permissionKey: pk } });
      }
    }
    await logAdminAction(userId, 'UPDATE_ROLE', id, { update, addPermissions: add, removePermissions: remove }, request.ip);
    return reply.send({ ok: true, id });
  });

  fastify.delete('/:id', async (request, reply) => {
    const ok = await ensurePermission(request, reply, 'MANAGE_ROLES');
    if (!ok) return;
    const userId = request.session.get("data");
    const { id } = request.params as { id: string };
    const role = await prisma.role.findUnique({ where: { id }, include: { users: true } });
    if (!role) return reply.code(404).send({ error: 'not_found' });
    if (role.users.length) return reply.code(400).send({ error: 'role_in_use' });
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await prisma.role.delete({ where: { id } });
    await logAdminAction(userId, 'DELETE_ROLE', id, { name: role.name }, request.ip);
    return reply.send({ ok: true, id });
  });
}
