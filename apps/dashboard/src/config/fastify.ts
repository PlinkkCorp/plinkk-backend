/**
 * Configuration Fastify
 * - registerPlugins
 */

import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import fastifyMultipart from "@fastify/multipart";
import fastifyCors from "@fastify/cors";
import fastifySecureSession from "@fastify/secure-session";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCompress from "@fastify/compress";
import fastifyOAuth2 from "@fastify/oauth2";
import { FastifyInstance } from "fastify";
import path from "path";
import ejs from "ejs";
import { fastifyWebsocket } from "@fastify/websocket";
import Redis from "ioredis";

/**
 * Registers the plugins for the fastify instance
 * @param fastify The fastify instance
 */
export async function registerPlugins(fastify: FastifyInstance) {
  const redisUrl = process.env.REDIS_URL;
  const rateLimitOptions: any = {
    max: 500,
    timeWindow: "2 minutes",
  };

  if (redisUrl) {
    const redis = new Redis(redisUrl);
    rateLimitOptions.redis = redis;
    fastify.log.info("Redis rate limit store initialized");
  } else {
    fastify.log.warn("Redis not configured, using in-memory rate limit store");
  }

  await fastify.register(fastifyRateLimit, rateLimitOptions);

  await fastify.register(fastifyCompress);

  const sharedViewsRoot = path.join(__dirname, "..", "..", "..", "..", "packages", "shared", "views");
  await fastify.register(fastifyView, {
    engine: { ejs },
    root: path.join(__dirname, "..", "views"),
    options: {
      views: [
        path.join(__dirname, "..", "views"),
        sharedViewsRoot,
      ],
    },
  });

  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, "..", "public"),
    prefix: "/public/",
  });

  await fastify.register(fastifyFormbody);

  await fastify.register(fastifyMultipart, {
    limits: { fileSize: 2 * 1024 * 1024 },
    attachFieldsToBody: false,
  });

  await fastify.register(fastifyCookie);

  // Configuration adaptée à l'environnement
  // En production, partager les cookies entre dash.plinkk.fr et plinkk.fr
  const isProduction = process.env.DASHBOARD_URL?.includes("plinkk.fr") ?? false;
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
      };

  let sessionKeyEnv = process.env.SESSION_SECRET_KEY;
  if (!sessionKeyEnv || sessionKeyEnv.length < 32) {
    fastify.log.warn(`SESSION_SECRET_KEY is ${!sessionKeyEnv ? 'missing' : 'too short (' + sessionKeyEnv.length + ' chars)'}. Using fallback 32-byte key.`);
    sessionKeyEnv = (sessionKeyEnv || "a").padEnd(32, "a").slice(0, 32);
  }
  const sessionKey = Buffer.from(sessionKeyEnv);

  await fastify.register(fastifySecureSession, {
    sessionName: "session",
    cookieName: "plinkk-backend",
    key: sessionKey,
    expiry: 24 * 60 * 60,
    cookie: cookieConfig,
  });

  await fastify.register(fastifyOAuth2, {
    name: "githubOAuth2",
    scope: ["user:email", "read:user"],
    credentials: {
      client: {
        id: process.env.GITHUB_OAUTH2_ID,
        secret: process.env.GITHUB_OAUTH2_SECRET,
      },
      auth: fastifyOAuth2.GITHUB_CONFIGURATION,
    },
    startRedirectPath: "/login/github",
    callbackUri: (req) =>
      `https://dash.plinkk.fr/login/github/callback`,
  });

  await fastify.register(fastifyOAuth2, {
    name: "discordOAuth2",
    scope: ["identify", "email"],
    credentials: {
      client: {
        id: process.env.DISCORD_OAUTH2_ID,
        secret: process.env.DISCORD_OAUTH2_SECRET,
      },
      auth: fastifyOAuth2.DISCORD_CONFIGURATION,
    },
    startRedirectPath: "/login/discord",
    callbackUri: (req) =>
      `https://dash.plinkk.fr/login/discord/callback`,
  });

  const corsConfig = isProduction
    ? {
        origin: ["https://dash.plinkk.fr", "https://plinkk.fr"],
        credentials: true,
      }
    : {
        origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
        credentials: true,
      };

  await fastify.register(fastifyCors, corsConfig);

  await fastify.register(fastifyWebsocket);
}
