import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { requireAuthRedirect } from "../../../middleware/auth";
import { logAdminAction } from "../../../lib/adminLogger";
import { bugReportClients, broadcastToBugReport, ThreadMessage } from "../../../services/bugReportSocketService";

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
                userName: "Utilisateur",
                image: null,
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
            userName: "Utilisateur", // Will be overridden
            image: null,
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
                include: { 
                    user: true, 
                    conversation: {
                        include: {
                            messages: {
                                orderBy: { createdAt: "asc" }
                            }
                        }
                    }
                },
                take: 100,
            }) as any[];

            // For each bug report, construct the thread including the original message and all replies
            const bugReportsWithThreads = bugReports.map((report) => {
                const thread: ThreadMessage[] = [];

                // Add original message
                thread.push({
                    id: `origin-${report.id}`,
                    from: "user",
                    message: report.message,
                    userName: report.user?.userName || "Anonyme",
                    image: report.user?.image || null,
                    createdAt: report.createdAt,
                });

                // Add all subsequent messages
                const messages = report.conversation?.messages || [];
                messages.forEach((msg: any) => {
                    thread.push({
                        id: msg.id,
                        from: msg.from as "user" | "admin",
                        message: msg.message,
                        userName: msg.from === "admin" ? "Admin" : (report.user?.userName || "Utilisateur"),
                        image: null,
                        createdAt: msg.createdAt,
                    });
                });

                return { ...report, thread };
            });

            return replyView(reply, "dashboard/admin/bugReports.ejs", request.currentUser!, {
                bugReports: bugReportsWithThreads,
                adminName: request.currentUser!.userName,
                adminAvatar: request.currentUser!.image
            });
        }
    );

    fastify.get(
        "/:id/ws",
        { websocket: true, preHandler: [requireAuthRedirect] },
        (socket, request) => {
            const { id } = request.params as { id: string };
            if (!bugReportClients.has(id)) {
                bugReportClients.set(id, new Set());
            }
            bugReportClients.get(id)!.add(socket);

            socket.on("close", () => {
                const clients = bugReportClients.get(id);
                if (clients) {
                    clients.delete(socket);
                    if (clients.size === 0) {
                        bugReportClients.delete(id);
                    }
                }
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

            if (request.headers.accept?.includes('application/json')) {
                return reply.send({ success: true, status: body.status || "RESOLVED" });
            }

            return reply.redirect("/admin/bug-reports");
        }
    );

    fastify.post(
        "/:id/respond",
        { preHandler: [requireAuthRedirect] },
        async (request, reply) => {
            const ok = await ensurePermission(request, reply, "VIEW_ADMIN", { mode: "redirect" });
            if (!ok) return;

            const { id } = request.params as { id: string };
            const { message, level, status } = request.body as {
                message: string;
                level: string;
                status?: string;
            };

            const bugReport = await prisma.bugReport.findUnique({
                where: { id },
                include: { user: true },
            });

            if (bugReport && bugReport.userId) {
                const allowedStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED"];
                const newStatus = status && allowedStatuses.includes(status) ? status : null;
                if (newStatus) {
                    await prisma.bugReport.update({
                        where: { id },
                        data: { status: newStatus },
                    });
                }

                // Ensure conversation exists
                let conversationId = bugReport.conversationId;
                if (!conversationId) {
                    const conv = await prisma.conversation.create({
                        data: { type: "BUG_REPORT" }
                    });
                    conversationId = conv.id;
                    await prisma.bugReport.update({
                        where: { id },
                        data: { conversationId }
                    });
                }

                // Create structured message
                await prisma.conversationMessage.create({
                    data: {
                        conversationId: conversationId,
                        from: "admin",
                        message: message.trim(),
                        senderId: request.currentUser!.id,
                    }
                });

                await logAdminAction(
                    request.currentUser!.id,
                    "RESPOND_BUG_REPORT",
                    bugReport.userId || undefined,
                    { bugReportId: id, message, level, status: newStatus },
                );

                // WebSocket broadcast
                const messageData: ThreadMessage = {
                    id: `admin-new-${Date.now()}`,
                    from: "admin",
                    message,
                    userName: request.currentUser!.userName,
                    image: request.currentUser!.image,
                    createdAt: new Date(),
                };
                broadcastToBugReport(id, messageData);
            }

            if (request.headers.accept?.includes('application/json')) {
                return reply.send({ success: true });
            }

            return reply.redirect("/admin/bug-reports");
        }
    );
}
