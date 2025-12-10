import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { prisma, User, Role } from "@plinkk/prisma";
import { verifyRoleIsStaff, verifyRoleAdmin } from "../lib/verifyRole";
import { getPublicPath } from "../services/plinkkService";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
    currentUser?: User & { role: Role | null };
    publicPath?: string;
  }
}

export function registerAuthDecorators(fastify: FastifyInstance) {
  fastify.decorateRequest("userId", null);
  fastify.decorateRequest("currentUser", null);
  fastify.decorateRequest("publicPath", null);
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.session.get("data");
  if (!userId || String(userId).includes("__totp")) {
    return reply.code(401).send({ error: "unauthorized" });
  }
  request.userId = userId as string;
}

export async function requireAuthWithUser(request: FastifyRequest, reply: FastifyReply) {
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
  request.publicPath = await getPublicPath(user.id);
}

export async function requireAuthRedirect(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.session.get("data");
  if (!userId || String(userId).includes("__totp")) {
    const returnTo = request.url || "/";
    return reply.redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId as string },
    include: { role: true },
  });

  if (!user) {
    const returnTo = request.url || "/";
    return reply.redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  request.userId = userId as string;
  request.currentUser = user;
  request.publicPath = await getPublicPath(user.id);
}

export async function requireStaff(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.session.get("data");
  if (!userId) {
    return reply.code(401).send({ error: "unauthorized" });
  }

  const user = await prisma.user.findFirst({
    where: { id: userId as string },
    include: { role: true },
  });

  if (!user || !verifyRoleIsStaff(user.role)) {
    return reply.code(403).send({ error: "forbidden" });
  }

  request.userId = userId as string;
  request.currentUser = user;
  request.publicPath = await getPublicPath(user.id);
}

export async function requireStaffRedirect(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.session.get("data");
  const returnTo = request.url || "/";

  if (!userId) {
    return reply.redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const user = await prisma.user.findFirst({
    where: { id: userId as string },
    include: { role: true },
  });

  if (!user) {
    return reply.redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (!verifyRoleIsStaff(user.role)) {
    return reply.code(403).view("erreurs/403.ejs", { currentUser: user });
  }

  request.userId = userId as string;
  request.currentUser = user;
  request.publicPath = await getPublicPath(user.id);
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.session.get("data");
  if (!userId) {
    return reply.code(401).send({ error: "unauthorized" });
  }

  const user = await prisma.user.findFirst({
    where: { id: userId as string },
    include: { role: true },
  });

  if (!user || !verifyRoleAdmin(user.role)) {
    return reply.code(403).send({ error: "forbidden" });
  }

  request.userId = userId as string;
  request.currentUser = user;
  request.publicPath = await getPublicPath(user.id);
}

export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply) {
  const userId = request.session.get("data");
  if (userId && !String(userId).includes("__totp")) {
    request.userId = userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      include: { role: true },
    });
    if (user) {
      request.currentUser = user;
      request.publicPath = await getPublicPath(user.id);
    }
  }
}
