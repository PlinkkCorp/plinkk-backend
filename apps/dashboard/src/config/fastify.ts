import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import fastifyMultipart from "@fastify/multipart";
import fastifyCors from "@fastify/cors";
import fastifySecureSession from "@fastify/secure-session";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCompress from "@fastify/compress";
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

  await fastify.register(fastifyView, {
    engine: { ejs },
    root: path.join(__dirname, "..", "views"),
  });

  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, "..", "public"),
    prefix: "/public/",
  });

  await fastify.register(fastifyFormbody);

  await fastify.register(fastifyMultipart, {
    limits: { fileSize: 2 * 1024 * 1024 },
    attachFieldsToBody: false
  });

  await fastify.register(fastifyCookie);

  await fastify.register(fastifySecureSession, {
    sessionName: "session",
    cookieName: "plinkk-backend",
    key: readFileSync(path.join(__dirname, "..", "secret-key")),
    expiry: 24 * 60 * 60,
    cookie: { path: "/" },
  });

  await fastify.register(fastifyCors, { origin: true });
}
