import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../lib/replyView";
import { requireAuthRedirect } from "../../middleware/auth";
import { getMaxQrCodes } from "@plinkk/shared";

export function dashboardQrCodesRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const userInfo = request.currentUser!;
    const userId = request.userId!;

    // Get all plinkks for the user
    const plinkks = await prisma.plinkk.findMany({
      where: { userId },
      select: { id: true, name: true, slug: true },
      orderBy: [{ isDefault: "desc" }, { index: "asc" }],
    });

    // Get QR codes for all plinkks
    const qrCodes = await prisma.qrCode.findMany({
      where: { userId },
      include: {
        plinkk: { select: { id: true, name: true, slug: true } }
      },
      orderBy: { createdAt: "desc" },
    });

    const totalQrCodes = qrCodes.length;
    const totalScans = qrCodes.reduce((sum, qr) => sum + (qr.scansCount || 0), 0);
    const maxQrCodes = getMaxQrCodes(userInfo);

    return replyView(reply, "dashboard/user/qrcodes.ejs", userInfo, {
      qrCodes,
      plinkks,
      totalQrCodes,
      totalScans,
      maxQrCodes,
      publicPath: request.publicPath,
    });
  });
}
