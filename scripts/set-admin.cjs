require('dotenv/config');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

async function main() {
  const target = process.argv[2]; // Récupère l’argument passé au script

  if (!target) {
    console.error('❌ Erreur : Aucun target spécifié.\nUsage: node setAdmin.js <userId|userName>');
    process.exit(1);
  }

  // Recherche par id (slug) puis par userName
  let user = await prisma.user.findUnique({ where: { id: target } });
  if (!user) {
    user = await prisma.user.findFirst({ where: { userName: target } });
  }

  if (!user) {
    console.error(`❌ Utilisateur "${target}" introuvable.`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' },
    select: { id: true, userName: true, role: true },
  });

  console.log(`✅ OK: ${updated.userName} (${updated.id}) est maintenant ${updated.role}.`);
}

main()
  .catch((e) => {
    console.error('⚠️ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });