import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../lib/replyView";
import { requireAuthRedirect } from "../../middleware/auth";
import { affiliateService } from "@plinkk/shared";
import { verifyRolePartner } from "../../lib/verifyRole";

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

        return replyView(reply, "dashboard/user/partnership.ejs", userInfo, {
            active: "partnership",
            affiliateLinks: linksWithStats,
            publicPath: request.publicPath,
        });
    });

    fastify.post("/links", async (request, reply) => {
        const userId = request.userId!;
        const body = request.body as { slug?: string; type?: "RANDOM" | "CUSTOM" };

        try {
            const link = await affiliateService.createLink(userId, body);
            return reply.send({ success: true, link });
        } catch (e) {
            return reply.code(400).send({ error: "failed_to_create_link" });
        }
    });
}
