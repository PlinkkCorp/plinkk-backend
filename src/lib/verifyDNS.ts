import dns from "dns/promises";
import { PrismaClient } from "../../generated/prisma/client";

const prisma = new PrismaClient()

export async function verifyDomain(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { host: true } });
  if (!user.host) throw new Error("No domain set");

  try {
    const records = await dns.resolveTxt(`_plinkk-verification.${user.host.id}`);
    const flat = records.flat().join(" ");
    if (flat.includes(user.host.verifyToken)) {
      await prisma.host.update({
        where: { id: user.host.id },
        data: { verified: true }
      });
      return true;
    }
  } catch (err) {
    console.error("DNS verification failed:", err);
  }
  return false;
}