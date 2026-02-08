import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../lib/replyView";
import { verifyRoleAdmin, verifyRoleDeveloper } from "../../lib/verifyRole";
import { requireAuthRedirect } from "../../middleware/auth";

export function dashboardCosmeticsRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const userInfo = await prisma.user.findFirst({
      where: { id: request.userId },
      include: { cosmetics: true, role: true },
    });

    if (!userInfo) {
      return reply.redirect(`/login?returnTo=${encodeURIComponent("/cosmetics")}`);
    }

    const cosmetics = userInfo.cosmetics;
    const catalog = {
      frames: [
        { key: "none", label: "Aucun", locked: false },
        { key: "neon", label: "Néon", locked: false },
        { key: "glow", label: "Glow", locked: false },
        { key: "gold", label: "Gold", locked: false },
      ],
      themes: [
        { key: "system", label: "Système", locked: false },
        { key: "dark-emerald", label: "Dark Emerald", locked: false },
        { key: "midnight", label: "Midnight", locked: false },
        { key: "plasma", label: "Plasma", locked: false },
      ],
      banners: [
        { key: "none", label: "Aucune", url: "", locked: false },
        { key: "gradient-emerald", label: "Dégradé Émeraude", url: "", locked: false },
        { key: "gradient-fuchsia", label: "Dégradé Fuchsia", url: "", locked: false },
      ],
    };

    return replyView(reply, "dashboard/user/cosmetics.ejs", userInfo, {
      cosmetics,
      catalog,
      publicPath: request.publicPath,
    });
  });
}
