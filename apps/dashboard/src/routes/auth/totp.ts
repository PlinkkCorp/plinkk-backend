import { FastifyInstance } from "fastify";
import { authenticator } from "otplib";
import { prisma } from "@plinkk/prisma";
import { createUserSession } from "../../services/sessionService";

export function totpRoutes(fastify: FastifyInstance) {
  fastify.get("/totp", (request, reply) => {
    const currentUserIdTotp = request.session.get("data") as string | undefined;
    
    if (!currentUserIdTotp) {
      return reply.redirect("/login");
    }

    const parts = String(currentUserIdTotp).split("__");
    
    if (parts.length === 2 && parts[1] === "totp") {
      const returnToQuery = (request.query as { returnTo: string })?.returnTo || "";
      return reply.view("totp.ejs", { returnTo: returnToQuery });
    }

    return reply.redirect("/login");
  });

  fastify.post("/totp", async (request, reply) => {
    const { totp } = request.body as { totp: string };
    const currentUserIdTotp = request.session.get("data") as string | undefined;

    if (!currentUserIdTotp) {
      return reply.redirect("/login");
    }

    const parts = String(currentUserIdTotp).split("__");

    if (parts.length === 2 && parts[1] === "totp") {
      const user = await prisma.user.findUnique({ where: { id: parts[0] } });

      if (!user || !user.twoFactorSecret) {
        try {
          request.session.delete();
        } catch {}
        return reply.redirect("/login");
      }

      const isValid = authenticator.check(totp, user.twoFactorSecret);

      if (!isValid) {
        return reply.code(401).send({ error: "Invalid TOTP code" });
      }

      const returnTo =
        (request.body as { returnTo: string })?.returnTo ||
        (request.query as { returnTo: string })?.returnTo;

      await createUserSession(user.id, request);

      return reply.redirect(returnTo || "/");
    }

    try {
      request.session.delete();
    } catch {}

    return reply.redirect("/login");
  });
}
