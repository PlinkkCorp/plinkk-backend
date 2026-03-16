/**
 * Index des routes d'authentification
 * - /auth/login
 * - /auth/register
 * - /auth/totp
 * - /auth/google
 * - /auth/forgot-password
 * - /auth/join
 * - /auth/verify
 */

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
  fastify.register(async (instance) => {
    instance.register(loginRoutes);
    instance.register(registerRoutes);
    instance.register(totpRoutes);
    instance.register(googleAuthRoutes);
    instance.register(forgotPasswordRoutes);
    instance.register(joinRoutes);
    instance.register(verifyRoutes);
  }, {
    prefix: "/auth",
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute"
      }
    }
  });
  
  logoutRoutes(fastify);
}
