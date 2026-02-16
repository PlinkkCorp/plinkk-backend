
import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { requireAuthRedirect } from "../../../middleware/auth";
import { getMaintenanceStatus } from "../../../services/maintenance.service";

export function adminMaintenanceRoutes(fastify: FastifyInstance) {
    fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
        const ok = await ensurePermission(request, reply, "MANAGE_MAINTENANCE", { mode: "redirect" });
        if (!ok) return;

        const maintenanceStatus = await getMaintenanceStatus();

        // Fetch roles for the whitelist dropdown
        const roles = await prisma.role.findMany({
            orderBy: { priority: 'desc' },
            select: { id: true, name: true }
        });

        return replyView(reply, "dashboard/admin/maintenance.ejs", request.currentUser!, {
            maintenance: maintenanceStatus,
            roles: roles,
            publicPath: request.publicPath,
        });
    });
}
