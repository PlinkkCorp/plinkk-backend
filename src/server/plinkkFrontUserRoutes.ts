import { FastifyInstance } from "fastify";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { generateProfileConfig } from "../generateConfig";
import { minify } from "uglify-js";
import { PrismaClient } from "../../generated/prisma/client";

const prisma = new PrismaClient();

export function plinkkFrontUserRoutes(fastify: FastifyInstance) {
  fastify.get("/:username", async function (request, reply) {
    const { username } = request.params as { username: string };
    const isPreview = (request.query as any)?.preview === '1';
    if (username === "") {
      reply.code(404).send({ error: "please specify a username" });
      return;
    }

    // En mode aperçu on n'incrémente pas les vues ni les agrégations journalières
    if (!isPreview) {
      await prisma.user.update({
        where: { id: username },
        data: { views: { increment: 1 } },
      });

      // Enregistrer la vue datée (agrégation quotidienne) dans SQLite sans modifier le client généré
      try {
        // Assurer la table (SQLite)
        await prisma.$executeRawUnsafe(
          'CREATE TABLE IF NOT EXISTS "UserViewDaily" ("userId" TEXT NOT NULL, "date" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("userId","date"))'
        );
        const now = new Date();
        const y = now.getUTCFullYear();
        const m = String(now.getUTCMonth() + 1).padStart(2, '0');
        const d = String(now.getUTCDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`; // YYYY-MM-DD (UTC)
        // Upsert (ON CONFLICT) pour incrémenter le compteur du jour
        await prisma.$executeRawUnsafe(
          'INSERT INTO "UserViewDaily" ("userId","date","count") VALUES (?,?,1) ON CONFLICT("userId","date") DO UPDATE SET "count" = "count" + 1',
          username,
          dateStr
        );
      } catch (e) {
        request.log?.warn({ err: e }, 'Failed to record daily view');
      }
    }

    return reply.view("links.ejs", { username: username });
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
        path.join(
          __dirname,
          "..",
          "public",
          "canvaAnimation",
          animationFileName
        )
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
        if (!profile) return reply.code(404).send({ error: 'Profil introuvable' });
        // Si un thème privé est sélectionné, récupérer ses données et l'injecter comme thème 0
        let injectedThemeVar = '';
        try {
          if ((profile as any).selectedCustomThemeId) {
            const t = await prisma.theme.findUnique({ where: { id: (profile as any).selectedCustomThemeId }, select: { data: true, isPrivate: true, authorId: true } });
            if (t && t.isPrivate && t.authorId === profile.id) {
              // sérialiser la structure pour front (format complet attendu par themeConfig)
              const safe = JSON.stringify(t.data);
              injectedThemeVar = `window.__PLINKK_PRIVATE_THEME__ = ${safe};`;
            }
          }
        } catch {}
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
        // préfixer avec un bloc optionnel définissant un thème privé
        const prefix = injectedThemeVar ? `${injectedThemeVar}\n` : '';
        return reply.type("text/javascript").send(prefix + (mini.code || ''));
      }
      if (
        existsSync(
          path.join(__dirname, "..", "public", "config", configFileName)
        )
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

  fastify.get("/click/:linkId", async (req, reply) => {
    const linkId = String((req.params as { linkId: string }).linkId);

    const link = await prisma.link.findUnique({ where: { id: linkId } });
    if (!link) return reply.code(404).send({ error: "Lien introuvable" });

    await prisma.link.update({
      where: { id: linkId },
      data: { clicks: { increment: 1 } },
    });

    // Enregistrer le clic daté (agrégation quotidienne)
    try {
      await prisma.$executeRawUnsafe(
        'CREATE TABLE IF NOT EXISTS "LinkClickDaily" ("linkId" TEXT NOT NULL, "date" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("linkId","date"))'
      );
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = String(now.getUTCMonth() + 1).padStart(2, '0');
      const d = String(now.getUTCDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      await prisma.$executeRawUnsafe(
        'INSERT INTO "LinkClickDaily" ("linkId","date","count") VALUES (?,?,1) ON CONFLICT("linkId","date") DO UPDATE SET "count" = "count" + 1',
        linkId,
        dateStr
      );
    } catch (e) {}

    return reply.redirect(link.url);
  });
}
