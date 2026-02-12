import "fastify";
import "@fastify/secure-session";
import { User, Role } from "@plinkk/prisma";


export interface OAuth2AccessTokenResult {
  token: {
    access_token: string;
    [key: string]: any;
  };
}

export interface FastifyOAuth2Namespace {
  getAccessTokenFromAuthorizationCodeFlow(request: unknown): Promise<OAuth2AccessTokenResult>;
}

declare module "fastify" {
  interface FastifyInstance {
    githubOAuth2: FastifyOAuth2Namespace;
    discordOAuth2: FastifyOAuth2Namespace;
  }

  interface FastifyRequest {
    userId?: string;
    currentUser?: User & { role: Role | null };
    publicPath?: string;
    rawBody?: string | Buffer;
  }
}
