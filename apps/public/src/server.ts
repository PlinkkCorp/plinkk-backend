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

// Prisma client
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
import { RESERVED_SLUGS } from "@plinkk/shared";

const fastify = Fastify({
  logger: true,
  trustProxy: true,
});
const PORT = 3002;

fastify.register(fastifyRateLimit, {
  max: 500,
  timeWindow: "2 minutes",
});

fastify.register(fastifyCompress);

// Register proxy BEFORE body-parsers to avoid body consumption
fastify.register(fastifyHttpProxy, {
  upstream: "https://analytics.plinkk.fr/",
  prefix: "/umami_script.js",
  rewritePrefix: "/script.js",
  replyOptions: {
    rewriteRequestHeaders: (req, headers) => {
      return {
        ...headers,
        host: "analytics.plinkk.fr",
        "x-forwarded-for": req.ip || (headers["x-forwarded-for"] as string),
        "x-real-ip": req.ip || (headers["x-real-ip"] as string),
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
        "x-forwarded-for": req.ip || (headers["x-forwarded-for"] as string),
        "x-real-ip": req.ip || (headers["x-real-ip"] as string),
        "user-agent": headers["user-agent"] || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        referer: "https://plinkk.fr/",
        origin: "https://plinkk.fr",
      };
    },
  },
});

const sharedViewsRoot = path.join(__dirname, "..", "..", "..", "packages", "shared", "views");
fastify.register(fastifyView, {
  engine: { ejs },
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
  limits: { fileSize: 2 * 1024 * 1024 },
  attachFieldsToBody: false,
});

fastify.register(fastifyCookie);

fastify.register(fastifySecureSession, {
  sessionName: "session",
  cookieName: "plinkk-backend",
  key: readFileSync(path.join(__dirname, "secret-key")),
  expiry: 24 * 60 * 60,
  cookie: { path: "/" },
});

fastify.register(fastifyCors, { origin: true });

import onRequestHook from "./hooks/onRequestHook";

fastify.addHook("onRequest", onRequestHook);

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
  if (host !== "plinkk.fr" && host !== "127.0.0.1:3002") {
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
