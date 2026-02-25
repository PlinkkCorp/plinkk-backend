import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../lib/replyView";
import { requireAuthRedirect } from "../../middleware/auth";
import { affiliateService } from "@plinkk/shared";
import { verifyRolePartner, verifyRoleIsStaff } from "../../lib/verifyRole";

export async function dashboardPartnershipRoutes(fastify: FastifyInstance) {
    fastify.addHook("preHandler", requireAuthRedirect);

    fastify.get("/", async (request, reply) => {
        const userInfo = request.currentUser!;
        const userId = request.userId!;

        // Vérifier si l'utilisateur est un partenaire
        if (!verifyRolePartner(userInfo.role)) {
            return reply.redirect("/");
        }

        const affiliateLinks = await affiliateService.getUserLinks(userId);

        // Récupérer les stats pour chaque lien (sur les 30 derniers jours)
        const linksWithStats = await Promise.all(
            affiliateLinks.map(async (link) => {
                const stats = await affiliateService.getLinkStats(link.id);
                return {
                    ...link,
                    stats,
                };
            })
        );

        // Récupérer les infos du partenaire (si applicable via le modèle Partner existant)
        // Ici on suppose que le partenaire peut avoir une entrée dans la table Partner
        // Mais pour l'instant on se concentre sur les liens affiliés liés à l'utilisateur

        // If the user has a Partner entry, aggregate partner stats
        let partnerInfo = null as any;
        try {
            const partner = await prisma.partner.findUnique({ where: { userId } });
            if (partner) {
                // Sum partner daily stats
                const agg = await prisma.partnerStatDaily.groupBy({
                    by: ['partnerId'],
                    where: { partnerId: partner.id },
                    _sum: { views: true, clicks: true }
                });
                const sums = agg[0]?._sum || { views: 0, clicks: 0 };

                // Sum gems rewarded for quests of this partner
                const quests = await prisma.partnerQuest.findMany({ where: { partnerId: partner.id }, select: { id: true, title: true } });
                const questIds = quests.map(q => q.id);
                const gemsAgg = questIds.length > 0 ? await prisma.userQuest.groupBy({
                    by: ['partnerQuestId'],
                    where: { partnerQuestId: { in: questIds } },
                    _sum: { gemsRewarded: true }
                }) : [] as any[];

                const gemsPerQuest = new Map<string, number>();
                gemsAgg.forEach(g => gemsPerQuest.set(g.partnerQuestId, g._sum.gemsRewarded || 0));

                partnerInfo = {
                    partner,
                    stats: { views: sums.views || 0, clicks: sums.clicks || 0 },
                    quests: quests.map(q => ({ ...q, gemsAwarded: gemsPerQuest.get(q.id) || 0 }))
                };
            }
        } catch (e) {
            request.log?.error?.(e);
        }

        return replyView(reply, "dashboard/user/partnership.ejs", userInfo, {
            active: "partnership",
            affiliateLinks: linksWithStats,
            publicPath: request.publicPath,
            partnerInfo,
        });
    });

    fastify.post("/links", async (request, reply) => {
        const userId = request.userId!;
        const body = request.body as { slug?: string; type?: "RANDOM" | "CUSTOM" };

        // Prevent non-staff (partners included) from creating or modifying affiliate links here.
        // Affiliate links should be managed by staff via the admin routes.
        const userInfo = request.currentUser!;
        if (!verifyRoleIsStaff(userInfo.role)) {
            return reply.code(403).send({ error: "forbidden" });
        }

        try {
            const link = await affiliateService.createLink(userId, body);
            return reply.send({ success: true, link });
        } catch (e) {
            return reply.code(400).send({ error: "failed_to_create_link" });
        }
    });

    fastify.get("/quest/:questId/start", async (request, reply) => {
        const userId = request.userId!;
        const { questId } = request.params as { questId: string };

        const quest = await prisma.partnerQuest.findUnique({
            where: { id: questId },
            include: { partner: true }
        });

        if (!quest || !quest.isActive || !quest.partner.isActive) {
            return reply.redirect("/partners");
        }

        // Check if already completed
        const existing = await prisma.userQuest.findUnique({
            where: {
                userId_partnerQuestId: {
                    userId,
                    partnerQuestId: questId
                }
            }
        });

        if (!existing) {
            // Reward gems and record completion
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
                prisma.partnerStatDaily.upsert({
                    where: {
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
                        views: 0
                    }
                })
            ]);
        }

        return reply.redirect(quest.actionUrl);
    });
}
