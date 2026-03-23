import "dotenv/config";
import Fastify from "fastify";
import { prisma } from "@plinkk/prisma";
import { registerPlugins } from "./config/fastify";
import { registerCronJobs } from "./config/cron";
import "./types";
import { registerReservedRootsHook } from "./middleware/reservedRoots";
import { registerSessionValidator } from "./middleware/sessionValidator";
import { registerActionAuditHook } from "./middleware/actionAudit";
import { apiRoutes } from "./server/apiRoutes";
import { dashboardRoutes } from "./server/dashboardRoutes";
import { plinkkPagesRoutes } from "./server/plinkkPagesRoutes";
import { linkTrackingRoutes } from "./server/linkTrackingRoutes";
import { authRoutes } from "./routes/auth";
import { onboardingRoutes } from "./routes/onboarding";
import { registerOAuth2 } from "./config/fastifyOAuth2";
import { discordService } from "./services/discordService";
import { AppError, generateTheme } from "@plinkk/shared";
import fastifyHelmet from "@fastify/helmet";
import crypto from "crypto";
import { replyView } from "./lib/replyView";

const fastify = Fastify({ logger: true, trustProxy: true });

const isProduction = process.env.FRONTEND_URL?.includes("plinkk.fr") ?? false;

fastify.register(fastifyHelmet, {
  // Disable helmet's CSP handling — we'll set a per-request CSP header below
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  xFrameOptions: false,
  hsts: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
});

// Generate a per-request nonce and set a CSP header that includes it.
fastify.addHook("onRequest", async (request, reply) => {
  try {
    const nonce = crypto.randomBytes(16).toString("base64");
    (request as any).cspNonce = nonce;
  } catch (err) {
    // If crypto fails (very unlikely), use a fixed fallback to avoid breaking templates that expect a nonce.
    (request as any).cspNonce = "fallback";
  }
});

fastify.addHook("onSend", async (request, reply, payload) => {
  if (reply.raw.headersSent || (reply as any).sent) {
    return payload;
  }

  const nonce =
    (request as any).cspNonce || crypto.randomBytes(16).toString("base64");
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
    nonce ? `'nonce-${nonce}'` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const styleSrc =
    "'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://unpkg.com";
  const fontSrc = "'self' https://cdn.jsdelivr.net https://fonts.gstatic.com";
  const connectSrc = "'self' https://unpkg.com";
  const frameSrc = "*";
  const frameAncestors = "*";
  const imgSrc =
    "'self' data: https://cdn.plinkk.fr https://cdn.jsdelivr.net https://lh3.googleusercontent.com https://s3.marvideo.fr https://unpkg.com https://cdn.discordapp.com https://www.vistemo.xyz http://127.0.0.1:3001 http://127.0.0.1:3002";

  const csp = `default-src 'self'; script-src ${scriptSrc}; script-src-attr 'unsafe-inline'; style-src ${styleSrc}; font-src ${fontSrc}; connect-src ${connectSrc}; frame-src ${frameSrc}; frame-ancestors ${frameAncestors}; img-src ${imgSrc}; object-src 'none';`;

  reply.header('Content-Security-Policy', csp);
  return payload;
});

const PORT = 3001;

async function bootstrap() {
  await registerPlugins(fastify);
  await registerCronJobs(fastify);
  await registerOAuth2(fastify);

  // Initialiser Discord sans bloquer le démarrage du serveur
  void discordService.initialize();

  registerReservedRootsHook(fastify);
  registerSessionValidator(fastify);
  registerActionAuditHook(fastify);

  fastify.register(apiRoutes, { prefix: "/api" });
  fastify.register(dashboardRoutes);
  fastify.register(plinkkPagesRoutes, { prefix: "/plinkks" });
  fastify.register(linkTrackingRoutes);
  authRoutes(fastify);
  onboardingRoutes(fastify);

  fastify.get(
    "/themes.json",
    { config: { rateLimit: false } },
    async (request, reply) => {
      const { userId } = request.query as { userId: string };
      return reply.send(await generateTheme(userId));
    },
  );

  fastify.get("/*", async (request, reply) => {
    const url = request.raw.url || "";

    if (url.startsWith("/api") || url.startsWith("/public")) {
      return reply.callNotFound();
    }

    const host = request.headers.host || "";
    if (host !== "plinkk.fr" && host !== "127.0.0.1:3001") {
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
    let currentUserId: string | undefined;

    if (typeof sessionData === "object") {
      currentUserId = sessionData?.id;
    } else {
      currentUserId = sessionData;
      if (currentUserId && currentUserId.includes("__totp")) {
        currentUserId = undefined;
      }
    }

    const currentUser = currentUserId
      ? await prisma.user.findUnique({
          where: { id: currentUserId },
          include: { role: true },
        })
      : null;

    if (!currentUser) {
      return reply.redirect("/login");
    }

    const userId = currentUserId!;

    const [
      linksCount,
      socialsCount,
      labelsCount,
      recentLinks,
      plinkks,
      userViews,
      totalClicks,
    ] = await Promise.all([
      prisma.link.count({ where: { userId } }),
      prisma.socialIcon.count({ where: { userId } }),
      prisma.label.count({ where: { userId } }),
      prisma.link.findMany({
        where: { userId },
        orderBy: { id: "desc" },
        take: 10,
      }),
      prisma.plinkk.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          slug: true,
          isDefault: true,
          views: true,
        },
        orderBy: [{ isDefault: "desc" }, { index: "asc" }],
      }),
      // Total views across all user's plinkks
      prisma.plinkk.aggregate({
        where: { userId },
        _sum: { views: true },
      }),
      // Total clicks across all user's links
      prisma.link.aggregate({
        where: { userId },
        _sum: { clicks: true },
      }),
    ]);

    const views = userViews._sum.views || 0;
    const clicks = totalClicks._sum.clicks || 0;
    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) + "%" : "0%";

    return reply.callNotFound();
  });

  fastify.setNotFoundHandler(async (request, reply) => {
    if (request.raw.url?.startsWith("/api")) {
      return reply.code(404).send({ error: "Not Found" });
    }
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    return reply
      .code(404)
      .view("erreurs/404.ejs", { currentUser: userId ? { id: userId } : null, cspNonce: (request as any).cspNonce || '' });
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
      "Request failed",
    );

    if (error instanceof AppError) {
      if (request.raw.url?.startsWith("/api")) {
        return reply.code(error.statusCode).send({
          error: error.code.toLowerCase(),
          message: error.message,
        });
      }
      const sessionData = request.session.get("data");
      const userId = (
        typeof sessionData === "object" ? sessionData?.id : sessionData
      ) as string | undefined;

      const user = userId ? await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true }
      }) : null;

      const template =
        error.statusCode === 404 ? "erreurs/404.ejs" : "erreurs/500.ejs";

      return await replyView(reply, template, user, {
        message: error.message,
      }, error.statusCode);
    }

    if (request.raw.url?.startsWith("/api")) {
      return reply.code(500).send({ error: "internal_server_error" });
    }
    const sessionData = request.session.get("data");
    const userId = (
      typeof sessionData === "object" ? sessionData?.id : sessionData
    ) as string | undefined;

    const user = userId ? await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    }) : null;

    return await replyView(reply, "erreurs/500.ejs", user, {
      message: error && typeof error === 'object' && 'message' in error ? (error).message ?? "" : "",
    }, 500);
  });

  fastify.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    console.info(`Server is now listening on ${address}`);
    fastify.cron.startAllJobs();
  });
}

bootstrap();
