import { FastifyInstance } from "fastify";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import z from "zod";
import { prisma } from "@plinkk/prisma";
import { slugify } from "../../lib/plinkkUtils";
import { replyView } from "../../lib/replyView";
import { createUserSession } from "../../services/sessionService";
import { redirectWithError } from "../../utils/errorRedirect";
import { logUserAction } from "../../lib/userLogger";

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
        } catch { }
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
        `/totp${returnToQuery ? `?returnTo=${encodeURIComponent(returnToQuery)}` : ""
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
    await logUserAction(user.id, "LOGIN", null, { method: "PASSWORD" }, request.ip);

    return reply.redirect(returnTo || "/");
  });

  fastify.post("/impersonate/:id", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });

    // Check if requester is Admin
    const me = await prisma.user.findUnique({
      where: { id: String(meId) },
      include: { role: true },
    });

    if (!me || me.role?.name !== "ADMIN") {
      return reply.code(403).send({ error: "Forbidden" });
    }

    const { id } = request.params as { id: string };
    const target = await prisma.user.findUnique({
      where: { id },
    });

    if (!target) return reply.code(404).send({ error: "Target not found" });

    // Store original admin ID in session to allow "returning" if needed
    request.session.set("original_admin", meId);

    // Switch session to target user
    await createUserSession(target.id, request);
    await logUserAction(meId, "IMPERSONATE", target.id, { targetUsername: target.userName }, request.ip);
    return reply.send({ success: true });
  });

  fastify.post("/impersonate-link/:id", async (request, reply) => {
    const sessionData = request.session.get("data");
    const meId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    const me = await prisma.user.findUnique({
      where: { id: String(meId) },
      include: { role: true },
    });
    if (!me || me.role?.name !== "ADMIN") return reply.code(403).send({ error: "Forbidden" });

    const { id } = request.params as { id: string };
    const token = randomBytes(32).toString("hex");
    await prisma.magicLink.create({
      data: {
        token,
        userId: id,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      },
    });

    await logUserAction(meId, "GENERATE_MAGIC_LINK", id, {}, request.ip);
    return reply.send({ url: `/login/magic?token=${token}` });
  });

  fastify.get("/login/magic", async (request, reply) => {
    const { token } = request.query as { token?: string };
    if (!token) return reply.redirect("/login?error=invalid_token");
    const magic = await prisma.magicLink.findUnique({ where: { token } });
    if (!magic || magic.expiresAt < new Date()) {
      return reply.redirect("/login?error=expired_token");
    }
    await prisma.magicLink.delete({ where: { token } });
    await createUserSession(magic.userId, request);
    return reply.redirect("/");
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
        return `Votre compte a été banni pour la raison suivante: ${ban.reason || "Violation des règles"
          }. Veuillez contacter l'administration pour plus de détails à contact@plinkk.fr`;
      }
    }
  } catch { }

  return null;
}
