import "dotenv/config";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import Fastify from "fastify";
import path from "path";
import ejs from "ejs";
import { existsSync, readFileSync } from "fs";
import {
  Announcement,
  AnnouncementRoleTarget,
  AnnouncementTarget,
  PlinkkSettings,
  PrismaClient,
  Role,
  User,
} from "../../../generated/prisma/client";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import fastifyMultipart from "@fastify/multipart";
import fastifyCors from "@fastify/cors";
import fastifyCron from "fastify-cron";
import fastifySecureSession from "@fastify/secure-session";
import { staticPagesRoutes } from "./server/staticPagesRoutes";
import { plinkkFrontUserRoutes } from "./server/plinkkFrontUserRoutes";
import { replyView } from "./lib/replyView";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyHttpProxy from "@fastify/http-proxy";
import { generateBundle } from "./lib/generateBundle";
import { resolvePlinkkPage } from "./lib/resolvePlinkkPage";
import { generateProfileConfig } from "./lib/generateConfig";
import { minify } from "uglify-js";
import { coerceThemeData } from "./lib/theme";
import { generateTheme } from "./lib/generateTheme";

const prisma = new PrismaClient();
const fastify = Fastify({
  logger: true,
});
const PORT = 3002;

declare module "@fastify/secure-session" {
  interface SessionData {
    data?: string;
    // URL to return to after successful authentication
    returnTo?: string;
  }
}

fastify.register(fastifyRateLimit, {
  max: 500,
  timeWindow: "2 minutes",
});

fastify.register(fastifyView, {
  engine: {
    ejs: ejs,
  },
  root: path.join(__dirname, "views"),
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/public/", // optional: default '/'
});

fastify.register(fastifyFormbody);
// support file uploads via multipart/form-data
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
  rewritePrefix: "/script.js", // Supprime le préfixe dans la requête vers upstream
  replyOptions: {
    rewriteRequestHeaders: (req, headers) => {
      // On force un User-Agent et Host propres
      return {
        ...headers,
        host: "analytics.plinkk.fr",
      };
    },
  },
});

fastify.register(fastifyCron, {
  jobs: [
    {
      name: "Delete all inactive account",
      cronTime: "0 0 * * MON",
      onTick: async () => {
        const date = new Date(Date.now());
        date.setUTCFullYear(date.getUTCFullYear() - 3);
        console.log("Delete all to " + date.toISOString());
        const before = await prisma.user.count();
        await prisma.user.deleteMany({
          where: { lastLogin: { lte: date } },
        });
        const after = await prisma.user.count();
        console.log(
          `Finished deleted ${
            before - after
          } User(s) ( Before : ${before} User(s) / After : ${after} User(s) )`
        );
      },
    },
  ],
});

fastify.register(staticPagesRoutes);
fastify.register(plinkkFrontUserRoutes);

fastify.addHook("onRequest", async (request, reply) => {
  const host = request.headers.host || "";

  if (host !== "plinkk.fr" && host !== "127.0.0.1:3002") {
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

        const links = await prisma.link.findMany({
          where: { plinkkId: resolved.page.id, userId: resolved.user.id },
        });
        const isOwner =
          (request.session.get("data") as string | undefined) ===
          resolved.user.id;
        const publicPath =
          resolved.page && resolved.page.slug
            ? resolved.page.slug
            : resolved.user.id;

        return reply.view("plinkk/show.ejs", {
          page: resolved.page,
          userId: resolved.user.id,
          username: resolved.user.id,
          isOwner,
          links,
          publicPath,
        });
      } else if (request.url === "/css/styles.css") {
        return reply.sendFile(`css/styles.css`);
      } else if (request.url === "/css/button.css") {
        return reply.sendFile(`css/button.css`);
      } else if (request.url === "/umami_script.js") {
        return reply.sendFile(`https://analytics.plinkk.fr/script.js`);
      } else if (request.url.startsWith("/config.js")) {
        const page = hostDb.plinkk
        if (!page) return reply.code(404).send({ error: "Page introuvable" });

        // Charger les données par Plinkk
        const [
          settings,
          background,
          labels,
          neonColors,
          socialIcons,
          links,
          pageStatusbar,
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
          }),
          prisma.plinkkStatusbar.findUnique({ where: { plinkkId: page.id } }),
        ]);
        // Si un thème privé est sélectionné, récupérer ses données, les normaliser en "full shape"
        // et l'injecter comme thème 0 pour le front.
        let injectedThemeVar = "";
        try {
          // Helpers de normalisation (cohérents avec apiRoutes)
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
          // Fallback: si aucun thème sélectionné injecté, injecter le dernier SUBMITTED de l'utilisateur
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
        } catch {}
        // If we computed an injected theme, parse it to pass as object
        let injectedObj = null;
        try {
          if (injectedThemeVar) {
            // injectedThemeVar is like `window.__PLINKK_PRIVATE_THEME__ = {...};`
            const idx = injectedThemeVar.indexOf("=");
            const objStr = injectedThemeVar
              .slice(idx + 1)
              .trim()
              .replace(/;$/, "");
            injectedObj = JSON.parse(objStr);
          }
        } catch (e) {
          /* ignore */
        }

        // Fusionner les réglages de page (PlinkkSettings) avec les valeurs par défaut du compte
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
          selectedAnimationButtonIndex:
            settings?.selectedAnimationButtonIndex ?? 10,
          selectedAnimationBackgroundIndex:
            settings?.selectedAnimationBackgroundIndex ?? 0,
          animationDurationBackground:
            settings?.animationDurationBackground ?? 30,
          delayAnimationButton: settings?.delayAnimationButton ?? 0.1,
          // Support for per-Plinkk public email: if a PlinkkSettings.affichageEmail
          // exists we must prefer it for the generated profile config. We expose it
          // both as `affichageEmail` and override `publicEmail` so generateProfileConfig
          // (which reads profile.publicEmail) will pick up the page-specific value.
          affichageEmail: settings?.affichageEmail ?? null,
          publicEmail:
            settings &&
            Object.prototype.hasOwnProperty.call(settings, "affichageEmail")
              ? settings.affichageEmail
              : page.user.publicEmail ?? null,
          canvaEnable: settings?.canvaEnable ?? 1,
          selectedCanvasIndex: settings?.selectedCanvasIndex ?? 16,
          layoutOrder: settings?.layoutOrder ?? null,
        };

        const generated = generateProfileConfig(
          pageProfile,
          links,
          background,
          labels,
          neonColors,
          socialIcons,
          pageStatusbar,
          injectedObj
        );
        const mini = minify(generated);
        return reply.type("text/javascript").send(mini.code || "")
      } else if (request.url === "/themes.json") {
        return reply.send(await generateTheme(hostDb.plinkk.userId));
      } else if (request.url.replace("/", "").replace(".js", "").trim() === hostDb.plinkk.slug) {
        const js = await generateBundle();
        return reply.type("application/javascript").send(js);
      } else if (request.url.startsWith("/canvaAnimation")) {
        return reply.sendFile(`canvaAnimation/${request.url.replace("/canvaAnimation/", "")}`);
      }  else if (request.url.startsWith("/public")) {
        return reply.sendFile(`images/${request.url.replace("/public/images/", "")}`);
      }
    }
    return reply.type("text/html").send(`
    <!doctype html>
    <html lang="fr">
    <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Plinkk — Bienvenue</title>
    <style>
      :root{
      --bg-1:#0f172a;
      --bg-2:#0b1220;
      --card:#0b1226;
      --accent:#7c3aed;
      --muted:rgba(255,255,255,0.72);
      --glass:rgba(255,255,255,0.03);
      }
      @media (prefers-color-scheme: light){
      :root{
        --bg-1:#f7f8fb;
        --bg-2:#eef2ff;
        --card:#ffffff;
        --accent:#6d28d9;
        --muted:#334155;
        --glass:rgba(13,17,25,0.04);
      }
      }
      html,body{
      height:100%;
      margin:0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
      background: linear-gradient(135deg,var(--bg-1),var(--bg-2));
      -webkit-font-smoothing:antialiased;
      -moz-osx-font-smoothing:grayscale;
      color:var(--muted);
      }
      .wrap{
      min-height:100%;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:32px;
      box-sizing:border-box;
      }
      .card{
      width:100%;
      max-width:920px;
      background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
      backdrop-filter: blur(8px);
      border-radius:12px;
      box-shadow: 0 10px 30px rgba(2,6,23,0.6);
      overflow:hidden;
      display:flex;
      gap:0;
      }
      .panel-left{
      flex:1 1 420px;
      padding:40px;
      display:flex;
      flex-direction:column;
      justify-content:center;
      gap:18px;
      background:
        linear-gradient(180deg, rgba(124,58,237,0.06), transparent 40%),
        linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
      }
      .logo{
      display:inline-grid;
      place-items:center;
      width:64px;
      height:64px;
      border-radius:12px;
      background:linear-gradient(135deg,var(--accent),#4f46e5);
      color:white;
      font-weight:700;
      font-size:24px;
      box-shadow:0 6px 18px rgba(79,70,229,0.24);
      }
      h1{
      margin:0;
      color: white;
      font-size:28px;
      line-height:1.05;
      }
      p.lead{
      margin:0;
      color:var(--muted);
      font-size:15px;
      max-width:44ch;
      }
      .ctas{
      margin-top:8px;
      display:flex;
      gap:12px;
      flex-wrap:wrap;
      }
      .btn{
      display:inline-flex;
      align-items:center;
      gap:10px;
      padding:10px 16px;
      border-radius:10px;
      text-decoration:none;
      color:white;
      background:var(--accent);
      box-shadow:0 8px 20px rgba(99,102,241,0.14);
      font-weight:600;
      transition:transform .12s ease, box-shadow .12s ease;
      }
      .btn.secondary{
      background:transparent;
      color:var(--muted);
      border:1px solid var(--glass);
      box-shadow:none;
      font-weight:600;
      }
      .btn:active{ transform:translateY(1px) }
      .panel-right{
      width:320px;
      min-width:260px;
      background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
      padding:22px;
      display:flex;
      flex-direction:column;
      justify-content:center;
      gap:10px;
      border-left:1px solid rgba(255,255,255,0.03);
      }
      .meta{
      font-size:13px;
      color:var(--muted);
      display:flex;
      align-items:center;
      gap:10px;
      }
      .badge{
      background:var(--glass);
      color:var(--muted);
      padding:6px 10px;
      border-radius:999px;
      font-weight:600;
      font-size:12px;
      }
      footer{
      padding:18px;
      text-align:center;
      font-size:13px;
      color:rgba(255,255,255,0.5);
      background:linear-gradient(180deg, transparent, rgba(0,0,0,0.02));
      }
      @media (max-width:820px){
      .card{ flex-direction:column; }
      .panel-right{ width:100%; border-left:0; border-top:1px solid rgba(255,255,255,0.03); }
      }
    </style>
    </head>
    <body>
    <div class="wrap" role="main">
      <div class="card" aria-labelledby="welcome-title">
      <div class="panel-left">
        <div style="display:flex;align-items:center;gap:12px">
        <div class="logo" aria-hidden="true"><img src="https://plinkk.fr/public/images/logo.svg" style="max-width:100%;height:auto" alt="Plinkk Logo" /></div>
        <div style="display:flex;flex-direction:column">
          <div class="meta"><span class="badge">plinkk.fr</span><span style="opacity:.9">Accès restreint</span></div>
        </div>
        </div>
        <h1 id="welcome-title">Bienvenue sur Plinkk</h1>
        <p class="lead">Ce contenu est réservé au domaine officiel. Pour accéder à l'intégralité du site et à votre profil, rendez-vous sur le site principal ou connectez-vous avec votre compte.</p>
        <div class="ctas">
        <a class="btn" href="https://plinkk.fr" rel="noopener" target="_blank">Accéder au site officiel ↗</a>
        <a class="btn secondary" href="https://plinkk.fr/login">Se connecter</a>
        </div>
      </div>
      <div class="panel-right" aria-hidden="false">
        <div style="display:flex;flex-direction:column;gap:8px">
        <div style="font-weight:700;color:var(--muted);font-size:14px">Pourquoi cette page ?</div>
        <div style="font-size:13px;color:var(--muted);line-height:1.45">
          Pour protéger les profils et l'expérience utilisateur, l'accès direct à certains contenus est limité aux demandes depuis plinkk.fr. Si vous pensez que c'est une erreur, contactez le support à <a href="mailto:contact@plinkk.fr" style="color:inherit;text-decoration:underline">contact@plinkk.fr</a>.
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          <span style="font-size:12px;color:var(--muted);background:var(--glass);padding:6px 8px;border-radius:8px">Sécurité</span>
          <span style="font-size:12px;color:var(--muted);background:var(--glass);padding:6px 8px;border-radius:8px">Vie privée</span>
          <span style="font-size:12px;color:var(--muted);background:var(--glass);padding:6px 8px;border-radius:8px">Support</span>
        </div>
        </div>
      </div>
      </div>
    </div>
    <footer>
      © Plinkk — Renvoyer vers <a href="https://plinkk.fr" style="color:inherit;text-decoration:underline" rel="noopener" target="_blank">plinkk.fr</a>
    </footer>
    </body>
    </html>
  `);
  }
});

fastify.get("/", async function (request, reply) {
  const currentUserId = request.session.get("data") as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        include: { role: true },
      })
    : null;
  // Annonces depuis la DB (affichées si ciblées pour l'utilisateur courant ou globales)
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
  } catch (e) {}
  return await replyView(reply, "index.ejs", currentUser, {});
});

// Liste publique de tous les profils
fastify.get("/users", async (request, reply) => {
  const currentUserId = request.session.get("data") as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        include: { role: true },
      })
    : null;
  const plinkks = await prisma.plinkk.findMany({
    where: { isPublic: true },
    include: { settings: true },
    orderBy: { createdAt: "asc" },
  });
  // Annonces DB pour la page publique des utilisateurs: on affiche seulement les globales si non connecté
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
  } catch (e) {}
  return await replyView(reply, "users.ejs", currentUser, {
    plinkks: plinkks,
  });
});

// SPA fallback: serve the main index for non-API, non-static HTML navigations
// This enables client-side routing across the site without breaking existing server routes.
fastify.get("/*", async (request, reply) => {
  const url = request.raw.url || "";
  // Exclusions: API endpoints, known static prefixes, dashboard server routes keep server-side handling
  if (
    url.startsWith("/api") ||
    url.startsWith("/public") ||
    url.startsWith("/umami_script.js") ||
    url.startsWith("/dashboard")
  ) {
    return reply.callNotFound();
  }
  // Respect existing host handling: do not force SPA on non-allowed hosts
  const host = request.headers.host || "";
  if (host !== "plinkk.fr" && host !== "127.0.0.1:3001") {
    return reply.callNotFound();
  }
  // If it looks like a file request (has an extension), let 404/static handler deal with it
  if (/\.[a-zA-Z0-9]+$/.test(url)) {
    return reply.callNotFound();
  }
  // Only for HTML navigations
  const accept = request.headers.accept || "";
  if (!accept.includes("text/html")) {
    return reply.callNotFound();
  }
  const currentUserId = request.session.get("data") as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        include: { role: true },
      })
    : null;
  return await replyView(reply, "index.ejs", currentUser, {});
});

// 404 handler (après routes spécifiques)
fastify.setNotFoundHandler((request, reply) => {
  if (request.raw.url?.startsWith("/api")) {
    return reply.code(404).send({ error: "Not Found" });
  }
  const userId = request.session.get("data");
  return reply
    .code(404)
    .view("erreurs/404.ejs", { currentUser: userId ? { id: userId } : null });
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  if (request.raw.url?.startsWith("/api")) {
    return reply.code(500).send({ error: "Internal Server Error" });
  }
  const userId = request.session.get("data");
  return reply.code(500).view("erreurs/500.ejs", {
    message: error?.message ?? "",
    currentUser: userId ? { id: userId } : null,
  });
});

fastify.listen({ port: PORT, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.info(`Server is now listening on ${address}`);
  fastify.cron.startAllJobs();
});
