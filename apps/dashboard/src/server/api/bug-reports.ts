import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";

function extractUserThreadMessages(raw: string, createdAt: Date, reportId: string) {
  const lines = String(raw || "").split("\n");
  const messages: Array<{ id: string; from: "user"; message: string; createdAt: Date }> = [];

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

    const adminReplies = reports.length
      ? await prisma.announcement.findMany({
          where: {
            targets: { some: { userId } },
            text: { startsWith: "[RÉPONSE BUG #" },
          },
          orderBy: { createdAt: "asc" },
        })
      : [];

    const threads = reports.map((report) => {
      const token = `[RÉPONSE BUG #${report.id}]`;
      const replies = adminReplies
        .filter((r) => r.text.startsWith(token))
        .map((r) => ({
          id: r.id,
          from: "admin" as const,
          message: r.text.replace(token, "").trim(),
          createdAt: r.createdAt,
        }));

      return {
        id: report.id,
        status: report.status,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        messages: [...extractUserThreadMessages(report.message, report.createdAt, report.id), ...replies].sort((a, b) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }),
      };
    });

    return reply.send({ threads });
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

    await prisma.userLog
      .create({
        data: {
          userId,
          action: "REPLY_BUG_REPORT",
          details: {
            bugReportId: id,
            message,
          },
        },
      })
      .catch((e) => request.log.error(e, "Failed to create user log for bug report reply"));

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
        },
      });

      if (userId) {
        await prisma.userLog
          .create({
            data: {
              userId,
              action: "SUBMIT_BUG_REPORT",
              details: {
                message: body.message,
                url: body.url || null,
                bugReportId: bugReport.id,
              },
            },
          })
          .catch((e) => request.log.error(e, "Failed to create user log for bug report"));
      }

      return reply.send({ ok: true, bugReportId: bugReport.id });
    } catch (error) {
      request.log.error(error, "Failed to create bug report");
      return reply.code(500).send({ error: "internal_server_error" });
    }
  });
}
