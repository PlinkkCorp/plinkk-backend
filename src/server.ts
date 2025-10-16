import "dotenv/config";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import Fastify from "fastify";
import path from "path";
import ejs from "ejs";
import { readFileSync } from "fs";
import {
  Announcement,
  AnnouncementRoleTarget,
  AnnouncementTarget,
  PrismaClient,
  Role,
} from "../generated/prisma/client";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import fastifyMultipart from "@fastify/multipart";
import fastifyCors from "@fastify/cors";
import fastifyCron from "fastify-cron";
import bcrypt from "bcrypt";
import fastifySecureSession from "@fastify/secure-session";
import z from "zod";
import { apiRoutes } from "./server/apiRoutes";
import { staticPagesRoutes } from "./server/staticPagesRoutes";
import { dashboardRoutes } from "./server/dashboardRoutes";
import { plinkkFrontUserRoutes } from "./server/plinkkFrontUserRoutes";
import { plinkkPagesRoutes } from "./server/plinkkPagesRoutes";
import {
  createPlinkkForUser,
  slugify,
  isReservedSlug,
} from "./lib/plinkkUtils";
// Example profile data used to pre-fill a new user's main Plinkk
// Note: this file is shared with client-side config and exports a default object
import profileConfig from "./public/config/profileConfig";
import { authenticator } from "otplib";
import { replyView } from "./lib/replyView";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyHttpProxy from "@fastify/http-proxy";

const prisma = new PrismaClient();
const fastify = Fastify({
  logger: true,
});
const PORT = 3001;

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

fastify.register(apiRoutes, { prefix: "/api" });
fastify.register(staticPagesRoutes);
fastify.register(dashboardRoutes, { prefix: "/dashboard" });
fastify.register(plinkkPagesRoutes, { prefix: "/dashboard" });
fastify.register(plinkkFrontUserRoutes);

fastify.addHook("onRequest", async (request, reply) => {
  const host = request.headers.host || "";

  if (
    host !== "plinkk.fr" &&
    host !== "127.0.0.1:3001" &&
    request.url === "/"
  ) {
    const hostDb = await prisma.host.findUnique({
      where: {
        id: host,
      },
    });
    if (hostDb && hostDb.verified === true) {
      const user = await prisma.user.findUnique({
        where: { id: hostDb.userId },
      });
      const userName = user.userName;
      if (userName === "") {
        reply.code(404).send({ error: "please specify a userName" });
        return;
      }

      return reply.view("plinkk/show.ejs", { username: user.id });
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

fastify.get("/login", async function (request, reply) {
  const currentUserId = request.session.get("data") as string | undefined;
  // If a session exists and it's not a temporary TOTP marker, ensure the user still exists.
  // If user exists, redirect to dashboard; otherwise, clear the stale session to avoid redirect loops.
  if (currentUserId && !String(currentUserId).includes("__totp")) {
    try {
      const exists = await prisma.user.findUnique({
        where: { id: String(currentUserId) },
        select: { id: true },
      });
      if (exists) {
        return reply.redirect("/dashboard");
      }
      // stale session -> clear and continue to render login page
      try {
        request.session.delete();
      } catch (e) {}
    } catch (e) {
      // On DB error, do not loop: clear session as a safe fallback
      try {
        request.session.delete();
      } catch (_) {}
    }
  }
  // Log stored returnTo for debugging
  try {
    request.log?.info(
      { returnTo: request.session.get("returnTo") },
      "GET /login session"
    );
  } catch (e) {}
  const currentUser =
    currentUserId && String(currentUserId).includes("__totp")
      ? await prisma.user.findUnique({
          where: { id: String(currentUserId).split("__")[0] },
        })
      : null;
  const returnToQuery = (request.query as { returnTo: string })?.returnTo || "";
  return await replyView(reply, "connect.ejs", currentUser, {
    returnTo: returnToQuery,
  });
});

// Provide a GET /register route: unauthenticated users are redirected to the login page anchor,
// authenticated users are forwarded to the dashboard.
fastify.get("/register", async (request, reply) => {
  const currentUserId = request.session.get("data") as string | undefined;
  if (currentUserId && !String(currentUserId).includes("__totp")) {
    return reply.redirect("/dashboard");
  }
  // Not logged in: send to the login page signup anchor
  return reply.redirect("/login#signup");
});

fastify.post("/register", async (req, reply) => {
  // If already authenticated (not in TOTP flow), redirect to dashboard instead of creating another account
  const currentUserId = req.session.get("data") as string | undefined;
  if (currentUserId && !String(currentUserId).includes("__totp")) {
    return reply.redirect("/dashboard");
  }
  const { username, email, password, passwordVerif, acceptTerms } =
    req.body as {
      username: string;
      email: string;
      password: string;
      passwordVerif: string;
      acceptTerms?: string | boolean;
    };
  // Nettoyage / validations de base
  const rawUsername = (username || "").trim();
  const rawEmail = (email || "").trim();
  const rawPassword = password || "";
  const rawPasswordVerif = passwordVerif || "";

  // Username length constraints (client and server must agree)
  const USERNAME_MIN = 3;
  const USERNAME_MAX = 30;
  if (rawUsername.length < USERNAME_MIN || rawUsername.length > USERNAME_MAX) {
    const emailParam = encodeURIComponent(rawEmail);
    const userParam = encodeURIComponent(rawUsername);
    return reply.redirect(
      `/login?error=${encodeURIComponent(
        `Le nom d'utilisateur doit contenir entre ${USERNAME_MIN} et ${USERNAME_MAX} caractères`
      )}&email=${emailParam}&username=${userParam}#signup`
    );
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  // Vérif mots de passe
  if (password !== passwordVerif) {
    const emailParam = encodeURIComponent(rawEmail);
    const userParam = encodeURIComponent(rawUsername);
    return reply.redirect(
      `/login?error=${encodeURIComponent(
        "Les mots de passe ne correspondent pas"
      )}&email=${emailParam}&username=${userParam}#signup`
    );
  }
  if (rawPassword.length < 8) {
    const emailParam = encodeURIComponent(rawEmail);
    const userParam = encodeURIComponent(rawUsername);
    return reply.redirect(
      `/login?error=${encodeURIComponent(
        "Le mot de passe doit contenir au moins 8 caractères"
      )}&email=${emailParam}&username=${userParam}#signup`
    );
  }

  // Vérifier que l'utilisateur a accepté les CGU
  if (
    !(acceptTerms === "on" || acceptTerms === "true" || acceptTerms === true)
  ) {
    const emailParam = encodeURIComponent(rawEmail);
    const userParam = encodeURIComponent(rawUsername);
    return reply.redirect(
      `/login?error=${encodeURIComponent(
        "Vous devez accepter les Conditions générales d'utilisation et la politique de confidentialité"
      )}&email=${emailParam}&username=${userParam}#signup`
    );
  }

  try {
    z.email().parse(rawEmail);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const emailParam = encodeURIComponent(rawEmail);
      const userParam = encodeURIComponent(rawUsername);
      return reply.redirect(
        `/login?error=${encodeURIComponent(
          "Email invalide"
        )}&email=${emailParam}&username=${userParam}#signup`
      );
    }
  }
  try {
    // generate slug/id from username
    const generatedId = slugify(username);

    if (!generatedId || generatedId.length === 0) {
      const emailParam = encodeURIComponent(rawEmail);
      const userParam = encodeURIComponent(rawUsername);
      return reply.redirect(
        `/login?error=${encodeURIComponent(
          "Nom d'utilisateur invalide"
        )}&email=${emailParam}&username=${userParam}#signup`
      );
    }

    // Vérifier unicité globale: pas d'utilisateur existant, pas de plinkk avec ce slug, pas de mot réservé
    if (await isReservedSlug(prisma, generatedId)) {
      const emailParam = encodeURIComponent(rawEmail);
      const userParam = encodeURIComponent(rawUsername);
      return reply.redirect(
        `/login?error=${encodeURIComponent(
          "Cet @ est réservé, essaye un autre nom d'utilisateur"
        )}&email=${emailParam}&username=${userParam}#signup`
      );
    }
    const conflictUser = await prisma.user.findUnique({
      where: { id: generatedId },
      select: { id: true },
    });
    if (conflictUser) {
      const emailParam = encodeURIComponent(rawEmail);
      const userParam = encodeURIComponent(rawUsername);
      return reply.redirect(
        `/login?error=${encodeURIComponent(
          "Ce @ est déjà pris"
        )}&email=${emailParam}&username=${userParam}#signup`
      );
    }
    const conflictPlinkk = await prisma.plinkk.findFirst({
      where: { slug: generatedId },
      select: { id: true },
    });
    if (conflictPlinkk) {
      const emailParam = encodeURIComponent(rawEmail);
      const userParam = encodeURIComponent(rawUsername);
      return reply.redirect(
        `/login?error=${encodeURIComponent(
          "Ce @ est déjà pris"
        )}&email=${emailParam}&username=${userParam}#signup`
      );
    }

    const user = await prisma.user.create({
      data: {
        id: generatedId,
        userName: username,
        name: username,
        email: email,
        password: hashedPassword,
        role: {
          connect: {
            id: "USER"
          }
        }
      },
    });
    // Ensure a default Cosmetic row exists to avoid null-access errors in code
    try {
      await prisma.cosmetic.create({ data: { userId: user.id } });
    } catch (e) {
      // Non bloquant: ignore unique constraint or other create errors
      req.log?.warn({ e }, "create default cosmetic failed");
    }
    // Auto-crée un Plinkk principal pour ce compte (slug global basé sur username)
    try {
      // Create the user's main Plinkk and capture it so we can attach example data
      const createdPlinkk = await createPlinkkForUser(prisma, user.id, {
        name: username,
        slugBase: username,
        visibility: "PUBLIC",
        isActive: true,
      });
      try {
        // Create PlinkkSettings from example profileConfig (non-blocking)
        await prisma.plinkkSettings.create({
          data: {
            plinkkId: createdPlinkk.id,
            profileLink: profileConfig.profileLink,
            profileImage: profileConfig.profileImage,
            profileIcon: profileConfig.profileIcon,
            profileSiteText: profileConfig.profileSiteText,
            userName: username,
            iconUrl: profileConfig.iconUrl,
            description: profileConfig.description,
            profileHoverColor: profileConfig.profileHoverColor,
            degBackgroundColor: profileConfig.degBackgroundColor,
            neonEnable:
              profileConfig.neonEnable ?? profileConfig.neonEnable === 0
                ? 0
                : 1,
            buttonThemeEnable: profileConfig.buttonThemeEnable,
            EnableAnimationArticle: profileConfig.EnableAnimationArticle,
            EnableAnimationButton: profileConfig.EnableAnimationButton,
            EnableAnimationBackground: profileConfig.EnableAnimationBackground,
            backgroundSize: profileConfig.backgroundSize,
            selectedThemeIndex: profileConfig.selectedThemeIndex,
            selectedAnimationIndex: profileConfig.selectedAnimationIndex,
            selectedAnimationButtonIndex:
              profileConfig.selectedAnimationButtonIndex,
            selectedAnimationBackgroundIndex:
              profileConfig.selectedAnimationBackgroundIndex,
            animationDurationBackground:
              profileConfig.animationDurationBackground,
            delayAnimationButton: profileConfig.delayAnimationButton,
            canvaEnable: profileConfig.canvaEnable,
            selectedCanvasIndex: profileConfig.selectedCanvasIndex,
          },
        });
      } catch (e) {
        req.log?.warn({ e }, "create default plinkkSettings failed");
      }

      try {
        // Create a single example Link for the new Plinkk if provided in the example config
        const exampleLinks = profileConfig.links;
        if (Array.isArray(exampleLinks) && exampleLinks.length > 0) {
          const l = exampleLinks[0];
          await prisma.link.create({
            data: {
              userId: user.id,
              plinkkId: createdPlinkk.id,
              icon: l.icon || profileConfig.profileIcon || undefined,
              url: l.url || profileConfig.profileLink || "https://example.com",
              text: l.text || "Mon lien",
              name: l.name || "Exemple",
              description: l.description || null,
              showDescriptionOnHover:
                typeof l.showDescriptionOnHover === "boolean"
                  ? l.showDescriptionOnHover
                  : true,
              showDescription:
                typeof l.showDescription === "boolean"
                  ? l.showDescription
                  : true,
            },
          });
        }
      } catch (e) {
        req.log?.warn({ e }, "create example link failed");
      }
    } catch (e) {
      // non bloquant
      req.log?.warn({ e }, "auto-create default plinkk failed");
    }
    // Auto-login: set session and redirect to original destination if present
    const returnTo =
      (req.body as { returnTo: string })?.returnTo ||
      (req.query as { returnTo: string })?.returnTo;
    req.log?.info({ returnTo }, "register: returnTo read from request");
    req.session.set("data", user.id);
    req.log?.info(
      { sessionData: req.session.get("data"), cookies: req.headers.cookie },
      "session set after register"
    );
    return reply.redirect(returnTo || "/dashboard");
  } catch (error) {
    reply.redirect(
      "/login?error=" + encodeURIComponent("Utilisateur deja existant")
    );
  }
  // note: on error above we redirected; otherwise we've already redirected to /dashboard
});

fastify.post("/login", async (request, reply) => {
  // If already authenticated and not in TOTP flow, redirect to dashboard
  const currentUserId = request.session.get("data") as string | undefined;
  if (currentUserId && !String(currentUserId).includes("__totp")) {
    return reply.redirect("/dashboard");
  }
  const { email, password } = request.body as {
    email: string;
    password: string;
  };
  const emailTrim = (email || "").trim();
  try {
    z.email().parse(emailTrim);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.redirect(
        `/login?error=${encodeURIComponent(
          "Email invalide"
        )}&email=${encodeURIComponent(emailTrim)}`
      );
    }
  }
  const user = await prisma.user.findFirst({
    where: {
      email: emailTrim,
    },
    include: { role: true },
  });

  if (!user)
    return reply.redirect(
      `/login?error=${encodeURIComponent(
        "Utilisateur introuvable"
      )}&email=${encodeURIComponent(emailTrim)}`
    );
  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return reply.redirect(
      `/login?error=${encodeURIComponent(
        "Mot de passe incorrect"
      )}&email=${encodeURIComponent(emailTrim)}`
    );

  if (user.twoFactorEnabled) {
    // Pass returnTo via query to TOTP step so it's preserved through the flow
    const returnToQuery =
      (request.body as { returnTo: string })?.returnTo ||
      (request.query as { returnTo: string })?.returnTo;
    request.session.set("data", user.id + "__totp");
    return reply.redirect(
      `/totp${
        returnToQuery ? `?returnTo=${encodeURIComponent(returnToQuery)}` : ""
      }`
    );
  }
  await prisma.user.update({
    where: { email: emailTrim },
    data: {
      lastLogin: new Date(Date.now()),
    },
  });
  const returnToLogin =
    (request.body as { returnTo: string })?.returnTo ||
    (request.query as { returnTo: string })?.returnTo;
  request.log?.info(
    { returnTo: returnToLogin },
    "login: returnTo read from request"
  );
  request.session.set("data", user.id);
  request.log?.info(
    {
      sessionData: request.session.get("data"),
      cookies: request.headers.cookie,
    },
    "session set after login"
  );
  reply.redirect(returnToLogin || "/dashboard");
});

fastify.get("/totp", (request, reply) => {
  const currentUserIdTotp = request.session.get("data") as string | undefined;
  if (!currentUserIdTotp) {
    return reply.redirect("/login");
  }
  const parts = String(currentUserIdTotp).split("__");
  if (parts.length === 2 && parts[1] === "totp") {
    const returnToQuery =
      (request.query as { returnTo: string })?.returnTo || "";
    return reply.view("totp.ejs", { returnTo: returnToQuery });
  }
  return reply.redirect("/login");
});

fastify.post("/totp", async (request, reply) => {
  const { totp } = request.body as { totp: string };
  const currentUserIdTotp = request.session.get("data") as string | undefined;
  if (!currentUserIdTotp) {
    return reply.redirect("/login");
  }
  const parts = String(currentUserIdTotp).split("__");
  if (parts.length === 2 && parts[1] === "totp") {
    const user = await prisma.user.findUnique({ where: { id: parts[0] } });
    if (!user || !user.twoFactorSecret) {
      try {
        request.session.delete();
      } catch (e) {}
      return reply.redirect("/login");
    }
    const isValid = authenticator.check(totp, user.twoFactorSecret);
    if (!isValid) {
      return reply.code(401).send({ error: "Invalid TOTP code" });
    }
    const returnToTotp =
      (request.body as { returnTo: string })?.returnTo ||
      (request.query as { returnTo: string })?.returnTo;
    request.log?.info(
      { returnTo: returnToTotp },
      "totp: returnTo read from request"
    );
    request.session.set("data", user.id);
    request.log?.info(
      {
        sessionData: request.session.get("data"),
        cookies: request.headers.cookie,
      },
      "session set after totp"
    );
    return reply.redirect(returnToTotp || "/dashboard");
  }
  // Unexpected state: clear and go to login to avoid loops
  try {
    request.session.delete();
  } catch (e) {}
  return reply.redirect("/login");
});

fastify.get("/logout", (req, reply) => {
  try {
    req.log?.info(
      { beforeDelete: req.session.get("data"), cookies: req.headers.cookie },
      "logout: before session.delete"
    );
  } catch (e) {}
  req.session.delete();
  try {
    req.log?.info(
      { afterDelete: req.session.get("data"), cookies: req.headers.cookie },
      "logout: after session.delete"
    );
  } catch (e) {}
  reply.redirect("/login");
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
