import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";

export async function apiBugReportsRoutes(fastify: FastifyInstance) {
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
