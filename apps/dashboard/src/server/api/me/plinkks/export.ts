import { FastifyInstance } from "fastify";
import { PlinkkSettings, User, prisma } from "@plinkk/prisma";
import path from "path";
import archiver from "archiver";
import ejs from "ejs";
import { existsSync } from "fs";
import { generateBundle } from "../../../../lib/generateBundle";
import { generateProfileConfig } from "../../../../lib/generateConfig";
import { generateTheme } from "../../../../lib/generateTheme";
import { fetchRemoteFile } from "../../../../lib/fileUtils";
import { canvaData } from "../../../../public/config/canvaConfig";
import { logUserAction } from "../../../../lib/userLogger";

export function plinkksExportRoutes(fastify: FastifyInstance) {
  fastify.get("/:id/export.zip", async (request, reply) => {
    try {
      const userId = request.session.get("data");
      const { includeImages, includeIcons, includeCanva } = request.query as { includeImages?: string, includeIcons?: string, includeCanva?: string };

      // Parse booleans
      const doIncludeImages = includeImages === 'true';
      const doIncludeIcons = includeIcons === 'true';
      const doIncludeCanva = includeCanva === 'true';

      if (!userId) return reply.code(401).send({ error: "Unauthorized" });
      const { id } = request.params as { id: string };

      const page = await prisma.plinkk.findFirst({
        where: { id, userId: String(userId) },
        include: {
          user: true,
          settings: true,
          links: true,
          background: true,
          labels: true,
          neonColors: true,
          socialIcons: true,
          statusbar: true,
          categories: true,
        },
      });
      if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });

      const js = await generateBundle();
      const settings = page.settings;

      const pageProfile: User & PlinkkSettings = {
        plinkkId: null,
        ...page.user,
        profileLink: settings?.profileLink ?? "",
        profileImage: settings?.profileImage ?? "",
        profileIcon: settings?.profileIcon ?? "",
        profileSiteText: settings?.profileSiteText ?? "",
        userName: settings?.userName ?? page.user.userName,
        iconUrl: settings?.iconUrl ?? "",
        description: settings?.description ?? "",
        profileHoverColor: settings?.profileHoverColor ?? "",
        degBackgroundColor: settings?.degBackgroundColor ?? 45,
        neonEnable: settings?.neonEnable ?? 1,
        buttonThemeEnable: settings?.buttonThemeEnable ?? 1,
        EnableAnimationArticle: settings?.EnableAnimationArticle ?? 1,
        EnableAnimationButton: settings?.EnableAnimationButton ?? 1,
        EnableAnimationBackground: settings?.EnableAnimationBackground ?? 1,
        backgroundSize: settings?.backgroundSize ?? 50,
        selectedThemeIndex: settings?.selectedThemeIndex ?? 13,
        selectedAnimationIndex: settings?.selectedAnimationIndex ?? 0,
        selectedAnimationButtonIndex: settings?.selectedAnimationButtonIndex ?? 10,
        selectedAnimationBackgroundIndex: settings?.selectedAnimationBackgroundIndex ?? 0,
        animationDurationBackground: settings?.animationDurationBackground ?? 30,
        delayAnimationButton: settings?.delayAnimationButton ?? 0.1,
        affichageEmail: settings?.affichageEmail ?? null,
        publicEmail: settings?.affichageEmail ?? page.user.publicEmail ?? null,
        publicPhone: settings?.publicPhone ?? null,
        showVerifiedBadge: settings?.showVerifiedBadge ?? true,
        showPartnerBadge: settings?.showPartnerBadge ?? true,
        enableVCard: settings?.enableVCard ?? true,
        enableLinkCategories: settings?.enableLinkCategories ?? false,
        canvaEnable: settings?.canvaEnable ?? 1,
        selectedCanvasIndex: settings?.selectedCanvasIndex ?? 16,
        layoutOrder: settings?.layoutOrder ?? null,
      };

      const config = await generateProfileConfig(
        pageProfile,
        page.links,
        page.background,
        page.labels,
        page.neonColors,
        page.socialIcons,
        page.statusbar,
        undefined,
        page.categories
      );

      const themes = await generateTheme(page.userId);
      const archive = archiver("zip", { zlib: { level: 9 } });

      await logUserAction(userId as string, "EXPORT_PLINKK", id, {
        included: {
          images: doIncludeImages,
          icons: doIncludeIcons,
          canva: doIncludeCanva
        }
      }, request.ip);

      archive.on("error", function (err) {
        console.error("Archiver error:", err);
        if (!reply.raw.headersSent) {
          reply.code(500).send({ error: "Archiver error" });
        }
      });

      reply
        .header("Content-Type", "application/zip")
        .header("Content-Disposition", "attachment; filename=plinkk_" + page.name + ".zip");

      archive.pipe(reply.raw);

      // FIX PATHS: Use process.cwd() as anchor (apps/dashboard) to find resources
      // We expect 'files' to be in apps/public or similar. 
      // The previous implementation used many ../.. which is fragile.
      // Assuming structure:
      // apps/dashboard (cwd)
      // apps/public/src/views/plinkk/show.ejs

      // Resolve relative to repo root if possible or use fixed relative path from cwd
      const appsDir = path.resolve(process.cwd(), "..");
      const publicAppDir = path.join(appsDir, "public");

      const showEjsPath = path.join(publicAppDir, "src", "views", "plinkk", "show.ejs");

      if (!existsSync(showEjsPath)) {
        console.error("show.ejs not found at resolved path:", showEjsPath);
        // Fallback try relative to __dirname (original method) just in case
        const backupPath = path.join(__dirname, "..", "..", "..", "..", "..", "..", "public", "src", "views", "plinkk", "show.ejs");
        if (!existsSync(backupPath)) {
          throw new Error("Template show.ejs not found");
        }
        // If found via backup, use it? Or just error. Let's assume the resolved path should work.
      }

      archive.append(
        await ejs.renderFile(showEjsPath, {
          page: page,
          userId: page.userId,
          username: page.userId,
          isExport: true,
        }),
        { name: "index.html" }
      );
      archive.append(js, { name: page.slug + ".js" });
      archive.append(config, { name: "config.js" });
      archive.append(JSON.stringify(themes), { name: "themes.json" });

      let analyticsScript = "";
      try {
        analyticsScript = await fetchRemoteFile("https://analytics.plinkk.fr/script.js");
      } catch (e) {
        console.error("Failed to fetch analytics script", e);
      }
      archive.append(analyticsScript, { name: "umami_script.js" });

      // Canva
      if (doIncludeCanva) {
        const canvaId = pageProfile.canvaEnable ? pageProfile.selectedCanvasIndex : null;
        if (canvaId !== null && canvaData[canvaId]) {
          const p = path.join(publicAppDir, "public", "canvaAnimation", canvaData[canvaId].fileNames);
          if (existsSync(p)) archive.file(p, { name: "canvaAnimation/" + canvaData[canvaId].fileNames });
        }
      }

      // CSS
      const cssPath = path.join(publicAppDir, "public", "css", "styles.css");
      if (existsSync(cssPath)) archive.file(cssPath, { name: "css/styles.css" });

      const btnCssPath = path.join(publicAppDir, "public", "css", "button.css");
      if (existsSync(btnCssPath)) archive.file(btnCssPath, { name: "css/button.css" });

      // Images
      const projectRoot = path.resolve(appsDir, ".."); // e.g. /plinkk-backend

      if (doIncludeImages) {
        if (pageProfile.profileImage?.startsWith("/public/")) {
          const p = path.join(projectRoot, ...pageProfile.profileImage.split("/")); // /public is at root? or inside an app? 
          // Usually uploads are in a mounted volume or root public. Let's try to resolve against root.
          if (existsSync(p)) archive.file(p, { name: pageProfile.profileImage });
        }
        if (pageProfile.profileIcon?.startsWith("/public/")) {
          const p = path.join(projectRoot, ...pageProfile.profileIcon.split("/"));
          if (existsSync(p)) archive.file(p, { name: pageProfile.profileIcon });
        }
        if (pageProfile.iconUrl?.startsWith("/public/")) {
          const p = path.join(projectRoot, ...pageProfile.iconUrl.split("/"));
          if (existsSync(p)) archive.file(p, { name: pageProfile.iconUrl });
        }

        for (const link of page.links) {
          if (link.icon?.startsWith("/public/")) {
            const p = path.join(projectRoot, ...link.icon.split("/"));
            if (existsSync(p)) archive.file(p, { name: link.icon });
          }
        }
      }

      // Social Icons
      if (doIncludeIcons) {
        for (const socialIcon of page.socialIcons) {
          const iconName = socialIcon.icon.toLowerCase().replace(/ /g, "-");
          // Try apps/public/public/images/icons first
          const p = path.join(publicAppDir, "public", "images", "icons", iconName + ".svg");
          if (existsSync(p)) {
            archive.file(p, { name: "public/images/icons/" + iconName + ".svg" });
          } else {
            // Try source?
            const p2 = path.join(publicAppDir, "src", "public", "images", "icons", iconName + ".svg");
            if (existsSync(p2)) archive.file(p2, { name: "public/images/icons/" + iconName + ".svg" });
          }
        }
      }

      await archive.finalize();
    } catch (err) {
      console.error("CRITICAL EXPORT ERROR:", err);
      if (!reply.raw.headersSent) {
        reply.code(500).send({ error: "Internal Server Error during export", details: (err as Error).message });
      }
    }
  });
}
