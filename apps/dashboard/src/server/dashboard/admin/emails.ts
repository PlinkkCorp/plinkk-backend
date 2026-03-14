import { FastifyInstance } from "fastify";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { requireAuthRedirect } from "../../../middleware/auth";
import { emailQuotaService } from "../../../services/emailQuotaService";
import { emailQueueService } from "../../../services/emailQueueService";
import { prisma } from "@plinkk/prisma";

function currentMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function adminEmailsRoutes(fastify: FastifyInstance) {
  // GET /admin/emails
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "SEND_EMAILS", { mode: "view", active: "emails" });
    if (!ok) return;

    const user = request.currentUser!;
    
    // Récupérer le quota actuel et l'historique
    const currentQuota = await emailQuotaService.getQuota(currentMonth());
    const history = await emailQuotaService.getHistory();
    
    // Récupérer les données de la queue
    const queue = await emailQueueService.getQueueForAdmin();
    const queueStats = await emailQueueService.getStats();
    const roles = await prisma.role.findMany({
      select: { id: true, name: true, isStaff: true },
      orderBy: [{ isStaff: "desc" }, { name: "asc" }],
    });
    
    // Récupérer l'état d'activation des emails
    const emailEnabledSetting = await prisma.siteSetting.findUnique({
      where: { key: "email_campaigns_enabled" },
    });
    const emailsEnabled = emailEnabledSetting?.value !== "false";
    
    return replyView(reply, "dashboard/admin/emails.ejs", user, {
      quota: currentQuota,
      history,
      queue,
      queueStats,
      roles,
      emailsEnabled,
      ALERT_90: emailQuotaService.ALERT_90,
      ALERT_CRITICAL: emailQuotaService.ALERT_CRITICAL,
    });
  });
  
  // GET /admin/emails/quota - API pour récupérer le quota en temps réel
  fastify.get("/quota", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "SEND_EMAILS", { mode: "view" });
    if (!ok) return reply.code(403).send({ error: "forbidden" });
    
    const currentQuota = await emailQuotaService.getQuota(currentMonth());
    return reply.send(currentQuota);
  });
  
  // POST /admin/emails/toggle - Activer/désactiver l'envoi d'emails
  fastify.post("/toggle", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "SEND_EMAILS", { mode: "json" });
    if (!ok) return reply.code(403).send({ error: "forbidden" });
    
    const { enabled } = request.body as { enabled: boolean };
    
    await prisma.siteSetting.upsert({
      where: { key: "email_campaigns_enabled" },
      create: { key: "email_campaigns_enabled", value: String(enabled) },
      update: { value: String(enabled) },
    });
    
    return reply.send({ ok: true, enabled });
  });
}
