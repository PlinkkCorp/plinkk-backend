import { Resend } from "resend";
import * as emailTemplates from "./emailTemplates";
import { prisma } from "@plinkk/prisma";
import { emailQuotaService } from "./emailQuotaService";
import { emailQueueService } from "./emailQueueService";

// Configuration Resend
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn(
    "⚠️  RESEND_API_KEY non définie. L'envoi d'emails sera désactivé."
  );
}

// Initialiser Resend uniquement si la clé API est présente
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Interface pour les options d'envoi d'email
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: { name: string; value: string }[];
  critical?: boolean; // Si true, ignore le mode économie
}

/**
 * Service d'envoi d'emails via Resend
 */
export class EmailService {
  private static fromEmail = "noreply@plinkk.fr";

  /**
   * Vérifie si l'email peut être envoyé selon le mode économie
   * Si non, met en queue pour envoi ultérieur
   */
  private static async canSendEmail(
    critical: boolean = false,
    options?: SendEmailOptions,
    emailType?: string
  ): Promise<{ canSend: boolean; reason?: string; queued?: boolean; queueId?: string }> {
    // Les emails critiques passent toujours
    if (critical) {
      return { canSend: true };
    }

    // Vérifier si le mode économie est activé
    const economyModeSetting = await prisma.siteSetting.findUnique({
      where: { key: "email_economy_mode_enabled" }
    });

    if (economyModeSetting?.value !== "true") {
      return { canSend: true }; // Mode économie désactivé
    }

    // Mode économie activé - vérifier le quota
    const now = new Date();
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const quota = await emailQuotaService.getQuota(currentMonth);

    if (quota.total >= emailQuotaService.ALERT_90) {
      // On a dépassé 90% du quota - mettre en queue au lieu de bloquer
      if (options) {
        try {
          const queueId = await emailQueueService.enqueue(
            options,
            emailType || "other",
            0 // Priorité normale
          );
          console.log(`📬 Email mis en queue (${queueId}) : quota à ${quota.percentUsed}%`);
          return { 
            canSend: false, 
            reason: `Mode économie actif : quota à ${quota.percentUsed}% (${quota.total}/${quota.limit})`,
            queued: true,
            queueId
          };
        } catch (error) {
          console.error("❌ Erreur mise en queue:", error);
          return { 
            canSend: false, 
            reason: "Erreur mise en queue"
          };
        }
      }
      
      return { 
        canSend: false, 
        reason: `Mode économie actif : quota à ${quota.percentUsed}% (${quota.total}/${quota.limit})`
      };
    }

    return { canSend: true };
  }

  /**
   * Envoyer un email
   * @param options Options d'envoi
   * @returns ID de l'email envoyé, ID de queue si mis en attente, ou null si échec
   */
  static async send(options: SendEmailOptions, emailType: string = "other"): Promise<string | null> {
    if (!resend) {
      console.error("❌ Service d'email non configuré (RESEND_API_KEY manquante)");
      return null;
    }

    // Vérifier le mode économie
    const { canSend, reason, queued, queueId } = await this.canSendEmail(options.critical, options, emailType);
    if (!canSend) {
      if (queued) {
        // Email mis en queue, retourner l'ID de la queue
        return `queued:${queueId}`;
      }
      console.warn(`⚠️ Email non envoyé : ${reason}`);
      console.warn(`   Destinataire: ${options.to}, Sujet: ${options.subject}`);
      return null;
    }

    try {
      const { data, error } = await resend.emails.send({
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        tags: options.tags,
      });

      if (error) {
        console.error("❌ Erreur lors de l'envoi d'email:", error);
        return null;
      }

      console.log("✅ Email envoyé avec succès:", data?.id);
      return data?.id || null;
    } catch (error) {
      console.error("❌ Exception lors de l'envoi d'email:", error);
      return null;
    }
  }

  /**
   * Envoyer un email de bienvenue (non-critique, respect mode économie)
   */
  static async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    const result = await this.send({
      to,
      subject: "Bienvenue sur Plinkk ! 🎉",
      html: emailTemplates.welcomeEmailTemplate(userName),
      text: `Bienvenue sur Plinkk, ${userName} ! Commencez à créer votre page de liens : https://plinkk.fr/dashboard`,
      tags: [{ name: "category", value: "welcome" }],
      critical: false,
    }, "welcome");

    return result !== null;
  }

  /**
   * Envoyer un email de confirmation de changement d'email (critique)
   */
  static async sendEmailChangeConfirmation(
    to: string,
    userName: string
  ): Promise<boolean> {
    const result = await this.send({
      to,
      subject: "Confirmation de changement d'email",
      html: emailTemplates.emailChangeConfirmationTemplate(userName, to),
      text: `Bonjour ${userName}, votre adresse email a été modifiée avec succès sur Plinkk.`,
      tags: [{ name: "category", value: "security" }],
      critical: true,
    }, "other");

    return result !== null;
  }

  /**
   * Envoyer un email de réinitialisation de mot de passe (critique)
   */
  static async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetToken: string
  ): Promise<boolean> {
    const result = await this.send({
      to,
      subject: "Réinitialisation de votre mot de passe",
      html: emailTemplates.passwordResetTemplate(userName, resetToken),
      text: `Bonjour ${userName}, réinitialisez votre mot de passe ici : https://dash.plinkk.fr/reset-password?token=${resetToken}`,
      tags: [{ name: "category", value: "security" }],
      critical: true,
    }, "other");

    return result !== null;
  }

  /**
   * Envoyer un email de notification administrateur
   */
  static async sendAdminNotification(
    subject: string,
    message: string,
    adminEmails: string[],
    details?: Record<string, any>
  ): Promise<boolean> {
    const result = await this.send({
      to: adminEmails,
      subject: `[Admin] ${subject}`,
      html: emailTemplates.adminNotificationTemplate(subject, message, details),
      text: message,
      tags: [{ name: "category", value: "admin" }],
    });

    return result !== null;
  }

  /**
   * Envoyer un email de vérification d'email
   */
  static async sendEmailVerification(
    to: string,
    userName: string,
    verificationToken: string
  ): Promise<boolean> {
    const result = await this.send({
      to,
      subject: "Vérifiez votre adresse email",
      html: emailTemplates.emailVerificationTemplate(userName, verificationToken),
      text: `Bonjour ${userName}, vérifiez votre email ici : https://dash.plinkk.fr/verify-email?token=${verificationToken}`,
      tags: [{ name: "category", value: "verification" }],
    });

    return result !== null;
  }

  /**
   * Envoyer un email générique avec template personnalisé
   */
  static async sendGenericEmail(
    to: string | string[],
    subject: string,
    title: string,
    message: string,
    actionUrl?: string,
    actionText?: string,
    trackingPixelUrl?: string,
    emailType: string = "other"
  ): Promise<boolean> {
    const result = await this.send({
      to,
      subject,
      html: emailTemplates.genericNotificationTemplate(title, message, actionUrl, actionText, trackingPixelUrl),
      text: message,
    }, emailType);

    return result !== null;
  }

  /**
   * Envoyer un email pour une nouvelle fonctionnalité
   */
  static async sendNewFeatureEmail(
    to: string | string[],
    featureName: string,
    featureDescription: string,
    featureUrl: string
  ): Promise<boolean> {
    const result = await this.send({
      to,
      subject: `✨ ${featureName} - Nouvelle fonctionnalité sur Plinkk`,
      html: emailTemplates.newFeatureTemplate(featureName, featureDescription, featureUrl),
      text: `Nouvelle fonctionnalité: ${featureName}\n\n${featureDescription}\n\nDécouvrez-la: ${featureUrl}`,
      tags: [{ name: "category", value: "feature" }],
    });

    return result !== null;
  }

  /**
   * Vérifier si le service d'email est configuré
   */
  static isConfigured(): boolean {
    return resend !== null;
  }
}
