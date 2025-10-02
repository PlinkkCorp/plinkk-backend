import { FastifyInstance } from "fastify";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { generateProfileConfig } from "../generateConfig";
import { minify } from "uglify-js";
import { PrismaClient } from "../../generated/prisma/client";

const prisma = new PrismaClient();

export function plinkkFrontUserRoutes(fastify: FastifyInstance) {
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
    if (existsSync(path.join(__dirname, "..", "public", "css", cssFileName))) {
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
    if (existsSync(path.join(__dirname, "..", "public", "js", jsFileName))) {
      const file = readFileSync(
        path.join(__dirname, "..", "public", "js", jsFileName),
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
        path.join(__dirname, "..", "public", "canvaAnimation", animationFileName)
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
      if (
        existsSync(path.join(__dirname, "..", "public", "config", configFileName))
      ) {
        const file = readFileSync(
          path.join(__dirname, "..", "public", "config", configFileName),
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
    if (existsSync(path.join(__dirname, "..", "public", "images", image))) {
      return reply.sendFile(`images/${image}`);
    }
    return reply.code(404).send({ error: "non existant file" });
  });
}
