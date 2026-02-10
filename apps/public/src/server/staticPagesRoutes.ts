import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../lib/replyView";

const STATIC_PAGES = [
  { path: "/about", template: "about/about.ejs" },
  { path: "/privacy", template: "about/privacy.ejs" },
  { path: "/terms", template: "about/terms.ejs" },
  { path: "/cgv", template: "about/cgv.ejs" },
  { path: "/cookies", template: "about/cookies.ejs" },
  { path: "/legal", template: "about/legal.ejs" },
  { path: "/docs", template: "docs.ejs" },
  { path: "/pricing", template: "pricing.ejs" },
];

async function getCurrentUser(request: FastifyRequest) {
  const userId = request.session.get("data");
  return userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
}

function getBaseUrl(request: FastifyRequest): string {
  const host =
    (request.headers["x-forwarded-host"] as string) ||
    (request.headers.host as string) ||
    "0.0.0.0:3001";
  const proto = (
    (request.headers["x-forwarded-proto"] as string) ||
    (request.protocol as string) ||
    "http"
  ).split(",")[0];
  return `${proto}://${host}`;
}

const BLOCKED_BOTS = [
  "Baiduspider", "360Spider", "Sogouspider", "Yisouspider", "PetalBot",
  "Bytespider", "GPTBot", "OAI-SearchBot", "anthropic-ai", "ClaudeBot",
  "PerplexityBot", "Google-Extended", "Applebot-Extended", "meta-externalagent",
  "DuckAssistBot", "ChatGPT-User", "Gemini-Deep-Research", "GoogleAgent-Mariner",
  "Google-NotebookLM", "CCBot", "Claude-User", "Claude-SearchBot",
  "Perplexity-User", "AI2Bot", "MistralAI-User",
];

const SITEMAP_STATIC_PATHS = [
  "", "about", "contact", "privacy", "terms", "cgv", "cookies", "legal", "users", "dashboard", "docs", "pricing",
];

export function staticPagesRoutes(fastify: FastifyInstance) {
  for (const page of STATIC_PAGES) {
    fastify.get(page.path, async (request, reply) => {
      const currentUser = await getCurrentUser(request);
      return replyView(reply, page.template, currentUser, {});
    });
  }

  fastify.get("/docs/", async (request, reply) => {
    return reply.code(301).redirect("/docs");
  });

  fastify.get("/robots.txt", async (request, reply) => {
    const base = getBaseUrl(request);
    const botRules = BLOCKED_BOTS.map((bot) => `User-agent: ${bot}`).join("\n");
    const txt = `${botRules}
Disallow: /

User-agent: *
Allow: /
Sitemap: ${base}/sitemap.xml
`;
    reply.type("text/plain").send(txt);
  });

  fastify.get("/sitemap.xml", async (request, reply) => {
    const base = getBaseUrl(request);
    const staticUrls = SITEMAP_STATIC_PATHS.map((p) => (p ? `${base}/${p}` : `${base}/`));
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
