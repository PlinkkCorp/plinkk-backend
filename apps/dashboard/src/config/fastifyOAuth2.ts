import { FastifyInstance } from "fastify";
import { request } from "undici";
import "../types/index";
import { GithubUser } from "../types/githubUser";
import { prisma } from "@plinkk/prisma";
import { slugify } from "../lib/plinkkUtils";
import { createUserSession } from "../services/sessionService";
import { createDefaultPlinkk } from "../routes/auth/register";
import { discordUser } from "../types/discordUser";

async function getGitHubUserDetails(token: { access_token: string }) {
  const res = await request("https://api.github.com/user", {
    headers: {
      "User-Agent": "plinkk-authentication-server",
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  const resEmail = await request("https://api.github.com/user/emails", {
    headers: {
      "User-Agent": "plinkk-authentication-server",
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  const user = (await res.body.json()) as GithubUser;

  const primaryEmail = (
    (await resEmail.body.json()) as { email: string; primary: boolean }[]
  ).find((email) => email.primary)?.email;

  if (user.email === null) {
    user.email = primaryEmail;
  }

  return user;
}

async function getDiscordUserDetails(token: { access_token: string }) {
  const res = await request("https://discord.com/api/users/@me", {
    headers: {
      "User-Agent": "plinkk-authentication-server",
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token.access_token}`,
    },
  });
  const user = (await res.body.json()) as discordUser;

  return user;
}

export async function registerOAuth2(fastify: FastifyInstance) {
  fastify.get("/login/github/callback", async function (request, reply) {
    const { token } =
      await this.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

    const user = await getGitHubUserDetails(token);

    const plinkkUser = await prisma.user.findFirst({
      where: { email: user.email },
      include: { role: true },
    });

    if (!plinkkUser) {
      const generatedId = slugify(user.name);

      const plinkkUserDB = await prisma.user.create({
        data: {
          id: generatedId,
          userName: user.name,
          name: user.name,
          email: user.email,
          password: token.access_token,
          role: {
            connectOrCreate: {
              where: { name: "USER" },
              create: { id: "USER", name: "USER" },
            },
          },
        },
      });

      try {
        await prisma.cosmetic.create({ data: { userId: user.id.toString() } });
      } catch (e) {
        request.log?.warn({ e }, "create default cosmetic failed");
      }

      await createDefaultPlinkk(request, plinkkUserDB.id, user.name);

      const returnTo =
        (request.body as { returnTo: string })?.returnTo ||
        (request.query as { returnTo: string })?.returnTo;

      await createUserSession(plinkkUserDB.id, request);

      return reply.redirect(returnTo || "/");
    }
    await createUserSession(plinkkUser.id, request);

    // reply.send({ access_token: token.access_token });
    return reply.redirect("/")
  });

  fastify.get("/login/discord/callback", async function (request, reply) {
    const { token } =
      await this.discordOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

    const user = await getDiscordUserDetails(token)

    const plinkkUser = await prisma.user.findFirst({
      where: { email: user.email },
      include: { role: true },
    });

    if (!plinkkUser) {
      const generatedId = slugify(user.username);

      const plinkkUserDB = await prisma.user.create({
        data: {
          id: generatedId,
          userName: user.username,
          name: user.global_name,
          email: user.email,
          password: token.access_token,
          role: {
            connectOrCreate: {
              where: { name: "USER" },
              create: { id: "USER", name: "USER" },
            },
          },
        },
      });

      try {
        await prisma.cosmetic.create({ data: { userId: user.id.toString() } });
      } catch (e) {
        request.log?.warn({ e }, "create default cosmetic failed");
      }

      await createDefaultPlinkk(request, plinkkUserDB.id, user.username);

      const returnTo =
        (request.body as { returnTo: string })?.returnTo ||
        (request.query as { returnTo: string })?.returnTo;

      await createUserSession(plinkkUserDB.id, request);

      return reply.redirect(returnTo || "/");
    }
    await createUserSession(plinkkUser.id, request);

    // reply.send({ access_token: token.access_token });
    return reply.redirect("/")
  });
}
