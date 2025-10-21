import { FastifyInstance } from "fastify";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { generateProfileConfig } from "../lib/generateConfig";
import { minify } from "uglify-js";
import {
  PlinkkSettings,
  PrismaClient,
  User,
} from "@plinkk/prisma/generated/prisma/client";

const prisma = new PrismaClient();

import { resolvePlinkkPage, parseIdentifier } from "../lib/resolvePlinkkPage";
import { coerceThemeData } from "../lib/theme";
import { generateBundle } from "../lib/generateBundle";
import { generateTheme } from "../lib/generateTheme";
import { roundedRect, wrapText } from "../lib/fileUtils";
import { createCanvas, loadImage, registerFont } from "canvas";

export function plinkkFrontUserRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/:username",
    { config: { rateLimit: false } },
    async function (request, reply) {
      const { username } = request.params as { username: string };
      const isPreview = (request.query as { preview: string })?.preview === "1";
      if (username === "") {
        reply.code(404).send({ error: "please specify a username" });
        return;
      }

      // Ignore obvious asset-like requests or reserved system paths so they
      // don't get treated as a username and cause DB updates (e.g. favicon.ico)
      const reservedRoots = new Set([
        "favicon.ico",
        "robots.txt",
        "manifest.json",
        "public",
        "api",
        "dashboard",
        "login",
        "logout",
        "register",
        "totp",
        "users",
      ]);
      if (
        username.includes(".") ||
        reservedRoots.has(username) ||
        username.startsWith(".well-known")
      ) {
        return reply.code(404).send({ error: "not_found" });
      }

      // Slug-first: si le premier segment correspond à un plinkk.slug global,
      // afficher directement cette page (le plinkk est indépendant du compte).
      try {
        const pageBySlug = await prisma.plinkk.findFirst({
          where: { slug: username },
          select: { id: true, userId: true, slug: true },
        });
        if (pageBySlug) {
          const resolved = await resolvePlinkkPage(
            prisma,
            pageBySlug.userId,
            pageBySlug.slug,
            request
          );
          if (resolved.status === 200) {
            // Vérifier si l'utilisateur est banni par email
            try {
              const u = await prisma.user.findUnique({
                where: { id: resolved.user.id },
                select: { email: true },
              });
              if (u?.email) {
                const ban = await prisma.bannedEmail.findFirst({
                  where: { email: u.email, revoquedAt: null },
                });
                if (ban) {
                  const isActive =
                    ban.time == null ||
                    ban.time < 0 ||
                    new Date(ban.createdAt).getTime() + ban.time * 60000 >
                      Date.now();
                  if (isActive) {
                    const until =
                      typeof ban.time === "number" && ban.time > 0
                        ? new Date(
                            new Date(ban.createdAt).getTime() + ban.time * 60000
                          ).toISOString()
                        : null;
                    return reply.view("erreurs/banned.ejs", {
                      reason: ban.reason || "Violation des règles",
                      email: u.email,
                      until,
                    });
                  }
                }
              }
            } catch (e) {}

            const links = await prisma.link.findMany({
              where: { plinkkId: resolved.page.id, userId: resolved.user.id },
            });
            const isOwner =
              (request.session.get("data") as string | undefined) ===
              resolved.user.id;
            const publicPath =
              resolved.page && resolved.page.slug
                ? resolved.page.slug
                : resolved.user.id;
            return reply.view("plinkk/show.ejs", {
              page: resolved.page,
              userId: resolved.user.id,
              username: resolved.user.id,
              isOwner,
              links,
              publicPath,
            });
          }
          // if page exists but resolve failed (private/inactive), return appropriate status
          if (resolved.status === 403)
            return reply.code(403).view("erreurs/404.ejs", { user: null });
          return reply.code(404).view("erreurs/404.ejs", { user: null });
        }
      } catch (e) {
        // ignore and fallback to username-based resolution below
      }

      // En mode aperçu on n'incrémente pas les vues ni les agrégations journalières
      if (!isPreview) {
        // Use updateMany instead of update to avoid throwing when the user does not exist
        // (update would fail with 'No record was found for an update'). updateMany will
        // silently affect 0 rows if there's no matching user, which is desirable here.
        await prisma.user.updateMany({
          where: { id: username },
          data: { views: { increment: 1 } },
        });

        // Enregistrer la vue datée (agrégation quotidienne) dans SQLite sans modifier le client généré
        try {
          const now = new Date();
          const y = now.getUTCFullYear();
          const m = String(now.getUTCMonth() + 1).padStart(2, "0");
          const d = String(now.getUTCDate()).padStart(2, "0");
          const dateStr = `${y}-${m}-${d}`; // YYYY-MM-DD (UTC)
          await prisma.userViewDaily.upsert({
            where: {
              userId_date: {
                userId: username,
                date: dateStr,
              },
            },
            create: {
              userId: username,
              date: dateStr,
              count: 1,
            },
            update: {
              count: {
                increment: 1,
              },
            },
          });
        } catch (e) {
          request.log?.warn({ err: e }, "Failed to record daily view");
        }
      }

      // Résoudre toujours la page par défaut Plinkk; ne plus faire de fallback vers l'ancien rendu
      const resolved = await resolvePlinkkPage(
        prisma,
        username,
        undefined,
        request
      );
      if (resolved.status !== 200) {
        return reply
          .code(resolved.status)
          .view("erreurs/404.ejs", { user: null });
      }
      // Si utilisateur banni -> afficher page bannie
      try {
        const u = await prisma.user.findUnique({
          where: { id: resolved.user.id },
          select: { email: true },
        });
        if (u?.email) {
          const ban = await prisma.bannedEmail.findFirst({
            where: { email: u.email, revoquedAt: null },
          });
          if (ban) {
            const isActive =
              ban.time == null ||
              ban.time < 0 ||
              new Date(ban.createdAt).getTime() + ban.time * 60000 > Date.now();
            if (isActive) {
              const until =
                typeof ban.time === "number" && ban.time > 0
                  ? new Date(
                      new Date(ban.createdAt).getTime() + ban.time * 60000
                    ).toISOString()
                  : null;
              return reply.view("erreurs/banned.ejs", {
                reason: ban.reason || "Violation des règles",
                email: u.email,
                until,
              });
            }
          }
        }
      } catch (e) {}

      const links = await prisma.link.findMany({
        where: { plinkkId: resolved.page.id, userId: resolved.user.id },
      });
      const isOwner =
        (request.session.get("data") as string | undefined) ===
        resolved.user.id;
      const publicPath =
        resolved.page && resolved.page.slug
          ? resolved.page.slug
          : resolved.user.id;
      return reply.view("plinkk/show.ejs", {
        page: resolved.page,
        userId: resolved.user.id,
        username: resolved.user.id,
        isOwner,
        links,
        publicPath,
      });
    }
  );

  fastify.get(
    "/css/:cssFileName",
    { config: { rateLimit: false } },
    function (request, reply) {
      const { cssFileName } = request.params as {
        cssFileName: string;
      };
      if (cssFileName === "") {
        reply.code(404).send({ error: "please specify a js file" });
        return;
      }
      if (
        existsSync(path.join(__dirname, "..", "public", "css", cssFileName))
      ) {
        return reply.sendFile(`css/${cssFileName}`);
      }
      return reply.code(404).send({ error: "non existant file" });
    }
  );

  fastify.get("/:username.js", async function (request, reply) {
    const { username } = request.params as {
      username: string;
    };
    if (username === "") {
      reply.code(404).send("// please specify a username");
      return;
    }

    const js = await generateBundle();

    reply.type("application/javascript").send(js);
  });

  fastify.get(
    "/canvaAnimation/*",
    { config: { rateLimit: false } },
    function (request, reply) {
      const animationFileName = request.params["*"];
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
    }
  );

  fastify.get(
    "/config.js",
    { config: { rateLimit: false } },
    async function (request, reply) {
      const { username } = request.query as {
        username: string;
      };
      if (username === "") {
        reply.code(404).send({ error: "please specify a username" });
        return;
      }
      // Eviter le cache pour garantir l'actualisation immédiate du preview
      reply.header("Cache-Control", "no-store, max-age=0, must-revalidate");
      reply.header("Vary", "Referer");
      const page = await prisma.plinkk.findFirst({
        where: { slug: username },
        include: { user: true },
      });
      if (!page) return reply.code(404).send({ error: "Page introuvable" });

      // Charger les données par Plinkk
      const [
        settings,
        background,
        labels,
        neonColors,
        socialIcons,
        links,
        pageStatusbar,
      ] = await Promise.all([
        prisma.plinkkSettings.findUnique({ where: { plinkkId: page.id } }),
        prisma.backgroundColor.findMany({
          where: { userId: page.user.id, plinkkId: page.id },
        }),
        prisma.label.findMany({
          where: { userId: page.user.id, plinkkId: page.id },
        }),
        prisma.neonColor.findMany({
          where: { userId: page.user.id, plinkkId: page.id },
        }),
        prisma.socialIcon.findMany({
          where: { userId: page.user.id, plinkkId: page.id },
        }),
        prisma.link.findMany({
          where: { userId: page.user.id, plinkkId: page.id },
        }),
        prisma.plinkkStatusbar.findUnique({ where: { plinkkId: page.id } }),
      ]);
      // Si un thème privé est sélectionné, récupérer ses données, les normaliser en "full shape"
      // et l'injecter comme thème 0 pour le front.
      let injectedThemeVar = "";
      try {
        // Helpers de normalisation (cohérents avec apiRoutes)
        const normalizeHex = (v?: string) => {
          if (!v || typeof v !== "string") return "#000000";
          const s = v.trim();
          if (/^#?[0-9a-fA-F]{3}$/.test(s)) {
            const t = s.replace("#", "");
            return (
              "#" +
              t
                .split("")
                .map((c) => c + c)
                .join("")
            );
          }
          if (/^#?[0-9a-fA-F]{6}$/.test(s))
            return s.startsWith("#") ? s : "#" + s;
          return "#000000";
        };
        const luminance = (hex: string) => {
          const h = normalizeHex(hex).slice(1);
          const r = parseInt(h.slice(0, 2), 16) / 255;
          const g = parseInt(h.slice(2, 4), 16) / 255;
          const b = parseInt(h.slice(4, 6), 16) / 255;
          const a = [r, g, b].map((v) =>
            v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
          );
          return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
        };
        const contrastText = (bg: string) =>
          luminance(bg) > 0.5 ? "#111827" : "#ffffff";
        const mix = (hexA: string, hexB: string, ratio = 0.2) => {
          const a = normalizeHex(hexA).slice(1);
          const b = normalizeHex(hexB).slice(1);
          const c = (i: number) =>
            Math.round(
              parseInt(a.slice(i, i + 2), 16) * (1 - ratio) +
                parseInt(b.slice(i, i + 2), 16) * ratio
            );
          const r = c(0),
            g = c(2),
            bl = c(4);
          return `#${[r, g, bl]
            .map((x) => x.toString(16).padStart(2, "0"))
            .join("")}`;
        };
        const hoverVariant = (color: string) =>
          luminance(color) > 0.5
            ? mix(color, "#000000", 0.2)
            : mix(color, "#ffffff", 0.2);
        type SimplifiedVariant = {
          bg: string;
          button: string;
          hover: string;
        };
        const toFullTheme = (
          light: SimplifiedVariant,
          dark: SimplifiedVariant
        ) => {
          const L = {
            background: normalizeHex(light.bg),
            hoverColor: normalizeHex(light.hover),
            textColor: contrastText(light.bg),
            buttonBackground: normalizeHex(light.button),
            buttonHoverBackground: hoverVariant(light.button),
            buttonTextColor: contrastText(light.button),
            linkHoverColor: normalizeHex(light.hover),
            articleHoverBoxShadow: `0 4px 12px ${normalizeHex(light.hover)}55`,
            darkTheme: false,
          };
          const D = {
            background: normalizeHex(dark.bg),
            hoverColor: normalizeHex(dark.hover),
            textColor: contrastText(dark.bg),
            buttonBackground: normalizeHex(dark.button),
            buttonHoverBackground: hoverVariant(dark.button),
            buttonTextColor: contrastText(dark.button),
            linkHoverColor: normalizeHex(dark.hover),
            articleHoverBoxShadow: `0 4px 12px ${normalizeHex(dark.hover)}55`,
            darkTheme: true,
          };
          return { ...L, opposite: D };
        };

        if (page.user.selectedCustomThemeId) {
          const t = await prisma.theme.findUnique({
            where: { id: page.user.selectedCustomThemeId },
            select: { data: true, isPrivate: true, authorId: true },
          });
          if (t && t.authorId === page.user.id) {
            const full = coerceThemeData(t.data);
            if (full) {
              const safe = JSON.stringify(full);
              injectedThemeVar = `window.__PLINKK_PRIVATE_THEME__ = ${safe};`;
            }
          }
        }
        // Fallback: si aucun thème sélectionné injecté, injecter le dernier SUBMITTED de l'utilisateur
        if (!injectedThemeVar) {
          const sub = await prisma.theme.findFirst({
            where: { authorId: page.user.id, status: "SUBMITTED" },
            select: { data: true },
            orderBy: { updatedAt: "desc" },
          });
          const candidate = sub
            ? sub
            : await prisma.theme.findFirst({
                where: { authorId: page.user.id, status: "DRAFT" },
                select: { data: true },
                orderBy: { updatedAt: "desc" },
              });
          if (candidate && candidate.data) {
            const full = coerceThemeData(candidate.data);
            if (full) {
              const safe = JSON.stringify(full);
              injectedThemeVar = `window.__PLINKK_PRIVATE_THEME__ = ${safe};`;
            }
          }
        }
      } catch {}
      // If we computed an injected theme, parse it to pass as object
      let injectedObj = null;
      try {
        if (injectedThemeVar) {
          // injectedThemeVar is like `window.__PLINKK_PRIVATE_THEME__ = {...};`
          const idx = injectedThemeVar.indexOf("=");
          const objStr = injectedThemeVar
            .slice(idx + 1)
            .trim()
            .replace(/;$/, "");
          injectedObj = JSON.parse(objStr);
        }
      } catch (e) {
        /* ignore */
      }

      // Fusionner les réglages de page (PlinkkSettings) avec les valeurs par défaut du compte
      const pageProfile: User & PlinkkSettings = {
        plinkkId: null,
        ...page.user,
        profileLink: settings?.profileLink ?? "",
        profileImage: settings?.profileImage ?? "",
        profileIcon: settings?.profileIcon ?? "",
        profileSiteText: settings?.profileSiteText ?? "",
        userName: settings?.userName ?? page.user.userName,
        iconUrl: settings?.iconUrl ?? "",
        description: settings?.description ?? "",
        profileHoverColor: settings?.profileHoverColor ?? "",
        degBackgroundColor: settings?.degBackgroundColor ?? 45,
        neonEnable: settings?.neonEnable ?? 1,
        buttonThemeEnable: settings?.buttonThemeEnable ?? 1,
        EnableAnimationArticle: settings?.EnableAnimationArticle ?? 1,
        EnableAnimationButton: settings?.EnableAnimationButton ?? 1,
        EnableAnimationBackground: settings?.EnableAnimationBackground ?? 1,
        backgroundSize: settings?.backgroundSize ?? 50,
        selectedThemeIndex: settings?.selectedThemeIndex ?? 13,
        selectedAnimationIndex: settings?.selectedAnimationIndex ?? 0,
        selectedAnimationButtonIndex:
          settings?.selectedAnimationButtonIndex ?? 10,
        selectedAnimationBackgroundIndex:
          settings?.selectedAnimationBackgroundIndex ?? 0,
        animationDurationBackground:
          settings?.animationDurationBackground ?? 30,
        delayAnimationButton: settings?.delayAnimationButton ?? 0.1,
        // Support for per-Plinkk public email: if a PlinkkSettings.affichageEmail
        // exists we must prefer it for the generated profile config. We expose it
        // both as `affichageEmail` and override `publicEmail` so generateProfileConfig
        // (which reads profile.publicEmail) will pick up the page-specific value.
        affichageEmail: settings?.affichageEmail ?? null,
        publicEmail:
          settings &&
          Object.prototype.hasOwnProperty.call(settings, "affichageEmail")
            ? settings.affichageEmail
            : page.user.publicEmail ?? null,
        canvaEnable: settings?.canvaEnable ?? 1,
        selectedCanvasIndex: settings?.selectedCanvasIndex ?? 16,
        layoutOrder: settings?.layoutOrder ?? null,
      };

      const generated = generateProfileConfig(
        pageProfile,
        links,
        background,
        labels,
        neonColors,
        socialIcons,
        pageStatusbar,
        injectedObj
      ).replaceAll("{{username}}", username);

      // If debug=1 in query, return the non-minified generated code for inspection
      const isDebug = (request.query as { debug: string })?.debug === "1";
      if (injectedObj) {
        reply.header("X-Plinkk-Injected", "1");
      }
      if (isDebug) {
        return reply.type("text/javascript").send(generated);
      }
      const mini = minify(generated);
      return reply.type("text/javascript").send(mini.code || "");
    }
  );

  fastify.get(
    "/themes.json",
    { config: { rateLimit: false } },
    async function (request, reply) {
      const { userId } = request.query as { userId: string };

      // Return built-ins first, then community and mine
      return reply.send(await generateTheme(userId));
    }
  );

  fastify.get("/images/*", function (request, reply) {
    const image = request.params["*"];
    if (image === "") {
      reply.code(404).send({ error: "please specify a css file" });
      return;
    }
    if (existsSync(path.join(__dirname, "..", "public", "images", image))) {
      return reply.sendFile(`images/${image}`);
    }
    return reply.code(404).send({ error: "non existant file" });
  });

  // Route publique pour pages Plinkk multiples – placée APRÈS les routes d’actifs
  fastify.get<{
    Params: { username: string; identifier?: string };
  }>("/:username/:identifier", async (request, reply) => {
    const { username, identifier } = request.params as {
      username: string;
      identifier: string;
    };
    // Ignore si l'identifiant correspond à un préfixe d'actifs
    if (
      ["css", "js", "images", "canvaAnimation"].includes(String(identifier))
    ) {
      return reply.code(404).view("erreurs/404.ejs", { user: null });
    }
    // Si l'identifiant est un slug qui existe globalement sur un autre utilisateur,
    // préférer l'URL globale '/:slug' et rediriger vers elle.
    try {
      const parsed = parseIdentifier(identifier);
      if (parsed.kind === "slug") {
        const global = await prisma.plinkk.findFirst({
          where: { slug: parsed.value as string },
          select: { userId: true },
        });
        if (global && global.userId !== username) {
          // redirection permanente non obligatoire; on utilise 302 pour être sûr
          return reply.redirect(`/${parsed.value}`);
        }
      }
    } catch (e) {
      // ignore and continue resolving by username
    }
    const resolved = await resolvePlinkkPage(
      prisma,
      username,
      identifier,
      request
    );
    if (resolved.status !== 200)
      return reply
        .code(resolved.status)
        .view("erreurs/404.ejs", { user: null });
    const links = await prisma.link.findMany({
      where: { plinkkId: resolved.page.id, userId: resolved.user.id },
    });
    const isOwner =
      (request.session.get("data") as string | undefined) === resolved.user.id;
    const publicPath =
      resolved.page && resolved.page.slug
        ? resolved.page.slug
        : resolved.user.id;
    return reply.view("plinkk/show.ejs", {
      page: resolved.page,
      userId: resolved.user.id,
      username: resolved.user.id,
      isOwner,
      links,
      publicPath,
    });
  });

  // Compat: /:username/0 -> page par défaut
  fastify.get<{
    Params: { username: string };
  }>("/:username/0", async (request, reply) => {
    const { username } = request.params as { username: string };
    const resolved = await resolvePlinkkPage(
      prisma,
      username,
      undefined,
      request
    );
    if (resolved.status !== 200)
      return reply
        .code(resolved.status)
        .view("erreurs/404.ejs", { user: null });
    const links = await prisma.link.findMany({
      where: { plinkkId: resolved.page.id, userId: resolved.user.id },
    });
    const isOwner =
      (request.session.get("data") as string | undefined) === resolved.user.id;
    return reply.view("plinkk/show.ejs", {
      page: resolved.page,
      userId: resolved.user.id,
      username: resolved.user.id,
      isOwner,
      links,
    });
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
      const m = String(now.getUTCMonth() + 1).padStart(2, "0");
      const d = String(now.getUTCDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      await prisma.$executeRawUnsafe(
        'INSERT INTO "LinkClickDaily" ("linkId","date","count") VALUES (?,?,1) ON CONFLICT("linkId","date") DO UPDATE SET "count" = "count" + 1',
        linkId,
        dateStr
      );
    } catch (e) {}

    return reply.redirect(link.url);
  });

  registerFont(path.resolve("assets/fonts/Inter-Bold.ttf"), {
    family: "Inter",
  });
  registerFont(path.resolve("assets/fonts/Inter-Regular.ttf"), {
    family: "Inter",
  });

  fastify.get("/og/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({
      where: { slug: id },
      include: { user: true, settings: true },
    });
    if (!page) return reply.code(404).send({ error: "Plinkk introuvable" });
    const width = 1200;
    const height = 630;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // === FOND ===
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#7C3AED");
    gradient.addColorStop(1, "#0F172A");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // === CARTE ===
    const cardX = 100;
    const cardY = 80;
    const cardW = width - 200;
    const cardH = height - 160;
    const radius = 50;

    // Ombre
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 40;

    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    roundedRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.fill();

    // === AVATAR + GLOW ===
    const avatarSize = 180;
    const centerX = width / 2;
    const centerY = 230;

    try {
      const image = page.settings.profileImage.startsWith("/public/")
        ? request.protocol + "://" + request.host + page.settings.profileImage
        : page.settings.profileImage ||
          request.host + "/public/images/default-avatar.png";
      const avatar = await loadImage(image);

      // Halo néon violet autour de l'avatar
      const glowRadius = avatarSize * 0.65;
      const gradientGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        glowRadius * 0.4,
        centerX,
        centerY,
        glowRadius
      );
      gradientGlow.addColorStop(0, "rgba(140, 82, 255, 0.9)");
      gradientGlow.addColorStop(1, "rgba(140, 82, 255, 0)");
      ctx.fillStyle = gradientGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Avatar rond au centre
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        avatar,
        centerX - avatarSize / 2,
        centerY - avatarSize / 2,
        avatarSize,
        avatarSize
      );
      ctx.restore();
    } catch (err) {
      console.error("Erreur chargement avatar :", err);
    }

    // === PSEUDO ===
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "bold 64px Inter";
    ctx.fillText(`${page.settings.userName}`, width / 2, 420);

    // === DESCRIPTION ===
    const bio = page.settings.description || "Découvre mon profil sur Plinkk !";
    const maxWidth = 800;
    const maxChars = 120;
    const text =
      bio.length > maxChars ? bio.slice(0, maxChars - 3) + "..." : bio;

    ctx.font = "30px Inter";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    wrapText(ctx, text, width / 2, 480, maxWidth, 40);

    // === SIGNATURE ===
    ctx.font = "24px Inter";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("plinkk.fr", width - 140, height - 50);

    // === Réponse ===
    reply
      .header("Content-Type", "image/png")
      .header("Cache-Control", "public, max-age=120") // 2 minutes de cache
      .send(canvas.toBuffer("image/png"));
  });
}
