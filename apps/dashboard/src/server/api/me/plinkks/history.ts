import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { captureSnapshot, restoreVersion } from "../../../../lib/plinkkHistoryService";

export function plinkksHistoryRoutes(fastify: FastifyInstance) {
    // List versions for a Plinkk
    fastify.get("/:id/history", async (request, reply) => {
        const userId = request.session.get("data") as string | undefined;
        if (!userId) return reply.code(401).send({ error: "unauthorized" });

        const { id } = request.params as { id: string };
        const plinkk = await prisma.plinkk.findFirst({
            where: { id, userId }
        });

        if (!plinkk) return reply.code(404).send({ error: "not_found" });

        const versions = await prisma.plinkkVersion.findMany({
            where: { plinkkId: id },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                label: true,
                createdAt: true
            }
        });

        return reply.send({ versions });
    });

    // Get specific version data (snapshot) for preview
    fastify.get("/:id/history/:versionId", async (request, reply) => {
        const userId = request.session.get("data") as string | undefined;
        if (!userId) return reply.code(401).send({ error: "unauthorized" });

        const { id, versionId } = request.params as { id: string; versionId: string };
        const version = await prisma.plinkkVersion.findFirst({
            where: {
                id: versionId,
                plinkkId: id,
                plinkk: { userId }
            }
        });

        if (!version) return reply.code(404).send({ error: "not_found" });

        return reply.send({
            id: version.id,
            createdAt: version.createdAt,
            snapshot: version.snapshot
        });
    });

    // Restore a Plinkk to a version
    fastify.post("/:id/history/:versionId/restore", async (request, reply) => {
        const userId = request.session.get("data") as string | undefined;
        if (!userId) return reply.code(401).send({ error: "unauthorized" });

        const { id, versionId } = request.params as { id: string; versionId: string };

        try {
            // 1. Capture current state as a "pre-restore" point if wanted? 
            // For now let's just restore.
            await restoreVersion(id, versionId, userId);

            return reply.send({ ok: true });
        } catch (err: any) {
            console.error("Restore failed", err);
            return reply.code(500).send({ error: "restore_failed", message: err.message });
        }
    });

    // Manual snapshot creation (Optional, if user wants to label a version)
    fastify.post("/:id/history/snapshot", async (request, reply) => {
        const userId = request.session.get("data") as string | undefined;
        if (!userId) return reply.code(401).send({ error: "unauthorized" });

        const { id } = request.params as { id: string };
        const { label } = request.body as { label?: string };

        const plinkk = await prisma.plinkk.findFirst({
            where: { id, userId }
        });

        if (!plinkk) return reply.code(404).send({ error: "not_found" });

        await captureSnapshot(id, label);

        return reply.send({ ok: true });
    });
}
