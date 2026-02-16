
import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";

export function debugPermissionsRoute(fastify: FastifyInstance) {
    fastify.get("/debug-fix-permissions", async (request, reply) => {
        const role = await prisma.role.findUnique({
            where: { name: 'ADMIN' },
            include: { permissions: true }
        });

        if (!role) return { error: "ADMIN role not found" };

        const hasManage = role.permissions.some(p => p.permissionKey === 'MANAGE_MAINTENANCE');
        let action = "None";

        if (!hasManage) {
            await prisma.rolePermission.create({
                data: {
                    roleId: role.id,
                    permissionKey: 'MANAGE_MAINTENANCE'
                }
            });
            action = "Added MANAGE_MAINTENANCE to ADMIN";
        }

        // Also fix Developer
        const devRole = await prisma.role.findUnique({ where: { name: 'DEVELOPER' }, include: { permissions: true } });
        if (devRole && !devRole.permissions.some(p => p.permissionKey === 'MANAGE_MAINTENANCE')) {
            await prisma.rolePermission.create({
                data: {
                    roleId: devRole.id,
                    permissionKey: 'MANAGE_MAINTENANCE'
                }
            });
            action += " & Added to DEVELOPER";
        }

        return {
            status: "OK",
            adminHasPermissionBefore: hasManage,
            actionTaken: action,
            currentPermissions: (await prisma.role.findUnique({ where: { name: 'ADMIN' }, include: { permissions: true } }))?.permissions.map(p => p.permissionKey)
        };
    });
}
