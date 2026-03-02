import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { EmailService } from "../../../services/emailService";
import { UnauthorizedError, ForbiddenError, BadRequestError } from "@plinkk/shared";
import z from "zod";
import { logUserAction } from "../../../lib/userLogger";

// Validation du corps de la requête
const sendEmailSchema = z.object({
  recipientType: z.enum(["all", "staff", "admin", "custom"]),
  recipients: z.array(z.string().email()).optional(), // Pour recipientType: "custom"
  subject: z.string().min(1, "Sujet requis"),
  title: z.string().min(1, "Titre requis"),
  message: z.string().min(1, "Message requis"),
  actionUrl: z.string().url().optional(),
  actionText: z.string().optional(),
  category: z.enum(["announcement", "feature", "update", "security", "other"]).default("announcement"),
});

type SendEmailRequest = z.infer<typeof sendEmailSchema>;

export async function apiAdminEmailsRoutes(fastify: FastifyInstance) {
  // Middleware: Vérification des permissions
  fastify.addHook("preHandler", async (request, reply) => {
    const sessionData = request.session.get("data");
    const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

    if (!currentUserId) throw new UnauthorizedError();

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: { include: { permissions: true } } },
    });

    // Vérifier la permission ou être admin/developer
    const hasPermission = user?.role?.permissions.some((rp) => rp.permissionKey === "SEND_EMAILS");
    const isStaff = user?.role?.isStaff || ["ADMIN", "DEVELOPER"].includes(user?.role?.name || "");

    if (!hasPermission && !isStaff) {
      throw new ForbiddenError("Vous n'avez pas la permission d'envoyer des emails");
    }
  });

  /**
   * GET /admin/emails/stats
   * Récupérer les statistiques d'envoi
   */
  fastify.get("/stats", async (request, reply) => {
    const campaignCount = await prisma.emailCampaign.count();
    const emailsSent = await prisma.emailCampaign.aggregate({
      _sum: { sentCount: true },
    });

    return reply.send({
      totalCampaigns: campaignCount,
      totalEmailsSent: emailsSent._sum.sentCount || 0,
    });
  });

  /**
   * GET /admin/emails/campaigns
   * Récupérer l'historique des campagnes d'emails
   */
  fastify.get("/campaigns", async (request, reply) => {
    const campaigns = await prisma.emailCampaign.findMany({
      select: {
        id: true,
        subject: true,
        category: true,
        sentCount: true,
        createdAt: true,
        createdBy: { select: { userName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return reply.send(campaigns);
  });

  /**
   * POST /admin/emails/send
   * Envoyer un email custom
   */
  fastify.post("/send", async (request, reply) => {
    const sessionData = request.session.get("data");
    const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

    if (!currentUserId) throw new UnauthorizedError();

    // Valider le corps
    let body: SendEmailRequest;
    try {
      body = sendEmailSchema.parse(request.body);
    } catch (e) {
      const message = e instanceof z.ZodError ? e.issues[0]?.message || "Validation échouée" : "Validation échouée";
      throw new BadRequestError(message);
    }

    // Récupérer les destinataires
    let recipients: string[] = [];

    if (body.recipientType === "all") {
      // Tous les utilisateurs
      const users = await prisma.user.findMany({
        select: { email: true },
        where: { email: { not: null } },
      });
      recipients = users.map((u) => u.email!);
    } else if (body.recipientType === "staff") {
      // Staff uniquement (admin, developer, moderator, etc.)
      const users = await prisma.user.findMany({
        select: { email: true },
        where: {
          email: { not: null },
          role: { isStaff: true },
        },
      });
      recipients = users.map((u) => u.email!);
    } else if (body.recipientType === "admin") {
      // Admin uniquement
      const users = await prisma.user.findMany({
        select: { email: true },
        where: {
          email: { not: null },
          role: { name: "ADMIN" },
        },
      });
      recipients = users.map((u) => u.email!);
    } else if (body.recipientType === "custom") {
      // Destinataires spécifiés
      if (!body.recipients || body.recipients.length === 0) {
        throw new BadRequestError("Spécifiez au moins un destinataire");
      }
      recipients = body.recipients;
    }

    if (recipients.length === 0) {
      throw new BadRequestError("Aucun destinataire trouvé");
    }

    // Créer une campagne d'email
    const campaign = await prisma.emailCampaign.create({
      data: {
        subject: body.subject,
        title: body.title,
        message: body.message,
        actionUrl: body.actionUrl,
        actionText: body.actionText,
        category: body.category,
        recipientType: body.recipientType,
        sentCount: recipients.length,
        createdById: currentUserId,
      },
    });

    // Envoyer les emails (asynchrone pour ne pas bloquer)
    // En production, utilisez une queue (Bull, BullMQ)
    setImmediate(async () => {
      let successCount = 0;
      let errorCount = 0;

      for (const recipient of recipients) {
        const sent = await EmailService.sendGenericEmail(
          recipient,
          body.subject,
          body.title,
          body.message,
          body.actionUrl,
          body.actionText
        );

        if (sent) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      // Mettre à jour la campagne
      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: {
          sentCount: successCount,
          failedCount: errorCount,
        },
      });

      console.log(
        `📧 Campagne ${campaign.id} terminée: ${successCount} envoyés, ${errorCount} échoués`
      );
    });

    // Logger l'action
    await logUserAction(
      currentUserId,
      "SEND_EMAIL_CAMPAIGN",
      null,
      {
        campaignId: campaign.id,
        recipientType: body.recipientType,
        recipientCount: recipients.length,
        subject: body.subject,
        category: body.category,
      },
      request.ip
    );

    return reply.code(201).send({
      success: true,
      message: `Campagne créée avec ${recipients.length} destinataires. Les emails sont en cours d'envoi.`,
      campaign: {
        id: campaign.id,
        subject: campaign.subject,
        recipientCount: recipients.length,
      },
    });
  });

  /**
   * GET /admin/emails/campaigns/:id
   * Récupérer les détails d'une campagne
   */
  fastify.get("/campaigns/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, userName: true, email: true } },
      },
    });

    if (!campaign) {
      return reply.code(404).send({ error: "Campagne non trouvée" });
    }

    return reply.send(campaign);
  });
}
