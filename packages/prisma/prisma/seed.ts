import { prisma } from '..';
import { PERMISSIONS } from '../permissions';

async function main() {
  const roles = [
    { name: 'USER',      isStaff: false, priority: 0, maxPlinkks: 1,  maxThemes: 0 },
    { name: 'BETA',      isStaff: false, priority: 1, maxPlinkks: 2,  maxThemes: 0 },
    { name: 'PARTNER',   isStaff: false, priority: 2, maxPlinkks: 5,  maxThemes: 1 },
    { name: 'MODERATOR', isStaff: true,  priority: 50, maxPlinkks: 3, maxThemes: 1 },
    { name: 'DEVELOPER', isStaff: true,  priority: 60, maxPlinkks: 5, maxThemes: 5 },
    { name: 'ADMIN',     isStaff: true,  priority: 100, maxPlinkks: 10, maxThemes: 10 },
  ];

  // Upsert des rôles de base
  for (const def of roles) {
    await prisma.role.upsert({
      where: { name: def.name },
      update: {
        isStaff: def.isStaff,
        priority: def.priority,
        maxPlinkks: def.maxPlinkks,
        maxThemes: def.maxThemes,
      },
      create: {
        id: def.name,
        name: def.name,
        isStaff: def.isStaff,
        priority: def.priority,
        maxPlinkks: def.maxPlinkks,
        maxThemes: def.maxThemes,
      },
    });
  }

  // Upsert des permissions systèmes
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { category: p.category, description: p.description || null, system: true },
      create: { key: p.key, category: p.category, description: p.description || null, system: true },
    });
  }

  // Attribution par défaut (RolePermission) en évitant les doublons
  for (const p of PERMISSIONS) {
    const targets = p.defaultRoles || [];
    for (const roleName of targets) {
      const role = await prisma.role.findUnique({ where: { name: roleName }, select: { id: true } });
      if (!role) continue;
      const existing = await prisma.rolePermission.findUnique({ where: { roleId_permissionKey: { roleId: role.id, permissionKey: p.key } } }).catch(()=>null);
      if (existing) continue;
      await prisma.rolePermission.create({ data: { roleId: role.id, permissionKey: p.key } });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })