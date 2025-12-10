import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { logAdminAction } from "../../../lib/adminLogger";
import { requireAuthRedirect, requireAuth } from "../../../middleware/auth";
import * as os from "os";
import { exec } from "child_process";

const ALLOWED_SCRIPTS = [
  "check-avatars.mjs",
  "delete_inactive_user.js",
  "check_public_endpoints.mjs",
  "check-bans.js",
];

export function adminSystemRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_SYSTEM_HEALTH", { mode: "redirect" });
    if (!ok) return;

    return replyView(reply, "dashboard/admin/system.ejs", request.currentUser!, {
      publicPath: request.publicPath,
    });
  });

  fastify.get("/api", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_SYSTEM_HEALTH");
    if (!ok) return;

    const mem = process.memoryUsage();
    const stats = {
      uptime: process.uptime(),
      memory: {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
      },
      os: {
        freemem: os.freemem(),
        totalmem: os.totalmem(),
        loadavg: os.loadavg(),
      },
      nodeVersion: process.version,
    };

    return reply.send(stats);
  });

  fastify.post("/tasks/run", { preHandler: [requireAuth] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "RUN_SYSTEM_TASKS");
    if (!ok) return;

    const { script } = request.body as { script: string };

    if (!ALLOWED_SCRIPTS.includes(script)) {
      return reply.code(400).send({ error: "invalid_script" });
    }

    await logAdminAction(request.userId!, "RUN_TASK", undefined, { script }, request.ip);

    const cmd = `node apps/dashboard/scripts/${script}`;

    return new Promise((resolve) => {
      exec(cmd, (error, stdout, stderr) => {
        resolve({
          ok: !error,
          stdout,
          stderr,
          error: error ? error.message : null,
        });
      });
    });
  });
}
