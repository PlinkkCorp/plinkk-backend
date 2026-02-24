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

    // Support stripping redundant /dashboard/ prefix
    if (url.startsWith("/dashboard/")) {
      return reply.redirect(url.replace("/dashboard/", "/"));
    }
    if (url === "/dashboard") {
      return reply.redirect("/");
    }

    if (url in RESERVED_ROOTS) {
      return reply.redirect(process.env.FRONTEND_URL + url);
    }
  });
}
