#!/usr/bin/env node
// Script minimal pour renommer un plinkk slug conflictué en une variante disponible
// Usage: node scripts/rename-plinkk-slug.js <existing-slug>

const { PrismaClient } = require('../generated/prisma/client');
const prisma = new PrismaClient();

async function findAvailable(base) {
  // try base, base-1, base-2...
  let i = 0;
  while (true) {
    const candidate = i === 0 ? base : `${base}-${i}`;
    const hitUser = await prisma.user.findUnique({ where: { id: candidate } });
    if (hitUser) { i++; continue; }
    const hitPlinkk = await prisma.plinkk.findFirst({ where: { slug: candidate } });
    if (!hitPlinkk) return candidate;
    i++;
  }
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: node scripts/rename-plinkk-slug.js <existing-slug>');
    process.exit(2);
  }
  const p = await prisma.plinkk.findFirst({ where: { slug } });
  if (!p) {
    console.error('Plinkk introuvable pour le slug:', slug);
    process.exit(1);
  }
  const base = slug.replace(/-\d+$/, '') || slug;
  const available = await findAvailable(base);
  if (available === slug) {
    console.log('Le slug est déjà optimal:', slug);
    process.exit(0);
  }
  // update
  await prisma.plinkk.update({ where: { id: p.id }, data: { slug: available } });
  console.log(`Renommé plinkk id=${p.id} slug: ${slug} -> ${available}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
