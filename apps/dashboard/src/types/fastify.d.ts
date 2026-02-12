import "fastify";
import "@fastify/secure-session";

declare module "@fastify/secure-session" {
  interface SessionData {
    data?: string | { id: string };
    sessionId?: string;
    returnTo?: string;
    original_admin?: string;
  }
}

export interface OAuth2AccessTokenResult {
  token: {
    access_token: string;
    [key: string]: any;
  };
}

declare module "fastify" {
  interface FastifyInstance {
    githubOAuth2: FastifyOAuth2Namespace;
    discordOAuth2: FastifyOAuth2Namespace;
  }

  interface FastifyRequest {
    userId?: string;
    currentUser?: import("@plinkk/prisma").User & { role: import("@plinkk/prisma").Role | null };
    publicPath?: string;
    rawBody?: string | Buffer;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    githubOAuth2: FastifyOAuth2Namespace;
    discordOAuth2: FastifyOAuth2Namespace;
  }
}
