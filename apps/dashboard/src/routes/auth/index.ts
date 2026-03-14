import { FastifyInstance } from "fastify";
import { loginRoutes } from "./login";
import { registerRoutes } from "./register";
import { totpRoutes } from "./totp";
import { logoutRoutes } from "./logout";
import { googleAuthRoutes } from "./google";
import { forgotPasswordRoutes } from "./forgot-password";
import { joinRoutes } from "./join";
import { verifyRoutes } from "./verify";

export function authRoutes(fastify: FastifyInstance) {
  loginRoutes(fastify);
  registerRoutes(fastify);
  totpRoutes(fastify);
  logoutRoutes(fastify);
  googleAuthRoutes(fastify);
  forgotPasswordRoutes(fastify);
  joinRoutes(fastify);
  verifyRoutes(fastify);
}
