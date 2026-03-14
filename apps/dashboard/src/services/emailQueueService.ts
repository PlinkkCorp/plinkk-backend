/**
 * EmailQueueService — Gestion de la file d'attente d'emails
 * Permet de différer l'envoi d'emails non-critiques en mode économie
 */
import { prisma } from "@plinkk/prisma";
import { EmailService, SendEmailOptions } from "./emailService";

export interface QueuedEmail {
  id: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags: any;
  emailType: string;
  priority: number;
  status: string;
  scheduledFor?: Date;
  attempts: number;
  lastAttempt?: Date;
  error?: string;
  sentAt?: Date;
  createdAt: Date;
}

export const emailQueueService = {
  /**
   * Ajouter un email à la file d'attente
   */
  async enqueue(
    options: SendEmailOptions,
    emailType: string = "other",
    priority: number = 0,
    scheduledFor?: Date
  ): Promise<string> {
    const queued = await prisma.emailQueue.create({
      data: {
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        from: options.from,
        replyTo: options.replyTo,
        tags: options.tags || [],
        emailType,
        priority,
        scheduledFor: scheduledFor || this.getNextMonthStart(),
        status: "PENDING",
      },
    });

    console.log(`[EmailQueue] Email ajouté à la file : ${queued.id} (type: ${emailType}, envoi: ${scheduledFor || "début mois prochain"})`);
    return queued.id;
  },

  /**
   * Récupérer les emails prêts à être envoyés
   */
  async getPendingEmails(limit: number = 50): Promise<QueuedEmail[]> {
    const now = new Date();
    
    return prisma.emailQueue.findMany({
      where: {
        status: "PENDING",
        OR: [
          { scheduledFor: null },
          { scheduledFor: { lte: now } }
        ]
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" }
      ],
      take: limit,
    }) as Promise<QueuedEmail[]>;
  },

  /**
   * Traiter la file d'attente (envoyer les emails en attente)
   */
  async processQueue(batchSize: number = 50): Promise<{ sent: number; failed: number; remaining: number }> {
    const pending = await this.getPendingEmails(batchSize);
    let sent = 0;
    let failed = 0;

    for (const email of pending) {
      try {
        // Marquer comme en cours de traitement
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: "PROCESSING",
            lastAttempt: new Date(),
            attempts: { increment: 1 }
          }
        });

        // Tenter l'envoi
        const result = await EmailService.send({
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          from: email.from,
          replyTo: email.replyTo,
          tags: email.tags as any,
          critical: false, // Les emails en queue ne sont jamais critiques
        }, email.emailType || "other");

        if (result) {
          // Succès
          await prisma.emailQueue.update({
            where: { id: email.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
              error: null
            }
          });
          sent++;
          console.log(`[EmailQueue] ✅ Email envoyé : ${email.id}`);
        } else {
          // Échec, réessayer plus tard si < 3 tentatives
          const newStatus = email.attempts >= 2 ? "FAILED" : "PENDING";
          await prisma.emailQueue.update({
            where: { id: email.id },
            data: {
              status: newStatus,
              error: "Échec d'envoi via Resend"
            }
          });
          failed++;
          console.warn(`[EmailQueue] ❌ Échec email ${email.id} (tentative ${email.attempts + 1}/3)`);
        }
      } catch (error: any) {
        console.error(`[EmailQueue] Erreur traitement email ${email.id}:`, error);
        
        // Marquer comme échoué après 3 tentatives
        const newStatus = email.attempts >= 2 ? "FAILED" : "PENDING";
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: newStatus,
            error: error.message || "Erreur inconnue"
          }
        }).catch(console.error);
        
        failed++;
      }
    }

    if (sent > 0 || failed > 0) {
      console.log(`[EmailQueue] Traitement terminé : ${sent} envoyés, ${failed} échoués`);
    }

    // Compter les emails restants en attente
    const remaining = await prisma.emailQueue.count({
      where: { status: "PENDING" }
    });

    return { sent, failed, remaining };
  },

  /**
   * Obtenir la date de début du mois prochain
   */
  getNextMonthStart(): Date {
    const now = new Date();
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
    return nextMonth;
  },

  /**
   * Obtenir les statistiques de la file
   */
  async getStats() {
    const [pending, processing, sent, failed, total] = await Promise.all([
      prisma.emailQueue.count({ where: { status: "PENDING" } }),
      prisma.emailQueue.count({ where: { status: "PROCESSING" } }),
      prisma.emailQueue.count({ where: { status: "SENT" } }),
      prisma.emailQueue.count({ where: { status: "FAILED" } }),
      prisma.emailQueue.count(),
    ]);

    const nextScheduled = await prisma.emailQueue.findFirst({
      where: { 
        status: "PENDING",
        scheduledFor: { not: null }
      },
      orderBy: { scheduledFor: "asc" }
    });

    return {
      pending,
      processing,
      sent,
      failed,
      total,
      nextScheduled: nextScheduled?.scheduledFor || null
    };
  },

  /**
   * Récupérer les emails en queue pour l'admin
   */
  async getQueueForAdmin(
    status?: string,
    limit: number = 100
  ): Promise<QueuedEmail[]> {
    return prisma.emailQueue.findMany({
      where: status ? { status: status as any } : {},
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" }
      ],
      take: limit,
    }) as Promise<QueuedEmail[]>;
  },

  /**
   * Annuler un email en queue
   */
  async cancel(id: string): Promise<boolean> {
    try {
      await prisma.emailQueue.update({
        where: { id },
        data: { status: "CANCELLED" }
      });
      return true;
    } catch (error) {
      console.error(`[EmailQueue] Erreur annulation ${id}:`, error);
      return false;
    }
  },

  /**
   * Supprimer les emails envoyés/échoués de plus de 30 jours
   */
  async cleanup(daysOld: number = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const result = await prisma.emailQueue.deleteMany({
      where: {
        status: { in: ["SENT", "FAILED", "CANCELLED"] },
        createdAt: { lt: cutoff }
      }
    });

    console.log(`[EmailQueue] Nettoyage : ${result.count} emails supprimés`);
    return result.count;
  }
};
