import { FastifyInstance } from "fastify";

const RESERVED_ROOTS = new Set([
  "favicon.ico",
  "robots.txt",
  "manifest.json",
  "public",
  "users",
  "terms",
  "privacy"
]);

export function registerReservedRootsHook(fastify: FastifyInstance) {
  fastify.addHook("onRequest", async (request, reply) => {
    const url = request.url;
    if (url in RESERVED_ROOTS) {
      reply.redirect(process.env.FRONTEND_URL + url);
    }
  });
}
