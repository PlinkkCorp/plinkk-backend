import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import Fastify from "fastify";
import path from "path";
import ejs from "ejs";
import { readFileSync } from "fs";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import fastifyMultipart from "@fastify/multipart";
import fastifyCors from "@fastify/cors";
import fastifyCron from "fastify-cron";
import bcrypt from "bcrypt";
import fastifySecureSession from "@fastify/secure-session";
import z from "zod";
import { apiRoutes } from "./server/apiRoutes";
import { dashboardRoutes } from "./server/dashboardRoutes";
import { plinkkPagesRoutes } from "./server/plinkkPagesRoutes";
import {
  createPlinkkForUser,
  slugify,
  isReservedSlug,
} from "./lib/plinkkUtils";
import profileConfig from "./public/config/profileConfig";
import { authenticator } from "otplib";
import { replyView } from "./lib/replyView";
import fastifyRateLimit from "@fastify/rate-limit";
import "dotenv/config";
import { PrismaClient } from "@plinkk/prisma/generated/prisma/client";
import { generateTheme } from "./lib/generateTheme";

const prisma = new PrismaClient();
const fastify = Fastify({
  logger: true,
});
const PORT = 3001;

declare module "@fastify/secure-session" {
  interface SessionData {
    data?: string;
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

fastify.addHook("onRequest", async (request, reply) => {
  const reservedRoots = new Set([
    "favicon.ico",
    "robots.txt",
    "manifest.json",
    "public",
    "users",
  ]);
  if (request.url in reservedRoots) {
    reply.redirect(process.env.FRONTEND_URL + request.url);
  }
});

fastify.register(apiRoutes, { prefix: "/api" });
fastify.register(dashboardRoutes);
fastify.register(plinkkPagesRoutes);

fastify.get("/login", async function (request, reply) {
  const currentUserId = request.session.get("data");
  if (currentUserId && !String(currentUserId).includes("__totp")) {
    try {
      const exists = await prisma.user.findUnique({
        where: { id: String(currentUserId) },
        select: { id: true },
      });
      if (exists) {
        return reply.redirect("/");
      }
      try {
        request.session.delete();
      } catch (e) {}
    } catch (e) {
      try {
        request.session.delete();
      } catch (_) {}
    }
  }
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

fastify.get("/register", async (request, reply) => {
  const currentUserId = request.session.get("data");
  if (currentUserId && !String(currentUserId).includes("__totp")) {
    return reply.redirect("/");
  }
  return reply.redirect("/login#signup");
});

fastify.post("/register", async (req, reply) => {
  const currentUserId = req.session.get("data");
  if (currentUserId && !String(currentUserId).includes("__totp")) {
    return reply.redirect("/");
  }
  const { username, email, password, passwordVerif, acceptTerms } =
    req.body as {
      username: string;
      email: string;
      password: string;
      passwordVerif: string;
      acceptTerms?: string | boolean;
    };
  const rawUsername = (username || "").trim();
  const rawEmail = (email || "").trim();
  const rawPassword = password || "";
  const rawPasswordVerif = passwordVerif || "";

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
          connectOrCreate: {
            where: { name: "USER" },
            create: { id: "USER", name: "USER" },
          },
        },
      },
    });
    try {
      await prisma.cosmetic.create({ data: { userId: user.id } });
    } catch (e) {
      req.log?.warn({ e }, "create default cosmetic failed");
    }
    try {
      const createdPlinkk = await createPlinkkForUser(prisma, user.id, {
        name: username,
        slugBase: username,
        visibility: "PUBLIC",
        isActive: true,
      });
      try {
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
      req.log?.warn({ e }, "auto-create default plinkk failed");
    }
    const returnTo =
      (req.body as { returnTo: string })?.returnTo ||
      (req.query as { returnTo: string })?.returnTo;
    req.log?.info({ returnTo }, "register: returnTo read from request");
    req.session.set("data", user.id);
    req.log?.info(
      { sessionData: req.session.get("data"), cookies: req.headers.cookie },
      "session set after register"
    );
    return reply.redirect(returnTo || "/");
  } catch (error) {
    console.error(error);
    reply.redirect(
      "/login?error=" + encodeURIComponent("Utilisateur deja existant")
    );
  }
});

fastify.post("/login", async (request, reply) => {
  const currentUserId = request.session.get("data");
  if (currentUserId && !String(currentUserId).includes("__totp")) {
    return reply.redirect("/");
  }
  const { email, password } = request.body as {
    email?: string;
    password: string;
  };
  const identifierRaw = (email || "").trim();
  const identifier = identifierRaw;
  const isEmail = identifier.includes("@");

  if (isEmail) {
    try {
      z.email().parse(identifier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.redirect(
          `/login?error=${encodeURIComponent(
            "Email invalide"
          )}&email=${encodeURIComponent(identifier)}`
        );
      }
    }
  }
  let user: any = null;
  if (isEmail) {
    user = await prisma.user.findFirst({
      where: { email: identifier },
      include: { role: true },
    });
  } else {
    const withoutAt = identifier.startsWith("@")
      ? identifier.slice(1)
      : identifier;
    const candidateId = slugify(withoutAt);
    user = await prisma.user.findFirst({
      where: {
        OR: [{ id: candidateId }, { userName: identifier }],
      },
      include: { role: true },
    });
  }

  if (!user)
    return reply.redirect(
      `/login?error=${encodeURIComponent(
        "Utilisateur introuvable"
      )}&email=${encodeURIComponent(identifier)}`
    );
  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return reply.redirect(
      `/login?error=${encodeURIComponent(
        "Mot de passe incorrect"
      )}&email=${encodeURIComponent(identifier)}`
    );

  try {
    const ban = await prisma.bannedEmail.findFirst({
      where: { email: user.email, revoquedAt: null },
    });
    if (ban) {
      const isActive =
        ban.time == null ||
        ban.time < 0 ||
        new Date(ban.createdAt).getTime() + ban.time * 60000 > Date.now();
      if (isActive) {
        const msg = `Votre compte a été banni pour la raison suivante: ${
          ban.reason || "Violation des règles"
        }. Veuillez contacter l'administration pour plus de détails à contact@plinkk.fr`;
        return reply.redirect(
          `/login?error=${encodeURIComponent(msg)}&email=${encodeURIComponent(
            identifier
          )}`
        );
      }
    }
  } catch (e) {}

  if (user.twoFactorEnabled) {
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
    where: { id: user.id },
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
  reply.redirect(returnToLogin || "/");
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
    return reply.redirect(returnToTotp || "/");
  }
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

fastify.get(
  "/themes.json",
  { config: { rateLimit: false } },
  async function (request, reply) {
    const { userId } = request.query as { userId: string };

    // Return built-ins first, then community and mine
    return reply.send(await generateTheme(userId));
  }
);

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

fastify.setNotFoundHandler((request, reply) => {
  if (request.raw.url?.startsWith("/api")) {
    return reply.code(404).send({ error: "Not Found" });
  }
  const userId = request.session.get("data");
  return reply
    .code(404)
    .view("erreurs/404.ejs", { currentUser: userId ? { id: userId } : null });
});

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
