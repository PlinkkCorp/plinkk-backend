import { FastifyInstance } from "fastify";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { requireAuthRedirect } from "../../../middleware/auth";

export async function adminEmailsRoutes(fastify: FastifyInstance) {
  // GET /admin/emails
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "SEND_EMAILS", { mode: "view", active: "emails" });
    if (!ok) return;

    const user = request.currentUser!;
    return replyView(reply, "dashboard/admin/emails.ejs", user, {});
  });
}
