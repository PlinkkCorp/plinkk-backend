import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../lib/replyView";
import { requireAuthRedirect } from "../../middleware/auth";
import {
  getPlinkksByUserId,
  getSelectedPlinkk,
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
    const selected = getSelectedPlinkk(pages, q?.plinkkId);
    const selectedForView = formatPlinkkForView(selected);
    const autoOpenPlinkkModal = !q?.plinkkId && pages.length > 1;

    const [linksCount] = await Promise.all([
      prisma.link.count({ where: { userId } }),
    ]);
    const maxLinks = getUserLimits(userInfo).maxLinks;

    const emailHash = crypto
      .createHash("md5")
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
    });
  });
}
