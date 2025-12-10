import { FastifyRequest } from "fastify";
import { prisma } from "@plinkk/prisma";

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export async function createUserSession(
  userId: string,
  request: FastifyRequest
): Promise<string> {
  const session = await prisma.session.create({
    data: {
      userId,
      ip: request.ip,
      userAgent: request.headers["user-agent"] || "Unknown",
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });
  
  request.session.set("data", userId);
  request.session.set("sessionId", session.id);
  
  return session.id;
}

export async function deleteUserSession(
  sessionId: string | undefined
): Promise<void> {
  if (!sessionId) return;
  
  try {
    await prisma.session.delete({ where: { id: sessionId } });
  } catch {
  }
}

export async function validateSession(
  sessionId: string
): Promise<boolean> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    
    if (!session || session.expiresAt < new Date()) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

export async function updateSessionActivity(
  sessionId: string,
  currentPath: string
): Promise<void> {
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        currentPath: currentPath.split("?")[0],
        lastActiveAt: new Date(),
      },
    });
  } catch {
  }
}

export async function cleanExpiredSessions(): Promise<number> {
  const { count } = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
}
