import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { logUserAction } from "../../lib/userLogger";
import { replyView } from "../../lib/replyView";
import { UserWithInclude } from "@plinkk/shared";

export function verifyRoutes(fastify: FastifyInstance) {
  /**
   * GET /verify-email?token=...
   * Consumes a verification token to verify a user's email address.
   */
  fastify.get("/verify-email", async (request, reply) => {
    const { token } = request.query as { token?: string };

    if (!token) {
      return reply.redirect("/login?error=" + encodeURIComponent("Token de vérification manquant"));
    }

    try {
      // Find the magic link in the database
      const magicLink = await prisma.magicLink.findUnique({
        where: { token },
      });

      if (!magicLink) {
        return reply.redirect("/login?error=" + encodeURIComponent("Lien de vérification invalide ou expiré"));
      }

      // Check for expiration
      if (magicLink.expiresAt < new Date()) {
        await prisma.magicLink.delete({ where: { token } }).catch(() => {});
        return reply.redirect("/login?error=" + encodeURIComponent("Lien de vérification expiré"));
      }

      // Update the user and get the user object for rendering
      const user = await prisma.user.update({
        where: { id: magicLink.userId },
        data: { emailVerified: true },
        include: {
          accounts: true,
          profile: true,
          plan: true,
          socials: true,
          stats: true,
          referral: true,
          referredBy: true,
          settings: true,
          featureFlags: true,
        }
      }) as UserWithInclude;

      // Log the action
      await logUserAction(magicLink.userId, "email_verified", null, { token }, String(request.ip || ""));

      // Delete the used magic link
      await prisma.magicLink.delete({
        where: { token },
      });

      // Render the success page
      return replyView(reply, "auth/verify-success.ejs", user, {});
    } catch (error) {
      request.log.error(error, "Error during email verification");
      return reply.redirect("/login?error=" + encodeURIComponent("Une erreur est survenue lors de la vérification"));
    }
  });
}
