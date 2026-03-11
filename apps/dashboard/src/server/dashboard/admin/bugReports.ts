import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { requireAuthRedirect } from "../../../middleware/auth";
import { logAdminAction } from "../../../lib/adminLogger";

type ThreadMessage = {
    id: string;
    from: "user" | "admin";
    message: string;
    createdAt: Date;
};

function extractUserThreadMessages(raw: string, createdAt: Date, reportId: string): ThreadMessage[] {
    const lines = String(raw || "").split("\n");
    const messages: ThreadMessage[] = [];

    let base: string[] = [];
    let replyBuffer: string[] = [];
    let replyIso: string | null = null;

    const flushReply = () => {
        if (!replyIso) return;
        const text = replyBuffer.join("\n").trim();
        if (text) {
            messages.push({
                id: `user-reply-${reportId}-${messages.length + 1}`,
                from: "user",
                message: text,
                createdAt: new Date(replyIso),
            });
        }
        replyIso = null;
        replyBuffer = [];
    };

    for (const line of lines) {
        const marker = line.match(/^\[USER_REPLY\s+([^\]]+)\]\s*(.*)$/);
        if (marker) {
            flushReply();
            replyIso = marker[1];
            if (marker[2]) replyBuffer.push(marker[2]);
            continue;
        }
        if (replyIso) {
            replyBuffer.push(line);
        } else {
            base.push(line);
        }
    }
    flushReply();

    const baseMessage = base.join("\n").trim();
    if (baseMessage) {
        messages.unshift({
            id: `origin-${reportId}`,
            from: "user",
            message: baseMessage,
            createdAt,
        });
    }

    return messages;
}

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

            const adminReplies = bugReports.length
                ? await prisma.announcement.findMany({
                      where: { text: { startsWith: "[RÉPONSE BUG #" } },
                      orderBy: { createdAt: "asc" },
                      select: { id: true, text: true, createdAt: true },
                  })
                : [];

            const bugReportsWithThreads = bugReports.map((report) => {
                const token = `[RÉPONSE BUG #${report.id}]`;
                const adminMessages: ThreadMessage[] = adminReplies
                    .filter((r) => r.text.startsWith(token))
                    .map((r) => ({
                        id: r.id,
                        from: "admin" as const,
                        message: r.text.replace(token, "").trim(),
                        createdAt: r.createdAt,
                    }));

                const userMessages = extractUserThreadMessages(report.message, report.createdAt, report.id);

                const thread: ThreadMessage[] = [...userMessages, ...adminMessages].sort(
                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );

                return { ...report, thread };
            });

            return replyView(reply, "dashboard/admin/bugReports.ejs", request.currentUser!, {
                bugReports: bugReportsWithThreads,
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
            const { message, level, displayType, status } = request.body as {
                message: string;
                level: string;
                displayType: string;
                status?: string;
            };

            const bugReport = await prisma.bugReport.findUnique({
                where: { id },
                include: { user: true },
            });

            if (bugReport && bugReport.userId) {
                await prisma.announcement.create({
                    data: {
                        text: `[RÉPONSE BUG #${id}] ${message}`,
                        level: level || "info",
                        displayType: displayType || "notification",
                        global: false,
                        targets: {
                            create: { userId: bugReport.userId },
                        },
                    },
                });

                const allowedStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED"];
                const newStatus = status && allowedStatuses.includes(status) ? status : null;
                if (newStatus) {
                    await prisma.bugReport.update({
                        where: { id },
                        data: { status: newStatus },
                    });
                }

                await logAdminAction(
                    request.currentUser!.id,
                    "RESPOND_BUG_REPORT",
                    bugReport.userId || undefined,
                    { bugReportId: id, message, level, displayType, status: newStatus },
                    request.ip
                );
            }

            return reply.redirect("/dashboard/admin/bug-reports");
        }
    );
}
