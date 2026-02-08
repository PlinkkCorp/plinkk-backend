import { FastifyInstance } from "fastify";
import { loginRoutes } from "./login";
import { registerRoutes } from "./register";
import { totpRoutes } from "./totp";
import { logoutRoutes } from "./logout";
import { googleAuthRoutes } from "./google";

export function authRoutes(fastify: FastifyInstance) {
  loginRoutes(fastify);
  registerRoutes(fastify);
  totpRoutes(fastify);
  logoutRoutes(fastify);
  googleAuthRoutes(fastify);
}
