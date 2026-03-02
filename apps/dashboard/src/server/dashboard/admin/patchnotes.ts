import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { requireAuthRedirect } from "../../../middleware/auth";

export function adminPatchNotesRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "MANAGE_PATCHNOTES", { mode: "redirect" });
    if (!ok) return;

    const patchNotes = await prisma.patchNote.findMany({
      include: { createdBy: { select: { id: true, userName: true } } },
      orderBy: { publishedAt: { sort: "desc", nulls: "last" } },
    });

    return replyView(reply, "dashboard/admin/patchnotes.ejs", request.currentUser!, {
      patchNotes,
    });
  });
}
