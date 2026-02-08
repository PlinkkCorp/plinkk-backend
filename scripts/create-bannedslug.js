const { PrismaClient } = require('../generated/prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating BannedSlug table if missing...');
  const sql = `
    CREATE TABLE IF NOT EXISTS "BannedSlug" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "slug" TEXT NOT NULL UNIQUE,
      "reason" TEXT,
      "createdAt" DATETIME DEFAULT (datetime('now')),
      "updatedAt" DATETIME DEFAULT (datetime('now'))
    );
  `;
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log('CREATE TABLE executed (or already existed).');
  } catch (e) {
    console.error('Failed to create table:', e);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

main();
