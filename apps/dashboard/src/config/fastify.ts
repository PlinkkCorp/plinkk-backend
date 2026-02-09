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
import { readFileSync } from "fs";

export async function registerPlugins(fastify: FastifyInstance) {
  await fastify.register(fastifyRateLimit, {
    max: 500,
    timeWindow: "2 minutes",
  });

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

  await fastify.register(fastifySecureSession, {
    sessionName: "session",
    cookieName: "plinkk-backend",
    key: readFileSync(path.join(__dirname, "..", "secret-key")),
    expiry: 24 * 60 * 60,
    cookie: { path: "/" },
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

  await fastify.register(fastifyCors, { origin: true });
}
