import dns from "dns/promises";
import { prisma } from "@plinkk/prisma";

// const prisma = new PrismaClient()

export async function verifyDomain(plinkkId: string) {
  const plinkk = await prisma.plinkk.findUnique({ where: { id: plinkkId }, include: { host: true } });
  if (!plinkk.host) throw new Error("No domain set");

  try {
    const records = await dns.resolveTxt(`_plinkk-verification.${plinkk.host.id}`);
    const flat = records.flat().join(" ");
    if (flat.includes(plinkk.host.verifyToken)) {
      await prisma.host.update({
        where: { id: plinkk.host.id },
        data: { verified: true }
      });
      return true;
    }
  } catch (err) {
    console.error("DNS verification failed:", err);
  }
  return false;
}