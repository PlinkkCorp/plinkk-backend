/**
 * Templates d'emails Plinkk
 * DA alignée sur les pages auth (connect.ejs, forgot-password.ejs)
 * Style: dark, minimal, glass-card, accents violet/indigo
 */

// — Tokens de design —
const colors = {
  bg: "#020617",         // slate-950
  card: "#0f172a",       // slate-900
  cardBorder: "#1e293b", // slate-800
  white: "#ffffff",
  text: "#94a3b8",       // slate-400
  muted: "#64748b",      // slate-500
  subtle: "#475569",     // slate-600
  link: "#a78bfa",       // violet-400
  violet: "#8b5cf6",     // violet-500
  indigo: "#6366f1",     // indigo-500
  emerald: "#10b981",
  rose: "#f43f5e",
};

/**
 * Styles de base partagés
 */
export const baseStyles = `
  <style>
    body { margin:0; padding:0; background-color:${colors.bg}; color:${colors.text}; font-family:'Segoe UI',Tahoma,Geneva,Verdana,-apple-system,BlinkMacSystemFont,sans-serif; }
    a { color:${colors.link}; text-decoration:none; }
  </style>
`;

/**
 * Layout d'email de base — glass-card dark minimal
 */
export function baseEmailTemplate(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${title}</title>
  ${baseStyles}
</head>
<body style="margin:0;padding:0;background-color:${colors.bg};font-family:'Segoe UI',Tahoma,Geneva,Verdana,-apple-system,BlinkMacSystemFont,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Logo -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <img src="https://cdn.plinkk.fr/logo.svg" alt="Plinkk" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:16px;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:12px;">
              <span style="font-size:20px;font-weight:700;color:${colors.white};letter-spacing:-0.02em;">Plinkk</span>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;margin:0 auto;background-color:${colors.card};border-radius:24px;border:1px solid ${colors.cardBorder};">
          <tr>
            <td style="padding:36px 32px;">
              ${content}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;margin:0 auto;">
          <tr>
            <td style="padding:24px 32px 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:${colors.subtle};">&copy; ${new Date().getFullYear()} Plinkk &middot; <a href="https://plinkk.fr" style="color:${colors.muted};text-decoration:none;">plinkk.fr</a></p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// — Helpers internes —

function heading(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${colors.white};letter-spacing:-0.02em;">${text}</h1>`;
}

function subtitle(text: string): string {
  return `<p style="margin:0 0 24px;font-size:14px;color:${colors.muted};">${text}</p>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${colors.text};">${text}</p>`;
}

function ctaButton(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td align="center" style="border-radius:12px;background:linear-gradient(135deg,${colors.violet},${colors.indigo});">
      <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:${colors.white};text-decoration:none;border-radius:12px;">${label}</a>
    </td>
  </tr>
</table>`;
}

function separator(): string {
  return `<hr style="border:none;border-top:1px solid ${colors.cardBorder};margin:24px 0;">`;
}

function infoBox(text: string, accentColor: string = colors.muted): string {
  return `<div style="background-color:${colors.bg};border:1px solid ${colors.cardBorder};border-radius:12px;padding:14px 16px;margin:16px 0;">
  <p style="margin:0;font-size:13px;line-height:1.5;color:${accentColor};">${text}</p>
</div>`;
}

function linkBox(url: string): string {
  return `<div style="background-color:${colors.bg};border:1px solid ${colors.cardBorder};border-radius:12px;padding:12px 16px;margin:8px 0 0;">
  <p style="margin:0;font-size:11px;color:${colors.muted};margin-bottom:4px;">Ou copiez ce lien :</p>
  <a href="${url}" style="font-size:12px;color:${colors.link};text-decoration:none;word-break:break-all;">${url}</a>
</div>`;
}

// — Templates —

/**
 * Email de bienvenue
 */
export function welcomeEmailTemplate(userName: string): string {
  const content = `
    ${heading("Bienvenue, " + userName)}
    ${subtitle("Votre compte Plinkk est pr\u00eat.")}
    ${paragraph("Nous sommes ravis de vous compter parmi nous. Avec Plinkk, cr\u00e9ez votre page de liens en quelques clics : personnalisez votre profil, ajoutez vos liens et partagez-le au monde.")}
    ${ctaButton("https://plinkk.fr/dashboard", "Acc\u00e9der au dashboard")}
    ${separator()}
    <p style="margin:0;font-size:12px;color:${colors.muted};">Besoin d'aide ? Contactez-nous sur <a href="https://plinkk.fr/support" style="color:${colors.link};">plinkk.fr/support</a></p>
  `;
  return baseEmailTemplate("Bienvenue sur Plinkk", content);
}

/**
 * Confirmation de changement d'email
 */
export function emailChangeConfirmationTemplate(userName: string, newEmail: string): string {
  const content = `
    ${heading("Email modifi\u00e9")}
    ${subtitle("Votre adresse a \u00e9t\u00e9 mise \u00e0 jour.")}
    ${paragraph("Bonjour <strong style=\"color:" + colors.white + ";\">" + userName + "</strong>, votre adresse email a \u00e9t\u00e9 modifi\u00e9e. Vous recevrez d\u00e9sormais vos notifications \u00e0 cette nouvelle adresse.")}
    <div style="background-color:${colors.bg};border:1px solid ${colors.cardBorder};border-radius:12px;padding:14px 16px;margin:16px 0 0;">
      <p style="margin:0 0 4px;font-size:11px;color:${colors.muted};text-transform:uppercase;letter-spacing:0.05em;">Nouvelle adresse</p>
      <p style="margin:0;font-size:15px;color:${colors.white};font-weight:500;">${newEmail}</p>
    </div>
    ${separator()}
    ${infoBox("\u26a0\ufe0f Si vous n'\u00eates pas \u00e0 l'origine de ce changement, contactez imm\u00e9diatement notre <a href=\"https://plinkk.fr/support\" style=\"color:" + colors.link + ";\">support</a>.", colors.text)}
  `;
  return baseEmailTemplate("Changement d'email", content);
}

/**
 * Réinitialisation de mot de passe
 */
export function passwordResetTemplate(userName: string, resetToken: string): string {
  const resetUrl = `${process.env.FRONTEND_URL || "https://dash.plinkk.fr"}/auth/reset-password?token=${resetToken}`;
  const content = `
    ${heading("R\u00e9initialisez votre mot de passe")}
    ${subtitle("Vous avez demand\u00e9 \u00e0 changer votre mot de passe.")}
    ${paragraph("Bonjour <strong style=\"color:" + colors.white + ";\">" + userName + "</strong>, cliquez sur le bouton ci-dessous pour cr\u00e9er un nouveau mot de passe :")}
    ${ctaButton(resetUrl, "R\u00e9initialiser mon mot de passe")}
    ${linkBox(resetUrl)}
    ${separator()}
    <p style="margin:0;font-size:12px;color:${colors.muted};font-style:italic;">Ce lien expirera dans 1 heure. Si vous n'\u00eates pas \u00e0 l'origine de cette demande, ignorez cet email.</p>
  `;
  return baseEmailTemplate("R\u00e9initialisation de mot de passe", content);
}

/**
 * Notification administrateur
 */
export function adminNotificationTemplate(subject: string, message: string, details?: Record<string, any>): string {
  let detailsHtml = "";
  if (details) {
    const rows = Object.entries(details)
      .map(([key, value]) => `<tr><td style="padding:8px 12px;font-size:13px;color:${colors.muted};border-bottom:1px solid ${colors.cardBorder};">${key}</td><td style="padding:8px 12px;font-size:13px;color:${colors.white};border-bottom:1px solid ${colors.cardBorder};">${value}</td></tr>`)
      .join("");
    detailsHtml = `
      ${separator()}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.bg};border:1px solid ${colors.cardBorder};border-radius:12px;overflow:hidden;">
        ${rows}
      </table>
    `;
  }

  const content = `
    <div style="display:inline-block;padding:4px 10px;border-radius:8px;background-color:rgba(139,92,246,0.12);margin-bottom:16px;">
      <span style="font-size:11px;font-weight:600;color:${colors.violet};text-transform:uppercase;letter-spacing:0.05em;">Admin</span>
    </div>
    ${heading(subject)}
    ${paragraph(message)}
    ${detailsHtml}
    ${separator()}
    <p style="margin:0;font-size:11px;color:${colors.subtle};">${new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}</p>
  `;
  return baseEmailTemplate("[Admin] " + subject, content);
}

/**
 * Vérification d'email
 */
export function emailVerificationTemplate(userName: string, verificationToken: string): string {
  const verificationUrl = `https://plinkk.fr/verify-email?token=${verificationToken}`;
  const content = `
    ${heading("V\u00e9rifiez votre email")}
    ${subtitle("Une derni\u00e8re \u00e9tape avant de commencer.")}
    ${paragraph("Bonjour <strong style=\"color:" + colors.white + ";\">" + userName + "</strong>, pour activer votre compte Plinkk, confirmez votre adresse email :")}
    ${ctaButton(verificationUrl, "V\u00e9rifier mon email")}
    ${linkBox(verificationUrl)}
    ${separator()}
    <p style="margin:0;font-size:12px;color:${colors.muted};">Si vous n'avez pas cr\u00e9\u00e9 de compte, ignorez simplement cet email.</p>
  `;
  return baseEmailTemplate("V\u00e9rification d'email", content);
}

/**
 * Notification générique (campagnes admin, etc.)
 */
export function genericNotificationTemplate(
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): string {
  const action = actionUrl && actionText ? ctaButton(actionUrl, actionText) : "";
  const content = `
    ${heading(title)}
    ${paragraph(message)}
    ${action}
  `;
  return baseEmailTemplate(title, content);
}

/**
 * Annonce de nouvelle fonctionnalité
 */
export function newFeatureTemplate(featureName: string, featureDescription: string, featureUrl: string): string {
  const content = `
    <div style="display:inline-block;padding:4px 10px;border-radius:8px;background-color:rgba(139,92,246,0.12);margin-bottom:16px;">
      <span style="font-size:11px;font-weight:600;color:${colors.violet};text-transform:uppercase;letter-spacing:0.05em;">Nouveaut\u00e9</span>
    </div>
    ${heading(featureName)}
    ${paragraph(featureDescription)}
    ${ctaButton(featureUrl, "D\u00e9couvrir")}
    ${separator()}
    <p style="margin:0;font-size:12px;color:${colors.muted};">Une question ? <a href="https://plinkk.fr/support" style="color:${colors.link};">Contactez-nous</a></p>
  `;
  return baseEmailTemplate("Nouveaut\u00e9 : " + featureName, content);
}
