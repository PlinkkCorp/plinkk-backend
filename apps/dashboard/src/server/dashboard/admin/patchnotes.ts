import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { userHasAnyPermission } from "../../../lib/permissions";
import { requireAuthRedirect } from "../../../middleware/auth";

export function adminPatchNotesRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await userHasAnyPermission(request.userId || (request.currentUser)?.id, [
      "CREATE_PATCHNOTES",
      "EDIT_PATCHNOTES",
      "PUBLISH_PATCHNOTES",
      "DELETE_PATCHNOTES",
    ]);
    
    if (!ok) {
      return reply.redirect("/admin");
    }

    const patchNotes = await prisma.patchNote.findMany({
      include: { createdBy: { select: { id: true, userName: true } } },
      orderBy: { publishedAt: { sort: "desc", nulls: "last" } },
    });

    return replyView(reply, "dashboard/admin/patchnotes.ejs", request.currentUser!, {
      patchNotes,
    });
  });
}
