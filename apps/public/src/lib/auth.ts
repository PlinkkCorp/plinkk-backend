import { FastifyRequest } from "fastify";
import { prisma } from "@plinkk/prisma";

export async function getCurrentUser(request: FastifyRequest) {
  const sessionData = request.session.get("data");
  if (!sessionData) return null;
  const userId = typeof sessionData === "object" ? sessionData.id : sessionData;
  return await prisma.user.findUnique({
    where: { id: userId as string },
    include: { role: true },
  });
}
