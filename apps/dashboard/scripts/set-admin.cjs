#!/usr/bin/env node
// Promote a user to ADMIN role.
// Usage: node scripts/set-admin.cjs <identifier>
// identifier can be user id, userName or email

// Utilise le package workspace @plinkk/prisma (génération centralisée)
const { PrismaClient } = require('@plinkk/prisma/generated/prisma/client');
const prisma = new PrismaClient();

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

async function ensureAdminRole() {
  const name = 'ADMIN';
  const role = await prisma.role.upsert({
    where: { name },
    update: {},
    create: { id: name, name },
  });
  return role;
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

    const role = await ensureAdminRole();

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
