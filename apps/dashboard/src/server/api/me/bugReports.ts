import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { UnauthorizedError, NotFoundError } from "@plinkk/shared";
import { bugReportClients, broadcastToBugReport, ThreadMessage } from "../../../services/bugReportSocketService";

export function apiMeBugReportsRoutes(fastify: FastifyInstance) {
    // Respond to a bug report
    fastify.post("/:id/respond", async (request, reply) => {
        const userId = request.session.get("data") as string | { id: string } | null | undefined;
        let id: string | undefined;
        if (typeof userId === "string") id = userId;
        else if (userId && typeof userId === "object") id = userId.id;
        
        if (!id) throw new UnauthorizedError();

        const { id: reportId } = request.params as { id: string };
        const { message } = request.body as { message: string };

        if (!message || !message.trim()) {
            return reply.code(400).send({ error: "Message is required" });
        }

        const bugReport = await prisma.bugReport.findUnique({
            where: { id: reportId },
        });

        if (!bugReport || bugReport.userId !== id) {
            throw new NotFoundError("Bug report not found");
        }

        // Ensure conversation exists
        let conversationId = bugReport.conversationId;
        if (!conversationId) {
            const conv = await prisma.conversation.create({
                data: { type: "BUG_REPORT" }
            });
            conversationId = conv.id;
            await prisma.bugReport.update({
                where: { id: reportId },
                data: { conversationId }
            });
        }

        // Create structured message
        await prisma.conversationMessage.create({
            data: {
                conversationId: conversationId,
                from: "user",
                message: message.trim(),
                senderId: id,
            }
        });

        // Broadcast to WebSocket clients (both user and admin)
        const messageData: ThreadMessage = {
            id: `user-new-${Date.now()}`,
            from: "user",
            message: message.trim(),
            userName: request.currentUser?.userName || "Utilisateur",
            image: request.currentUser?.image || null,
            createdAt: new Date(),
        };
        broadcastToBugReport(reportId, messageData);

        return reply.send({ success: true });
    });

    // Get bug report detail with messages
    fastify.get("/:id", async (request, reply) => {
        const userId = request.session.get("data") as string | { id: string } | null | undefined;
        let id: string | undefined;
        if (typeof userId === "string") id = userId;
        else if (userId && typeof userId === "object") id = userId.id;
        
        if (!id) throw new UnauthorizedError();

        const { id: reportId } = request.params as { id: string };

        const bugReport = await prisma.bugReport.findUnique({
            where: { id: reportId },
            include: { 
                conversation: {
                    include: {
                        messages: {
                            orderBy: { createdAt: "asc" }
                        }
                    }
                }
            }
        }) as any;

        if (!bugReport || bugReport.userId !== id) {
            throw new NotFoundError("Bug report not found");
        }

        return reply.send({ bugReport });
    });

    // WebSocket for real-time updates
    fastify.get("/:id/ws", { websocket: true }, (socket, request) => {
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
    });
}
