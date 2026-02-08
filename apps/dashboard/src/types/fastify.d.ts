import "@fastify/secure-session";

declare module "@fastify/secure-session" {
  interface SessionData {
    data?: string;
    sessionId?: string;
    returnTo?: string;
  }
}
