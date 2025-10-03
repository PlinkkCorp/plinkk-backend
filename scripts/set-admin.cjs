require('dotenv/config');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

async function main() {
  const target = 'klaynight';

  // Cherche par id (slug) puis par userName
  let user = await prisma.user.findUnique({ where: { id: target } });
  if (!user) {
    user = await prisma.user.findFirst({ where: { userName: target } });
  }

  if (!user) {
    console.error(`Utilisateur "${target}" introuvable.`);
    process.exitCode = 1;
    return;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' },
    select: { id: true, userName: true, role: true },
  });

  console.log(`OK: ${updated.userName} (${updated.id}) est maintenant ${updated.role}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
