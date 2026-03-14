import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { createPlinkkForUser } from "@plinkk/shared";
import profileConfig from "../../public/config/profileConfig";

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get("/register", async (request, reply) => {
    const currentUserId = request.session.get("data");
    if (currentUserId && !String(currentUserId).includes("__totp")) {
      return reply.redirect("/");
    }
    return reply.redirect("/join");
  });

  fastify.post("/register", async (req, reply) => {
    const currentUserId = req.session.get("data");
    if (currentUserId && !String(currentUserId).includes("__totp")) {
      return reply.redirect("/");
    }

    const { email } = req.body as { email?: string };
    const emailPrefill = String(email || "").trim().toLowerCase();
    return reply.redirect(`/join${emailPrefill ? `?email=${encodeURIComponent(emailPrefill)}` : ""}`);
  });
}

export async function createDefaultPlinkk(
  req: any,
  userId: string,
  username: string,
  opts?: { visibility?: "PUBLIC" | "PRIVATE"; isActive?: boolean }
) {
  try {
    const createdPlinkk = await createPlinkkForUser(prisma, userId, {
      name: username,
      slugBase: username,
      visibility: opts?.visibility ?? "PUBLIC",
      isActive: opts?.isActive ?? true,
    });

    try {
      await prisma.plinkkSettings.create({
        data: {
          plinkkId: createdPlinkk.id,
          profileLink: profileConfig.profileLink,
          profileImage: profileConfig.profileImage,
          profileIcon: profileConfig.profileIcon,
          profileSiteText: profileConfig.profileSiteText,
          userName: username,
          iconUrl: profileConfig.iconUrl,
          description: profileConfig.description,
          profileHoverColor: profileConfig.profileHoverColor,
          degBackgroundColor: profileConfig.degBackgroundColor,
          neonEnable: 1,
          buttonThemeEnable: profileConfig.buttonThemeEnable,
          EnableAnimationArticle: profileConfig.EnableAnimationArticle,
          EnableAnimationButton: profileConfig.EnableAnimationButton,
          EnableAnimationBackground: profileConfig.EnableAnimationBackground,
          backgroundSize: profileConfig.backgroundSize,
          selectedThemeIndex: profileConfig.selectedThemeIndex,
          selectedAnimationIndex: profileConfig.selectedAnimationIndex,
          selectedAnimationButtonIndex: profileConfig.selectedAnimationButtonIndex,
          selectedAnimationBackgroundIndex: profileConfig.selectedAnimationBackgroundIndex,
          animationDurationBackground: profileConfig.animationDurationBackground,
          delayAnimationButton: profileConfig.delayAnimationButton,
          canvaEnable: 0,
          selectedCanvasIndex: profileConfig.selectedCanvasIndex,
        },
      });
    } catch { req.log?.warn({ e: 'plinkkSettings' }, 'create default plinkkSettings failed'); }

    // Pas de lien preset — l'utilisateur configurera ses liens depuis le dashboard
  } catch (e) {
    req.log?.warn({ e }, "auto-create default plinkk failed");
  }
}
