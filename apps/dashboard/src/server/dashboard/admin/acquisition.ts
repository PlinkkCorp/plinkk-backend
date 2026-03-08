/**
 * Admin — Dashboard page "Acquisition" 
 * Suivi du funnel inscription + quota email
 */
import { FastifyInstance } from "fastify";
import { ensurePermission } from "../../../lib/permissions";
import { requireAuthRedirect } from "../../../middleware/auth";

export function adminAcquisitionRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    { preHandler: [requireAuthRedirect] },
    async function (request, reply) {
      const ok = await ensurePermission(request, reply, "VIEW_STATS", {
        mode: "redirect",
      });
      if (!ok) return;

      return reply.redirect("/admin/stats?tab=funnel");
    }
  );
}
