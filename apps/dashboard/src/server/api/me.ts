import { FastifyInstance } from "fastify";
import { authenticator } from "otplib";
import z from "zod";
import { verifyDomain } from "../../lib/verifyDNS";
import bcrypt from "bcrypt";
import QRCode from "qrcode";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import { User, prisma } from "@plinkk/prisma";
import { apiMeThemesRoutes } from "./me/theme";
import { apiMePlinkksRoutes } from "./me/plinkks/index";
import path from "path";
import crypto from "crypto";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from "@aws-sdk/client-s3";
import { getS3Client } from "../../lib/fileUtils";

const pending2fa = new Map<
  string,
  { secret: string; otpauth: string; createdAt: number }
>();

// const prisma = new PrismaClient();

export function apiMeRoutes(fastify: FastifyInstance) {
  fastify.register(apiMeThemesRoutes, { prefix: "/themes" });
  fastify.register(apiMePlinkksRoutes, { prefix: "/plinkks" });

  fastify.post("/apikey", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    const newKey = "plk_" + crypto.randomUUID().replace(/-/g, "");

    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: { apiKey: newKey },
      select: { apiKey: true },
    });

    return reply.send({ apiKey: updated.apiKey });
  });

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

  fastify.post("/email", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { email } = (request.body as { email: string }) || {};
    try {
      z.email().parse(email);
    } catch (e) {
      return reply.code(400).send({ error: "Email invalide" });
    }
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

  fastify.post("/password", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { currentPassword, newPassword, confirmPassword } =
      (request.body as {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
      }) || {};
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

  fastify.post("/delete", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { password, otp } =
      (request.body as { password: string; otp: string }) || {};
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

  fastify.post("/email-visibility", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
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

  fastify.post("/2fa", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.twoFactorEnabled) {
      const pending: { secret: string; otpauth: string; createdAt: number } =
        pending2fa.get(userId as string) || null;
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
        pending2fa.set(userId as string, { secret, otpauth, createdAt: now });
      }
      const qrCode = await QRCode.toDataURL(otpauth as string);
      return { qrCode, otpauth };
    }

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

  fastify.post("/2fa/confirm", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { otp } = (request.body as { otp: string }) || {};
    if (!otp || typeof otp !== "string")
      return reply.code(400).send({ error: "OTP requis" });

    const pending: { secret: string; otpauth: string; createdAt: number } =
      pending2fa.get(userId as string) || null;
    if (!pending || !pending.secret)
      return reply.code(400).send({ error: "Aucune clé 2FA en attente" });
    const now = Date.now();
    if (!pending.createdAt || now - pending.createdAt > 10 * 60 * 1000) {
      pending2fa.delete(userId as string);
      return reply
        .code(400)
        .send({ error: "La clé 2FA a expiré, régénère le QR" });
    }

    const valid = authenticator.check(otp, pending.secret);
    if (!valid) return reply.code(403).send({ error: "Code 2FA invalide" });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: pending.secret, twoFactorEnabled: true },
    });
    pending2fa.delete(userId as string);
    return reply.send({ successful: true });
  });

  fastify.post("/profile", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = request.body as {
      userName: string;
      name: string;
      description: string;
    };
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
      request.log?.warn({ e }, "sync default plinkk name failed");
    }
    return reply.send(updated);
  });

  fastify.post("/host", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    const body = request.body as { hostname: string; plinkkId: string };
    if (!body.hostname || !body.plinkkId) {
      return reply.code(400).send({ error: "Données manquantes" });
    }

    const hostname = body.hostname.trim();
    const plinkkId = body.plinkkId;

    const plinkk = await prisma.plinkk.findFirst({
      where: { id: plinkkId, userId: userId as string },
    });
    if (!plinkk) return reply.code(404).send({ error: "Plinkk introuvable" });

    const existingHost = await prisma.host.findUnique({
      where: { id: hostname },
    });
    if (existingHost && existingHost.plinkkId !== plinkkId) {
      return reply
        .code(409)
        .send({ error: "Ce nom de domaine est déjà utilisé" });
    }

    const token = crypto.randomUUID();

    try {
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
    } catch (e) {
      request.log.error(e);
      return reply
        .code(500)
        .send({ error: "Erreur lors de l'enregistrement du domaine" });
    }
  });

  fastify.post("/host/verify", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = request.body as { plinkkId: string };
    const plinkkId = body.plinkkId;
    const verified = await verifyDomain(plinkkId);
    return reply.send({ verified: verified });
  });

  fastify.delete("/host", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = request.body as { plinkkId: string };
    const plinkkId = body.plinkkId;
    const deleted = await prisma.host.delete({
      where: { plinkkId: plinkkId },
    });
    return reply.send({ successful: true });
  });

  fastify.post("/cosmetics", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = request.body as {
      bannerUrl?: string;
      banner?: string;
      frame?: string;
      theme?: string;
      flair?: string;
      data?: any;
    };

    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: {
        cosmetics: {
          upsert: {
            create: {
              bannerUrl: body.bannerUrl ?? "",
              banner: body.banner ?? "",
              frame: body.frame ?? "none",
              theme: body.theme ?? "system",
              flair: body.flair ?? "OG",
              data: body.data ?? {},
            },
            update: {
              bannerUrl: body.bannerUrl,
              banner: body.banner,
              frame: body.frame,
              theme: body.theme,
              flair: body.flair,
              data: body.data,
            },
          },
        },
      },
      select: {
        id: true,
        cosmetics: {
          select: {
            id: true,
            flair: true,
            frame: true,
            theme: true,
            bannerUrl: true,
            banner: true,
            data: true,
          },
        },
      },
    });
    return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
  });

  fastify.post("/avatar", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    const file = await request.file();

    if (!file) return reply.code(400).send({ error: "Aucun fichier reçu" });
    if (!file.mimetype.startsWith("image/"))
      return reply.code(400).send({ error: "Format non supporté" });

    const buf = await file.toBuffer();

    // Limite : 2 Mo
    if (buf.byteLength > 2 * 1024 * 1024)
      return reply.code(413).send({ error: "Image trop lourde (max 2 Mo)" });

    const mime = file.mimetype.toLowerCase();
    const ext = mime.endsWith("png")
      ? "png"
      : mime.endsWith("webp")
      ? "webp"
      : "jpg"; // plinkk-image

    /* const dir = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "uploads",
      "avatars"
    );
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); */

    const me = await prisma.user.findUnique({
      where: { id: userId as string },
    });
    if (!me) return reply.code(404).send({ error: "Utilisateur introuvable" });

    const hash = me.id;
    const dedupName = `${hash}.${ext}`;
    // const filePath = path.join(dir, dedupName);
    // const publicUrl = `/public/uploads/avatars/${dedupName}`;
    const oldVal = me?.image || null;

    const upload = new Upload({
      client: getS3Client(),
      params: {
        Bucket: "plinkk-image/profile",
        Key: dedupName,
        Body: buf,
      },
      partSize: 5 * 1024 * 1024,
    });

    const up = await upload.done()

    // writeFileSync(filePath, buf);

    await prisma.user.update({
      where: { id: me.id },
      data: { image: up.Location },
    });

    /* if (oldVal && oldVal !== publicUrl) {
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
    } */

    return reply.send({ ok: true, file: dedupName, url: up.Location });
  });
}
