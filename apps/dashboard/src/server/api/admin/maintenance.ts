import { FastifyInstance } from "fastify";
import { updateMaintenanceStatus, getMaintenanceStatus, MaintenanceStatus } from "../../../services/maintenance.service";
import { prisma } from "@plinkk/prisma";
import { UnauthorizedError, ForbiddenError } from "@plinkk/shared";

export async function apiAdminMaintenanceRoutes(fastify: FastifyInstance) {
    // Middleware to check permission
    fastify.addHook("preHandler", async (request, reply) => {
        const sessionData = request.session.get("data");
        const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

        if (!currentUserId) throw new UnauthorizedError();

        const user = await prisma.user.findUnique({
            where: { id: currentUserId },
            include: { role: { include: { permissions: true } } }
        });

        const hasPermission = user?.role?.permissions.some(rp => rp.permissionKey === "ACCESS_MAINTENANCE");
        if (!hasPermission) {
            console.log(`[DEBUG] Maintenance Access Denied for user ${currentUserId}`);
            console.log(`[DEBUG] Role: ${user?.role?.name}`);
            console.log(`[DEBUG] Permissions:`, user?.role?.permissions);

            // Fallback: check if admin or developer (handled by verifyRoleIsStaff usually, but let's be strict on permission as requested)
            // "seul les personnes ayant la permission ACCESS_MAINTENACE puisse avoir accès"
            throw new ForbiddenError();
        }
    });

    fastify.get("/", async (request, reply) => {
        const status = await getMaintenanceStatus();
        return reply.send(status);
    });

    fastify.post("/", async (request, reply) => {
        try {
            const body = request.body as Partial<MaintenanceStatus>;
            console.log("[DEBUG] Updating maintenance status:", body);

            const updated = await updateMaintenanceStatus({
                global: body.global,
                dashboard: body.dashboard,
                activePages: body.activePages,
                maintenancePages: body.maintenancePages,
                reason: body.reason,
                scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : null,
                scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : null,
                allowedIps: body.allowedIps,
                allowedRoles: body.allowedRoles,
            });

            return reply.send(updated);
        } catch (error) {
            console.error("[ERROR] Failed to update maintenance status:", error);
            // @ts-ignore
            return reply.status(500).send({ error: "Internal Server Error", message: error.message, stack: error.stack });
        }
    });
}
