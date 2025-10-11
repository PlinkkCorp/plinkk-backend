import "dotenv/config";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import Fastify from "fastify";
import path from "path";
import ejs from "ejs";
import { readFileSync } from "fs";
import { PrismaClient } from "../generated/prisma/client";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import fastifyMultipart from "@fastify/multipart";
import fastifyCors from "@fastify/cors";
import bcrypt from "bcrypt";
import fastifySecureSession from "@fastify/secure-session";
import z from "zod";
import { apiRoutes } from "./server/apiRoutes";
import { staticPagesRoutes } from "./server/staticPagesRoutes";
import { dashboardRoutes } from "./server/dashboardRoutes";
import { plinkkFrontUserRoutes } from "./server/plinkkFrontUserRoutes";
import { plinkkPagesRoutes } from "./server/plinkkPagesRoutes";
import { createPlinkkForUser, slugify, isReservedSlug } from "./server/plinkkUtils";
// Example profile data used to pre-fill a new user's main Plinkk
// Note: this file is shared with client-side config and exports a default object
import profileConfig from "./public/config/profileConfig";
import { authenticator } from "otplib";
import { replyView } from "./lib/replyView";
import { toSafeUser } from "./types/user";
import fastifyRateLimit from "@fastify/rate-limit";

export const prisma = new PrismaClient();
export const fastify = Fastify({
  logger: true,
});
const PORT = Number(process.env.PORT) || 3001;

declare module "@fastify/secure-session" {
  interface SessionData {
    data?: string;
    // URL to return to after successful authentication
    returnTo?: string;
  }
}

fastify.register(fastifyRateLimit, {
  max: 100,
  timeWindow: "1 minutes",
})

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
fastify.register(fastifyMultipart, { attachFieldsToBody: true });
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

fastify.register(fastifyCors,  {
  origin: true
})

fastify.register(apiRoutes, { prefix: "/api" });
fastify.register(staticPagesRoutes);
fastify.register(dashboardRoutes, { prefix: "/dashboard" });
fastify.register(plinkkPagesRoutes, { prefix: "/dashboard" });
fastify.register(plinkkFrontUserRoutes);

fastify.addHook("onRequest", async (request, reply) => {
  const host = request.headers.host || "";

  if (host !== "plinkk.fr" && host !== "127.0.0.1:3001" && request.url === "/") {
    const hostDb = await prisma.host.findUnique({
      where: {
        id: host,
      },
    });
    if (hostDb && hostDb.verified === true) {
      const user = await prisma.user.findUnique({ where: { id: hostDb.userId } });
      const userName = user.userName
      if (userName === "") {
        reply.code(404).send({ error: "please specify a userName" });
        return;
      }

      return reply.view("links.ejs", { username: user.id });
    }

    return reply.type("text/html").send(`
      <html>
        <head><title>Plinkk</title></head>
        <body style="font-family:sans-serif;text-align:center;padding-top:40px">
          <h1>Bienvenue sur Plinkk</h1>
          <p>Ce contenu est uniquement accessible via <b>plinkk.fr</b></p>
          <a href="https://plinkk.fr">Acceder au site officiel</a>
        </body>
      </html>
    `);
  }
});

fastify.get("/", async function (request, reply) {
  const currentUserId = request.session.get("data") as string | undefined;
    const currentUser = currentUserId
    ? (await prisma.user.findUnique({
        where: { id: currentUserId },
      }))
    : null;
  // Annonces depuis la DB (affichées si ciblées pour l'utilisateur courant ou globales)
  let msgs: any[] = [];
  try {
    const now = new Date();
    const anns = await (prisma as any).announcement.findMany({
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
          a.targets.some((t: any) => t.userId === currentUser.id) ||
          a.roleTargets.some((rt: any) => rt.role === currentUser.role);
        if (toUser)
          msgs.push({
            id: a.id,
            level: a.level,
            text: a.text,
            dismissible: a.dismissible,
            startAt: a.startAt,
            endAt: a.endAt,
            createdAt: a.createdAt,
          });
      }
    } else {
      msgs = anns
        .filter((a: any) => a.global)
        .map((a: any) => ({
          id: a.id,
          level: a.level,
          text: a.text,
          dismissible: a.dismissible,
          startAt: a.startAt,
          endAt: a.endAt,
          createdAt: a.createdAt,
        }));
    }
  } catch (e) {}
  return await replyView(reply, "index.ejs", currentUser, {});
});

fastify.get("/login", async function (request, reply) {
  const currentUserId = request.session.get("data") as string | undefined;
  // If a session exists and it's not a temporary TOTP marker, ensure the user still exists.
  // If user exists, redirect to dashboard; otherwise, clear the stale session to avoid redirect loops.
  if (currentUserId && !String(currentUserId).includes('__totp')) {
    try {
      const exists = await prisma.user.findUnique({ where: { id: String(currentUserId) }, select: { id: true } });
      if (exists) {
        return reply.redirect('/dashboard');
      }
      // stale session -> clear and continue to render login page
      try { request.session.delete(); } catch (e) {}
    } catch (e) {
      // On DB error, do not loop: clear session as a safe fallback
      try { request.session.delete(); } catch (_) {}
    }
  }
  // Log stored returnTo for debugging
  try {
    request.log?.info(
      { returnTo: (request.session as any).get("returnTo") },
      "GET /login session"
    );
  } catch (e) {}
  const currentUser =
    currentUserId && String(currentUserId).includes("__totp")
      ? await prisma.user.findUnique({
          where: { id: String(currentUserId).split("__")[0] },
        })
      : null;
  const returnToQuery = (request.query as any)?.returnTo || "";
  return await replyView(reply, "connect.ejs", currentUser, { returnTo: returnToQuery });
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
  const { username, email, password, passwordVerif, acceptTerms } = req.body as {
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
  if (!(acceptTerms === 'on' || acceptTerms === 'true' || acceptTerms === true)) {
    const emailParam = encodeURIComponent(rawEmail);
    const userParam = encodeURIComponent(rawUsername);
    return reply.redirect(
      `/login?error=${encodeURIComponent("Vous devez accepter les Conditions générales d'utilisation et la politique de confidentialité")}&email=${emailParam}&username=${userParam}#signup`
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
    if (await isReservedSlug(prisma as any, generatedId)) {
      const emailParam = encodeURIComponent(rawEmail);
      const userParam = encodeURIComponent(rawUsername);
      return reply.redirect(`/login?error=${encodeURIComponent("Cet @ est réservé, essaye un autre nom d'utilisateur")}&email=${emailParam}&username=${userParam}#signup`);
    }
    const conflictUser = await prisma.user.findUnique({ where: { id: generatedId }, select: { id: true } });
    if (conflictUser) {
      const emailParam = encodeURIComponent(rawEmail);
      const userParam = encodeURIComponent(rawUsername);
      return reply.redirect(`/login?error=${encodeURIComponent("Ce @ est déjà pris")}&email=${emailParam}&username=${userParam}#signup`);
    }
    const conflictPlinkk = await prisma.plinkk.findFirst({ where: { slug: generatedId }, select: { id: true } });
    if (conflictPlinkk) {
      const emailParam = encodeURIComponent(rawEmail);
      const userParam = encodeURIComponent(rawUsername);
      return reply.redirect(`/login?error=${encodeURIComponent("Ce @ est déjà pris")}&email=${emailParam}&username=${userParam}#signup`);
    }

    const user = await prisma.user.create({
      data: {
        id: generatedId,
        userName: username,
        name: username,
        email: email,
        password: hashedPassword,
      },
    });
    // Ensure a default Cosmetic row exists to avoid null-access errors in code
    try {
      await prisma.cosmetic.create({ data: { userId: user.id } });
    } catch (e) {
      // Non bloquant: ignore unique constraint or other create errors
      req.log?.warn({ e }, 'create default cosmetic failed');
    }
    // Auto-crée un Plinkk principal pour ce compte (slug global basé sur username)
    try {
      // Create the user's main Plinkk and capture it so we can attach example data
      const createdPlinkk = await createPlinkkForUser(prisma as any, user.id, { name: username, slugBase: username, visibility: 'PUBLIC', isActive: true });
      try {
        // Create PlinkkSettings from example profileConfig (non-blocking)
        await prisma.plinkkSettings.create({ data: {
          plinkkId: createdPlinkk.id,
          profileLink: (profileConfig as any).profileLink,
          profileImage: (profileConfig as any).profileImage,
          profileIcon: (profileConfig as any).profileIcon,
          profileSiteText: (profileConfig as any).profileSiteText,
          userName: (profileConfig as any).userName,
          iconUrl: (profileConfig as any).iconUrl,
          description: (profileConfig as any).description,
          profileHoverColor: (profileConfig as any).profileHoverColor,
          degBackgroundColor: (profileConfig as any).degBackgroundColor,
          neonEnable: (profileConfig as any).neonEnable ?? (profileConfig as any).neonEnable === 0 ? 0 : 1,
          buttonThemeEnable: (profileConfig as any).buttonThemeEnable,
          EnableAnimationArticle: (profileConfig as any).EnableAnimationArticle,
          EnableAnimationButton: (profileConfig as any).EnableAnimationButton,
          EnableAnimationBackground: (profileConfig as any).EnableAnimationBackground,
          backgroundSize: (profileConfig as any).backgroundSize,
          selectedThemeIndex: (profileConfig as any).selectedThemeIndex,
          selectedAnimationIndex: (profileConfig as any).selectedAnimationIndex,
          selectedAnimationButtonIndex: (profileConfig as any).selectedAnimationButtonIndex,
          selectedAnimationBackgroundIndex: (profileConfig as any).selectedAnimationBackgroundIndex,
          animationDurationBackground: (profileConfig as any).animationDurationBackground,
          delayAnimationButton: (profileConfig as any).delayAnimationButton,
          canvaEnable: (profileConfig as any).canvaEnable,
          selectedCanvasIndex: (profileConfig as any).selectedCanvasIndex,
        }});
      } catch (e) {
        req.log?.warn({ e }, 'create default plinkkSettings failed');
      }

      try {
        // Create a single example Link for the new Plinkk if provided in the example config
        const exampleLinks = (profileConfig as any).links;
        if (Array.isArray(exampleLinks) && exampleLinks.length > 0) {
          const l = exampleLinks[0];
          await prisma.link.create({ data: {
            userId: user.id,
            plinkkId: createdPlinkk.id,
            icon: l.icon || (profileConfig as any).profileIcon || undefined,
            url: l.url || (profileConfig as any).profileLink || 'https://example.com',
            text: l.text || 'Mon lien',
            name: l.name || 'Exemple',
            description: l.description || null,
            showDescriptionOnHover: typeof l.showDescriptionOnHover === 'boolean' ? l.showDescriptionOnHover : true,
            showDescription: typeof l.showDescription === 'boolean' ? l.showDescription : true,
          }});
        }
      } catch (e) {
        req.log?.warn({ e }, 'create example link failed');
      }
    } catch (e) {
      // non bloquant
      req.log?.warn({ e }, 'auto-create default plinkk failed');
    }
    // Auto-login: set session and redirect to original destination if present
    const returnTo =
      (req.body as any)?.returnTo || (req.query as any)?.returnTo;
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
      (request.body as any)?.returnTo || (request.query as any)?.returnTo;
    request.session.set("data", user.id + "__totp");
    return reply.redirect(
      `/totp${
        returnToQuery ? `?returnTo=${encodeURIComponent(returnToQuery)}` : ""
      }`
    );
  }
  const returnToLogin =
    (request.body as any)?.returnTo || (request.query as any)?.returnTo;
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
    return reply.redirect('/login');
  }
  const parts = String(currentUserIdTotp).split("__");
  if (parts.length === 2 && parts[1] === "totp") {
    const returnToQuery = (request.query as any)?.returnTo || '';
    return reply.view("totp.ejs", { returnTo: returnToQuery });
  }
  return reply.redirect('/login');
});

fastify.post("/totp", async (request, reply) => {
  const { totp } = request.body as { totp: string };
  const currentUserIdTotp = request.session.get("data") as string | undefined;
  if (!currentUserIdTotp) {
    return reply.redirect('/login');
  }
  const parts = String(currentUserIdTotp).split("__");
  if (parts.length === 2 && parts[1] === "totp") {
    const user = await prisma.user.findUnique({ where: { id: parts[0] } });
    if (!user || !user.twoFactorSecret) {
      try { request.session.delete(); } catch (e) {}
      return reply.redirect('/login');
    }
    const isValid = authenticator.check(totp, user.twoFactorSecret);
    if (!isValid) {
      return reply.code(401).send({ error: "Invalid TOTP code" });
    }
    const returnToTotp = (request.body as any)?.returnTo || (request.query as any)?.returnTo;
    request.log?.info({ returnTo: returnToTotp }, 'totp: returnTo read from request');
    request.session.set("data", user.id);
    request.log?.info({ sessionData: request.session.get('data'), cookies: request.headers.cookie }, 'session set after totp');
    return reply.redirect(returnToTotp || "/dashboard");
  }
  // Unexpected state: clear and go to login to avoid loops
  try { request.session.delete(); } catch (e) {}
  return reply.redirect('/login');
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
      })
    : null;
  const users = await prisma.user.findMany({
    where: { isPublic: true },
    select: ({
      id: true,
      userName: true,
      email: true,
      publicEmail: true,
      role: true,
      cosmetics: true,
      image: true,
      plinkks: { select: { id: true, name: true, slug: true, isDefault: true } },
    } as any),
    orderBy: { createdAt: "asc" },
  });
  // Annonces DB pour la page publique des utilisateurs: on affiche seulement les globales si non connecté
  let msgs: any[] = [];
  try {
    const now = new Date();
    const anns = await (prisma as any).announcement.findMany({
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
          a.targets.some((t: any) => t.userId === currentUser.id) ||
          a.roleTargets.some((rt: any) => rt.role === currentUser.role);
        if (toUser)
          msgs.push({
            id: a.id,
            level: a.level,
            text: a.text,
            dismissible: a.dismissible,
            startAt: a.startAt,
            endAt: a.endAt,
            createdAt: a.createdAt,
          });
      }
    } else {
      msgs = anns
        .filter((a: any) => a.global)
        .map((a: any) => ({
          id: a.id,
          level: a.level,
          text: a.text,
          dismissible: a.dismissible,
          startAt: a.startAt,
          endAt: a.endAt,
          createdAt: a.createdAt,
        }));
    }
  } catch (e) {}
  return await replyView(reply, "users.ejs", currentUser, {
    users: users,
  });
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
});
