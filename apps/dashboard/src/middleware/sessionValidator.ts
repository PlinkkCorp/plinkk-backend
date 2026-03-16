import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { updateSessionActivity } from "../services/sessionService";

const ACTIVITY_THROTTLE_MS = 60 * 1000;

export function registerSessionValidator(fastify: FastifyInstance) {
  fastify.addHook("preHandler", async (request, _reply) => {
    const userId = request.session.get("data");
    const sessionId = request.session.get("sessionId");

    if (!userId || String(userId).includes("__totp")) {
      return;
    }

    const isImpersonated = request.session.get("is_impersonated");
    const impExpires = request.session.get("impersonation_expires");
    if (isImpersonated && impExpires && Date.now() > impExpires) {
      const originalAdmin = request.session.get("original_admin");
      if (originalAdmin) {
        // Return to admin session
        request.session.set("data", originalAdmin);
        request.session.set("is_impersonated", false);
        request.session.set("impersonation_expires", null);
        request.session.set("original_admin", null);
        request.log.info({ adminId: originalAdmin }, "Impersonation session expired, reverted to admin.");
      } else {
        request.session.delete();
      }
      return;
    }

    if (sessionId) {
      try {
        const session = await prisma.session.findUnique({
          where: { id: sessionId as string },
        });

        if (!session || session.expiresAt < new Date()) {
          request.session.delete();
          return;
        }

        const currentPath = request.raw.url;
        const now = new Date();
        const lastActive = session.lastActiveAt
          ? new Date(session.lastActiveAt)
          : new Date(0);
        const shouldUpdate = now.getTime() - lastActive.getTime() > ACTIVITY_THROTTLE_MS;

        if (
          currentPath &&
          !currentPath.startsWith("/public") &&
          !currentPath.startsWith("/api") &&
          shouldUpdate
        ) {
          await updateSessionActivity(sessionId as string, currentPath);
        }
      } catch {}
    } else {
      try {
        const session = await prisma.session.create({
          data: {
            userId: String(userId),
            ip: request.ip,
            userAgent: request.headers["user-agent"] || "Unknown",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
        request.session.set("sessionId", session.id);
      } catch {}
    }
  });
}
