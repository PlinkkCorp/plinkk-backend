import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../lib/replyView";
import { requireAuthRedirect } from "../../middleware/auth";
import {
  getPlinkksByUserId,
  getSelectedPlinkk,
  getPlinkkWithDetails,
  formatPlinkkForView,
  formatPagesForView,
} from "../../services/plinkkService";
import { getUserLimits } from "@plinkk/shared";
import crypto from "crypto";

export function dashboardEditRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const userInfo = request.currentUser!;
    const userId = request.userId!;

    const q = request.query as { plinkkId: string };
    const pages = await getPlinkksByUserId(userId);
    const selectedSimple = getSelectedPlinkk(pages, q?.plinkkId);

    let selectedForView: any = null;
    if (selectedSimple) {
      const selected = await getPlinkkWithDetails(selectedSimple.id, userId);
      if (selected) {
        selectedForView = formatPlinkkForView(selected);
      }
    }

    if (!selectedForView) {
      return reply.redirect('/plinkks');
    }

    const autoOpenPlinkkModal = !q?.plinkkId && pages.length > 1;

    const plinkkId = selectedForView ? selectedForView.id : null;
    const [linksCount, categories] = await Promise.all([
      prisma.link.count({ where: { userId } }),
      plinkkId
        ? prisma.category.findMany({
            where: { plinkkId },
            orderBy: { order: "asc" },
          })
        : Promise.resolve([]),
    ]);
    console.log('[EDIT] Fetched categories:', JSON.stringify(categories, null, 2));
    const maxLinks = getUserLimits(userInfo).maxLinks;

    const emailHash = crypto
      .createHash("sha256")
      .update((userInfo.email || "").trim().toLowerCase())
      .digest("hex");
    const gravatarUrl = `https://www.gravatar.com/avatar/${emailHash}?d=404`;

    return replyView(reply, "dashboard/user/edit.ejs", userInfo, {
      plinkk: selectedForView,
      pages: formatPagesForView(pages),
      autoOpenPlinkkModal,
      publicPath: request.publicPath,
      linksCount,
      maxLinks,
      gravatarUrl,
      categories,
    });
  });
}
