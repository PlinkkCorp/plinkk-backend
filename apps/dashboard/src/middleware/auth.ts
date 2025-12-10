import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@plinkk/prisma";
import { verifyRoleIsStaff, verifyRoleAdmin } from "../lib/verifyRole";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
    currentUser?: any;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.session.get("data");
  if (!userId || String(userId).includes("__totp")) {
    return reply.code(401).send({ error: "unauthorized" });
  }
  request.userId = userId as string;
}

export async function requireAuthWithUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.session.get("data");
  if (!userId || String(userId).includes("__totp")) {
    return reply.code(401).send({ error: "unauthorized" });
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId as string },
    include: { role: true },
  });
  
  if (!user) {
    return reply.code(401).send({ error: "unauthorized" });
  }
  
  request.userId = userId as string;
  request.currentUser = user;
}

export async function requireStaff(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.session.get("data");
  if (!userId) {
    return reply.code(401).send({ error: "unauthorized" });
  }
  
  const user = await prisma.user.findFirst({
    where: { id: userId as string },
    select: { role: true },
  });
  
  if (!user || !verifyRoleIsStaff(user.role)) {
    return reply.code(403).send({ error: "forbidden" });
  }
  
  request.userId = userId as string;
  request.currentUser = user;
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.session.get("data");
  if (!userId) {
    return reply.code(401).send({ error: "unauthorized" });
  }
  
  const user = await prisma.user.findFirst({
    where: { id: userId as string },
    select: { role: true },
  });
  
  if (!user || !verifyRoleAdmin(user.role)) {
    return reply.code(403).send({ error: "forbidden" });
  }
  
  request.userId = userId as string;
  request.currentUser = user;
}

export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const userId = request.session.get("data");
  if (userId && !String(userId).includes("__totp")) {
    request.userId = userId as string;
  }
}
