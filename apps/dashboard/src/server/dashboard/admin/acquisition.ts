/**
 * Admin — Dashboard page "Acquisition" 
 * Suivi du funnel inscription + quota email
 */
import { FastifyInstance } from "fastify";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { requireAuthRedirect } from "../../../middleware/auth";

export function adminAcquisitionRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    { preHandler: [requireAuthRedirect] },
    async function (request, reply) {
      const ok = await ensurePermission(request, reply, "VIEW_STATS", {
        mode: "view",
        active: "acquisition",
      });
      if (!ok) return;

      return replyView(reply, "dashboard/admin/acquisition.ejs", request.currentUser!, {
        publicPath: request.publicPath,
      });
    }
  );
}
