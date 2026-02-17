import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../lib/replyView";
import { requireAuthRedirect, requireAuth } from "../../middleware/auth";

export function dashboardLeadsRoutes(fastify: FastifyInstance) {
    // Page: view leads
    fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
        const userInfo = request.currentUser!;
        const userId = request.userId!;

        // Get all plinkks for this user
        const userPlinkks = await prisma.plinkk.findMany({
            where: { userId },
            select: { id: true, name: true, slug: true },
        });
        const plinkkIds = userPlinkks.map((p) => p.id);

        // Find all LEAD events for this user's plinkks
        const leads = await prisma.pageStat.findMany({
            where: {
                eventType: "LEAD",
                plinkkId: { in: plinkkIds },
            },
            include: {
                plinkk: { select: { id: true, name: true, slug: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 500,
        });

        // Enrich leads with link text from the meta.linkId
        const linkIds = leads
            .map((l) => {
                const meta = l.meta as any;
                return meta?.linkId;
            })
            .filter(Boolean);

        const links = linkIds.length
            ? await prisma.link.findMany({
                where: { id: { in: linkIds } },
                select: { id: true, text: true },
            })
            : [];

        const linkMap = new Map(links.map((l) => [l.id, l]));

        const enrichedLeads = leads.map((lead) => {
            const meta = lead.meta as any;
            const link = meta?.linkId ? linkMap.get(meta.linkId) : null;
            return {
                ...lead,
                linkInfo: link,
                formData: meta?.formData || {},
            };
        });

        return replyView(reply, "dashboard/user/leads.ejs", userInfo, {
            leads: enrichedLeads,
        });
    });

    // API: delete a lead
    fastify.delete("/api/:id", { preHandler: [requireAuth] }, async function (request, reply) {
        const userId = request.userId!;
        const { id } = request.params as { id: string };

        // Get user's plinkk IDs
        const userPlinkks = await prisma.plinkk.findMany({
            where: { userId },
            select: { id: true },
        });
        const plinkkIds = userPlinkks.map((p) => p.id);

        const lead = await prisma.pageStat.findFirst({
            where: { id, eventType: "LEAD", plinkkId: { in: plinkkIds } },
        });

        if (!lead) {
            return reply.code(404).send({ error: "not_found" });
        }

        await prisma.pageStat.delete({ where: { id } });
        return reply.send({ ok: true });
    });
}
