/**
 * OTP Service — Gestion des codes de vérification et Magic Links
 * pour le flux d'inscription email-only.
 */
import { prisma } from "@plinkk/prisma";
import { randomBytes } from "crypto";
import { EmailService } from "./emailService";
import { emailQuotaService } from "./emailQuotaService";

const OTP_EXPIRY_MINUTES = 15;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_SEND_COUNT = 3;
const OTP_MAX_VERIFY_ATTEMPTS = 3;
const OTP_BLOCK_DURATION_MINUTES = 10;

export interface OtpSendResult {
  ok: boolean;
  error?: "cooldown" | "max_sends" | "quota_exceeded" | "registration_disabled" | "send_failed";
  cooldownSeconds?: number;
}

export interface OtpVerifyResult {
  ok: boolean;
  email?: string;
  error?: "invalid_code" | "expired" | "used" | "blocked" | "not_found";
  blockedUntil?: Date;
  attemptsLeft?: number;
}

/**
 * Génère un code OTP à 6 chiffres (string pour conserver les zéros de tête)
 */
function generateCode(): string {
  const num = Math.floor(Math.random() * 1_000_000);
  return String(num).padStart(6, "0");
}

/**
 * Génère un token URL-safe pour le Magic Link
 */
function generateMagicToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Obtient le mois courant sous la forme "2026-03"
 */
function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Envoie (ou renvoie) un email OTP + Magic Link à l'adresse donnée.
 * Crée ou met à jour un enregistrement OtpCode en base.
 */
export async function sendOtp(email: string): Promise<OtpSendResult> {
  // Vérifier si les inscriptions email sont activées
  const regSetting = await prisma.systemConfig.findUnique({
    where: { key: "email_registration_enabled" },
  });
  if (regSetting && regSetting.value === "false") {
    return { ok: false, error: "registration_disabled" };
  }

  // Vérifier le quota mensuel (seuil d'urgence = 2900/3000)
  const quota = await emailQuotaService.getQuota(currentMonth());
  if (quota.otp >= 2900) {
    return { ok: false, error: "quota_exceeded" };
  }

  // Chercher un OtpCode récent pour cet email (non expiré, non utilisé)
  const existing = await prisma.otpCode.findFirst({
    where: { email, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    const secondsSinceLastSend =
      (Date.now() - new Date(existing.lastSentAt).getTime()) / 1000;
    if (secondsSinceLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
      return {
        ok: false,
        error: "cooldown",
        cooldownSeconds: Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastSend),
      };
    }

    if (existing.sendCount >= OTP_MAX_SEND_COUNT) {
      return { ok: false, error: "max_sends" };
    }

    // Renvoi : on régénère code + magic token, on incrémente sendCount
    const code = generateCode();
    const codeHash = await Bun.password.hash(code);
    const magicToken = generateMagicToken();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000);

    await prisma.otpCode.update({
      where: { id: existing.id },
      data: {
        codeHash,
        magicToken,
        expiresAt,
        sendCount: { increment: 1 },
        lastSentAt: new Date(),
        verifyAttempts: 0,
        blockedUntil: null,
      },
    });

    const sent = await sendOtpEmail(email, code, magicToken);
    if (!sent) {
      return { ok: false, error: "send_failed" };
    }
    await emailQuotaService.increment(currentMonth(), "otp");
    return { ok: true };
  }

  // Premier envoi : création d'un nouveau OtpCode
  const code = generateCode();
  const codeHash = await Bun.password.hash(code);
  const magicToken = generateMagicToken();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000);

  await prisma.otpCode.create({
    data: { email, codeHash, magicToken, expiresAt },
  });

  const sent = await sendOtpEmail(email, code, magicToken);
  if (!sent) {
    return { ok: false, error: "send_failed" };
  }
  await emailQuotaService.increment(currentMonth(), "otp");
  return { ok: true };
}

/**
 * Vérifie un code OTP saisi manuellement.
 */
export async function verifyOtpCode(
  email: string,
  code: string
): Promise<OtpVerifyResult> {
  const otp = await prisma.otpCode.findFirst({
    where: { email, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return { ok: false, error: "not_found" };

  // Vérifier le blocage temporaire
  if (otp.blockedUntil && otp.blockedUntil > new Date()) {
    return { ok: false, error: "blocked", blockedUntil: otp.blockedUntil };
  }

  // Vérifier l'expiration
  if (otp.expiresAt < new Date()) {
    return { ok: false, error: "expired" };
  }

  const match = await Bun.password.verify(code.trim(), otp.codeHash);

  if (!match) {
    const newAttempts = otp.verifyAttempts + 1;
    const shouldBlock = newAttempts >= OTP_MAX_VERIFY_ATTEMPTS;
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: {
        verifyAttempts: newAttempts,
        blockedUntil: shouldBlock
          ? new Date(Date.now() + OTP_BLOCK_DURATION_MINUTES * 60_000)
          : undefined,
      },
    });
    return {
      ok: false,
      error: "invalid_code",
      attemptsLeft: Math.max(0, OTP_MAX_VERIFY_ATTEMPTS - newAttempts),
    };
  }

  // Code correct → marquer comme utilisé
  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
  return { ok: true, email: otp.email };
}

/**
 * Vérifie un Magic Link via son token.
 */
export async function verifyMagicToken(token: string): Promise<OtpVerifyResult> {
  const otp = await prisma.otpCode.findUnique({ where: { magicToken: token } });

  if (!otp) return { ok: false, error: "not_found" };
  if (otp.used) return { ok: false, error: "used" };
  if (otp.expiresAt < new Date()) return { ok: false, error: "expired" };

  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
  return { ok: true, email: otp.email };
}

/**
 * Envoie l'email OTP via Resend.
 */
async function sendOtpEmail(
  email: string,
  code: string,
  magicToken: string
): Promise<boolean> {
  const baseUrl = (process.env.DASHBOARD_URL || "https://dash.plinkk.fr").replace(/\/$/, "");
  const magicLink = `${baseUrl}/join/magic/${magicToken}`;

  if (!EmailService.isConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[OTP][DEV] RESEND_API_KEY absente: email non envoyé.");
      console.info(`[OTP][DEV] email=${email} code=${code} magic=${magicLink}`);
      return true;
    }
    return false;
  }

  const sentId = await EmailService.send({
    to: email,
    subject: `${code} — Ton code de connexion Plinkk`,
    html: buildOtpEmailHtml(code, magicLink),
    tags: [{ name: "type", value: "otp" }],
  });

  return sentId !== null;
}

function buildOtpEmailHtml(code: string, magicLink: string): string {
  const bg = "#020617";
  const card = "#0f172a";
  const border = "#1e293b";
  const white = "#ffffff";
  const text = "#94a3b8";
  const muted = "#64748b";
  const violet = "#8b5cf6";
  const subtle = "#475569";

  // Digits individuels
  const digits = code
    .split("")
    .map(
      (d) =>
        `<td align="center" style="padding:0 4px;">
          <div style="
            display:inline-block;
            width:44px;height:56px;line-height:56px;
            background:#1e293b;border-radius:12px;
            font-size:28px;font-weight:700;color:${white};
            text-align:center;letter-spacing:0;
            border:1px solid #334155;
          ">${d}</div>
        </td>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Ton code Plinkk</title>
</head>
<body style="margin:0;padding:0;background:${bg};font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bg};">
    <tr><td align="center" style="padding:40px 16px;">

      <!-- Logo -->
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr><td align="center">
          <img src="https://cdn.plinkk.fr/logo.svg" alt="Plinkk" width="48" style="border-radius:16px;display:block;" />
        </td></tr>
        <tr><td align="center" style="padding-top:10px;">
          <span style="font-size:20px;font-weight:700;color:${white};">Plinkk</span>
        </td></tr>
      </table>

      <!-- Card -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;margin:0 auto;background:${card};border-radius:24px;border:1px solid ${border};">
        <tr><td style="padding:36px 32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${white};">Vérifie ton email</h1>
          <p style="margin:0 0 28px;font-size:14px;color:${text};line-height:1.6;">Utilise ce code ou clique sur le lien magique pour te connecter à Plinkk.</p>

          <!-- Code OTP -->
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
            <tr>${digits}</tr>
          </table>

          <p style="margin:0 0 6px;font-size:12px;color:${muted};text-align:center;">Ce code expire dans <strong style="color:${text};">15 minutes</strong>.</p>
          <p style="margin:0 0 28px;font-size:12px;color:${muted};text-align:center;">3 tentatives max avant blocage temporaire.</p>

          <!-- Séparateur -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr>
              <td style="border-top:1px solid ${border};"></td>
              <td style="padding:0 12px;white-space:nowrap;font-size:12px;color:${muted};">ou</td>
              <td style="border-top:1px solid ${border};"></td>
            </tr>
          </table>

          <!-- Magic Link Button -->
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
            <tr><td align="center" style="border-radius:12px;background:${violet};">
              <a href="${magicLink}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:${white};text-decoration:none;border-radius:12px;">
                ⚡ Connexion instantanée
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:11px;color:${subtle};text-align:center;word-break:break-all;">
            Lien : <a href="${magicLink}" style="color:${muted};">${magicLink}</a>
          </p>
        </td></tr>
      </table>

      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;margin:0 auto;">
        <tr><td style="padding:20px 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:${subtle};">Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
          <p style="margin:4px 0 0;font-size:12px;color:${subtle};">&copy; ${new Date().getFullYear()} Plinkk &middot; <a href="https://plinkk.fr" style="color:${muted};">plinkk.fr</a></p>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}
