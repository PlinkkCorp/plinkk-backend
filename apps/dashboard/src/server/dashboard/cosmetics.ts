import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../lib/replyView";
import { requireAuthRedirect } from "../../middleware/auth";
import { canUseGifBanner, canUseVisualEffects, getUserLimits } from "@plinkk/shared";

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
    const premium = getUserLimits(userInfo);
    const bannerLocked = !canUseGifBanner(userInfo);
    const effectsLocked = !canUseVisualEffects(userInfo);

    const catalog = {
      frames: [
        { key: "none", label: "Aucun", locked: false },
        { key: "neon", label: "Néon", locked: false },
        { key: "glow", label: "Glow", locked: effectsLocked },
        { key: "gold", label: "Gold", locked: effectsLocked },
      ],
      themes: [
        { key: "system", label: "Système", locked: false },
        { key: "dark-emerald", label: "Dark Emerald", locked: false },
        { key: "midnight", label: "Midnight", locked: false },
        { key: "plasma", label: "Plasma", locked: false },
      ],
      effects: [
        { key: "none", label: "Aucun", locked: false },
        { key: "sparkles", label: "✨ Paillettes", locked: effectsLocked },
        { key: "noise", label: "📺 Grain", locked: effectsLocked },
      ],
      banners: [
        { key: "none", label: "Aucune", url: "", locked: false },
        { key: "gradient-emerald", label: "Dégradé Émeraude", url: "", locked: false },
        { key: "gradient-fuchsia", label: "Dégradé Fuchsia", url: "", locked: false },
        { key: "custom-gif", label: "GIF / Image personnalisée", url: "", locked: bannerLocked, premium: true },
      ],
    };

    return replyView(reply, "dashboard/user/cosmetics.ejs", userInfo, {
      cosmetics,
      catalog,
      publicPath: request.publicPath,
      premiumLimits: premium,
    });
  });
}
