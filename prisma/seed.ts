import { PrismaClient } from '../generated/prisma/client';
const prisma = new PrismaClient();

async function main() {
  const roles = ['USER', 'BETA', 'PARTNER', 'ADMIN', 'DEVELOPER', 'MODERATOR'];

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
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