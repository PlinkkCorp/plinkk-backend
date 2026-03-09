/**
 * EmailQuotaService — Suivi en temps réel du quota emails mensuel (3000/mois Resend Free)
 */
import { prisma } from "@plinkk/prisma";

export type EmailType = "otp" | "campaign" | "welcome" | "other";

const MONTHLY_QUOTA = 3000;
const ALERT_70 = Math.floor(MONTHLY_QUOTA * 0.7);  // 2100
const ALERT_90 = Math.floor(MONTHLY_QUOTA * 0.9);  // 2700
const ALERT_CRITICAL = Math.floor(MONTHLY_QUOTA * 0.97); // 2900

export interface QuotaStatus {
  month: string;
  otp: number;
  campaign: number;
  welcome: number;
  other: number;
  total: number;
  limit: number;
  percentUsed: number;
  alert: "none" | "warning" | "critical";
}

/**
 * Envoie une alerte Discord pour le quota d'emails
 */
async function sendDiscordQuotaAlert(quota: QuotaStatus): Promise<void> {
  try {
    // Vérifier que les alertes sont activées
    const alertsEnabled = await prisma.siteSetting.findUnique({
      where: { key: "discord_alerts_enabled" }
    });

    if (alertsEnabled?.value !== "true") {
      return; // Alertes désactivées
    }

    // Récupérer le webhook
    const webhook = await prisma.siteSetting.findUnique({
      where: { key: "discord_webhook_quota_alerts" }
    });

    if (!webhook?.value) {
      return; // Pas de webhook configuré
    }

    // Déterminer le message et la couleur selon le niveau
    let color = 0xFBBF24; // Amber
    let title = "⚠️ Alerte Quota Emails";
    let description = `Le quota d'emails a atteint **${quota.percentUsed}%** (${quota.total}/${quota.limit} emails).`;
    
    if (quota.alert === "critical") {
      color = 0xEF4444; // Red
      title = "🚨 Alerte Critique Quota Emails";
      description = `**Quota critique !** ${quota.total}/${quota.limit} emails envoyés ce mois-ci (${quota.percentUsed}%).\n\nLe mode économie devrait être activé pour préserver les emails essentiels.`;
    } else if (quota.alert === "warning") {
      color = 0xFBBF24; // Amber
      title = "⚠️ Alerte Quota Emails";
      description = `Le quota mensuel approche de sa limite : ${quota.total}/${quota.limit} emails (${quota.percentUsed}%).\n\nPensez à limiter les campagnes marketing.`;
    }

    const embed = {
      title,
      description,
      color,
      timestamp: new Date().toISOString(),
      fields: [
        { name: "🔐 OTP / Connexion", value: String(quota.otp), inline: true },
        { name: "📧 Campagnes", value: String(quota.campaign), inline: true },
        { name: "👋 Bienvenue", value: String(quota.welcome), inline: true },
        { name: "📄 Autres", value: String(quota.other), inline: true },
        { name: "📊 Total", value: `${quota.total}/${quota.limit}`, inline: true },
        { name: "📈 Pourcentage", value: `${quota.percentUsed}%`, inline: true }
      ],
      footer: {
        text: `Plinkk Email System • ${quota.month}`
      }
    };

    await fetch(webhook.value, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] })
    });

    console.log(`[EmailQuota] Alerte Discord envoyée (${quota.alert})`);
  } catch (error) {
    console.error("[EmailQuota] Erreur lors de l'envoi de l'alerte Discord:", error);
  }
}

export const emailQuotaService = {
  /**
   * Incrémente le compteur d'un type d'email pour le mois courant.
   */
  async increment(month: string, type: EmailType, count = 1): Promise<void> {
    // Récupérer le quota avant incrémentation
    const quotaBefore = await this.getQuota(month);
    const totalBefore = quotaBefore.total;

    await prisma.emailQuotaLog.upsert({
      where: { month_type: { month, type } },
      create: { month, type, count },
      update: { count: { increment: count } },
    });

    // Récupérer le nouveau quota
    const quotaAfter = await this.getQuota(month);
    const totalAfter = quotaAfter.total;

    // Vérifier si on vient de franchir un seuil d'alerte
    const crossedCritical = totalBefore < ALERT_CRITICAL && totalAfter >= ALERT_CRITICAL;
    const crossedWarning = totalBefore < ALERT_90 && totalAfter >= ALERT_90;

    if (crossedCritical || crossedWarning) {
      // Envoyer l'alerte Discord en arrière-plan (ne pas attendre)
      sendDiscordQuotaAlert(quotaAfter).catch(err => 
        console.error("[EmailQuota] Erreur alerte Discord:", err)
      );
    }
  },

  /**
   * Retourne le statut complet du quota pour un mois donné.
   */
  async getQuota(month: string): Promise<QuotaStatus> {
    const rows = await prisma.emailQuotaLog.findMany({
      where: { month },
    });

    const map: Record<string, number> = {};
    for (const row of rows) map[row.type] = row.count;

    const otp = map["otp"] ?? 0;
    const campaign = map["campaign"] ?? 0;
    const welcome = map["welcome"] ?? 0;
    const other = map["other"] ?? 0;
    const total = otp + campaign + welcome + other;
    const percentUsed = total === 0
      ? 0
      : Number(((total / MONTHLY_QUOTA) * 100).toFixed(6));

    let alert: QuotaStatus["alert"] = "none";
    if (total >= ALERT_CRITICAL) alert = "critical";
    else if (total >= ALERT_90) alert = "warning";

    return { month, otp, campaign, welcome, other, total, limit: MONTHLY_QUOTA, percentUsed, alert };
  },

  /**
   * Retourne une liste des 6 derniers mois pour les graphiques admin.
   */
  async getHistory(): Promise<QuotaStatus[]> {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
    }
    return Promise.all(months.map((m) => emailQuotaService.getQuota(m)));
  },

  MONTHLY_QUOTA,
  ALERT_70,
  ALERT_90,
  ALERT_CRITICAL,
};
