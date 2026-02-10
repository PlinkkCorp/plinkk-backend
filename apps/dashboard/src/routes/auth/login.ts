import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import z from "zod";
import { prisma } from "@plinkk/prisma";
import { slugify } from "../../lib/plinkkUtils";
import { replyView } from "../../lib/replyView";
import { createUserSession } from "../../services/sessionService";
import { redirectWithError } from "../../utils/errorRedirect";

export function loginRoutes(fastify: FastifyInstance) {
  fastify.get("/login", async (request, reply) => {
    const currentUserId = request.session.get("data");

    if (currentUserId && !String(currentUserId).includes("__totp")) {
      try {
        const exists = await prisma.user.findUnique({
          where: { id: String(currentUserId) },
          select: { id: true },
        });
        if (exists) {
          return reply.redirect("/");
        }
        request.session.delete();
      } catch {
        try {
          request.session.delete();
        } catch {}
      }
    }

    const currentUser =
      currentUserId && String(currentUserId).includes("__totp")
        ? await prisma.user.findUnique({
            where: { id: String(currentUserId).split("__")[0] },
          })
        : null;

    const returnToQuery =
      (request.query as { returnTo: string })?.returnTo || "";

    const googleClientId = process.env.GOOGLE_OAUTH2_ID || process.env.ID_CLIENT;
    return await replyView(reply, "connect.ejs", currentUser, {
      returnTo: returnToQuery,
      googleClientId,
    });
  });

  fastify.post("/login", async (request, reply) => {
    const currentUserId = request.session.get("data");
    if (currentUserId && !String(currentUserId).includes("__totp")) {
      return reply.redirect("/");
    }

    const { email, password } = request.body as {
      email?: string;
      password: string;
    };

    const identifier = (email || "").trim();
    const isEmail = identifier.includes("@");

    if (isEmail) {
      try {
        z.string().email().parse(identifier);
      } catch {
        return redirectWithError(reply, "/login", "Email invalide", {
          email: identifier,
        });
      }
    }

    let user: any = null;

    if (isEmail) {
      user = await prisma.user.findFirst({
        where: { email: identifier },
        include: { role: true },
      });
    } else {
      const withoutAt = identifier.startsWith("@")
        ? identifier.slice(1)
        : identifier;
      const candidateId = slugify(withoutAt);
      user = await prisma.user.findFirst({
        where: {
          OR: [{ id: candidateId }, { userName: identifier }],
        },
        include: { role: true },
      });
    }

    if (!user) {
      return redirectWithError(reply, "/login", "Utilisateur introuvable", {
        email: identifier,
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return redirectWithError(reply, "/login", "Mot de passe incorrect", {
        email: identifier,
      });
    }

    const banCheckResult = await checkUserBan(user.email, identifier);
    if (banCheckResult) {
      return redirectWithError(reply, "/login", banCheckResult, {
        email: identifier,
      });
    }

    if (user.twoFactorEnabled) {
      const returnToQuery =
        (request.body as { returnTo: string })?.returnTo ||
        (request.query as { returnTo: string })?.returnTo;
      request.session.set("data", user.id + "__totp");
      return reply.redirect(
        `/totp${
          returnToQuery ? `?returnTo=${encodeURIComponent(returnToQuery)}` : ""
        }`
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const returnTo =
      (request.body as { returnTo: string })?.returnTo ||
      (request.query as { returnTo: string })?.returnTo;

    await createUserSession(user.id, request);

    return reply.redirect(returnTo || "/");
  });
}

async function checkUserBan(
  email: string,
  identifier: string
): Promise<string | null> {
  try {
    const ban = await prisma.bannedEmail.findFirst({
      where: { email, revoquedAt: null },
    });

    if (ban) {
      const isActive =
        ban.time == null ||
        ban.time < 0 ||
        new Date(ban.createdAt).getTime() + ban.time * 60000 > Date.now();

      if (isActive) {
        return `Votre compte a été banni pour la raison suivante: ${
          ban.reason || "Violation des règles"
        }. Veuillez contacter l'administration pour plus de détails à contact@plinkk.fr`;
      }
    }
  } catch {}

  return null;
}
