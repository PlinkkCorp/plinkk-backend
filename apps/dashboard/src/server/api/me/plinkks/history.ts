
import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { restorePlinkkVersion, createPlinkkVersion } from "../../../services/historyService";
import { isUserPremium } from "@plinkk/shared";
// @ts-ignore
import { logUserAction } from "../../../../lib/userLogger";

// snapshot shape used in history entries
interface PlinkkSnapshot {
    meta?: { changes?: unknown[] };
}


export function plinkksHistoryRoutes(fastify: FastifyInstance) {

    // Get History
    fastify.get("/:id/history", async (request, reply) => {
        const userId = request.session.get("data") as string | undefined;
        if (!userId) return reply.code(401).send({ error: "Unauthorized" });
        const { id } = request.params as { id: string };

        const page = await prisma.plinkk.findUnique({ where: { id } });
        if (!page || page.userId !== userId) return reply.code(404).send({ error: "Plinkk not found" });

        const versions = await prisma.plinkkVersion.findMany({
            where: { plinkkId: id },
            orderBy: { createdAt: "desc" },
            select: { id: true, label: true, createdAt: true, snapshot: true } // Need snapshot for meta
        });

        const mappedVersions = versions.map(v => {
            const snap = v.snapshot as PlinkkSnapshot;
            return {
                id: v.id,
                label: v.label,
                createdAt: v.createdAt,
                isManual: v.label?.startsWith("[BACKUP]"),
                // Extract changes from meta
                changes: snap?.meta?.changes || []
            };
        });

        return reply.send({
            versions: mappedVersions.filter(v => !v.label?.startsWith("[BACKUP]")),
            backups: mappedVersions.filter(v => v.label?.startsWith("[BACKUP]"))
        });
    });

    // Create Manual Backup
    fastify.post("/:id/history", async (request, reply) => {
        const userId = request.session.get("data") as string | undefined;
        if (!userId) return reply.code(401).send({ error: "Unauthorized" });
        const { id } = request.params as { id: string };
        const body = request.body as { name: string };
        const name = body.name ? body.name.trim() : "Sauvegarde manuelle";

        const page = await prisma.plinkk.findUnique({ where: { id } });
        if (!page || page.userId !== userId) return reply.code(404).send({ error: "Plinkk not found" });

        try {
            await createPlinkkVersion(id, userId, `[BACKUP] ${name}`, true);
        } catch (e) {
            request.log.error(e);
            return reply.code(500).send({ error: "Backup failed" });
        }

        return reply.send({ ok: true });
    });

    // Restore Version
    fastify.post("/:id/history/:versionId/restore", async (request, reply) => {
        const userId = request.session.get("data") as string | undefined;
        if (!userId) return reply.code(401).send({ error: "Unauthorized" });
        const { id, versionId } = request.params as { id: string, versionId: string };

        const page = await prisma.plinkk.findUnique({ where: { id } });
        if (!page || page.userId !== userId) return reply.code(404).send({ error: "Plinkk not found" });

        // Ideally, take a snapshot of CURRENT state before restoring? 
        // "Auto-save before restore"
        // We can do that by calling createVersion() in the service or here.
        // But let's keep it simple for now, user asked for restore.
        // Implementing "Safety Snapshot" is good practice though. Let's do it if possible in the service?
        // Actually the existing logic in createVersion might be callable.
        // But strict requirements: just restore.

        try {
            await restorePlinkkVersion(id, versionId, userId);
            // Log the action
            //  await logUserAction(userId, "RESTORE_PLINKK_VERSION", id, { versionId, formatted: "Restored a previous version" }, request.ip);
        } catch (e) {
            request.log.error(e);
            return reply.code(500).send({ error: "Restore failed" });
        }

        return reply.send({ ok: true });
    });
}
