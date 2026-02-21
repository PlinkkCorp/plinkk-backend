import "dotenv/config";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import Fastify, { FastifyError } from "fastify";
import path from "path";
import ejs from "ejs";
import { readFileSync } from "fs";
import {
  Announcement,
  AnnouncementRoleTarget,
  AnnouncementTarget,
  PlinkkSettings,
  Role,
  User,
  PlinkkVersion,
  BackgroundColor,
  NeonColor,
  Label,
  SocialIcon,
  PlinkkStatusbar,
  Link,
  Category,
} from "@plinkk/prisma";
import { PlinkkSnapshot } from "./types/plinkk";

// snapshot type imported from ./types/plinkk
import { prisma } from "@plinkk/prisma";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import fastifyMultipart from "@fastify/multipart";
import fastifyCors from "@fastify/cors";
import fastifySecureSession from "@fastify/secure-session";
import { redirectRoutes } from "./server/redirectRoutes";
import { staticPagesRoutes } from "./server/staticPagesRoutes";
import { plinkkFrontUserRoutes } from "./server/plinkkFrontUserRoutes";
import { replyView } from "./lib/replyView";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCompress from "@fastify/compress";
import fastifyHttpProxy from "@fastify/http-proxy";
import { generateBundle } from "./lib/generateBundle";
import { resolvePlinkkPage } from "./lib/resolvePlinkkPage";
import { generateProfileConfig } from "./lib/generateConfig";
import { minify } from "uglify-js";
import { coerceThemeData } from "./lib/theme";
import { generateTheme } from "./lib/generateTheme";
import { AppError } from "@plinkk/shared";

const fastify = Fastify({
  logger: true,
  trustProxy: true,
});
const PORT = 3002;

/*
declare module "@fastify/secure-session" {
  interface SessionData {
    data?: string;
    returnTo?: string;
    [key: string]: any;
  }
}
*/

fastify.register(fastifyRateLimit, {
  max: 500,
  timeWindow: "2 minutes",
});

fastify.register(fastifyCompress);

const sharedViewsRoot = path.join(__dirname, "..", "..", "..", "packages", "shared", "views");
fastify.register(fastifyView, {
  engine: {
    ejs: ejs,
  },
  root: path.join(__dirname, "views"),
  options: {
    views: [
      path.join(__dirname, "views"),
      sharedViewsRoot,
    ],
  },
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/public/",
});

fastify.register(fastifyFormbody);
fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 Mo
  },
});
fastify.register(fastifyCookie);

fastify.register(fastifySecureSession, {
  sessionName: "session",
  cookieName: "plinkk-backend",
  key: readFileSync(path.join(__dirname, "secret-key")),
  expiry: 24 * 60 * 60,
  cookie: {
    path: "/",
  },
});

fastify.register(fastifyCors, {
  origin: true,
});

fastify.register(fastifyHttpProxy, {
  upstream: "https://analytics.plinkk.fr/",
  prefix: "/umami_script.js",
  rewritePrefix: "/script.js",
  replyOptions: {
    rewriteRequestHeaders: (req, headers) => {
      return {
        ...headers,
        host: "analytics.plinkk.fr",
      };
    },
  },
});

fastify.register(fastifyHttpProxy, {
  upstream: "https://analytics.plinkk.fr/",
  prefix: "/api/send",
  rewritePrefix: "/api/send",
  replyOptions: {
    rewriteRequestHeaders: (req, headers) => {
      return {
        ...headers,
        host: "analytics.plinkk.fr",
      };
    },
  },
});

fastify.register(redirectRoutes);
fastify.register(staticPagesRoutes);
fastify.register(plinkkFrontUserRoutes);

fastify.addHook("preHandler", async (request, reply) => {
  if (request.url.startsWith("/public") ||
    request.url.startsWith("/assets") ||
    request.url.startsWith("/js/") ||
    request.url.startsWith("/css/") ||
    request.url.startsWith("/umami_script.js") ||
    request.url.startsWith("/icons/")
  ) return;

  const maintenance = await prisma.maintenance.findUnique({ where: { id: "config" } });

  if (maintenance) {
    let isActive = maintenance.global;

    // Check specific page maintenance (Blocklist) if global is OFF
    if (!isActive && maintenance.maintenancePages.includes(request.url)) {
      isActive = true;
    }

    // Check exceptions (Allowlist) if global is ON
    if (isActive && maintenance.activePages.includes(request.url)) {
      isActive = false;
    }

    if (isActive) {
      // Check for bypass permission
      const sessionData = request.session.get("data");
      const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

      if (currentUserId) {
        const user = await prisma.user.findUnique({
          where: { id: currentUserId },
          include: { role: { include: { permissions: true } } }
        });
        const hasPermission = user?.role?.permissions.some(rp => rp.permissionKey === "ACCESS_MAINTENANCE");
        if (hasPermission) return;
      }

      return reply.code(503).view("erreurs/503.ejs", {
        reason: maintenance.reason || "Maintenance en cours",
        currentUser: null,
        global: maintenance.global
      });
    }
  }
});

fastify.addHook("onRequest", async (request, reply) => {
  const host = request.headers.host || "";

  if (
    host !== "plinkk.fr" &&
    host !== "beta.plinkk.fr" &&
    host !== "127.0.0.1:3002"
  ) {
    const hostDb = await prisma.host.findUnique({
      where: {
        id: host,
      },
      include: { plinkk: { include: { user: true } } },
    });
    if (hostDb && hostDb.verified === true) {
      if (request.url === "/") {
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

        // Check for versionId in query for preview
        const query = (request.query as { versionId?: string });
        const versionId = query.versionId;

        // Default values// Force restart to apply view changes
        // 2026-02-18T21:30:00Z
        let displayPage = resolved.page;
        let displayUser = resolved.user;

        // Fetch additional data for default view
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

        // Initialize display variables
        let displaySettings = settings;
        let displayBackground = background;
        let displayNeonColors = neonColors;
        let displayLabels = labels;
        let displaySocialIcons = socialIcon;
        let displayStatusbar = statusbar;
        let displayLinks = links;
        let displayCategories = categories;

        if (versionId) {
          // Try to load snapshot
          console.log(`[Preview] Loading version ${versionId} for plinkk ${resolved.page.id}`);
          const version = await prisma.plinkkVersion.findUnique({ where: { id: versionId } });

          if (version && version.plinkkId === resolved.page.id) {
            const snapshot = version.snapshot as PlinkkSnapshot;
            console.log(`[Preview] Snapshot loaded. Keys: ${Object.keys(snapshot || {}).join(', ')}`);

            if (snapshot?.plinkk) {
              displayPage = { ...displayPage, ...snapshot.plinkk };
            }
            if (snapshot?.settings) {
              displaySettings = { ...displaySettings, ...snapshot.settings };
            }
            if (snapshot?.background) {
              displayBackground = snapshot.background;
            }
            if (snapshot?.neonColors) {
              displayNeonColors = snapshot.neonColors;
            }
            if (snapshot?.labels) {
              displayLabels = snapshot.labels;
            }
            if (snapshot?.socialIcon) {
              displaySocialIcons = snapshot.socialIcon;
            }
            if (snapshot?.statusbar) {
              displayStatusbar = snapshot.statusbar;
            }
            if (snapshot?.links) {
              displayLinks = snapshot.links;
            }
            if (snapshot?.categories) {
              displayCategories = snapshot.categories;
            }
          } else {
            console.log(`[Preview] Version not found or mismatch: ${versionId}`);
          }
        }

        const isOwner = (request.session.get("data") as string | undefined) === resolved.user.id;
        const publicPath = displayPage && displayPage.slug ? displayPage.slug : displayUser.id;

        return reply.view("plinkk/show.ejs", {
          page: displayPage,
          userId: displayUser.id,
          username: displayUser.id,
          isOwner,
          links: displayLinks,
          publicPath,
        });
      } else if (request.url === "/css/styles.css") {
        return reply.sendFile(`css/styles.css`);
      } else if (request.url === "/css/button.css") {
        return reply.sendFile(`css/button.css`);
      } else if (request.url.startsWith("/js/")) {
        const jsFile = request.url.replace("/js/", "");
        return reply.sendFile(`js/${jsFile}`);
      } else if (request.url.startsWith("/config.js")) {
        const page = hostDb.plinkk;
        if (!page) return reply.code(404).send({ error: "Page introuvable" });

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
              select: { data: true, isPrivate: true, authorId: true },
            });
            if (t && t.authorId === page.user.id) {
              const full = coerceThemeData(t.data);
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
        request.url.replace("/", "").replace(".js", "").trim() ===
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
  if (request.url in reservedRoots) {
    reply.redirect(process.env.DASHBOARD_URL + request.url)
  }
});

fastify.get("/", async function (request, reply) {
  const sessionData = request.session.get("data");
  const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: true },
    })
    : null;

  const [userCount, linkCount, totalViewsResult] = await Promise.all([
    prisma.user.count(),
    prisma.link.count(),
    prisma.plinkk.aggregate({
      _sum: {
        views: true,
      },
    }),
  ]);
  const totalViews = totalViewsResult._sum.views || 0;

  let msgs: Announcement[] = [];
  try {
    const now = new Date();
    const anns = await prisma.announcement.findMany({
      where: {
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      include: { targets: true, roleTargets: { include: { role: true } } },
      orderBy: { createdAt: "desc" },
    });
    if (currentUser) {
      for (const a of anns) {
        const toUser =
          a.global ||
          a.targets.some(
            (t: AnnouncementTarget) => t.userId === currentUser.id
          ) ||
          a.roleTargets.some(
            (rt: AnnouncementRoleTarget & { role: Role }) =>
              rt.role.name === currentUser.role.name
          );
        if (toUser) msgs.push(a);
      }
    } else {
      msgs = anns.filter((a) => a.global);
    }
  } catch (e) { }
  return await replyView(reply, "index.ejs", currentUser, {
    userCount,
    linkCount,
    totalViews,
  });
});

fastify.get("/users", async (request, reply) => {
  const sessionData = request.session.get("data");
  const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: true },
    })
    : null;
  const plinkks = await prisma.plinkk.findMany({
    where: { isPublic: true },
    include: {
      settings: true,
      user: {
        include: {
          cosmetics: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  let msgs: Announcement[] = [];
  try {
    const now = new Date();
    const anns = await prisma.announcement.findMany({
      where: {
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      include: { targets: true, roleTargets: true },
      orderBy: { createdAt: "desc" },
    });
    if (currentUser) {
      for (const a of anns) {
        const toUser =
          a.global ||
          a.targets.some(
            (t: AnnouncementTarget) => t.userId === currentUser.id
          ) ||
          a.roleTargets.some(
            (rt: AnnouncementRoleTarget & { role: Role }) =>
              rt.role.name === currentUser.role.name
          );
        if (toUser) msgs.push(a);
      }
    } else {
      msgs = anns.filter((a) => a.global);
    }
  } catch (e) { }
  return await replyView(reply, "users.ejs", currentUser, {
    plinkks: plinkks,
  });
});

fastify.get("/*", async (request, reply) => {
  const url = request.raw.url || "";
  if (
    url.startsWith("/api") ||
    url.startsWith("/public") ||
    url.startsWith("/umami_script.js") ||
    url.startsWith("/dashboard")
  ) {
    return reply.callNotFound();
  }
  const host = request.headers.host || "";
  if (host !== "plinkk.fr" && host !== "127.0.0.1:3001") {
    return reply.callNotFound();
  }
  if (/\.[a-zA-Z0-9]+$/.test(url)) {
    return reply.callNotFound();
  }
  const accept = request.headers.accept || "";
  if (!accept.includes("text/html")) {
    return reply.callNotFound();
  }
  const sessionData = request.session.get("data");
  const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: true },
    })
    : null;

  const [userCount, linkCount, totalViewsResult] = await Promise.all([
    prisma.user.count(),
    prisma.link.count(),
    prisma.plinkk.aggregate({
      _sum: {
        views: true,
      },
    }),
  ]);
  const totalViews = totalViewsResult._sum.views || 0;

  return await replyView(reply, "index.ejs", currentUser, {
    userCount,
    linkCount,
    totalViews,
  });
});

fastify.setNotFoundHandler((request, reply) => {
  if (request.raw.url?.startsWith("/api")) {
    return reply.code(404).send({ error: "Not Found" });
  }
  const sessionData = request.session.get("data");
  const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
  return reply.code(404).view("erreurs/404.ejs", {
    currentUser: userId ? { id: userId } : null,
    dashboardUrl: process.env.DASHBOARD_URL,
  });
});

fastify.addHook('onSend', async (request, reply, payload) => {
  if (request.raw.url?.startsWith("/api")) return payload;

  const statusCode = reply.statusCode;
  if ([401, 403, 410, 429, 503, 504].includes(statusCode)) {
    const contentType = reply.getHeader('content-type');
    if (contentType && typeof contentType === 'string' && contentType.includes('application/json')) {
      // Remplacer par la vue d'erreur
      const sessionData = request.session.get("data");
      const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
      const viewData = {
        currentUser: userId ? { id: userId } : null,
        dashboardUrl: process.env.DASHBOARD_URL,
      };
      const html = await fastify.view(`erreurs/${statusCode}.ejs`, viewData);
      reply.header('content-type', 'text/html');
      return html;
    }
  }
  return payload;
});

fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  if (error instanceof AppError) {
    if (request.raw.url?.startsWith("/api")) {
      return reply.code(error.statusCode).send({
        error: error.code.toLowerCase(),
        message: error.message
      });
    }
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    const template = error.statusCode === 404 ? "erreurs/404.ejs" : "erreurs/500.ejs";
    return reply.code(error.statusCode).view(template, {
      message: error.message,
      currentUser: userId ? { id: userId } : null,
      dashboardUrl: process.env.DASHBOARD_URL,
    });
  }

  if (request.raw.url?.startsWith("/api")) {
    return reply.code(500).send({ error: "internal_server_error" });
  }
  const sessionData = request.session.get("data");
  const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
  return reply.code(500).view("erreurs/500.ejs", {
    message: error && typeof error === 'object' && 'message' in error ? (error).message ?? "" : "",
    currentUser: userId ? { id: userId } : null,
    dashboardUrl: process.env.DASHBOARD_URL,
  });
});

fastify.listen({ port: PORT, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.info(`Server is now listening on ${address}`);
});
