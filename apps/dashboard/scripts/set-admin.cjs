#!/usr/bin/env node
// Promote a user to ADMIN role.
// Usage: node scripts/set-admin.cjs <identifier>
// identifier can be user id, userName or email

// Utilise le package workspace @plinkk/prisma (génération centralisée)
const { prisma } = require('@plinkk/prisma');

async function findUser(identifier) {
  // try by id
  let user = await prisma.user.findUnique({ where: { id: identifier } }).catch(() => null);
  if (user) return user;
  // try by email
  user = await prisma.user.findUnique({ where: { email: identifier } }).catch(() => null);
  if (user) return user;
  // try by userName
  return await prisma.user.findFirst({ where: { userName: identifier } }).catch(() => null);
}

async function main() {
  const identifier = process.argv[2];
  if (!identifier) {
    console.error('Usage: node scripts/set-admin.cjs <identifier>');
    process.exit(2);
  }

  try {
    const user = await findUser(identifier);
    if (!user) {
      console.error(`Utilisateur introuvable pour l'identifiant: ${identifier}`);
      await prisma.$disconnect();
      process.exit(1);
    }

    // Ensure ADMIN role exists
    const role = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { 
        name: 'ADMIN',
        isStaff: true,
        priority: 100,
        maxPlinkks: 100,
        maxThemes: 100
      },
    });

    await prisma.user.update({ where: { id: user.id }, data: { roleId: role.id } });

    console.log(`Utilisateur ${user.id} (${user.userName || user.email}) promu au rôle ADMIN.`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Erreur en promouvant l\'utilisateur:', e.message || e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
