import { FastifyInstance } from "fastify";
import { Prisma, prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { requireAuthRedirect } from "../../../middleware/auth";
import { getPublicPath } from "../../../services/plinkkService";
import {
  getSubmittedThemes,
  getApprovedThemes,
  getArchivedThemes,
  getRejectedThemes,
  getThemeById,
} from "../../../services/themeService";

export function adminThemesRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_ADMIN", { mode: "redirect" });
    if (!ok) return;

    const [submitted, approved, archived, rejected] = await Promise.all([
      getSubmittedThemes(),
      getApprovedThemes(),
      getArchivedThemes(),
      getRejectedThemes(),
    ]);

    const approvedWithPending = approved.filter((t) => t.pendingUpdate);
    const approvedFiltered = approved.filter((t) => !t.pendingUpdate);
    const submittedNormalized = submitted.map((s) => ({ ...s, pendingUpdate: false }));
    const mergedSubmitted = [...submittedNormalized, ...approvedWithPending];

    return replyView(reply, "dashboard/admin/themes.ejs", request.currentUser!, {
      submitted: mergedSubmitted,
      approved: approvedFiltered,
      archived,
      rejected,
      publicPath: request.publicPath,
    });
  });

  fastify.get("/:id", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_ADMIN", { mode: "redirect" });
    if (!ok) return;

    const { id } = request.params as { id: string };
    const t = await getThemeById(id);

    if (!t) {
      return reply.code(404).view("erreurs/404.ejs", { currentUser: request.currentUser });
    }

    const themeForView = {
      ...t,
      archived: t.status === "ARCHIVED",
      approved: t.status === "APPROVED",
      isApproved: t.status === "APPROVED",
    };

    return replyView(reply, "dashboard/admin/preview.ejs", request.currentUser!, {
      theme: themeForView,
      publicPath: request.publicPath,
    });
  });
}
