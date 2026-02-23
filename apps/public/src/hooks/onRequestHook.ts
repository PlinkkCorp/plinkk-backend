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

    const devHosts = new Set(["127.0.0.1:3002", "localhost:3002"]);

    let effectiveUrl = request.url;

    const bypassPrefixes = [
      "/config.js",
      "/public/",
      "/canvaAnimation/",
      "/umami_script.js",
      "/api/send",
      "/themes.json",
      "/favicon.ico",
    ];

    let effectivePath = effectiveUrl.split("?")[0];
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

    if (
      host !== "plinkk.fr" &&
      host !== "beta.plinkk.fr" &&
      !(host === "127.0.0.1:3002" && effectiveUrl.startsWith("/config.js"))
    ) {
      let hostDb: any = null;
      const isDevHost = devHosts.has(host);

      if (isDevHost) {
        const rawSlug = effectiveUrl
          .replace(/^\/+/, "")
          .split("/")[0]
          .split("?")[0];
        if (rawSlug && !RESERVED_SLUGS.has(rawSlug)) {
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

      if (hostDb && hostDb.verified === true) {
        if (bypassPrefixes.some((p) => effectivePath.startsWith(p))) return;

        if (effectivePath === "/") {
          const userName = hostDb.plinkk.user.userName;
          if (userName === "") {
            reply.code(404).send({ error: "please specify a userName" });
            return;
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
        } else if (request.url.startsWith("/config.js")) {
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
              where: { userId: page.user.id, plinkkId: page.id },
            }),
            prisma.label.findMany({
              where: { userId: page.user.id, plinkkId: page.id },
            }),
            prisma.neonColor.findMany({
              where: { userId: page.user.id, plinkkId: page.id },
            }),
            prisma.socialIcon.findMany({
              where: { userId: page.user.id, plinkkId: page.id },
            }),
            prisma.link.findMany({
              where: { userId: page.user.id, plinkkId: page.id },
              orderBy: { index: "asc" },
            }),
            prisma.plinkkStatusbar.findUnique({ where: { plinkkId: page.id } }),
            prisma.category.findMany({
              where: { plinkkId: page.id },
              orderBy: { order: 'asc' }
            }),
          ]);

          // HISTORY PREVIEW LOGIC
          // Check referer for versionId
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
              console.log(`[Config.js] Loaded version ${versionIdArg} for ${page.id}`);

              // Override with snapshot data
              // Note: we must map them carefully if the shape differs, but since we saved them direct from DB, they should match.
              // Dates might be strings now.
              if (snap.settings) finalSettings = { ...finalSettings, ...snap.settings }; // Merge with default settings to ensure no missing fields
              if (snap.background) finalBackground = snap.background;
              if (snap.neonColors) finalNeon = snap.neonColors;
              if (snap.labels) finalLabels = snap.labels;
              if (snap.socialIcon) finalSocial = snap.socialIcon; // Fix key: socialIcon (from historyService) vs socialIcons (local var)
              if (snap.links) finalLinks = snap.links;
              if (snap.statusbar) finalStatusbar = snap.statusbar; // Snap might be null? Statusbar is optional?
              if (snap.categories) finalCategories = snap.categories;
            } else {
              console.log(`[Config.js] Version not found: ${versionIdArg}`);
            }
          }
          let injectedThemeVar = "";
          try {
            const normalizeHex = (v?: string) => {
              if (!v || typeof v !== "string") return "#000000";
              const s = v.trim();
              if (/^#?[0-9a-fA-F]{3}$/.test(s)) {
                const t = s.replace("#", "");
                return (
                  "#" +
                  t
                    .split("")
                    .map((c) => c + c)
                    .join("")
                );
              }
              if (/^#?[0-9a-fA-F]{6}$/.test(s))
                return s.startsWith("#") ? s : "#" + s;
              return "#000000";
            };
            const luminance = (hex: string) => {
              const h = normalizeHex(hex).slice(1);
              const r = parseInt(h.slice(0, 2), 16) / 255;
              const g = parseInt(h.slice(2, 4), 16) / 255;
              const b = parseInt(h.slice(4, 6), 16) / 255;
              const a = [r, g, b].map((v) =>
                v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
              );
              return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
            };
            const contrastText = (bg: string) =>
              luminance(bg) > 0.5 ? "#111827" : "#ffffff";
            const mix = (hexA: string, hexB: string, ratio = 0.2) => {
              const a = normalizeHex(hexA).slice(1);
              const b = normalizeHex(hexB).slice(1);
              const c = (i: number) =>
                Math.round(
                  parseInt(a.slice(i, i + 2), 16) * (1 - ratio) +
                  parseInt(b.slice(i, i + 2), 16) * ratio
                );
              const r = c(0),
                g = c(2),
                bl = c(4);
              return `#${[r, g, bl]
                .map((x) => x.toString(16).padStart(2, "0"))
                .join("")}`;
            };
            const hoverVariant = (color: string) =>
              luminance(color) > 0.5
                ? mix(color, "#000000", 0.2)
                : mix(color, "#ffffff", 0.2);
            type SimplifiedVariant = {
              bg: string;
              button: string;
              hover: string;
            };
            const toFullTheme = (
              light: SimplifiedVariant,
              dark: SimplifiedVariant
            ) => {
              const L = {
                background: normalizeHex(light.bg),
                hoverColor: normalizeHex(light.hover),
                textColor: contrastText(light.bg),
                buttonBackground: normalizeHex(light.button),
                buttonHoverBackground: hoverVariant(light.button),
                buttonTextColor: contrastText(light.button),
                linkHoverColor: normalizeHex(light.hover),
                articleHoverBoxShadow: `0 4px 12px ${normalizeHex(
                  light.hover
                )}55`,
                darkTheme: false,
              };
              const D = {
                background: normalizeHex(dark.bg),
                hoverColor: normalizeHex(dark.hover),
                textColor: contrastText(dark.bg),
                buttonBackground: normalizeHex(dark.button),
                buttonHoverBackground: hoverVariant(dark.button),
                buttonTextColor: contrastText(dark.button),
                linkHoverColor: normalizeHex(dark.hover),
                articleHoverBoxShadow: `0 4px 12px ${normalizeHex(dark.hover)}55`,
                darkTheme: true,
              };
              return { ...L, opposite: D };
            };

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
          return reply.type("text/javascript").send(mini.code || "");
        } else if (request.url === "/themes.json") {
          return reply.send(await generateTheme(hostDb.plinkk.userId));
        } else if (
          request.url.split('?')[0].endsWith('.js') &&
          request.url.replace("/", "").replace(".js", "").split("?")[0].trim() ===
          hostDb.plinkk.slug
        ) {
          const js = await generateBundle();
          return reply.type("application/javascript").send(js);
        } else if (request.url.startsWith("/canvaAnimation")) {
          return reply.sendFile(
            `canvaAnimation/${request.url.replace("/canvaAnimation/", "")}`
          );
        } else if (request.url.startsWith("/public")) {
          return reply.sendFile(
            `images/${request.url.replace("/public/images/", "")}`
          );
        }
      }
      return reply.code(409).view("erreurs/reserved.ejs")
    }
    const reservedRoots = new Set([
      "login",
      "logout",
      "register",
    ]);
    if (reservedRoots.has(request.url.replace("/", ""))) {
      reply.redirect(process.env.DASHBOARD_URL + request.url)
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
