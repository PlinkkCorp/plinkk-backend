import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { requireAuthRedirect } from "../../../middleware/auth";

export function adminBansRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_BANNED_EMAILS", { mode: "redirect" });
    if (!ok) return;

    return replyView(reply, "dashboard/admin/bans.ejs", request.currentUser!, {
      publicPath: request.publicPath,
    });
  });
}
