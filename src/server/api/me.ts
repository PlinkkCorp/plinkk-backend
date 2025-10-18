import { FastifyInstance } from "fastify";
import { authenticator } from "otplib";
import z from "zod";
import { verifyDomain } from "../../lib/verifyDNS";
import bcrypt from "bcrypt";
import QRCode from "qrcode";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import { PrismaClient, User } from "../../../generated/prisma/client";
import { apiMeThemesRoutes } from "./me/theme";
import { apiMePlinkksRoutes } from "./me/plinkks";
import path from "path";

// In-memory store for pending 2FA secrets awaiting user confirmation (keyed by userId)
const pending2fa = new Map<
  string,
  { secret: string; otpauth: string; createdAt: number }
>();

const prisma = new PrismaClient();

export function apiMeRoutes(fastify: FastifyInstance) {
  fastify.register(apiMeThemesRoutes, { prefix: "/themes" });
  fastify.register(apiMePlinkksRoutes, { prefix: "/plinkks" });
  // API: basculer la visibilité publique/privée de son profil
  fastify.post("/visibility", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { isPublic } = (request.body as { isPublic: string }) ?? {};
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: { isPublic: Boolean(isPublic) },
      select: { id: true, isPublic: true },
    });
    return reply.send(updated);
  });

  // API: changer l'email
  fastify.post("/email", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { email } = (request.body as { email: string }) || {};
    try {
      z.email().parse(email);
    } catch (e) {
      return reply.code(400).send({ error: "Email invalide" });
    }
    // vérifier unicité
    const exists = await prisma.user.findFirst({
      where: { email, NOT: { id: userId as string } },
      select: { id: true },
    });
    if (exists) return reply.code(409).send({ error: "Email déjà utilisé" });
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: { email },
      select: { id: true, email: true },
    });
    return reply.send(updated);
  });

  // API: changer le mot de passe
  fastify.post("/password", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { currentPassword, newPassword, confirmPassword } =
      (request.body as { currentPassword: string, newPassword: string, confirmPassword: string }) || {};
    if (!currentPassword || !newPassword || !confirmPassword)
      return reply.code(400).send({ error: "Champs manquants" });
    if (newPassword !== confirmPassword)
      return reply
        .code(400)
        .send({ error: "Les mots de passe ne correspondent pas" });
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });
    if (!user)
      return reply.code(404).send({ error: "Utilisateur introuvable" });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok)
      return reply.code(403).send({ error: "Mot de passe actuel incorrect" });
    if (await bcrypt.compare(newPassword, user.password))
      return reply
        .code(400)
        .send({ error: "Nouveau mot de passe identique à l'actuel" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId as string },
      data: { password: hashed },
    });
    return reply.send({ ok: true });
  });

  // API: supprimer mon compte (mdp + TOTP si activé)
  fastify.post("/delete", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { password, otp } = (request.body as { password: string, otp: string }) || {};
    if (!password)
      return reply.code(400).send({ error: "Mot de passe requis" });
    const me = await prisma.user.findUnique({
      where: { id: userId as string },
    });
    if (!me) return reply.code(404).send({ error: "Utilisateur introuvable" });
    const ok = await bcrypt.compare(password, me.password);
    if (!ok) return reply.code(403).send({ error: "Mot de passe incorrect" });
    if (me.twoFactorEnabled) {
      if (!otp || typeof otp !== "string")
        return reply.code(400).send({ error: "Code 2FA requis" });
      const valid = authenticator.check(otp, me.twoFactorSecret);
      if (!valid) return reply.code(403).send({ error: "Code 2FA invalide" });
    }
    await prisma.$transaction([
      prisma.link.deleteMany({ where: { userId: userId as string } }),
      prisma.label.deleteMany({ where: { userId: userId as string } }),
      prisma.socialIcon.deleteMany({ where: { userId: userId as string } }),
      prisma.backgroundColor.deleteMany({
        where: { userId: userId as string },
      }),
      prisma.neonColor.deleteMany({ where: { userId: userId as string } }),
      prisma.statusbar.deleteMany({ where: { userId: userId as string } }),
      prisma.cosmetic.deleteMany({ where: { userId: userId as string } }),
      prisma.user.delete({ where: { id: userId as string } }),
    ]);
    request.session.delete();
    return reply.send({ ok: true });
  });

  // API: basculer la visibilité publique de l'email (stockée dans cosmetics.settings.isEmailPublic)
  fastify.post("/email-visibility", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    // New behavior: use the dedicated `publicEmail` column on User to
    // control whether the account email is publicly visible. This avoids
    // coupling visibility to a cosmetics JSON object which doesn't exist
    // in the Prisma schema.
    const { isEmailPublic } = (request.body as { isEmailPublic: string }) ?? {};
    const me = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { email: true, publicEmail: true },
    });
    if (!me) return reply.code(404).send({ error: "Utilisateur introuvable" });
    const newPublicEmail = Boolean(isEmailPublic)
      ? me.publicEmail || me.email
      : null;
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: { publicEmail: newPublicEmail },
      select: { id: true, publicEmail: true },
    });
    return reply.send({
      id: updated.id,
      isEmailPublic: Boolean(updated.publicEmail),
    });
  });

  // API: basculer la 2FA
  fastify.post("/2fa", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    // If no secret yet -> generate a temporary secret stored in session, return qr/otpauth
    if (!user.twoFactorEnabled) {
      // Reuse a pending secret stored in session if present and not expired
      const pending: { secret: string, otpauth: string, createdAt: number } = pending2fa.get(userId as string) || null;
      const now = Date.now();
      let secret: string | null = null;
      let otpauth: string | null = null;
      if (
        pending &&
        pending.secret &&
        pending.createdAt &&
        now - pending.createdAt < 10 * 60 * 1000
      ) {
        secret = pending.secret;
        otpauth = pending.otpauth;
      } else {
        secret = authenticator.generateSecret();
        otpauth = authenticator.keyuri(user.userName, "Plinkk", secret);
        // store pending secret in session for confirmation step (expires after 10min)
        pending2fa.set(userId as string, { secret, otpauth, createdAt: now });
      }
      const qrCode = await QRCode.toDataURL(otpauth as string);
      return { qrCode, otpauth };
    }

    // If secret exists in DB -> expect an OTP to disable 2FA
    const { otp } = (request.body as { otp: string }) || {};
    if (!otp || typeof otp !== "string") {
      return reply
        .code(400)
        .send({ error: "OTP requis pour désactiver la 2FA" });
    }
    const valid = authenticator.check(otp, user.twoFactorSecret);
    if (!valid) return reply.code(403).send({ error: "Code 2FA invalide" });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: "", twoFactorEnabled: false },
    });
    return { successful: true };
  });

  // API: confirmer l'activation 2FA en vérifiant un OTP (ne désactive pas)
  fastify.post("/2fa/confirm", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { otp } = (request.body as { otp: string }) || {};
    if (!otp || typeof otp !== "string")
      return reply.code(400).send({ error: "OTP requis" });

    // Retrieve pending secret from session
    const pending: { secret: string, otpauth: string, createdAt: number } = pending2fa.get(userId as string) || null;
    if (!pending || !pending.secret)
      return reply.code(400).send({ error: "Aucune clé 2FA en attente" });
    // optional expiry check
    const now = Date.now();
    if (!pending.createdAt || now - pending.createdAt > 10 * 60 * 1000) {
      pending2fa.delete(userId as string);
      return reply
        .code(400)
        .send({ error: "La clé 2FA a expiré, régénère le QR" });
    }

    const valid = authenticator.check(otp, pending.secret);
    if (!valid) return reply.code(403).send({ error: "Code 2FA invalide" });

    // Persist to DB and clear pending
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: pending.secret, twoFactorEnabled: true },
    });
    pending2fa.delete(userId as string);
    return reply.send({ successful: true });
  });

  // API: mettre à jour des infos de base du compte (username, name, description)
  fastify.post("/profile", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = (request.body as { userName: string, name: string, description: string });
    let data: User;
    if (typeof body.userName === "string" && body.userName.trim())
      data.userName = body.userName.trim();
    if (typeof body.name === "string" && body.name.trim())
      data.name = body.name.trim();
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data,
      select: {
        id: true,
        userName: true,
        name: true,
      },
    });

    // If the account's display name was updated, also update the user's default Plinkk
    // so that account-level name and the main public page remain consistent.
    try {
      if (typeof body.name === "string" && body.name.trim()) {
        const defaultP = await prisma.plinkk.findFirst({
          where: { userId: userId as string, isDefault: true },
        });
        if (defaultP) {
          await prisma.plinkk.update({
            where: { id: defaultP.id },
            data: { name: body.name.trim() },
          });
        }
      }
    } catch (e) {
      // Non-blocking: log and continue
      request.log?.warn({ e }, "sync default plinkk name failed");
    }
    return reply.send(updated);
  });

  // API: ajouter un domaine ou le remplacer
  fastify.post("/host", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = (request.body as { hostname: string, plinkkId: string });
    const hostname = body.hostname.trim();
    const plinkkId = body.plinkkId
    const token = crypto.randomUUID();
    const updated = await prisma.host.upsert({
      where: { plinkkId: plinkkId },
      create: {
        id: hostname,
        plinkkId: plinkkId,
        verified: false,
        verifyToken: token,
      },
      update: {
        id: hostname,
        verified: false,
        verifyToken: token,
      },
    });
    return reply.send({
      token: updated.verifyToken,
      verified: updated.verified,
    });
  });

  // API: verifier si le domaine est valide
  fastify.post("/host/verify", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = (request.body as { plinkkId: string });
    const plinkkId = body.plinkkId
    const verified = await verifyDomain(plinkkId);
    return reply.send({ verified: verified });
  });

  // API: supprime le domaine
  fastify.delete("/host", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = (request.body as { plinkkId: string });
    const plinkkId = body.plinkkId
    const deleted = await prisma.host.delete({
      where: { plinkkId: plinkkId },
    });
    return reply.send({ successful: true });
  });

  // API: sélectionner des cosmétiques (flair, bannerUrl, frame, theme)
  fastify.post("/cosmetics", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = (request.body as { bannerUrl: string, banner: string, frame: string, theme: string });
    const u = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { cosmetics: true },
    });
    // Fallback to empty object to avoid runtime errors when cosmetics is null/undefined
    const cosmetics = u?.cosmetics;
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: {
        cosmetics: {
          upsert: {
            create: {
              flair: null,
              bannerUrl: body.bannerUrl ?? cosmetics.bannerUrl ?? null,
              banner: body.banner ?? cosmetics.banner ?? null,
              frame: body.frame ?? cosmetics.frame ?? null,
              theme: body.theme ?? cosmetics.theme ?? null,
            },
            update: {
              flair: null,
              bannerUrl: body.bannerUrl ?? cosmetics.bannerUrl ?? null,
              banner: body.banner ?? cosmetics.banner ?? null,
              frame: body.frame ?? cosmetics.frame ?? null,
              theme: body.theme ?? cosmetics.theme ?? null,
            },
          },
        },
      },
      select: { id: true, cosmetics: true },
    });
    return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
  });

  // API: uploader/remplacer la photo de profil (avatar) via data URL (base64)
  fastify.post("/avatar", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    // Récupération du fichier envoyé
    const file = await request.file();

    if (!file) return reply.code(400).send({ error: "Aucun fichier reçu" });
    if (!file.mimetype.startsWith("image/"))
      return reply.code(400).send({ error: "Format non supporté" });

    const buf = await file.toBuffer();

    // Limite stricte: 2 Mo
    if (buf.byteLength > 2 * 1024 * 1024)
      return reply.code(413).send({ error: "Image trop lourde (max 2 Mo)" });

    const mime = file.mimetype.toLowerCase();
    const ext = mime.endsWith("png")
      ? "png"
      : mime.endsWith("webp")
      ? "webp"
      : "jpg";

    const dir = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "uploads",
      "avatars"
    );
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    // Récupérer l’utilisateur
    const me = await prisma.user.findUnique({
      where: { id: userId as string },
    });
    if (!me) return reply.code(404).send({ error: "Utilisateur introuvable" });

    const hash = me.id;
    const dedupName = `${hash}.${ext}`;
    const filePath = path.join(dir, dedupName);
    const publicUrl = `/public/uploads/avatars/${dedupName}`;
    const oldVal = me?.image || null;

    // Écriture du fichier
    writeFileSync(filePath, buf);

    // Mise à jour de l’utilisateur
    await prisma.user.update({
      where: { id: me.id },
      data: { image: publicUrl },
    });

    // Suppression ancienne image si inutilisée
    if (oldVal && oldVal !== publicUrl) {
      const refs = await prisma.user.count({ where: { image: oldVal } });
      if (refs === 0) {
        try {
          let oldPath = "";
          if (oldVal.startsWith("/public/uploads/avatars/")) {
            oldPath = path.join(
              __dirname,
              oldVal.replace(/^\/public\//, "public/")
            );
          } else {
            oldPath = path.join(dir, oldVal);
          }
          if (existsSync(oldPath)) unlinkSync(oldPath);
        } catch {}
      }
    }

    return reply.send({ ok: true, file: dedupName, url: publicUrl });
  });
}
