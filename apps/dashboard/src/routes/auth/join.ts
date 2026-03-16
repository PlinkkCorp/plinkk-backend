/**
 * Routes d'inscription email-only (OTP + Magic Link)
 * - joinRoutes
 * 
 * GET  /join               → page formulaire email
 * POST /join               → demande d'envoi OTP
 * GET  /join/verify        → page saisie du code OTP
 * POST /join/verify        → vérification du code OTP
 * GET  /join/magic/:token  → connexion instantanée via Magic Link
 */
import { FastifyInstance } from "fastify";
import z from "zod";
import { prisma } from "@plinkk/prisma";
import { sendOtp, verifyOtpCode, verifyMagicToken } from "../../services/otpService";
import { replyView } from "../../lib/replyView";
import { createUserSession } from "../../services/sessionService";
import { logUserAction } from "../../lib/userLogger";
import { generateNanoId } from "../../utils/generateId";
import { ensureOnboardingCompletedForLegacyAccount } from "../../lib/onboarding";

/**
 * Enregistre les routes d'inscription email-only
 * @param fastify - L'instance fastify
 */
export function joinRoutes(fastify: FastifyInstance) {
  async function getCurrentUserForJoin(request: any) {
    const userId = request.session.get("data");
    if (!userId || String(userId).includes("__totp")) return null;
    return prisma.user.findUnique({
      where: { id: String(userId) },
      select: { id: true, email: true, hasPassword: true, emailVerified: true },
    });
  }

  fastify.get("/join", async (request, reply) => {
    const me = await getCurrentUserForJoin(request);
    if (me && (!me.hasPassword || me.emailVerified)) return reply.redirect("/");

    const queryEmail = (request.query).email ?? "";
    const formEmail = me?.hasPassword && !me.emailVerified ? me.email : queryEmail;
    const googleClientId = process.env.GOOGLE_OAUTH2_ID || process.env.ID_CLIENT;
    return replyView(reply, "join.ejs", null, {
      error: (request.query).error ?? null,
      email: formEmail,
      googleClientId,
    });
  });

  fastify.post("/join", async (request, reply) => {
    const me = await getCurrentUserForJoin(request);
    if (me && (!me.hasPassword || me.emailVerified)) return reply.redirect("/");

    const body = request.body as { email?: string };
    const rawEmail = (
      me?.hasPassword && !me.emailVerified ? me.email : body.email || ""
    )
      .trim()
      .toLowerCase();

    try {
      z.string().email().parse(rawEmail);
    } catch {
      return reply.redirect(
        `/join?error=${encodeURIComponent("Adresse email invalide")}&email=${encodeURIComponent(rawEmail)}`
      );
    }

    let result;
    try {
      result = await sendOtp(rawEmail);
    } catch {
      return reply.redirect(
        `/join?error=${encodeURIComponent("Impossible d'envoyer le code pour le moment. Réessaie dans quelques instants.")}&email=${encodeURIComponent(rawEmail)}`
      );
    }

    if (!result.ok) {
      const msgs: Record<string, string> = {
        cooldown: `Attends encore ${result.cooldownSeconds}s avant de renvoyer un email.`,
        max_sends: "Tu as atteint la limite d'envois. Réessaie dans 15 minutes.",
        quota_exceeded: "Le service d'inscription est temporairement indisponible. Réessaie plus tard.",
        registration_disabled: "Les inscriptions par email sont actuellement désactivées.",
        send_failed: "Impossible d'envoyer le code OTP pour le moment. Réessaie dans quelques instants.",
      };
      return reply.redirect(
        `/join?error=${encodeURIComponent(msgs[result.error!] ?? "Erreur inattendue")}&email=${encodeURIComponent(rawEmail)}`
      );
    }

    return reply.redirect(
      `/join/verify?email=${encodeURIComponent(rawEmail)}`
    );
  });

  fastify.get("/join/verify", async (request, reply) => {
    const me = await getCurrentUserForJoin(request);
    if (me && (!me.hasPassword || me.emailVerified)) return reply.redirect("/");

    const query = request.query as { email?: string; error?: string };
    const email = (me?.hasPassword && !me.emailVerified ? me.email : query.email || "").trim();
    if (!email) return reply.redirect("/join");

    return replyView(reply, "join-verify.ejs", null, {
      email,
      error: query.error ?? null,
    });
  });

  fastify.post("/join/verify", async (request, reply) => {
    const body = request.body as { email?: string; code?: string; otp?: string };
    const email = (body.email || "").trim().toLowerCase();
    const rawCode = String(body.code || body.otp || "").replace(/\D/g, "").trim();

    if (!email || !rawCode) {
      return reply.redirect(
        `/join/verify?email=${encodeURIComponent(email)}&error=${encodeURIComponent("Code manquant")}`
      );
    }

    if (rawCode.length !== 6) {
      return reply.redirect(
        `/join/verify?email=${encodeURIComponent(email)}&error=${encodeURIComponent("Code invalide (6 chiffres requis)")}`
      );
    }

    let result;
    try {
      result = await verifyOtpCode(email, rawCode);
    } catch {
      return reply.redirect(
        `/join/verify?email=${encodeURIComponent(email)}&error=${encodeURIComponent("Erreur de vérification. Réessaie.")}`
      );
    }

    if (!result.ok) {
      const msgs: Record<string, string> = {
        invalid_code: result.attemptsLeft === 0
          ? "Trop de tentatives. Compte bloqué 10 minutes."
          : `Code incorrect. Il te reste ${result.attemptsLeft} tentative${result.attemptsLeft! > 1 ? "s" : ""}.`,
        expired: "Ce code a expiré. Demande un nouveau code.",
        used: "Ce code a déjà été utilisé.",
        blocked: `Compte temporairement bloqué jusqu'à ${result.blockedUntil?.toLocaleTimeString("fr-FR")}.`,
        not_found: "Code introuvable. Demande un nouveau code.",
      };
      return reply.redirect(
        `/join/verify?email=${encodeURIComponent(email)}&error=${encodeURIComponent(msgs[result.error!] ?? "Erreur inattendue")}`
      );
    }

    let user;
    try {
      user = await createOrLoginUser(email, request);
      await createUserSession(user.id, request);
      await logUserAction(user.id, "JOIN_OTP", null, { email }, request.ip);
    } catch {
      return reply.redirect(
        `/join/verify?email=${encodeURIComponent(email)}&error=${encodeURIComponent("Connexion impossible pour le moment. Réessaie.")}`
      );
    }

    const onboardingCompleted = await ensureOnboardingCompletedForLegacyAccount(user);
    return reply.redirect(onboardingCompleted ? "/" : "/onboarding");
  });

  fastify.get("/join/magic/:token", async (request, reply) => {
    const { token } = request.params as { token: string };
    const result = await verifyMagicToken(token);

    if (!result.ok) {
      const msgs: Record<string, string> = {
        not_found: "Lien introuvable ou déjà utilisé.",
        used: "Ce lien a déjà été utilisé.",
        expired: "Ce lien a expiré. Demande un nouveau code.",
      };
      return reply.redirect(
        `/join?error=${encodeURIComponent(msgs[result.error!] ?? "Lien invalide")}`
      );
    }

    const user = await createOrLoginUser(result.email!, request);
    await createUserSession(user.id, request);
    await logUserAction(user.id, "JOIN_MAGIC_LINK", null, { email: result.email }, request.ip);

    const onboardingCompleted = await ensureOnboardingCompletedForLegacyAccount(user);
    return reply.redirect(onboardingCompleted ? "/" : "/onboarding");
  });
}

/**
 * Crée un nouvel utilisateur (sans mot de passe) ou retourne l'existant.
 * @param email - L'email de l'utilisateur
 * @param request - La requête
 * @returns L'utilisateur créé ou existant
 */
async function createOrLoginUser(email: string, request: any) {
  const existing = await prisma.user.findFirst({
    where: { email },
    select: { id: true, onboardingCompleted: true, emailVerified: true, createdAt: true },
  });
  if (existing) {
    if (!existing.emailVerified) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { emailVerified: true },
      });
    }
    return {
      id: existing.id,
      onboardingCompleted: existing.onboardingCompleted,
      createdAt: existing.createdAt,
    };
  }

  const base = email.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 20) || "user";
  const uid = `${base}-${generateNanoId(6)}`;

  const user = await prisma.user.create({
    data: {
      id: uid,
      userName: uid,
      name: uid,
      email,
      password: "",
      hasPassword: false,
      emailVerified: true,
      onboardingCompleted: false,
      role: {
        connectOrCreate: {
          where: { name: "USER" },
          create: { id: "USER", name: "USER" },
        },
      },
      cosmetics: { create: {} },
    },
    select: { id: true, onboardingCompleted: true, createdAt: true },
  });

  try {
    const trackingId =
      (request.cookies as Record<string, string>)?.["plinkk_tid"] || user.id;
    await prisma.funnelEvent.create({
      data: {
        event: "join_email_verified",
        sessionId: trackingId,
        userId: user.id,
        ip: request.ip,
        userAgent: request.headers["user-agent"] || null,
        referrer: request.headers.referer || null,
      },
    });
  } catch { }

  return user;
}
