/**
 * EmailQuotaService — Suivi en temps réel du quota emails mensuel (3000/mois Resend Free)
 */
import { prisma } from "@plinkk/prisma";

export type EmailType = "otp" | "campaign" | "welcome" | "other";

const MONTHLY_QUOTA = 3000;
const ALERT_70 = Math.floor(MONTHLY_QUOTA * 0.7);  // 2100
const ALERT_90 = Math.floor(MONTHLY_QUOTA * 0.9);  // 2700

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

export const emailQuotaService = {
  /**
   * Incrémente le compteur d'un type d'email pour le mois courant.
   */
  async increment(month: string, type: EmailType, count = 1): Promise<void> {
    await prisma.emailQuotaLog.upsert({
      where: { month_type: { month, type } },
      create: { month, type, count },
      update: { count: { increment: count } },
    });
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
    const percentUsed = Math.round((total / MONTHLY_QUOTA) * 100);

    let alert: QuotaStatus["alert"] = "none";
    if (total >= ALERT_90) alert = "critical";
    else if (total >= ALERT_70) alert = "warning";

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
};
