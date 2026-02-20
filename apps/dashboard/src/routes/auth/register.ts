import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import z from "zod";
import { prisma } from "@plinkk/prisma";
import { slugify, isReservedSlug, createPlinkkForUser } from "../../lib/plinkkUtils";
import profileConfig from "../../public/config/profileConfig";
import { createUserSession } from "../../services/sessionService";
import { redirectWithErrorToLogin } from "../../utils/errorRedirect";
import { logUserAction } from "../../lib/userLogger";

const USERNAME_MIN = 3;
const USERNAME_MAX = 30;

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get("/register", async (request, reply) => {
    const currentUserId = request.session.get("data");
    if (currentUserId && !String(currentUserId).includes("__totp")) {
      return reply.redirect("/");
    }
    return reply.redirect("/login#signup");
  });

  fastify.post("/register", async (req, reply) => {
    const currentUserId = req.session.get("data");
    if (currentUserId && !String(currentUserId).includes("__totp")) {
      return reply.redirect("/");
    }

    const { username, email, password, passwordVerif, acceptTerms } = req.body as {
      username: string;
      email: string;
      password: string;
      passwordVerif: string;
      acceptTerms?: string | boolean;
    };

    const rawUsername = (username || "").trim();
    const rawEmail = (email || "").trim();
    const rawPassword = password || "";

    if (rawUsername.length < USERNAME_MIN || rawUsername.length > USERNAME_MAX) {
      return redirectWithErrorToLogin(
        reply,
        `Le nom d'utilisateur doit contenir entre ${USERNAME_MIN} et ${USERNAME_MAX} caractères`,
        rawEmail,
        rawUsername,
        true
      );
    }

    if (password !== passwordVerif) {
      return redirectWithErrorToLogin(
        reply,
        "Les mots de passe ne correspondent pas",
        rawEmail,
        rawUsername,
        true
      );
    }

    if (rawPassword.length < 8) {
      return redirectWithErrorToLogin(
        reply,
        "Le mot de passe doit contenir au moins 8 caractères",
        rawEmail,
        rawUsername,
        true
      );
    }

    if (!(acceptTerms === "on" || acceptTerms === "true" || acceptTerms === true)) {
      return redirectWithErrorToLogin(
        reply,
        "Vous devez accepter les Conditions générales d'utilisation et la politique de confidentialité",
        rawEmail,
        rawUsername,
        true
      );
    }

    try {
      z.string().email().parse(rawEmail);
    } catch {
      return redirectWithErrorToLogin(reply, "Email invalide", rawEmail, rawUsername, true);
    }

    try {
      const generatedId = slugify(username);

      if (!generatedId || generatedId.length === 0) {
        return redirectWithErrorToLogin(
          reply,
          "Nom d'utilisateur invalide",
          rawEmail,
          rawUsername,
          true
        );
      }

      if (await isReservedSlug(prisma, generatedId)) {
        return redirectWithErrorToLogin(
          reply,
          "Cet @ est réservé, essaye un autre nom d'utilisateur",
          rawEmail,
          rawUsername,
          true
        );
      }

      const conflictUser = await prisma.user.findUnique({
        where: { id: generatedId },
        select: { id: true },
      });

      if (conflictUser) {
        return redirectWithErrorToLogin(
          reply,
          "Ce @ est déjà pris",
          rawEmail,
          rawUsername,
          true
        );
      }

      const conflictPlinkk = await prisma.plinkk.findFirst({
        where: { slug: generatedId },
        select: { id: true },
      });

      if (conflictPlinkk) {
        return redirectWithErrorToLogin(
          reply,
          "Ce @ est déjà pris",
          rawEmail,
          rawUsername,
          true
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          id: generatedId,
          userName: username,
          name: username,
          email: email,
          password: hashedPassword,
          role: {
            connectOrCreate: {
              where: { name: "USER" },
              create: { id: "USER", name: "USER" },
            },
          },
        },
      });

      try {
        await prisma.cosmetic.create({ data: { userId: user.id } });
      } catch (e) {
        req.log?.warn({ e }, "create default cosmetic failed");
      }

      await createDefaultPlinkk(req, user.id, username);
      await logUserAction(user.id, "REGISTER", null, { method: "PASSWORD" }, req.ip);

      const returnTo =
        (req.body as { returnTo: string })?.returnTo ||
        (req.query as { returnTo: string })?.returnTo;

      await createUserSession(user.id, req);

      return reply.redirect(returnTo || "/");
    } catch (error) {
      console.error(error);
      return reply.redirect("/login?error=" + encodeURIComponent("Utilisateur deja existant"));
    }
  });
}

export async function createDefaultPlinkk(req: any, userId: string, username: string) {
  try {
    const createdPlinkk = await createPlinkkForUser(prisma, userId, {
      name: username,
      slugBase: username,
      visibility: "PUBLIC",
      isActive: true,
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
          neonEnable: profileConfig.neonEnable ?? profileConfig.neonEnable === 0 ? 0 : 1,
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
          canvaEnable: profileConfig.canvaEnable,
          selectedCanvasIndex: profileConfig.selectedCanvasIndex,
        },
      });
    } catch (e) {
      req.log?.warn({ e }, "create default plinkkSettings failed");
    }

    try {
      const exampleLinks = profileConfig.links;
      if (Array.isArray(exampleLinks) && exampleLinks.length > 0) {
        const l = exampleLinks[0];
        await prisma.link.create({
          data: {
            // connect relations instead of scalar keys to satisfy Prisma's checked input type
            user: { connect: { id: userId } },
            plinkk: { connect: { id: createdPlinkk.id } },
            icon: l.icon || profileConfig.profileIcon || undefined,
            url: l.url || profileConfig.profileLink || "https://example.com",
            text: l.text || "Mon lien",
            name: l.name || "Exemple",
            description: l.description || null,
            showDescriptionOnHover:
              typeof l.showDescriptionOnHover === "boolean" ? l.showDescriptionOnHover : true,
            showDescription: typeof l.showDescription === "boolean" ? l.showDescription : true,
          },
        });
      }
    } catch (e) {
      req.log?.warn({ e }, "create example link failed");
    }
  } catch (e) {
    req.log?.warn({ e }, "auto-create default plinkk failed");
  }
}
