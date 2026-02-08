const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/dashboard/.env') });
const { PrismaClient } = require('../packages/prisma/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { PERMISSIONS } = require('../packages/prisma/permissions.js');

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
(async () => {
  try {
    const rolesDefs = [
      { name: 'USER', isStaff: false, priority: 0, maxPlinkks: 1, maxThemes: 0 },
      { name: 'BETA', isStaff: false, priority: 1, maxPlinkks: 2, maxThemes: 0 },
      { name: 'PARTNER', isStaff: false, priority: 2, maxPlinkks: 5, maxThemes: 1 },
      { name: 'MODERATOR', isStaff: true, priority: 50, maxPlinkks: 3, maxThemes: 1 },
      { name: 'DEVELOPER', isStaff: true, priority: 60, maxPlinkks: 5, maxThemes: 5 },
      { name: 'ADMIN', isStaff: true, priority: 100, maxPlinkks: 10, maxThemes: 10 },
    ];
    for (const r of rolesDefs) {
      await prisma.role.upsert({
        where: { name: r.name },
        update: { isStaff: r.isStaff, priority: r.priority, maxPlinkks: r.maxPlinkks, maxThemes: r.maxThemes },
        create: { id: r.name, name: r.name, isStaff: r.isStaff, priority: r.priority, maxPlinkks: r.maxPlinkks, maxThemes: r.maxThemes },
      });
    }
    for (const p of PERMISSIONS) {
      await prisma.permission.upsert({
        where: { key: p.key },
        update: { category: p.category, description: p.description || null, system: true },
        create: { key: p.key, category: p.category, description: p.description || null, system: true },
      });
      for (const roleName of (p.defaultRoles || [])) {
        const role = await prisma.role.findUnique({ where: { name: roleName } });
        if (!role) continue;
        await prisma.rolePermission.upsert({
          where: { roleId_permissionKey: { roleId: role.id, permissionKey: p.key } },
          update: {},
          create: { roleId: role.id, permissionKey: p.key },
        });
      }
    }
    console.log('Seeding permissions terminé.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
