import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { requireAuthRedirect } from "../../../middleware/auth";

export function adminPartnersRoutes(fastify: FastifyInstance) {
    fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
        const ok = await ensurePermission(request, reply, "VIEW_ADMIN", { mode: "redirect" });
        if (!ok) return;

        const partners = await prisma.partner.findMany({
            include: {
                _count: {
                    select: { quests: true }
                }
            },
            orderBy: { order: 'asc' }
        });

        return replyView(reply, "dashboard/admin/partners/index.ejs", request.currentUser!, {
            partners,
        });
    });

    fastify.get("/:id", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
        const ok = await ensurePermission(request, reply, "VIEW_ADMIN", { mode: "redirect" });
        if (!ok) return;

        const { id } = request.params as { id: string };
        const partner = await prisma.partner.findUnique({
            where: { id },
            include: { quests: { orderBy: { createdAt: 'desc' } } }
        });

        if (!partner) {
            return reply.redirect("/admin/partners");
        }

        // Récupérer l'utilisateur lié
        let linkedUser = null;
        if (partner.userId) {
            linkedUser = await prisma.user.findUnique({
                where: { id: partner.userId },
                include: { affiliateLinks: true }
            });
        } else {
            // Fallback sur le nom (ancienne méthode)
            linkedUser = await prisma.user.findFirst({
                where: { name: partner.name, role: { name: "PARTNER" } },
                include: { affiliateLinks: true }
            });
        }

        // Récupérer tous les utilisateurs avec le rôle PARTNER pour le sélecteur
        const partnerUsers = await prisma.user.findMany({
            where: { role: { name: "PARTNER" } },
            select: { id: true, name: true, email: true }
        });

        return replyView(reply, "dashboard/admin/partners/edit.ejs", request.currentUser!, {
            partner,
            linkedUser,
            partnerUsers
        });
    });
}
