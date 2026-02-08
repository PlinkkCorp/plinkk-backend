const { PrismaClient } = require('../generated/prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing prisma.bannedSlug.findMany()...');
    const list = await prisma.bannedSlug.findMany();
    console.log('OK — found', list.length, 'rows');
    console.log(JSON.stringify(list.slice(0,10), null, 2));
  } catch (e) {
    console.error('ERROR while querying BannedSlug:');
    console.error(e && e.stack ? e.stack : e);
    process.exitCode = 2;
  } finally {
    try { await prisma.$disconnect(); } catch (e) {}
  }
}

main();
