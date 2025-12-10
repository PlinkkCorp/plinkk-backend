#!/usr/bin/env node
// Promote a user to ADMIN role.
// Usage: node scripts/set-admin.cjs <identifier>
// identifier can be user id, userName or email

const fs = require('fs');
const path = require('path');

const { prisma } = require('@plinkk/prisma');

async function findUser(identifier) {
  let user = await prisma.user.findUnique({ where: { id: identifier } }).catch(() => null);
  if (user) return user;
  user = await prisma.user.findUnique({ where: { email: identifier } }).catch(() => null);
  if (user) return user;
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
      const msg = `Utilisateur introuvable pour l'identifiant: ${identifier}`;
      console.error(msg);
      fs.writeFileSync(path.join(process.cwd(), 'set-admin-error.log'), msg);
      await prisma.$disconnect();
      process.exit(1);
    }

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

    const PERMISSIONS = [
      { key: 'VIEW_ADMIN', category: 'Administration', description: 'Accéder à l’interface administrative' },
      { key: 'MANAGE_ROLES', category: 'Administration', description: 'Créer / modifier / supprimer des rôles' },
      { key: 'ASSIGN_ROLE', category: 'Administration', description: 'Attribuer un rôle à un utilisateur' },
      { key: 'MANAGE_ANNOUNCEMENTS', category: 'Administration', description: 'Gérer les annonces / messages globaux' },
      { key: 'VIEW_ADMIN_LOGS', category: 'Administration', description: 'Consulter les journaux d’administration' },
      { key: 'VIEW_SYSTEM_HEALTH', category: 'Administration', description: 'Consulter l’état du système' },
      { key: 'RUN_SYSTEM_TASKS', category: 'Administration', description: 'Exécuter des tâches système' },
      { key: 'IMPERSONATE_USER', category: 'Administration', description: 'Se connecter en tant qu’un autre utilisateur' },
      { key: 'MANAGE_USERS', category: 'Modération', description: 'Modifier des utilisateurs' },
      { key: 'BAN_USER', category: 'Modération', description: 'Bannir un utilisateur' },
      { key: 'UNBAN_USER', category: 'Modération', description: 'Révoquer un bannissement' },
      { key: 'MANAGE_BANNED_SLUGS', category: 'Modération', description: 'Gérer les slugs interdits' },
      { key: 'EXTENDED_PLINKK_LIMIT', category: 'Utilisateur', description: 'Accès à un nombre de Plinkk supérieur au standard' },
      { key: 'EXTENDED_THEME_LIMIT', category: 'Utilisateur', description: 'Peut créer davantage de thèmes privés' },
      { key: 'CREATE_THEME', category: 'Contenu', description: 'Créer un thème' },
      { key: 'APPROVE_THEME', category: 'Contenu', description: 'Approuver ou rejeter des thèmes' },
      { key: 'ARCHIVE_THEME', category: 'Contenu', description: 'Archiver des thèmes' },
      { key: 'RESET_2FA_USER', category: 'Sécurité', description: 'Réinitialiser le 2FA d’un utilisateur' },
      { key: 'VIEW_STATS', category: 'Statistiques', description: 'Voir les statistiques globales avancées' },
      { key: 'MANAGE_BANNED_EMAILS', category: 'Administration', description: 'Gérer les emails bannis' },
      { key: 'MANAGE_SITE_SETTINGS', category: 'Administration', description: 'Paramètres généraux du site' },
      { key: 'MANAGE_COSMETICS_CATALOG', category: 'Administration', description: 'Gérer le catalogue de cosmétiques' },
      { key: 'MANAGE_PLINKK_SETTINGS_GLOBAL', category: 'Administration', description: 'Ajuster des paramètres plinkk globaux' },
      { key: 'DELETE_PLINKK', category: 'Modération', description: 'Supprimer une Plinkk' },
      { key: 'EDIT_ANY_PLINKK', category: 'Modération', description: 'Modifier n’importe quelle Plinkk' },
      { key: 'VIEW_USER_PRIVATE_EMAIL', category: 'Modération', description: 'Voir les emails privés des utilisateurs' },
      { key: 'VIEW_PRIVATE_PAGES', category: 'Modération', description: 'Voir les pages privées' },
      { key: 'SUSPEND_PLINKK', category: 'Modération', description: 'Suspendre temporairement une Plinkk' },
      { key: 'MANAGE_REPORTS', category: 'Modération', description: 'Gérer les signalements' }
    ];

    for (const p of PERMISSIONS) {
      await prisma.permission.upsert({
        where: { key: p.key },
        update: {},
        create: { key: p.key, category: p.category, description: p.description }
      });

      await prisma.rolePermission.upsert({
        where: { roleId_permissionKey: { roleId: role.id, permissionKey: p.key } },
        update: {},
        create: { roleId: role.id, permissionKey: p.key }
      });
    }

    await prisma.user.update({ where: { id: user.id }, data: { roleId: role.id } });

    console.log(`Utilisateur ${user.id} (${user.userName || user.email}) promu au rôle ADMIN.`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    const msg = 'Erreur en promouvant l\'utilisateur: ' + (e.message || e);
    console.error(msg);
    fs.writeFileSync(path.join(process.cwd(), 'set-admin-error.log'), msg + '\n' + e.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
