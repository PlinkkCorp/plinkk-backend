#!/usr/bin/env node

const { PrismaClient } = require("../generated/prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const date = new Date(Date.now());
    date.setUTCFullYear(date.getUTCFullYear() - 3);
    console.log("Delete all to " + date.toISOString());
    const before = await prisma.user.count()
    await prisma.user.deleteMany({
      where: { lastLogin: { lte: date } },
    });
    const after = await prisma.user.count()
    console.log(`Finished deleted ${before - after} User(s) ( Before : ${before} User(s) / After : ${after} User(s) )`)
  } catch (e) {
    console.error("ERROR while deleting User:");
    console.error(e && e.stack ? e.stack : e);
    process.exitCode = 2;
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {}
  }
}

main();
