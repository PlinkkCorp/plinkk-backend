import { FastifyInstance } from "fastify";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { logAdminAction } from "../../../lib/adminLogger";
import { requireAuthRedirect, requireAuth } from "../../../middleware/auth";
import { prisma } from "@plinkk/prisma";

export function adminSettingsRoutes(fastify: FastifyInstance) {
  // Page des paramètres
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_SITE_SETTINGS", { mode: "view", active: "settings" });
    if (!ok) return;

    // Récupérer tous les paramètres Discord
    const discordSettings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            "discord_webhook_patchnotes",
            "discord_webhook_quota_alerts",
            "discord_alerts_enabled",
            "email_economy_mode_enabled"
          ]
        }
      }
    });

    const settings: Record<string, string> = {};
    discordSettings.forEach(s => {
      settings[s.key] = s.value;
    });

    return replyView(reply, "dashboard/admin/settings.ejs", request.currentUser!, {
      publicPath: request.publicPath,
      settings
    });
  });

  // Mettre à jour un paramètre
  fastify.post("/update", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_SITE_SETTINGS");
    if (!ok) return;

    const { key, value } = request.body as { key: string; value: string };

    // Validation des clés autorisées
    const validKeys = [
      "discord_webhook_patchnotes",
      "discord_webhook_quota_alerts",
      "discord_alerts_enabled",
      "email_economy_mode_enabled"
    ];

    if (!validKeys.includes(key)) {
      return reply.code(400).send({ error: "invalid_key" });
    }

    // Validation URL pour les webhooks
    if (key.startsWith("discord_webhook_") && value) {
      try {
        const url = new URL(value);
        if (!url.hostname.includes("discord.com") && !url.hostname.includes("discordapp.com")) {
          return reply.code(400).send({ error: "invalid_webhook_url" });
        }
      } catch (e) {
        return reply.code(400).send({ error: "invalid_url_format" });
      }
    }

    // Upsert du paramètre
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    await logAdminAction(
      request.currentUser!.id,
      "UPDATE_SITE_SETTING",
      key,
      { key, newValue: value },
      request.ip
    );

    return reply.send({ success: true });
  });

  // Test d'un webhook Discord
  fastify.post("/test-webhook", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_SITE_SETTINGS");
    if (!ok) return;

    const { webhookUrl, type } = request.body as { webhookUrl: string; type: "patchnotes" | "quota" };

    if (!webhookUrl) {
      return reply.code(400).send({ error: "webhook_url_required" });
    }

    try {
      const url = new URL(webhookUrl);
      if (!url.hostname.includes("discord.com") && !url.hostname.includes("discordapp.com")) {
        return reply.code(400).send({ error: "invalid_webhook_url" });
      }
    } catch (e) {
      return reply.code(400).send({ error: "invalid_url_format" });
    }

    // Envoi d'un message de test
    const testEmbed = {
      title: type === "patchnotes" ? "🎉 Test Webhook Patchnotes" : "⚠️ Test Webhook Alertes Quota",
      description: type === "patchnotes"
        ? "Ce webhook fonctionnera pour les annonces de nouvelles versions."
        : "Ce webhook fonctionnera pour les alertes de quota d'emails.",
      color: type === "patchnotes" ? 0x5865F2 : 0xFBBF24,
      timestamp: new Date().toISOString(),
      footer: {
        text: `Plinkk Admin • Testé par ${request.currentUser!.userName}`
      }
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [testEmbed]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return reply.code(400).send({ error: "webhook_failed", details: errorText });
      }

      await logAdminAction(
        request.currentUser!.id,
        "TEST_DISCORD_WEBHOOK",
        type,
        { type },
        request.ip
      );

      return reply.send({ success: true });
    } catch (error: any) {
      return reply.code(500).send({ error: "network_error", message: error.message });
    }
  });
}
