import Fastify from "fastify";
import { registerCronJobs } from "./config/cron";
import { registerPlugins } from "./config/fastify";
import { registerReservedRootsHook } from "./middleware/reservedRoots";
import { registerSessionValidator } from "./middleware/sessionValidator";
import { apiRoutes } from "./server/apiRoutes";
import { dashboardRoutes } from "./server/dashboardRoutes";
import { plinkkPagesRoutes } from "./server/plinkkPagesRoutes";

declare module "@fastify/secure-session" {
  interface SessionData {
    data?: string;
    sessionId?: string;
    returnTo?: string;
  }
}

interface OAuth2AccessTokenResult {
  token: {
    access_token: string;
    [key: string]: any;
  };
}

interface FastifyOAuth2Namespace {
  getAccessTokenFromAuthorizationCodeFlow(request: unknown): Promise<OAuth2AccessTokenResult>;
}

declare module 'fastify' {
  interface FastifyInstance {
    githubOAuth2: FastifyOAuth2Namespace;
    discordOAuth2: FastifyOAuth2Namespace;
  }
}