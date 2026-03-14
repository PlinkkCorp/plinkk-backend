import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { EmailService } from "../../../services/emailService";
import { UnauthorizedError, ForbiddenError, BadRequestError } from "@plinkk/shared";
import z from "zod";
import { logAdminAction } from "../../../lib/adminLogger";

// Validation du corps de la requête
const sendEmailSchema = z.object({
  recipientType: z.enum(["all", "staff", "admin", "role", "custom"]),
  roleId: z.string().min(1).optional(),
  recipients: z.array(z.string().email()).optional(), // Pour recipientType: "custom"
  subject: z.string().min(1, "Sujet requis").optional(),
  title: z.string().min(1, "Titre requis").optional(),
  message: z.string().min(1, "Message requis").optional(),
  actionUrl: z.string().url().optional(),
  actionText: z.string().optional(),
  templateId: z.string().optional(),
  category: z.enum(["announcement", "feature", "update", "security", "other"]).default("announcement"),
}).refine((value) => {
  // Soit un template, soit les champs libres obligatoires
  if (value.templateId) return true;
  return Boolean(value.subject && value.title && value.message);
}, {
  message: "Sujet, titre et message requis si aucun template n'est sélectionné",
}).refine((value) => {
  if (value.recipientType !== "role") return true;
  return Boolean(value.roleId);
}, {
  message: "Rôle requis pour un envoi par rôle",
  path: ["roleId"],
});

const saveTemplateSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  subject: z.string().min(1, "Sujet requis"),
  title: z.string().min(1, "Titre requis"),
  message: z.string().min(1, "Message requis"),
  actionUrl: z.string().url().optional(),
  actionText: z.string().optional(),
  category: z.enum(["announcement", "feature", "update", "security", "other"]).default("announcement"),
});

type SendEmailRequest = z.infer<typeof sendEmailSchema>;

export async function apiAdminEmailsRoutes(fastify: FastifyInstance) {
  const baseUrl = process.env.BACKEND_URL || process.env.APP_URL || "https://dash.plinkk.fr";

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
    const emailsSent = await prisma.emailCampaign.aggregate({ _sum: { sentCount: true } });
    const opens = await prisma.emailTrackingEvent.count({ where: { type: "OPEN" } });
    const clicks = await prisma.emailTrackingEvent.count({ where: { type: "CLICK" } });
    const delivered = emailsSent._sum.sentCount || 0;
    const openRate = delivered > 0 ? Math.round((opens / delivered) * 100) : 0;
    const clickRate = delivered > 0 ? Math.round((clicks / delivered) * 100) : 0;

    return reply.send({
      totalCampaigns: campaignCount,
      totalEmailsSent: delivered,
      totalOpens: opens,
      totalClicks: clicks,
      openRate,
      clickRate,
    });
  });

  /**
   * GET /admin/emails/templates
   * Récupérer les templates d'email
   */
  fastify.get("/templates", async () => {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: [{ isSystem: "desc" }, { updatedAt: "desc" }],
      take: 100,
    });

    return templates;
  });

  /**
   * POST /admin/emails/templates
   * Créer un template d'email
   */
  fastify.post("/templates", async (request, reply) => {
    const sessionData = request.session.get("data");
    const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

    if (!currentUserId) throw new UnauthorizedError();

    let body: z.infer<typeof saveTemplateSchema>;
    try {
      body = saveTemplateSchema.parse(request.body);
    } catch (e) {
      const message = e instanceof z.ZodError ? e.issues[0]?.message || "Validation échouée" : "Validation échouée";
      throw new BadRequestError(message);
    }

    const template = await prisma.emailTemplate.create({
      data: {
        ...body,
        createdById: currentUserId,
      },
    });

    await logAdminAction(currentUserId, "CREATE_EMAIL_TEMPLATE", template.id, { name: body.name }, request.ip);
    return reply.code(201).send(template);
  });

  /**
   * PUT /admin/emails/templates/:id
   * Mettre à jour un template
   */
  fastify.put("/templates/:id", async (request, reply) => {
    const sessionData = request.session.get("data");
    const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

    if (!currentUserId) throw new UnauthorizedError();

    const { id } = request.params as { id: string };
    let body: z.infer<typeof saveTemplateSchema>;
    try {
      body = saveTemplateSchema.parse(request.body);
    } catch (e) {
      const message = e instanceof z.ZodError ? e.issues[0]?.message || "Validation échouée" : "Validation échouée";
      throw new BadRequestError(message);
    }

    const existing = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) throw new BadRequestError("Template introuvable");
    if (existing.isSystem) throw new ForbiddenError("Impossible de modifier un template système");

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: body,
    });

    await logAdminAction(currentUserId, "UPDATE_EMAIL_TEMPLATE", template.id, { name: body.name }, request.ip);
    return reply.send(template);
  });

  /**
   * DELETE /admin/emails/templates/:id
   * Supprimer un template
   */
  fastify.delete("/templates/:id", async (request, reply) => {
    const sessionData = request.session.get("data");
    const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

    if (!currentUserId) throw new UnauthorizedError();

    const { id } = request.params as { id: string };
    const existing = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) throw new BadRequestError("Template introuvable");
    if (existing.isSystem) throw new ForbiddenError("Impossible de supprimer un template système");

    await prisma.emailTemplate.delete({ where: { id } });
    await logAdminAction(currentUserId, "DELETE_EMAIL_TEMPLATE", id, { name: existing.name }, request.ip);
    return reply.send({ success: true });
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
        openCount: true,
        clickCount: true,
        createdAt: true,
        createdBy: { select: { userName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return reply.send(campaigns.map((campaign) => ({
      ...campaign,
      openRate: campaign.sentCount > 0 ? Math.round((campaign.openCount / campaign.sentCount) * 100) : 0,
      clickRate: campaign.sentCount > 0 ? Math.round((campaign.clickCount / campaign.sentCount) * 100) : 0,
    })));
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
    } else if (body.recipientType === "role") {
      // Rôle spécifique
      const users = await prisma.user.findMany({
        select: { email: true },
        where: {
          email: { not: null },
          roleId: body.roleId,
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

    let template: Awaited<ReturnType<typeof prisma.emailTemplate.findUnique>> | null = null;
    if (body.templateId) {
      template = await prisma.emailTemplate.findUnique({ where: { id: body.templateId } });
      if (!template) throw new BadRequestError("Template introuvable");
    }

    const finalSubject = body.subject || template?.subject;
    const finalTitle = body.title || template?.title;
    const finalMessage = body.message || template?.message;
    const finalActionUrl = body.actionUrl || template?.actionUrl || undefined;
    const finalActionText = body.actionText || template?.actionText || undefined;
    const finalCategory = body.category || template?.category || "announcement";

    if (!finalSubject || !finalTitle || !finalMessage) {
      throw new BadRequestError("Contenu de campagne incomplet");
    }

    // Créer une campagne d'email
    const campaign = await prisma.emailCampaign.create({
      data: {
        subject: finalSubject,
        title: finalTitle,
        message: finalMessage,
        actionUrl: finalActionUrl,
        actionText: finalActionText,
        category: finalCategory,
        recipientType: body.recipientType,
        sentCount: recipients.length,
        createdById: currentUserId,
        templateId: template?.id,
      },
    });

    // Envoyer les emails (asynchrone pour ne pas bloquer)
    // En production, utilisez une queue (Bull, BullMQ)
    setImmediate(async () => {
      let successCount = 0;
      let errorCount = 0;

      for (const recipient of recipients) {
        const trackingPixelUrl = `${baseUrl}/api/email-track/open?c=${encodeURIComponent(campaign.id)}&r=${encodeURIComponent(recipient)}`;
        const trackedActionUrl = finalActionUrl
          ? `${baseUrl}/api/email-track/click?c=${encodeURIComponent(campaign.id)}&r=${encodeURIComponent(recipient)}&u=${encodeURIComponent(finalActionUrl)}`
          : undefined;

        const sent = await EmailService.sendGenericEmail(
          recipient,
          finalSubject,
          finalTitle,
          finalMessage,
          trackedActionUrl,
          finalActionText,
          trackingPixelUrl,
          "campaign"
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
    await logAdminAction(
      currentUserId,
      "SEND_EMAIL_CAMPAIGN",
      campaign.id,
      {
        recipientType: body.recipientType,
        roleId: body.roleId || null,
        recipientCount: recipients.length,
        subject: finalSubject,
        category: finalCategory,
        templateId: body.templateId || null,
      },
      request.ip
    );

    return reply.code(201).send({
      success: true,
      message: `Campagne créée avec ${recipients.length} destinataires. Les emails sont en cours d'envoi.`,
      campaign: {
        id: campaign.id,
        subject: finalSubject,
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
