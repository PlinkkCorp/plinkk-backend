import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { verifyRoleIsStaff } from "../../../lib/verifyRole";
import { affiliateService } from "@plinkk/shared";

export function apiAdminAffiliateRoutes(fastify: FastifyInstance) {
    // Middleware to check admin role
    fastify.addHook("preHandler", async (request, reply) => {
        const sessionData = request.session.get("data");
        if (!sessionData) return reply.code(401).send({ error: "unauthorized" });
        const userId = typeof sessionData === "object" ? sessionData.id : sessionData;
        const me = await prisma.user.findUnique({
            where: { id: String(userId) },
            select: { role: true },
        });
        if (!(me && verifyRoleIsStaff(me.role))) {
            return reply.code(403).send({ error: "forbidden" });
        }
    });

    fastify.post("/links", async (request, reply) => {
        const { userId, type, slug } = request.body as { userId: string; type: "RANDOM" | "CUSTOM"; slug?: string };

        if (!userId) return reply.code(400).send({ error: "missing_user_id" });

        try {
            const link = await affiliateService.createLink(userId, { type, slug });
            return reply.send({ ok: true, link });
        } catch (e: any) {
            return reply.code(400).send({ error: e.message || "creation_failed" });
        }
    });

    fastify.delete("/links/:id", async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
            await prisma.affiliateLink.delete({ where: { id } });
            return reply.send({ ok: true });
        } catch (e) {
            return reply.code(404).send({ error: "not_found" });
        }
    });
}
