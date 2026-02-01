import "fastify";
import "@fastify/secure-session";

declare module "@fastify/secure-session" {
  interface SessionData {
    data?: string;
    sessionId?: string;
    returnTo?: string;
  }
}

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
}
