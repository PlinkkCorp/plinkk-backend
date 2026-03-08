/**
 * API Admin — Acquisition : quota emails + funnel de conversion
 */
import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { UnauthorizedError, ForbiddenError, BadRequestError } from "@plinkk/shared";
import { emailQuotaService } from "../../../services/emailQuotaService";
import { logAdminAction } from "../../../lib/adminLogger";

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function apiAdminAcquisitionRoutes(fastify: FastifyInstance) {
  // Auth middleware
  fastify.addHook("preHandler", async (request, reply) => {
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!userId) throw new UnauthorizedError();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { permissions: true } } },
    });
    const isStaff = user?.role?.isStaff || ["ADMIN", "DEVELOPER"].includes(user?.role?.name || "");
    if (!isStaff) throw new ForbiddenError();
  });

  /**
   * GET /admin/acquisition/quota
   * Quota email du mois courant + historique 6 mois
   */
  fastify.get("/quota", async (_request, reply) => {
    const [current, history] = await Promise.all([
      emailQuotaService.getQuota(currentMonth()),
      emailQuotaService.getHistory(),
    ]);
    return reply.send({ current, history });
  });

  /**
   * GET /admin/acquisition/funnel
   * Statistiques du tunnel de conversion
   */
  fastify.get("/funnel", async (request, reply) => {
    const q = request.query as { from?: string; to?: string };
    const now = new Date();
    const end = q.to
      ? new Date(q.to + "T23:59:59.999Z")
      : now;
    const start = q.from
      ? new Date(q.from + "T00:00:00.000Z")
      : new Date(end.getTime() - 29 * 86400_000);

    const dateFilter = { gte: start, lte: end };

    const [
      emailSubmits,
      emailVerified,
      step1,
      step2,
      plinkkCreated,
    ] = await Promise.all([
      // Emails soumis = nombre d'OtpCode créés sur la période
      prisma.otpCode.count({ where: { createdAt: dateFilter } }),
      // Emails vérifiés = utilisateurs créés via join (emailVerified=true sans mot de passe)
      prisma.user.count({
        where: { createdAt: dateFilter, emailVerified: true, hasPassword: false },
      }),
      // Step 1 onboarding passé (a sauvegardé un draft step >= 2)
      prisma.onboardingDraft.count({ where: { updatedAt: dateFilter, step: { gte: 2 } } }),
      // Step 2 passé
      prisma.onboardingDraft.count({ where: { updatedAt: dateFilter, step: { gte: 3 } } }),
      // Onboarding terminé
      prisma.user.count({
        where: { createdAt: dateFilter, onboardingCompleted: true, hasPassword: false },
      }),
    ]);

    return reply.send({
      emailSubmits,
      emailVerified,
      step1,
      step2,
      plinkkCreated,
      rates: {
        verifyRate: emailSubmits > 0 ? ((emailVerified / emailSubmits) * 100).toFixed(1) : "0",
        completionRate: emailVerified > 0 ? ((plinkkCreated / emailVerified) * 100).toFixed(1) : "0",
        overallRate: emailSubmits > 0 ? ((plinkkCreated / emailSubmits) * 100).toFixed(1) : "0",
      },
      period: { from: start.toISOString().split("T")[0], to: end.toISOString().split("T")[0] },
    });
  });

  /**
   * GET /admin/acquisition/settings
   * Paramètres des inscriptions email
   */
  fastify.get("/settings", async (_request, reply) => {
    const config = await prisma.systemConfig.findMany({
      where: { key: { in: ["email_registration_enabled"] } },
    });
    const map: Record<string, string> = {};
    for (const c of config) map[c.key] = c.value;
    return reply.send({
      emailRegistrationEnabled: map["email_registration_enabled"] !== "false",
    });
  });

  /**
   * PATCH /admin/acquisition/settings
   * Activer / désactiver les inscriptions email
   */
  fastify.patch("/settings", async (request, reply) => {
    const body = request.body as { emailRegistrationEnabled?: boolean };
    if (typeof body.emailRegistrationEnabled !== "boolean") {
      throw new BadRequestError("emailRegistrationEnabled (boolean) requis");
    }

    await prisma.systemConfig.upsert({
      where: { key: "email_registration_enabled" },
      create: { key: "email_registration_enabled", value: String(body.emailRegistrationEnabled) },
      update: { value: String(body.emailRegistrationEnabled) },
    });

    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string;
    await logAdminAction(userId, "TOGGLE_EMAIL_REGISTRATION", undefined, {
      enabled: body.emailRegistrationEnabled,
    }, request.ip);

    return reply.send({ ok: true, emailRegistrationEnabled: body.emailRegistrationEnabled });
  });
}
