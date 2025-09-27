import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import Fastify from "fastify";
import path from "path";
import ejs from "ejs";
import { existsSync, readFileSync } from "fs";
import { PrismaClient, User } from "../generated/prisma/client";
import { generateProfileConfig } from "./generateConfig";
import { minify } from "uglify-js";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import bcrypt from "bcrypt";
import fastifySecureSession, { Session } from "@fastify/secure-session";
import z from "zod";

const prisma = new PrismaClient();
const fastify = Fastify({
  logger: true,
});

declare module "@fastify/secure-session" {
  interface SessionData {
    data?: string;
  }
}

fastify.register(fastifyView, {
  engine: {
    ejs: ejs,
  },
  root: path.join(__dirname, "views"),
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/public/", // optional: default '/'
});

fastify.register(fastifyFormbody);
fastify.register(fastifyCookie);

fastify.register(fastifySecureSession, {
  sessionName: "session",
  cookieName: "plinkk-backend",
  key: readFileSync(path.join(__dirname, "secret-key")),
  expiry: 24 * 60 * 60,
  cookie: {
    path: "/",
  },
});

fastify.get("/", function (request, reply) {
  reply.view("index.ejs");
});

fastify.get("/login", function (request, reply) {
  reply.view("connect.ejs");
});

fastify.post("/register", async (req, reply) => {
  const { username, email, password, passwordVerif } = req.body as {
    username: string;
    email: string;
    password: string;
    passwordVerif: string;
  };
  const hashedPassword = await bcrypt.hash(password, 10);
  const hashedPasswordVerif = await bcrypt.hash(passwordVerif, 10);

  if (await bcrypt.compare(hashedPassword, hashedPasswordVerif))
    return reply.redirect(
      "/login?error=" +
        encodeURIComponent("Password and Verif Password is not the same")
    );

  try {
    const emailVerified = z.email().parse(email);
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.redirect(
        "/login?error=" + encodeURIComponent(error.issues[0].message)
      );
    }
  }

  const user = await prisma.user.create({
    data: {
      id: username
        .replaceAll(" ", "-")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
      userName: username,
      email: email,
      password: hashedPassword,
    },
  });

  reply.redirect("/login");
});

fastify.post("/login", async (request, reply) => {
  const { email, password } = request.body as {
    email: string;
    password: string;
  };
  try {
    const emailVerified = z.email().parse(email);
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.redirect(
        "/login?error=" + encodeURIComponent(error.issues[0].message)
      );
    }
  }
  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!user) return reply.send("Utilisateur introuvable");
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return reply.send("Mot de passe incorrect");

  request.session.set("data", user.id);
  reply.redirect("/dashboard");
});

fastify.get("/dashboard", async function (request, reply) {
  const data = request.session.get("data");
  if (!data) return reply.redirect("/login");
  const userInfo = await prisma.user.findFirst({
    where: {
      id: data
    },
    omit: {
      password: true
    }
  })
  if (userInfo === null) return reply.redirect("/login")
  return reply.view("/dashboard.ejs", { user: userInfo });
});

fastify.get("/logout", (req, reply) => {
  req.session.delete();
  reply.redirect("/login");
});

fastify.get("/:username", function (request, reply) {
  const { username } = request.params as { username: string };
  if (username === "") {
    reply.code(404).send({ error: "please specify a username" });
    return;
  }
  reply.view("links.ejs", { username: username });
});

fastify.get("/:username/css/:cssFileName", function (request, reply) {
  const { username, cssFileName } = request.params as {
    username: string;
    cssFileName: string;
  };
  if (username === "") {
    reply.code(404).send({ error: "please specify a username" });
    return;
  }
  if (cssFileName === "") {
    reply.code(404).send({ error: "please specify a js file" });
    return;
  }
  if (existsSync(path.join(__dirname, "public", "css", cssFileName))) {
    return reply.sendFile(`css/${cssFileName}`);
  }
  return reply.code(404).send({ error: "non existant file" });
});

fastify.get("/:username/js/:jsFileName", function (request, reply) {
  const { username, jsFileName } = request.params as {
    username: string;
    jsFileName: string;
  };
  if (username === "") {
    reply.code(404).send({ error: "please specify a username" });
    return;
  }
  if (jsFileName === "") {
    reply.code(404).send({ error: "please specify a css file" });
    return;
  }
  if (existsSync(path.join(__dirname, "public", "js", jsFileName))) {
    const file = readFileSync(
      path.join(__dirname, "public", "js", jsFileName),
      { encoding: "utf-8" }
    );
    const mini = minify(file.replaceAll("{{username}}", username));
    return reply.type("text/javascript").send(mini.code);
  }
  return reply.code(404).send({ error: "non existant file" });
});

fastify.get("/:username/canvaAnimation/*", function (request, reply) {
  const { username } = request.params as {
    username: string;
    animationFileName: string;
  };
  const animationFileName = request.params["*"];
  if (username === "") {
    reply.code(404).send({ error: "please specify a username" });
    return;
  }
  if (animationFileName === "") {
    reply.code(404).send({ error: "please specify a css file" });
    return;
  }
  if (
    existsSync(
      path.join(__dirname, "public", "canvaAnimation", animationFileName)
    )
  ) {
    return reply.sendFile(`canvaAnimation/${animationFileName}`);
  }
  return reply.code(404).send({ error: "non existant file" });
});

fastify.get(
  "/:username/js/config/:configFileName",
  async function (request, reply) {
    const { username, configFileName } = request.params as {
      username: string;
      configFileName: string;
    };
    if (username === "") {
      reply.code(404).send({ error: "please specify a username" });
      return;
    }
    if (configFileName === "") {
      reply.code(404).send({ error: "please specify a css file" });
      return;
    }
    if (configFileName === "profileConfig.js") {
      const profile = await prisma.user.findFirst({
        where: {
          id: username,
        },
        include: {
          background: true,
          labels: true,
          neonColors: true,
          socialIcons: true,
          statusbar: true,
          links: true,
        },
      });
      const mini = minify(
        generateProfileConfig(
          profile,
          profile.links,
          profile.background,
          profile.labels,
          profile.neonColors,
          profile.socialIcons,
          profile.statusbar
        ).replaceAll("{{username}}", username)
      );
      return reply.type("text/javascript").send(mini.code);
    }
    if (existsSync(path.join(__dirname, "public", "config", configFileName))) {
      const file = readFileSync(
        path.join(__dirname, "public", "config", configFileName),
        { encoding: "utf-8" }
      );
      return reply
        .type("text/javascript")
        .send(file.replaceAll("{{username}}", username));
    }
    return reply.code(404).send({ error: "non existant file" });
  }
);

fastify.get("/:username/images/*", function (request, reply) {
  const { username } = request.params as { username: string; image: string };
  const image = request.params["*"];
  if (username === "") {
    reply.code(404).send({ error: "please specify a username" });
    return;
  }
  if (image === "") {
    reply.code(404).send({ error: "please specify a css file" });
    return;
  }
  if (existsSync(path.join(__dirname, "public", "images", image))) {
    return reply.sendFile(`images/${image}`);
  }
  return reply.code(404).send({ error: "non existant file" });
});

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.info(`Server is now listening on ${address}`);
});
