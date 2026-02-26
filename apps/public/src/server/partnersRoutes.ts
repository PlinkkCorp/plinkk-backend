import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";

export function partnersRoutes(fastify: FastifyInstance) {
    fastify.get("/api/partners", async (request, reply) => {
        const partners = await prisma.partner.findMany({
            where: { isActive: true },
            include: {
                quests: {
                    where: { isActive: true }
                }
            },
            orderBy: { order: 'asc' }
        });

        // Aggregate daily stats (views / clicks) and gems rewarded per partner
        try {
            const partnerIds = partners.map(p => p.id);

            const statsAgg = partnerIds.length > 0 ? await prisma.partnerStatDaily.groupBy({
                by: ['partnerId'],
                where: { partnerId: { in: partnerIds } },
                _sum: { views: true, clicks: true }
            }) : [] as any[];

            const quests = partnerIds.length > 0 ? await prisma.partnerQuest.findMany({
                where: { partnerId: { in: partnerIds } },
                select: { id: true, partnerId: true }
            }) : [] as any[];

            const questIds = quests.map(q => q.id);
            const userQuestSums = questIds.length > 0 ? await prisma.userQuest.groupBy({
                by: ['partnerQuestId'],
                where: { partnerQuestId: { in: questIds } },
                _sum: { gemsRewarded: true }
            }) : [] as any[];

            const statsMap = new Map<string, { views: number; clicks: number }>();
            statsAgg.forEach(s => {
                statsMap.set(s.partnerId, { views: s._sum.views || 0, clicks: s._sum.clicks || 0 });
            });

            const questToPartner = new Map<string, string>();
            quests.forEach(q => questToPartner.set(q.id, q.partnerId));

            const gemsMap = new Map<string, number>();
            userQuestSums.forEach(uq => {
                const pid = questToPartner.get(uq.partnerQuestId);
                if (!pid) return;
                const current = gemsMap.get(pid) || 0;
                gemsMap.set(pid, current + (uq._sum.gemsRewarded || 0));
            });

            // Attach aggregated stats to partner objects (non-breaking: added field `stats`)
            partners.forEach(p => {
                const s = statsMap.get(p.id) || { views: 0, clicks: 0 };
                (p as any).stats = {
                    views: s.views,
                    clicks: s.clicks,
                    gemsAwarded: gemsMap.get(p.id) || 0
                };
            });
        } catch (e) {
            // If aggregation fails, we still return partners without stats
            request.log?.error?.(e);
        }

        const sessionData = request.session.get("data");
        const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

        let userQuests: string[] = [];
        let plinkkGems = 0;

        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    plinkkGems: true,
                    // We can't easily include UserQuest relation directly since it's not defined in User in this basic query,
                    // but we added UserQuest model pointing to User.
                }
            });
            if (user) plinkkGems = user.plinkkGems;

            const completed = await prisma.userQuest.findMany({
                where: { userId },
                select: { partnerQuestId: true }
            });
            userQuests = completed.map(uq => uq.partnerQuestId);
        }

        return reply.send({ partners, userQuests, plinkkGems });
    });

    fastify.post("/api/quests/:questId/complete", async (request, reply) => {
        const sessionData = request.session.get("data");
        const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

        if (!userId) {
            return reply.code(401).send({ error: "unauthorized", message: "Connectez-vous pour gagner des gems" });
        }

        const { questId } = request.params as { questId: string };

        const quest = await prisma.partnerQuest.findUnique({
            where: { id: questId },
            include: { partner: true }
        });

        if (!quest || !quest.isActive || !quest.partner.isActive) {
            return reply.code(404).send({ error: "not_found", message: "Quête introuvable ou inactive" });
        }

        // Check if user already completed this quest
        const existing = await prisma.userQuest.findUnique({
            where: {
                userId_partnerQuestId: {
                    userId,
                    partnerQuestId: questId
                }
            }
        });

        if (existing) {
            // Already completed, just return success so the frontend redirects them, but no gems added.
            return reply.send({ ok: true, alreadyCompleted: true, actionUrl: quest.actionUrl });
        }

        // Wrap in transaction to add UserQuest and update User gems
        await prisma.$transaction([
            prisma.userQuest.create({
                data: {
                    userId,
                    partnerQuestId: questId,
                    gemsRewarded: quest.rewardGems
                }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { plinkkGems: { increment: quest.rewardGems } }
            }),
            // Also update Partner stats (clicks)
            prisma.partnerStatDaily.upsert({
                where: {
                    // we use the start of the day
                    partnerId_date: {
                        partnerId: quest.partnerId,
                        date: new Date(new Date().setUTCHours(0, 0, 0, 0))
                    }
                },
                update: { clicks: { increment: 1 } },
                create: {
                    partnerId: quest.partnerId,
                    date: new Date(new Date().setUTCHours(0, 0, 0, 0)),
                    clicks: 1,
                    views: 0 // views might be updated separately via a pixel or API call when page loads
                }
            })
        ]);

        return reply.send({ ok: true, rewardGems: quest.rewardGems, actionUrl: quest.actionUrl });
    });

    // Simple tracking endpoint for views
    fastify.post("/api/partners/:partnerId/view", async (request, reply) => {
        const { partnerId } = request.params as { partnerId: string };

        try {
            await prisma.partnerStatDaily.upsert({
                where: {
                    partnerId_date: {
                        partnerId,
                        date: new Date(new Date().setUTCHours(0, 0, 0, 0))
                    }
                },
                update: { views: { increment: 1 } },
                create: {
                    partnerId,
                    date: new Date(new Date().setUTCHours(0, 0, 0, 0)),
                    views: 1,
                    clicks: 0
                }
            });
        } catch (e) { /* ignore */ }

        return reply.send({ ok: true });
    });

    // Affiliate Link Redirection
    fastify.get("/a/:slug", async (request, reply) => {
        const { slug } = request.params as { slug: string };

        try {
            const affiliateLink = await prisma.affiliateLink.findFirst({
                where: { slug }
            });

            if (!affiliateLink) {
                return reply.redirect("/");
            }

            // Import affiliateService dynamically to avoid issues if needed, or stick to the shared export
            const { affiliateService } = await import("@plinkk/shared");
            await affiliateService.recordClick(affiliateLink.slug);

            return reply.redirect("/");
        } catch (e) {
            return reply.redirect("/");
        }
    });
}
