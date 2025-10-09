import { FastifyInstance } from "fastify";
import { PrismaClient } from "../../generated/prisma/client";

const prisma = new PrismaClient();

export function staticPagesRoutes(fastify: FastifyInstance) {
  // Pages statiques utiles
  fastify.get("/about", async (request, reply) => {
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
          },
        })
      : null;
    return reply.view("about/about.ejs", { currentUser });
  });
  fastify.get("/privacy", async (request, reply) => {
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
          },
        })
      : null;
    return reply.view("about/privacy.ejs", { currentUser });
  });
  fastify.get("/terms", async (request, reply) => {
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
          },
        })
      : null;
    return reply.view("about/terms.ejs", { currentUser });
  });
  fastify.get("/cookies", async (request, reply) => {
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
          },
        })
      : null;
    return reply.view("about/cookies.ejs", { currentUser });
  });
  fastify.get("/legal", async (request, reply) => {
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
          },
        })
      : null;
    return reply.view("about/legal.ejs", { currentUser });
  });

  // robots.txt
  fastify.get("/robots.txt", async (request, reply) => {
    const host =
      (request.headers["x-forwarded-host"] as string) ||
      (request.headers.host as string) ||
      "0.0.0.0:3001";
    const proto = (
      (request.headers["x-forwarded-proto"] as string) ||
      (request.protocol as string) ||
      "http"
    ).split(",")[0];
    const base = `${proto}://${host}`;
    reply
      .type("text/plain")
      .send(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
  });

  // sitemap.xml
  fastify.get("/sitemap.xml", async (request, reply) => {
    const host =
      (request.headers["x-forwarded-host"] as string) ||
      (request.headers.host as string) ||
      "0.0.0.0:3001";
    const proto = (
      (request.headers["x-forwarded-proto"] as string) ||
      (request.protocol as string) ||
      "http"
    ).split(",")[0];
    const base = `${proto}://${host}`;
    const staticUrls = [
      "",
      "about",
      "contact",
      "privacy",
      "terms",
      "cookies",
      "legal",
      "users",
      "dashboard",
    ].map((p) => (p ? `${base}/${p}` : `${base}/`));
    const users = await prisma.user.findMany({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    const userUrls = users.map((u) => `${base}/${encodeURIComponent(u.id)}`);
    const urls = [...staticUrls, ...userUrls];
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
      urls.map((loc) => `\n  <url><loc>${loc}</loc></url>`).join("") +
      "\n</urlset>\n";
    reply.type("application/xml").send(xml);
  });
}
