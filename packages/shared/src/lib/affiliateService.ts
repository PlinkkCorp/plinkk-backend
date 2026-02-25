import { prisma } from "@plinkk/prisma";
import { nanoid } from "nanoid";

/**
 * Service pour la gestion des liens affiliés
 */
export const affiliateService = {
    /**
     * Génère un slug aléatoire pour un lien affilié
     */
    generateRandomSlug(): string {
        return nanoid(10);
    },

    /**
     * Crée un lien affilié pour un utilisateur
     */
    async createLink(userId: string, options: { slug?: string; type?: "RANDOM" | "CUSTOM" }) {
        const slug = options.slug || this.generateRandomSlug();
        const type = options.type || (options.slug ? "CUSTOM" : "RANDOM");

        return prisma.affiliateLink.create({
            data: {
                userId,
                slug,
                type,
            },
        });
    },

    /**
     * Enregistre un clic sur un lien affilié
     */
    async recordClick(slug: string) {
        const link = await prisma.affiliateLink.findUnique({
            where: { slug },
        });

        if (!link) return null;

        // Incrémenter le compteur global
        await prisma.affiliateLink.update({
            where: { id: link.id },
            data: { clicks: { increment: 1 } },
        });

        // Enregistrer dans les stats journalières
        try {
            const now = new Date();
            const dateObj = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

            await prisma.affiliateLinkClickDaily.upsert({
                where: {
                    affiliateLinkId_date: {
                        affiliateLinkId: link.id,
                        date: dateObj,
                    },
                },
                create: {
                    affiliateLinkId: link.id,
                    date: dateObj,
                    count: 1,
                },
                update: {
                    count: { increment: 1 },
                },
            });
        } catch (e) {
            console.error("Failed to record affiliate click daily:", e);
        }

        return link;
    },

    /**
     * Récupère les liens affiliés d'un utilisateur
     */
    async getUserLinks(userId: string) {
        return prisma.affiliateLink.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    },

    /**
     * Récupère les stats d'un lien affilié
     */
    async getLinkStats(linkId: string, days: number = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const dailyStats = await prisma.affiliateLinkClickDaily.findMany({
            where: {
                affiliateLinkId: linkId,
                date: { gte: since },
            },
            orderBy: { date: "asc" },
        });

        return dailyStats.map((s) => ({
            date: s.date.toISOString().split("T")[0],
            count: s.count,
        }));
    },
};
