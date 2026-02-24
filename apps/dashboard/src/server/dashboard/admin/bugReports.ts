import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { requireAuthRedirect } from "../../../middleware/auth";
import { logAdminAction } from "../../../lib/adminLogger";

export function dashboardAdminBugReportsRoutes(fastify: FastifyInstance) {
    fastify.get(
        "/",
        { preHandler: [requireAuthRedirect] },
        async (request, reply) => {
            const ok = await ensurePermission(request, reply, "VIEW_ADMIN", { mode: "redirect" });
            if (!ok) return;

            const bugReports = await prisma.bugReport.findMany({
                orderBy: { createdAt: "desc" },
                include: { user: true },
                take: 100,
            });

            return replyView(reply, "dashboard/admin/bugReports.ejs", request.currentUser!, {
                bugReports,
            });
        }
    );

    fastify.post(
        "/:id/resolve",
        { preHandler: [requireAuthRedirect] },
        async (request, reply) => {
            const ok = await ensurePermission(request, reply, "VIEW_ADMIN", { mode: "redirect" });
            if (!ok) return;

            const { id } = request.params as { id: string };
            const body = request.body as { status: string };

            await prisma.bugReport.update({
                where: { id },
                data: { status: body.status || "RESOLVED" },
            });

            await logAdminAction(
                request.currentUser!.id,
                "RESOLVE_BUG_REPORT",
                undefined,
                { bugReportId: id, status: body.status || "RESOLVED" },
                request.ip
            );

            return reply.redirect("/dashboard/admin/bug-reports");
        }
    );

    fastify.post(
        "/:id/respond",
        { preHandler: [requireAuthRedirect] },
        async (request, reply) => {
            const ok = await ensurePermission(request, reply, "VIEW_ADMIN", { mode: "redirect" });
            if (!ok) return;

            const { id } = request.params as { id: string };
            const { message, level, displayType } = request.body as { message: string, level: string, displayType: string };

            const bugReport = await prisma.bugReport.findUnique({
                where: { id },
                include: { user: true }
            });

            if (bugReport && bugReport.userId) {
                // Create a site message for the user
                await prisma.announcement.create({
                    data: {
                        text: `[RÉPONSE BUG] ${message}`,
                        level: level || "info",
                        displayType: displayType || "notification",
                        global: false,
                        targets: {
                            create: { userId: bugReport.userId }
                        }
                    }
                });

                // Update bug report status if needed
                await prisma.bugReport.update({
                    where: { id },
                    data: { status: "RESOLVED" }
                });

                await logAdminAction(
                    request.currentUser!.id,
                    "RESPOND_BUG_REPORT",
                    bugReport.userId || undefined,
                    { bugReportId: id, message, level, displayType },
                    request.ip
                );
            }

            return reply.redirect("/dashboard/admin/bug-reports");
        }
    );
}
