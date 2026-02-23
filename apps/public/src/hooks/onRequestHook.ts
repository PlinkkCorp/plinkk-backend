import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@plinkk/prisma";
import { RESERVED_SLUGS } from "@plinkk/shared";
import { generateBundle } from "../lib/generateBundle";
import { resolvePlinkkPage } from "../lib/resolvePlinkkPage";
import { generateProfileConfig } from "../lib/generateConfig";
import { minify } from "uglify-js";
import { coerceThemeData } from "../lib/theme";
import { generateTheme } from "../lib/generateTheme";
import { PlinkkSnapshot } from "../types/plinkk";

export default async function onRequestHook(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const host = request.headers.host || "";
    const devHosts = new Set(["127.0.0.1:3002", "localhost:3002", "127.0.0.1:3001", "localhost:3001"]);

    let effectiveUrl = request.url;
    let effectivePath = effectiveUrl.split("?")[0];

    const bypassPrefixes = [
      "/public/",
      "/canvaAnimation/",
      "/umami_script.js",
      "/api/send",
      "/favicon.ico",
    ];

    if (bypassPrefixes.some((p) => effectivePath.startsWith(p))) return;

    if (effectivePath === "/css/styles.css") {
      return reply.sendFile("/css/styles.css");
    } else if (effectivePath === "/css/button.css") {
      return reply.sendFile("/css/button.css");
    } else if (effectivePath.startsWith("/js/")) {
      const jsFile = effectivePath.replace("/js/", "");
      return reply.sendFile(`/js/${jsFile}`);
    } else if (effectivePath.startsWith("/icons/")) {
      const iconFile = effectivePath.replace("/icons/", "");
      return reply.sendFile(`/images/icons/${iconFile}`);
    }

    // Handle standard domains vs custom domains/dev
    const isMainDomain = host === "plinkk.fr" || host === "beta.plinkk.fr";

    if (!isMainDomain) {
      let hostDb: any = null;
      const isDevHost = devHosts.has(host);

      if (isDevHost) {
        const rawSlug = effectiveUrl
          .replace(/^\/+/, "")
          .split("/")[0]
          .split("?")[0];

        const isJs = rawSlug.endsWith(".js");
        // If it's a slug that isn't a reserved file, try to resolve it
        if (rawSlug && !RESERVED_SLUGS.has(rawSlug) && (!rawSlug.includes(".") || isJs)) {
          const slug = rawSlug.replace(/\.js$/i, "");
          const plinkk = await prisma.plinkk.findFirst({
            where: { slug },
            include: { user: true },
          });
          if (plinkk) {
            hostDb = { plinkk, verified: true };
            if (/\.js$/i.test(rawSlug)) {
              const js = await generateBundle();
              return reply.type("application/javascript").send(js);
            }
            const remainder = effectiveUrl.slice(rawSlug.length + 1) || "/";
            effectiveUrl = remainder.startsWith("/") ? remainder : "/" + remainder;
            effectivePath = effectiveUrl.split("?")[0];
          }
        }
      }

      if (!hostDb) {
        hostDb = await prisma.host.findUnique({
          where: { id: host },
          include: { plinkk: { include: { user: true } } },
        });
      }

      // 1. Handle the main profile page
      if (hostDb && hostDb.verified === true && effectivePath === "/") {
        const userName = hostDb.plinkk.user.userName;
        if (userName === "") {
          return reply.code(404).send({ error: "please specify a userName" });
        }

        const resolved = await resolvePlinkkPage(
          prisma,
          userName,
          undefined,
          request
        );
        if (resolved.status !== 200 || !resolved.page || !resolved.user) {
          if (resolved.status === 403) {
            return reply.code(403).view("erreurs/404.ejs", { user: null });
          }
          return reply.code(404).view("erreurs/404.ejs", { user: null });
        }

        const query = (request.query as { versionId?: string });
        const versionId = query.versionId;

        let displayPage = resolved.page;
        let displayUser = resolved.user;

        const [
          settings,
          background,
          neonColors,
          labels,
          socialIcon,
          statusbar,
          links,
          categories,
        ] = await Promise.all([
          prisma.plinkkSettings.findUnique({ where: { plinkkId: resolved.page.id } }),
          prisma.backgroundColor.findMany({ where: { plinkkId: resolved.page.id } }),
          prisma.neonColor.findMany({ where: { plinkkId: resolved.page.id } }),
          prisma.label.findMany({ where: { plinkkId: resolved.page.id } }),
          prisma.socialIcon.findMany({ where: { plinkkId: resolved.page.id } }),
          prisma.plinkkStatusbar.findUnique({ where: { plinkkId: resolved.page.id } }),
          prisma.link.findMany({ where: { plinkkId: resolved.page.id }, orderBy: { index: "asc" } }),
          prisma.category.findMany({ where: { plinkkId: resolved.page.id }, orderBy: { order: "asc" } }),
        ]);

        let displaySettings = settings;
        let displayBackground = background;
        let displayNeonColors = neonColors;
        let displayLabels = labels;
        let displaySocialIcons = socialIcon;
        let displayStatusbar = statusbar;
        let displayLinks = links;
        let displayCategories = categories;

        if (versionId) {
          const version = await prisma.plinkkVersion.findUnique({ where: { id: versionId } });
          if (version && version.plinkkId === resolved.page.id) {
            const snapshot = version.snapshot as PlinkkSnapshot;
            if (snapshot?.plinkk) displayPage = { ...displayPage, ...snapshot.plinkk };
            if (snapshot?.settings) displaySettings = { ...displaySettings, ...snapshot.settings };
            if (snapshot?.background) displayBackground = snapshot.background;
            if (snapshot?.neonColors) displayNeonColors = snapshot.neonColors;
            if (snapshot?.labels) displayLabels = snapshot.labels;
            if (snapshot?.socialIcon) displaySocialIcons = snapshot.socialIcon;
            if (snapshot?.statusbar) displayStatusbar = snapshot.statusbar;
            if (snapshot?.links) displayLinks = snapshot.links;
            if (snapshot?.categories) displayCategories = snapshot.categories;
          }
        }

        const isOwner =
          request.session &&
          (request.session.get("data") as string | undefined) ===
          resolved.user.id;
        const publicPath =
          displayPage && displayPage.slug
            ? displayPage.slug
            : displayUser.id;

        return reply.view("plinkk/show.ejs", {
          page: displayPage,
          userId: displayUser.id,
          username: displayUser.id,
          isOwner,
          links: displayLinks,
          publicPath,
          settings: displaySettings,
        });
      }

      // 2. Handle config.js
      if (effectivePath === "/config.js") {
        let page = hostDb?.plinkk;
        let resolvedUser: any = page?.user;
        if (!page) {
          const q = request.query as { username?: string };
          if (q.username) {
            const resolved = await resolvePlinkkPage(
              prisma,
              q.username.trim(),
              undefined,
              request
            );
            if (resolved.status === 200) {
              page = resolved.page;
              resolvedUser = resolved.user;
            }
          }
        }

        if (!page || !resolvedUser) {
          return reply.code(404).send({ error: "Page introuvable" });
        }
        page.user = resolvedUser;

        const [
          settings,
          background,
          labels,
          neonColors,
          socialIcons,
          links,
          pageStatusbar,
          categories,
        ] = await Promise.all([
          prisma.plinkkSettings.findUnique({ where: { plinkkId: page.id } }),
          prisma.backgroundColor.findMany({
            where: { plinkkId: page.id },
          }),
          prisma.label.findMany({
            where: { plinkkId: page.id },
          }),
          prisma.neonColor.findMany({
            where: { plinkkId: page.id },
          }),
          prisma.socialIcon.findMany({
            where: { plinkkId: page.id },
          }),
          prisma.link.findMany({
            where: { plinkkId: page.id },
            orderBy: { index: "asc" },
          }),
          prisma.plinkkStatusbar.findUnique({ where: { plinkkId: page.id } }),
          prisma.category.findMany({
            where: { plinkkId: page.id },
            orderBy: { order: 'asc' }
          }),
        ]);

        let versionIdArg: string | null = null;
        try {
          const referer = request.headers.referer;
          if (referer) {
            const u = new URL(referer);
            versionIdArg = u.searchParams.get("versionId");
          }
        } catch (e) { }

        let finalSettings = settings;
        let finalBackground = background;
        let finalLabels = labels;
        let finalNeon = neonColors;
        let finalSocial = socialIcons;
        let finalLinks = links;
        let finalStatusbar = pageStatusbar;
        let finalCategories = categories;

        if (versionIdArg) {
          const version = await prisma.plinkkVersion.findUnique({ where: { id: versionIdArg } });
          if (version && version.plinkkId === page.id) {
            const snap = version.snapshot as PlinkkSnapshot;
            if (snap.settings) finalSettings = { ...finalSettings, ...snap.settings };
            if (snap.background) finalBackground = snap.background;
            if (snap.neonColors) finalNeon = snap.neonColors;
            if (snap.labels) finalLabels = snap.labels;
            if (snap.socialIcon) finalSocial = snap.socialIcon;
            if (snap.links) finalLinks = snap.links;
            if (snap.statusbar) finalStatusbar = snap.statusbar;
            if (snap.categories) finalCategories = snap.categories;
          }
        }

        let injectedThemeVar = "";
        try {
          if (page.user.selectedCustomThemeId) {
            const t = await prisma.theme.findUnique({
              where: { id: page.user.selectedCustomThemeId },
              select: { data: true, isPrivate: true, authorId: true, pendingUpdate: true },
            });
            if (t && t.authorId === page.user.id) {
              const source = t.pendingUpdate || t.data;
              const full = coerceThemeData(source);
              if (full) {
                const safe = JSON.stringify(full);
                injectedThemeVar = `window.__PLINKK_PRIVATE_THEME__ = ${safe};`;
              }
            }
          }
          if (!injectedThemeVar) {
            const sub = await prisma.theme.findFirst({
              where: { authorId: page.user.id, status: "SUBMITTED" },
              select: { data: true },
              orderBy: { updatedAt: "desc" },
            });
            const candidate = sub
              ? sub
              : await prisma.theme.findFirst({
                where: { authorId: page.user.id, status: "DRAFT" },
                select: { data: true },
                orderBy: { updatedAt: "desc" },
              });
            if (candidate && candidate.data) {
              const full = coerceThemeData(candidate.data);
              if (full) {
                const safe = JSON.stringify(full);
                injectedThemeVar = `window.__PLINKK_PRIVATE_THEME__ = ${safe};`;
              }
            }
          }
        } catch { }

        let injectedObj = null;
        try {
          if (injectedThemeVar) {
            const idx = injectedThemeVar.indexOf("=");
            const objStr = injectedThemeVar
              .slice(idx + 1)
              .trim()
              .replace(/;$/, "");
            injectedObj = JSON.parse(objStr);
          }
        } catch (e) { }

        const pageProfile: any = {
          plinkkId: finalSettings?.plinkkId ?? page.id,
          ...page.user,
          profileLink: finalSettings?.profileLink ?? "",
          profileImage: finalSettings?.profileImage ?? "",
          profileIcon: finalSettings?.profileIcon ?? "",
          profileSiteText: finalSettings?.profileSiteText ?? "",
          userName: finalSettings?.userName ?? page.user.userName,
          iconUrl: finalSettings?.iconUrl ?? "",
          description: finalSettings?.description ?? "",
          profileHoverColor: finalSettings?.profileHoverColor ?? "",
          degBackgroundColor: finalSettings?.degBackgroundColor ?? 45,
          neonEnable: finalSettings?.neonEnable ?? 1,
          buttonThemeEnable: finalSettings?.buttonThemeEnable ?? 1,
          EnableAnimationArticle: finalSettings?.EnableAnimationArticle ?? 1,
          EnableAnimationButton: finalSettings?.EnableAnimationButton ?? 1,
          EnableAnimationBackground: finalSettings?.EnableAnimationBackground ?? 1,
          backgroundSize: finalSettings?.backgroundSize ?? 50,
          selectedThemeIndex: finalSettings?.selectedThemeIndex ?? 13,
          selectedAnimationIndex: finalSettings?.selectedAnimationIndex ?? 0,
          selectedAnimationButtonIndex:
            finalSettings?.selectedAnimationButtonIndex ?? 10,
          selectedAnimationBackgroundIndex:
            finalSettings?.selectedAnimationBackgroundIndex ?? 0,
          animationDurationBackground:
            finalSettings?.animationDurationBackground ?? 30,
          delayAnimationButton: finalSettings?.delayAnimationButton ?? 0.1,
          affichageEmail: finalSettings?.affichageEmail ?? null,
          publicEmail:
            finalSettings &&
              Object.prototype.hasOwnProperty.call(finalSettings, "affichageEmail")
              ? finalSettings.affichageEmail
              : page.user.publicEmail ?? null,
          canvaEnable: finalSettings?.canvaEnable ?? 1,
          selectedCanvasIndex: finalSettings?.selectedCanvasIndex ?? 16,
          layoutOrder: finalSettings?.layoutOrder ?? null,
          publicPhone: finalSettings?.publicPhone ?? null,
          showVerifiedBadge: finalSettings?.showVerifiedBadge ?? true,
          showPartnerBadge: finalSettings?.showPartnerBadge ?? true,
          enableVCard: finalSettings?.enableVCard ?? false,
          enableLinkCategories: finalSettings?.enableLinkCategories ?? false,
          fontFamily: finalSettings?.fontFamily ?? "",
          buttonStyle: finalSettings?.buttonStyle ?? "",
          backgroundType: (finalSettings as any)?.backgroundType ?? "color",
          backgroundImage: (finalSettings as any)?.backgroundImage ?? "",
          backgroundVideo: (finalSettings as any)?.backgroundVideo ?? "",
        };

        const generated = generateProfileConfig(
          pageProfile,
          finalLinks,
          finalBackground,
          finalLabels,
          finalNeon,
          finalSocial,
          finalStatusbar,
          injectedObj,
          finalCategories
        );
        const mini = minify(generated);
        return reply.type("application/javascript").send(mini.code || "");
      }

      // 3. Handle themes.json
      if (effectivePath === "/themes.json") {
        let userIdToUse = hostDb?.plinkk?.userId || (request.query as any).userId;

        // If we still don't have a userId, but have a username, search for it
        if (!userIdToUse && (request.query as any).username) {
          const user = await prisma.user.findFirst({ where: { userName: (request.query as any).username } });
          if (user) userIdToUse = user.id;
        }

        if (userIdToUse) {
          return reply.send(await generateTheme(userIdToUse));
        }

        // Return a default theme list even if we don't have a userId
        return reply.send(await generateTheme());
      }

      // 4. Handle other JS bundles or assets
      if (
        hostDb &&
        effectivePath.endsWith('.js') &&
        effectivePath.replace("/", "").replace(".js", "").trim() === hostDb.plinkk.slug
      ) {
        const js = await generateBundle();
        return reply.type("application/javascript").send(js);
      }

      // Fallback for custom domains/local dev that didn't match anything
      if (!isDevHost && hostDb) {
        return reply.code(409).view("erreurs/reserved.ejs");
      }
    }

    // Standard Plinkk.fr routes redirection to Dashboard (login, logout, register)
    const reservedRoots = new Set([
      "login",
      "logout",
      "register",
    ]);

    const rootSlug = effectivePath.replace("/", "");
    if (reservedRoots.has(rootSlug)) {
      reply.redirect(process.env.DASHBOARD_URL + effectiveUrl);
      return;
    }

  } catch (error) {
    request.log.error("Error in onRequest hook:", error);
    if (!reply.sent) {
      const errorDetail = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : { message: String(error) };
      return reply.code(500).send({
        error: "internal_server_error_onRequest",
        details: errorDetail
      });
    }
  }
}
