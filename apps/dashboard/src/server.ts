import "dotenv/config";
import Fastify from "fastify";
import { prisma } from "@plinkk/prisma";
import { registerPlugins } from "./config/fastify";
import { registerCronJobs } from "./config/cron";
import "./types";
import { registerReservedRootsHook } from "./middleware/reservedRoots";
import { registerSessionValidator } from "./middleware/sessionValidator";
import { apiRoutes } from "./server/apiRoutes";
import { dashboardRoutes } from "./server/dashboardRoutes";
import { plinkkPagesRoutes } from "./server/plinkkPagesRoutes";
import { linkTrackingRoutes } from "./server/linkTrackingRoutes";
import { authRoutes } from "./routes/auth";
import { generateTheme } from "./lib/generateTheme";
import { registerOAuth2 } from "./config/fastifyOAuth2";
import { AppError } from "@plinkk/shared";

const fastify = Fastify({ logger: true, trustProxy: true });

const PORT = 3001;

async function bootstrap() {
  await registerPlugins(fastify);
  await registerCronJobs(fastify);
  await registerOAuth2(fastify)

  registerReservedRootsHook(fastify);
  registerSessionValidator(fastify);

  fastify.register(apiRoutes, { prefix: "/api" });
  fastify.register(dashboardRoutes);
  fastify.register(plinkkPagesRoutes);
  fastify.register(linkTrackingRoutes);
  authRoutes(fastify);

  fastify.get(
    "/themes.json",
    { config: { rateLimit: false } },
    async (request, reply) => {
      const { userId } = request.query as { userId: string };
      return reply.send(await generateTheme(userId));
    }
  );

  fastify.get("/*", async (request, reply) => {
    const url = request.raw.url || "";

    if (
      url.startsWith("/api") ||
      url.startsWith("/public") ||
      url.startsWith("/umami_script.js")
    ) {
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

    const [linksCount, socialsCount, labelsCount, recentLinks, plinkks, userViews, totalClicks] = await Promise.all([
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
        select: { id: true, name: true, slug: true, isDefault: true, views: true },
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
    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) + '%' : '0%';

    return reply.callNotFound();
  });

  fastify.setNotFoundHandler((request, reply) => {
    if (request.raw.url?.startsWith("/api")) {
      return reply.code(404).send({ error: "Not Found" });
    }
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    return reply
      .code(404)
      .view("erreurs/404.ejs", { currentUser: userId ? { id: userId } : null });
  });

  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    if (error instanceof AppError) {
      if (request.raw.url?.startsWith("/api")) {
        return reply.code(error.statusCode).send({
          error: error.code.toLowerCase(),
          message: error.message
        });
      }
      const sessionData = request.session.get("data");
      const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
      const template = error.statusCode === 404 ? "erreurs/404.ejs" : "erreurs/500.ejs";
      return reply.code(error.statusCode).view(template, {
        message: error.message,
        currentUser: userId ? { id: userId } : null,
      });
    }

    if (request.raw.url?.startsWith("/api")) {
      return reply.code(500).send({ error: "internal_server_error" });
    }
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    return reply.code(500).view("erreurs/500.ejs", {
      message: error instanceof Error ? error.message : "",
      currentUser: userId ? { id: userId } : null,
    });
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
