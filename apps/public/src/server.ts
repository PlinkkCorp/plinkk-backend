import "dotenv/config";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import Fastify, { FastifyError, FastifyRequest } from "fastify";
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
import { prisma, Prisma } from "@plinkk/prisma";

import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import fastifyMultipart from "@fastify/multipart";
import fastifyCors from "@fastify/cors";
import fastifySecureSession from "@fastify/secure-session";
import { redirectRoutes } from "./server/redirectRoutes";
import { staticPagesRoutes } from "./server/staticPagesRoutes";
import { plinkkFrontUserRoutes } from "./server/plinkkFrontUserRoutes";
import { partnersRoutes } from "./server/partnersRoutes";
import { patchNotesRoutes } from "./server/patchNotesRoutes";
import { trackingRoutes } from "./server/trackingRoutes";
import { indexRoutes } from "./server/indexRoutes";
import { replyView } from "./lib/replyView";
import { getCurrentUser } from "./lib/auth";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCompress from "@fastify/compress";
import fastifyHttpProxy from "@fastify/http-proxy";
import { AppError } from "@plinkk/shared";
import { apiBugReportsRoutes } from "@plinkk/shared";
import fastifyHelmet from "@fastify/helmet";
import crypto from "crypto";
import Redis from "ioredis";

const fastify = Fastify({
  logger: true,
  trustProxy: true,
});

const isProduction = process.env.FRONTEND_URL?.includes("plinkk.fr") ?? false;

fastify.register(fastifyHelmet, {
  // Disable helmet's CSP handling — we'll set a per-request CSP header below
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  xFrameOptions: false,
  hsts: (isProduction) ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
});

// Generate a per-request nonce and set a CSP header that includes it.
fastify.addHook('onRequest', async (request, reply) => {
  try {
    const nonce = crypto.randomBytes(16).toString('base64');
    (request as any).cspNonce = nonce;
    if (!(reply as any).locals) (reply as any).locals = {};
    (reply as any).locals.cspNonce = nonce;
  } catch (err) {
    const fallback = 'fallback';
    (request as any).cspNonce = fallback;
    if (!(reply as any).locals) (reply as any).locals = {};
    (reply as any).locals.cspNonce = fallback;
  }
});

fastify.addHook('onSend', async (request, reply, payload) => {
  const nonce = (request as FastifyRequest & { cspNonce?: string }).cspNonce || '';
  // Build CSP header string (keep same sources as before, add nonce and hashes)
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://accounts.google.com",
    "https://cdn.tailwindcss.com",
    "https://cdn.jsdelivr.net",
    "https://cdn.plinkk.fr",
    "https://cdn.jsdelivr.net/npm",
    "https://cdnjs.cloudflare.com",
    "https://unpkg.com",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "'sha256-VDHJYfrC5LSSrjtGlBejsdD/ny3ifzXqnwtQqrNSD8I='",
    nonce ? `'nonce-${nonce}'` : null,
  ].filter(Boolean).join(' ');

  const styleSrc = "'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://unpkg.com";
  const fontSrc = "'self' https://cdn.jsdelivr.net https://fonts.gstatic.com";
  const connectSrc = "'self' https://unpkg.com";
  const frameSrc = "*";
  const frameAncestors = "*";
  const imgSrc = "'self' data: https://cdn.plinkk.fr https://cdn.jsdelivr.net https://lh3.googleusercontent.com https://s3.marvideo.fr https://unpkg.com https://cdn.discordapp.com https://www.vistemo.xyz http://127.0.0.1:3001 http://127.0.0.1:3002";

  const csp = `default-src 'self'; script-src ${scriptSrc}; script-src-attr 'unsafe-inline'; style-src ${styleSrc}; font-src ${fontSrc}; connect-src ${connectSrc}; frame-src ${frameSrc}; frame-ancestors ${frameAncestors}; img-src ${imgSrc}; object-src 'none';`;

  reply.header('Content-Security-Policy', csp);
  return payload;
});
const PORT = Number(process.env.PORT) || 3002;

const redisUrl = process.env.REDIS_URL;
const rateLimitOptions: any = {
  max: 500,
  timeWindow: "2 minutes",
};

if (redisUrl) {
  const redis = new Redis(redisUrl);
  rateLimitOptions.redis = redis;
}

fastify.register(fastifyRateLimit, rateLimitOptions);

fastify.register(fastifyCompress);

// Proxy vers analytics retiré (Umami/analytics supprimés)

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
  root: path.join(__dirname, "..", "public"),
  prefix: "/public/",
});

fastify.register(fastifyFormbody);

fastify.register(fastifyMultipart, {
  limits: { fileSize: 2 * 1024 * 1024 },
  attachFieldsToBody: false,
});

fastify.register(fastifyCookie);

// Configuration adaptée à l'environnement
// En production, partager les cookies entre dash.plinkk.fr et plinkk.fr
const cookieConfig = isProduction
  ? {
      path: "/",
      domain: ".plinkk.fr",
      secure: true,
      httpOnly: true,
      sameSite: "lax" as const,
    }
  : {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "lax" as const,
    };

let sessionKeyEnv = process.env.SESSION_SECRET_KEY;
if (!sessionKeyEnv || sessionKeyEnv.length < 32) {
  fastify.log.warn(`SESSION_SECRET_KEY is ${!sessionKeyEnv ? 'missing' : 'too short (' + sessionKeyEnv.length + ' chars)'}. Using fallback 32-byte key.`);
  sessionKeyEnv = (sessionKeyEnv || "a").padEnd(32, "a").slice(0, 32);
}
const sessionKey = Buffer.from(sessionKeyEnv);

fastify.register(fastifySecureSession, {
  sessionName: "session",
  cookieName: "plinkk-backend",
  key: sessionKey,
  expiry: 24 * 60 * 60,
  cookie: cookieConfig,
});

const corsConfig = isProduction
  ? {
      origin: ["https://dash.plinkk.fr", "https://plinkk.fr"],
      credentials: true,
    }
  : {
      origin: true, // Permet toutes les origines en dev
      credentials: true,
    };

fastify.register(fastifyCors, corsConfig);

import onRequestHook from "./hooks/onRequestHook";

fastify.addHook("onRequest", onRequestHook);

redirectRoutes(fastify);
staticPagesRoutes(fastify);
plinkkFrontUserRoutes(fastify);
partnersRoutes(fastify);
patchNotesRoutes(fastify);
trackingRoutes(fastify);
indexRoutes(fastify);

fastify.register(apiBugReportsRoutes, { prefix: "/api/me/bug-reports" });

fastify.setNotFoundHandler(async (request, reply) => {
  if (request.raw.url?.startsWith("/api")) {
    return reply.code(404).send({ error: "Not Found" });
  }
  const user = await getCurrentUser(request);
  return await replyView(reply, "erreurs/404.ejs", user, {}, 404);
});

fastify.addHook('onSend', async (request, reply, payload) => {
  if (request.raw.url?.startsWith("/api")) return payload;

  const statusCode = reply.statusCode;
  if ([401, 403, 410, 429, 503, 504].includes(statusCode)) {
    const contentType = reply.getHeader('content-type');
    if (contentType && typeof contentType === 'string' && contentType.includes('application/json')) {
      // Remplacer par la vue d'erreur
      const user = await getCurrentUser(request);

      const html = await replyView(reply, `erreurs/${statusCode}.ejs`, user, {}, statusCode);
      reply.header('content-type', 'text/html');
      return html;
    }
  }
  return payload;
});

fastify.setErrorHandler(async (error, request, reply) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  request.log.error(
    {
      err: error,
      method: request.method,
      url: request.url,
      statusCode,
    },
    "Request failed"
  );

  if (error instanceof AppError) {
    if (request.raw.url?.startsWith("/api")) {
      return reply.code(error.statusCode).send({
        error: error.code.toLowerCase(),
        message: error.message
      });
    }
    const user = await getCurrentUser(request);

    const template = error.statusCode === 404 ? "erreurs/404.ejs" : "erreurs/500.ejs";
    return await replyView(reply, template, user, {
      message: error.message,
    }, error.statusCode);
  }

  if (request.raw.url?.startsWith("/api")) {
    return reply.code(500).send({ error: "internal_server_error" });
  }
  const user = await getCurrentUser(request);

  return await replyView(reply, "erreurs/500.ejs", user, {
    message: error && typeof error === 'object' && 'message' in error ? (error).message ?? "" : "",
  }, 500);
});

fastify.listen({ port: PORT, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.info(`Server is now listening on ${address}`);
});
