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
import { replyView } from "./lib/replyView";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCompress from "@fastify/compress";
import fastifyHttpProxy from "@fastify/http-proxy";
import { AppError } from "@plinkk/shared";
import { apiBugReportsRoutes } from "@plinkk/shared";
import fastifyHelmet from "@fastify/helmet";
import crypto from "crypto";

const fastify = Fastify({
  logger: true,
  trustProxy: true,
});

fastify.register(fastifyHelmet, {
  // Disable helmet's CSP handling — we'll set a per-request CSP header below
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
});

// Generate a per-request nonce and set a CSP header that includes it.
fastify.addHook('onRequest', async (request, reply) => {
  try {
    const nonce = crypto.randomBytes(16).toString('base64');
    (request as any).cspNonce = nonce;
  } catch (err) {
    (request as any).cspNonce = '';
  }
});

fastify.addHook('onSend', async (request, reply, payload) => {
  const nonce = (request as any).cspNonce || '';
  // Build CSP header string (keep same sources as before, add nonce and hashes)
  const scriptSrc = [
    "'self'",
    "https://accounts.google.com",
    "https://cdn.tailwindcss.com",
    "https://cdn.jsdelivr.net",
    "https://cdn.plinkk.fr",
    "https://cdn.jsdelivr.net/npm",
    "https://cdnjs.cloudflare.com",
    "https://unpkg.com",
    nonce ? `'nonce-${nonce}'` : null,
  ].filter(Boolean).join(' ');

  const styleSrc = "'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://unpkg.com";
  const fontSrc = "'self' https://cdn.jsdelivr.net https://fonts.gstatic.com";
  const connectSrc = "'self' https://unpkg.com";
  const frameSrc = "'self' https://accounts.google.com";
  const frameAncestors = "'self' https://plinkk.fr https://dash.plinkk.fr";
  const imgSrc = "'self' data: https://cdn.plinkk.fr https://cdn.jsdelivr.net https://lh3.googleusercontent.com https://s3.marvideo.fr https://unpkg.com";

  const csp = `default-src 'self'; script-src ${scriptSrc}; style-src ${styleSrc}; font-src ${fontSrc}; connect-src ${connectSrc}; frame-src ${frameSrc}; frame-ancestors ${frameAncestors}; img-src ${imgSrc}; object-src 'none';`;

  reply.header('Content-Security-Policy', csp);
});
const PORT = Number(process.env.PORT) || 3002;

type PublicMetrics = {
  userCount: number;
  linkCount: number;
  totalViews: number;
};

const METRICS_TTL_MS = 60_000;
const METRICS_QUERY_TIMEOUT_MS = 2_000;
let publicMetricsCache: { value: PublicMetrics; expiresAt: number } | null = null;
let publicMetricsRefreshPromise: Promise<PublicMetrics> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}_timeout`)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function getPublicMetrics(request: any): Promise<PublicMetrics> {
  const now = Date.now();
  if (publicMetricsCache && publicMetricsCache.expiresAt > now) {
    return publicMetricsCache.value;
  }

  if (publicMetricsRefreshPromise) {
    return publicMetricsRefreshPromise;
  }

  const fallback: PublicMetrics = publicMetricsCache?.value ?? {
    userCount: 0,
    linkCount: 0,
    totalViews: 0,
  };

  publicMetricsRefreshPromise = (async () => {
    const [usersRes, linksRes, viewsRes] = await Promise.allSettled([
      withTimeout(prisma.user.count(), METRICS_QUERY_TIMEOUT_MS, "user_count"),
      withTimeout(prisma.link.count(), METRICS_QUERY_TIMEOUT_MS, "link_count"),
      withTimeout(
        prisma.plinkk.aggregate({
          _sum: { views: true },
        }),
        METRICS_QUERY_TIMEOUT_MS,
        "plinkk_views_sum"
      ),
    ]);

    if (usersRes.status === "rejected") {
      request.log.warn({ err: usersRes.reason }, "public metrics: user.count failed");
    }
    if (linksRes.status === "rejected") {
      request.log.warn({ err: linksRes.reason }, "public metrics: link.count failed");
    }
    if (viewsRes.status === "rejected") {
      request.log.warn({ err: viewsRes.reason }, "public metrics: plinkk.aggregate failed");
    }

    const next: PublicMetrics = {
      userCount: usersRes.status === "fulfilled" ? usersRes.value : fallback.userCount,
      linkCount: linksRes.status === "fulfilled" ? linksRes.value : fallback.linkCount,
      totalViews:
        viewsRes.status === "fulfilled"
          ? viewsRes.value._sum.views || 0
          : fallback.totalViews,
    };

    publicMetricsCache = {
      value: next,
      expiresAt: Date.now() + METRICS_TTL_MS,
    };

    return next;
  })()
    .catch((err) => {
      request.log.warn({ err }, "public metrics: fallback used after refresh failure");
      return fallback;
    })
    .finally(() => {
      publicMetricsRefreshPromise = null;
    });

  return publicMetricsRefreshPromise;
}

fastify.register(fastifyRateLimit, {
  max: 500,
  timeWindow: "2 minutes",
});

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
  root: path.join(__dirname, "public"),
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
const isProduction = process.env.FRONTEND_URL?.includes("plinkk.fr") ?? false;
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

fastify.register(fastifySecureSession, {
  sessionName: "session",
  cookieName: "plinkk-backend",
  key: readFileSync(path.join(__dirname, "secret-key")),
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

fastify.register(apiBugReportsRoutes, { prefix: "/api/me/bug-reports" });

// ─── Funnel Event Tracking ──────────────────────────────────────────────────
const ALLOWED_EVENTS = ['landing_visit', 'signup', 'premium_view', 'config_view', 'purchase', 'cancel'];

fastify.post("/api/track", async (request, reply) => {
  const body = request.body as { event?: string; meta?: Record<string, unknown> } | undefined;
  const event = body?.event;
  if (!event || !ALLOWED_EVENTS.includes(event)) {
    return reply.code(400).send({ error: "invalid_event" });
  }

  // Session-based fingerprint
  const sessionData = request.session.get("data");
  const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

  // Generate or reuse a tracking session ID via cookie
  let trackingId = (request.cookies as Record<string, string>)?.["plinkk_tid"];
  if (!trackingId) {
    trackingId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    reply.setCookie("plinkk_tid", trackingId, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  try {
    await prisma.funnelEvent.create({
      data: {
        event,
        sessionId: trackingId,
        userId: userId || null,
        ip: request.ip,
        userAgent: request.headers["user-agent"] || null,
        referrer: request.headers.referer || null,
        meta: (body?.meta as Prisma.InputJsonObject) || null,
      },
    });
  } catch (e) {
    // Silently fail — tracking should never break the page
    request.log.error(e, "Failed to save funnel event");
  }

  return reply.send({ ok: true });
});

fastify.get("/", async function (request, reply) {
  const sessionData = request.session.get("data");
  const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: true },
    })
    : null;

  const { userCount, linkCount, totalViews } = await getPublicMetrics(request);

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
  const [plinkks, bannedEmailRows] = await Promise.all([
    prisma.plinkk.findMany({
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
    }),
    prisma.bannedEmail.findMany({
      where: { revoquedAt: null },
      select: { email: true, reason: true, time: true, createdAt: true },
    }),
  ]);
  // Build a map of banned emails -> ban info (only currently active bans)
  const bannedEmailsMap = new Map<string, { reason: string; until: string | null }>();
  for (const ban of bannedEmailRows) {
    const isActive =
      ban.time == null ||
      ban.time < 0 ||
      new Date(ban.createdAt).getTime() + ban.time * 60000 > Date.now();
    if (isActive) {
      const until =
        typeof ban.time === "number" && ban.time > 0
          ? new Date(new Date(ban.createdAt).getTime() + ban.time * 60000).toISOString()
          : null;
      bannedEmailsMap.set(ban.email, { reason: ban.reason, until });
    }
  }
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
    bannedEmails: Object.fromEntries(bannedEmailsMap),
  });
});

fastify.get("/patchnotes", async (request, reply) => {
  const sessionData = request.session.get("data");
  const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: true },
    })
    : null;

  const patchNotes = await prisma.patchNote.findMany({
    where: { isPublished: true },
    include: { createdBy: { select: { id: true, name: true, image: true } } },
    orderBy: { publishedAt: "desc" },
  });

  return await replyView(reply, "patch-notes/patch-notes.ejs", currentUser, {
    patchNotes: patchNotes,
  });
});

fastify.get("/*", async (request, reply) => {
  const url = request.raw.url || "";
  if (
    url.startsWith("/api") ||
    url.startsWith("/public") ||
    url.startsWith("/dashboard")
  ) {
    return reply.callNotFound();
  }
  const host = request.headers.host || "";
  const allowedHosts = new Set([
    "plinkk.fr",
    "127.0.0.1:3002",
    "localhost:3002",
    "127.0.0.1",
    "localhost"
  ]);
  if (!allowedHosts.has(host)) {
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

fastify.setNotFoundHandler(async (request, reply) => {
  if (request.raw.url?.startsWith("/api")) {
    return reply.code(404).send({ error: "Not Found" });
  }
  const sessionData = request.session.get("data");
  const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

  const user = userId ? await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  }) : null;

  return reply.code(404).view("erreurs/404.ejs", {
    user: user,
    currentUser: user,
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
      const user = userId ? await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true }
      }) : null;

      const viewData = {
        user: user,
        currentUser: user,
        dashboardUrl: process.env.DASHBOARD_URL,
      };
      const html = await fastify.view(`erreurs/${statusCode}.ejs`, viewData);
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
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    const user = userId ? await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    }) : null;

    const template = error.statusCode === 404 ? "erreurs/404.ejs" : "erreurs/500.ejs";
    return reply.code(error.statusCode).view(template, {
      message: error.message,
      user: user,
      currentUser: user,
      dashboardUrl: process.env.DASHBOARD_URL,
    });
  }

  if (request.raw.url?.startsWith("/api")) {
    return reply.code(500).send({ error: "internal_server_error" });
  }
  const sessionData = request.session.get("data");
  const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
  const user = userId ? await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  }) : null;

  return reply.code(500).view("erreurs/500.ejs", {
    message: error && typeof error === 'object' && 'message' in error ? (error).message ?? "" : "",
    user: user,
    currentUser: user,
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
