import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { ensurePermission } from "../../../lib/permissions";
import { logAdminAction } from "../../../lib/adminLogger";
import { requireAuth } from "../../../middleware/auth";
import { reindexNonDefault } from "../../../lib/plinkkUtils";

export function adminPlinkksRoutes(fastify: FastifyInstance) {
    
    // Patch Plinkk (Slug, Settings, etc.)
    fastify.patch("/:id", { preHandler: [requireAuth] }, async function (request, reply) {
        const ok = await ensurePermission(request, reply, "MANAGE_USERS");
        if (!ok) return;

        const { id } = request.params as { id: string };
        const data = request.body as { slug?: string; isPublic?: boolean; isDefault?: boolean };
        const payload: typeof data = {};

        if (data.slug !== undefined) payload.slug = data.slug;
        if (data.isPublic !== undefined) payload.isPublic = data.isPublic;
        if (data.isDefault !== undefined) {
             // If setting default, unset others first? 
             // Logic: usually handled by service. For admin, we force it.
             if (data.isDefault) {
                 const current = await prisma.plinkk.findUnique({ where: { id } });
                 if (current) {
                     await prisma.plinkk.updateMany({ where: { userId: current.userId }, data: { isDefault: false } });
                 }
             }
             payload.isDefault = data.isDefault;
        }

        await prisma.plinkk.update({ where: { id }, data: payload });
        
        await logAdminAction(request.userId!, "UPDATE_PLINKK", id, payload, request.ip);
        return reply.send({ success: true });
    });

    // Toggle Active
    fastify.patch("/:id/active", { preHandler: [requireAuth] }, async function (request, reply) {
        const ok = await ensurePermission(request, reply, "MANAGE_USERS");
        if (!ok) return;

        const { id } = request.params as { id: string };
        const { isActive } = request.body as { isActive: boolean };

        await prisma.plinkk.update({ where: { id }, data: { isActive } });
        await logAdminAction(request.userId!, "UPDATE_PLINKK_ACTIVE", id, { isActive }, request.ip);
        return reply.send({ success: true });
    });

    // Update Config (Email Visibility)
    fastify.put("/:id/config", { preHandler: [requireAuth] }, async function (request, reply) {
        const ok = await ensurePermission(request, reply, "MANAGE_USERS");
        if (!ok) return;

        const { id } = request.params as { id: string };
        const { affichageEmail } = (request.body as { affichageEmail: string | null }) ?? {};

        const plinkk = await prisma.plinkk.findUnique({ where: { id } });
        if (!plinkk) return reply.code(404).send({ error: "Plinkk not found" });

        await prisma.plinkkSettings.upsert({
            where: { plinkkId: id },
            create: { plinkkId: id, affichageEmail: affichageEmail ?? null },
            update: { affichageEmail: affichageEmail ?? null }
        });

        await logAdminAction(request.userId!, "UPDATE_PLINKK_CONFIG", id, { affichageEmail }, request.ip);
        return reply.send({ success: true });
    });

    // Delete Plinkk
    fastify.delete("/:id", { preHandler: [requireAuth] }, async function (request, reply) {
        const ok = await ensurePermission(request, reply, "MANAGE_USERS");
        if (!ok) return;

        const { id } = request.params as { id: string };
        
        const target = await prisma.plinkk.findUnique({ where: { id } });
        if (!target) return reply.code(404).send({ error: "not_found" });

        await prisma.plinkk.delete({ where: { id } });
        await reindexNonDefault(prisma, target.userId);

        await logAdminAction(request.userId!, "DELETE_PLINKK", id, { slug: target.slug }, request.ip);

        return reply.send({ success: true });
    });
}
