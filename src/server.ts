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
import { authenticator } from "otplib";

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
fastify.register(plinkkFrontUserRoutes);

fastify.addHook("onRequest", async (request, reply) => {
  const host = request.headers.host || "";

  if (!/(\.|^)plinkk\.fr$/i.test(host) && host !== "127.0.0.1:3001") {
    const hostDb = await prisma.host.findUnique({
      where: {
        id: host,
      },
    });
    if (hostDb) {
      const user = await prisma.user.findUnique({ where: { id: hostDb.userId } });
      const userName = user.userName
      if (userName === "") {
        reply.code(404).send({ error: "please specify a userName" });
        return;
      }

      return reply.view("links_cname.ejs", { username: user.id });
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
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          userName: true,
          isPublic: true,
          email: true,
          publicEmail: true,
          image: true,
          role: true,
        },
      })
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
  return reply.view("index.ejs", { currentUser, __SITE_MESSAGES__: msgs });
});

fastify.get("/login", async function (request, reply) {
  const currentUserId = request.session.get("data") as string | undefined;
  // If user is fully authenticated (not the temporary TOTP marker), redirect to dashboard
  if (currentUserId && !String(currentUserId).includes("__totp")) {
    return reply.redirect("/dashboard");
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
          select: {
            id: true,
            userName: true,
            isPublic: true,
            email: true,
            image: true,
          },
        })
      : null;
  const returnToQuery = (request.query as any)?.returnTo || "";
  return reply.view("connect.ejs", { currentUser, returnTo: returnToQuery });
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
  const { username, email, password, passwordVerif } = req.body as {
    username: string;
    email: string;
    password: string;
    passwordVerif: string;
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
    const generatedId = username
      .replaceAll(" ", "-")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!generatedId || generatedId.length === 0) {
      const emailParam = encodeURIComponent(rawEmail);
      const userParam = encodeURIComponent(rawUsername);
      return reply.redirect(
        `/login?error=${encodeURIComponent(
          "Nom d'utilisateur invalide"
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
      },
    });
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
  if (
    currentUserIdTotp.split("__").length === 2 &&
    currentUserIdTotp.split("__")[1] === "totp"
  ) {
    const returnToQuery = (request.query as any)?.returnTo || "";
    reply.view("totp.ejs", { returnTo: returnToQuery });
  }
});

fastify.post("/totp", async (request, reply) => {
  const { totp } = request.body as { totp: string };
  const currentUserIdTotp = request.session.get("data") as string | undefined;
  if (
    currentUserIdTotp.split("__").length === 2 &&
    currentUserIdTotp.split("__")[1] === "totp"
  ) {
    const user = await prisma.user.findUnique({
      where: {
        id: currentUserIdTotp.split("__")[0],
      },
    });
    const isValid = authenticator.check(totp, user.twoFactorSecret);
    if (!isValid) return reply.code(401).send({ error: "Invalid TOTP code" });

    const returnToTotp =
      (request.body as any)?.returnTo || (request.query as any)?.returnTo;
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
        select: {
          id: true,
          userName: true,
          isPublic: true,
          email: true,
          image: true,
          profileImage: true,
          role: true,
        },
      })
    : null;
  const users = await prisma.user.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      userName: true,
      email: true,
      publicEmail: true,
      role: true,
      cosmetics: true,
      profileImage: true,
    },
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
  return reply.view("users.ejs", {
    users: users,
    currentUser: currentUser,
    __SITE_MESSAGES__: msgs,
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
