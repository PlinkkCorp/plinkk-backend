import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";

export async function apiBugReportsRoutes(fastify: FastifyInstance) {
    fastify.get("/mine", async (request, reply) => {
        const sessionData = request.session.get("data");
        const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
        if (!userId) return reply.code(401).send({ error: "unauthorized" });

        const reports = await prisma.bugReport.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 40,
        });

        const reportIds = reports.map((r) => r.id);
        const adminReplies = reportIds.length
            ? await prisma.announcement.findMany({
                where: {
                    targets: { some: { userId } },
                    text: { startsWith: "[RÉPONSE BUG #" },
                },
                orderBy: { createdAt: "asc" },
            })
            : [];

        const grouped = reports.map((report) => {
            const token = `[RÉPONSE BUG #${report.id}]`;
            const replies = adminReplies
                .filter((r) => r.text.startsWith(token))
                .map((r) => ({
                    id: r.id,
                    from: "admin",
                    message: r.text.replace(token, "").trim(),
                    createdAt: r.createdAt,
                }));

            return {
                id: report.id,
                status: report.status,
                createdAt: report.createdAt,
                updatedAt: report.updatedAt,
                messages: [
                    {
                        id: `origin-${report.id}`,
                        from: "user",
                        message: report.message,
                        createdAt: report.createdAt,
                    },
                    ...replies,
                ],
            };
        });

        return reply.send({ threads: grouped });
    });

    fastify.post("/:id/reply", async (request, reply) => {
        const sessionData = request.session.get("data");
        const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
        if (!userId) return reply.code(401).send({ error: "unauthorized" });

        const { id } = request.params as { id: string };
        const body = request.body as { message?: string };
        const message = (body?.message || "").trim();
        if (!message) return reply.code(400).send({ error: "missing_message" });

        const report = await prisma.bugReport.findUnique({ where: { id } });
        if (!report || report.userId !== userId) {
            return reply.code(404).send({ error: "bug_report_not_found" });
        }

        await prisma.bugReport.update({
            where: { id },
            data: {
                status: "PENDING",
                message: `${report.message}\n\n[USER_REPLY ${new Date().toISOString()}] ${message}`,
            },
        });

        await prisma.userLog.create({
            data: {
                userId,
                action: "REPLY_BUG_REPORT",
                details: {
                    bugReportId: id,
                    message,
                },
            },
        }).catch((e) => request.log.error(e, "Failed to create user log for bug report reply"));

        return reply.send({ ok: true });
    });

    fastify.post("/", async (request, reply) => {
        const body = request.body as { message?: string; url?: string; stack?: string };

        if (!body || !body.message) {
            return reply.code(400).send({ error: "missing_message" });
        }

        const sessionData = request.session.get("data");
        const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

        try {
            const bugReport = await prisma.bugReport.create({
                data: {
                    message: body.message,
                    url: body.url || null,
                    stack: body.stack || null,
                    userId: userId || null,
                }
            });

            if (userId) {
                await prisma.userLog.create({
                    data: {
                        userId,
                        action: 'SUBMIT_BUG_REPORT',
                        details: {
                            message: body.message,
                            url: body.url || null,
                            bugReportId: bugReport.id
                        }
                    }
                }).catch(e => request.log.error(e, "Failed to create user log for bug report"));
            }

            return reply.send({ ok: true, bugReportId: bugReport.id });
        } catch (error) {
            request.log.error(error, "Failed to create bug report");
            return reply.code(500).send({ error: "internal_server_error" });
        }
    });
}
