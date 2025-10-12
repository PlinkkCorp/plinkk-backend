import { FastifyInstance } from "fastify";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { generateProfileConfig } from "../lib/generateConfig";
import { minify } from "uglify-js";
import { PrismaClient } from "../../generated/prisma/client";

const prisma = new PrismaClient();

import { resolvePlinkkPage, parseIdentifier } from "../lib/resolvePlinkkPage";

export function plinkkFrontUserRoutes(fastify: FastifyInstance) {
  fastify.get('/:username', { config: { rateLimit: false } }, async function (request, reply) {
    const { username } = request.params as { username: string };
    const isPreview = (request.query as any)?.preview === '1';
    if (username === "") {
      reply.code(404).send({ error: "please specify a username" });
      return;
    }

    // Ignore obvious asset-like requests or reserved system paths so they
    // don't get treated as a username and cause DB updates (e.g. favicon.ico)
    const reservedRoots = new Set(["favicon.ico", "robots.txt", "manifest.json", "public", "api", "dashboard", "login", "logout", "register", "totp", "users"]);
    if (username.includes('.') || reservedRoots.has(username) || username.startsWith('.well-known')) {
      return reply.code(404).send({ error: 'not_found' });
    }

    // Slug-first: si le premier segment correspond à un plinkk.slug global,
    // afficher directement cette page (le plinkk est indépendant du compte).
    try {
      const pageBySlug = await prisma.plinkk.findFirst({ where: { slug: username }, select: { id: true, userId: true, slug: true } });
      if (pageBySlug) {
        const resolved = await resolvePlinkkPage(prisma, pageBySlug.userId, pageBySlug.slug, request);
          if (resolved.status === 200) {
          const links = await prisma.link.findMany({ where: { plinkkId: resolved.page.id, userId: resolved.user.id } });
          const isOwner = (request.session.get('data') as string | undefined) === resolved.user.id;
          const publicPath = resolved.page && resolved.page.slug ? resolved.page.slug : resolved.user.id;
          return reply.view("plinkk/show.ejs", { page: resolved.page, userId: resolved.user.id, username: resolved.user.id, isOwner, links, publicPath });
        }
        // if page exists but resolve failed (private/inactive), return appropriate status
        if (resolved.status === 403) return reply.code(403).view("erreurs/404.ejs", { user: null });
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
        const m = String(now.getUTCMonth() + 1).padStart(2, '0');
        const d = String(now.getUTCDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`; // YYYY-MM-DD (UTC)
        await prisma.userViewDaily.upsert({
          where: {
            userId_date: {
              userId: username,
              date: dateStr
            },
          },
          create: {
            userId: username,
            date: dateStr,
            count: 1,
          },
          update: {
            count: {
              increment: 1
            }
          }
        })
      } catch (e) {
        request.log?.warn({ err: e }, 'Failed to record daily view');
      }
    }

  // Résoudre toujours la page par défaut Plinkk; ne plus faire de fallback vers l'ancien rendu
  const resolved = await resolvePlinkkPage(prisma, username, undefined, request);
    if (resolved.status !== 200) {
      return reply.code(resolved.status).view("erreurs/404.ejs", { user: null });
    }
  const links = await prisma.link.findMany({ where: { plinkkId: resolved.page.id, userId: resolved.user.id } });
  const isOwner = (request.session.get('data') as string | undefined) === resolved.user.id;
  const publicPath = resolved.page && resolved.page.slug ? resolved.page.slug : resolved.user.id;
  return reply.view("plinkk/show.ejs", { page: resolved.page, userId: resolved.user.id, username: resolved.user.id, isOwner, links, publicPath });
  });

  fastify.get("/:username/css/:cssFileName", { config: { rateLimit: false } }, function (request, reply) {
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

  fastify.get("/:username/canvaAnimation/*", { config: { rateLimit: false } }, function (request, reply) {
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

  fastify.get("/:username/js/config/:configFileName",
    { config: { rateLimit: false } },
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
        reply.code(404).send({ error: "please specify a config file" });
        return;
      }
      if (configFileName === "profileConfig.js") {
        // Eviter le cache pour garantir l'actualisation immédiate du preview
        reply.header('Cache-Control', 'no-store, max-age=0, must-revalidate');
        reply.header('Vary', 'Referer');
  const profile = await prisma.user.findFirst({ where: { id: username }, include: { role: true } });
        if (!profile) return reply.code(404).send({ error: 'Profil introuvable' });

        // Déterminer la page Plinkk à partir du query ?slug= ou du Referer (/:username ou /:username/:slug)
        let identifier: string | undefined = undefined;
        const q = request.query as any;
        if (typeof q?.slug === 'string') {
          const s = (q.slug || '').trim();
          // compat: slug=0 => page par défaut
          identifier = (s === '0') ? '' : s;
        }
        try {
          if (!identifier) {
            const ref = String(request.headers.referer || '');
            if (ref) {
              const u = new URL(ref);
              const parts = u.pathname.split('/').filter(Boolean);
              // parts: [username] ou [username, slug]
              if (parts.length >= 2 && parts[0] === username) {
                const candidate = parts[1];
                if (!['css', 'js', 'images', 'canvaAnimation'].includes(candidate)) {
                  identifier = candidate;
                }
              }
            }
          }
        } catch {}

        // Résoudre la page
        let page = null as any;
        if (identifier) {
          page = await prisma.plinkk.findFirst({ where: { userId: profile.id, slug: identifier } });
        }
        if (!page) {
          page = await prisma.plinkk.findFirst({ where: { userId: profile.id, isDefault: true } })
              || await prisma.plinkk.findFirst({ where: { userId: profile.id, index: 0 } })
              || await prisma.plinkk.findFirst({ where: { userId: profile.id }, orderBy: [{ index: 'asc' }, { createdAt: 'asc' }] });
        }
        if (!page) return reply.code(404).send({ error: 'Page introuvable' });

        // Charger les données par Plinkk
        const [settings, background, labels, neonColors, socialIcons, links, pageStatusbar] = await Promise.all([
          prisma.plinkkSettings.findUnique({ where: { plinkkId: page.id } }),
          prisma.backgroundColor.findMany({ where: { userId: profile.id, plinkkId: page.id } }),
          prisma.label.findMany({ where: { userId: profile.id, plinkkId: page.id } }),
          prisma.neonColor.findMany({ where: { userId: profile.id, plinkkId: page.id } }),
          prisma.socialIcon.findMany({ where: { userId: profile.id, plinkkId: page.id } }),
          prisma.link.findMany({ where: { userId: profile.id, plinkkId: page.id } }),
          prisma.plinkkStatusbar.findUnique({ where: { plinkkId: page.id } }),
        ]);
        // Si un thème privé est sélectionné, récupérer ses données, les normaliser en "full shape"
        // et l'injecter comme thème 0 pour le front.
        let injectedThemeVar = '';
        try {
          // Helpers de normalisation (cohérents avec apiRoutes)
          const normalizeHex = (v?: string) => {
            if (!v || typeof v !== 'string') return '#000000';
            const s = v.trim();
            if (/^#?[0-9a-fA-F]{3}$/.test(s)) {
              const t = s.replace('#', '');
              return '#' + t.split('').map((c) => c + c).join('');
            }
            if (/^#?[0-9a-fA-F]{6}$/.test(s)) return s.startsWith('#') ? s : ('#' + s);
            return '#000000';
          };
          const luminance = (hex: string) => {
            const h = normalizeHex(hex).slice(1);
            const r = parseInt(h.slice(0, 2), 16) / 255;
            const g = parseInt(h.slice(2, 4), 16) / 255;
            const b = parseInt(h.slice(4, 6), 16) / 255;
            const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
            return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
          };
          const contrastText = (bg: string) => (luminance(bg) > 0.5 ? '#111827' : '#ffffff');
          const mix = (hexA: string, hexB: string, ratio = 0.2) => {
            const a = normalizeHex(hexA).slice(1);
            const b = normalizeHex(hexB).slice(1);
            const c = (i: number) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - ratio) + parseInt(b.slice(i, i + 2), 16) * ratio);
            const r = c(0), g = c(2), bl = c(4);
            return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
          };
          const hoverVariant = (color: string) => (luminance(color) > 0.5 ? mix(color, '#000000', 0.2) : mix(color, '#ffffff', 0.2));
          type SimplifiedVariant = { bg: string; button: string; hover: string };
          const toFullTheme = (light: SimplifiedVariant, dark: SimplifiedVariant) => {
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
            return { ...L, opposite: D } as any;
          };
          const coerceThemeData = (data: any) => {
            if (data && typeof data === 'object' && 'background' in data && ('opposite' in data || 'darkTheme' in data)) return data;
            if (data && data.light && data.dark) {
              const l = data.light as SimplifiedVariant; const d = data.dark as SimplifiedVariant;
              return toFullTheme(l, d);
            }
            if (data && data.bg && data.button && data.hover) {
              const l = { bg: data.bg, button: data.button, hover: data.hover } as SimplifiedVariant;
              const d = { bg: hoverVariant(data.bg), button: hoverVariant(data.button), hover: data.hover } as SimplifiedVariant;
              return toFullTheme(l, d);
            }
            return null;
          };

          if ((profile as any).selectedCustomThemeId) {
            const t = await prisma.theme.findUnique({ where: { id: (profile as any).selectedCustomThemeId }, select: { data: true, isPrivate: true, authorId: true } });
            if (t && t.authorId === profile.id) {
              const full = coerceThemeData(t.data as any);
              if (full) {
                const safe = JSON.stringify(full);
                injectedThemeVar = `window.__PLINKK_PRIVATE_THEME__ = ${safe};`;
              }
            }
          }
          // Fallback: si aucun thème sélectionné injecté, injecter le dernier SUBMITTED de l'utilisateur
          if (!injectedThemeVar) {
            const sub = await prisma.theme.findFirst({ where: { authorId: profile.id, status: 'SUBMITTED' as any }, select: { data: true }, orderBy: { updatedAt: 'desc' } });
            const candidate = sub ? sub : await prisma.theme.findFirst({ where: { authorId: profile.id, status: 'DRAFT' as any }, select: { data: true }, orderBy: { updatedAt: 'desc' } });
            if (candidate && candidate.data) {
              const full = coerceThemeData(candidate.data as any);
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
            const idx = injectedThemeVar.indexOf('=');
            const objStr = injectedThemeVar.slice(idx + 1).trim().replace(/;$/, '');
            injectedObj = JSON.parse(objStr);
          }
        } catch (e) { /* ignore */ }

        // Fusionner les réglages de page (PlinkkSettings) avec les valeurs par défaut du compte
        const pageProfile: any = {
          ...profile,
          profileLink: (settings as any)?.profileLink ?? (profile as any).profileLink,
          profileImage: (settings as any)?.profileImage ?? (profile as any).profileImage,
          profileIcon: (settings as any)?.profileIcon ?? (profile as any).profileIcon,
          profileSiteText: (settings as any)?.profileSiteText ?? (profile as any).profileSiteText,
          userName: (settings as any)?.userName ?? (profile as any).userName,
          iconUrl: (settings as any)?.iconUrl ?? (profile as any).iconUrl,
          description: (settings as any)?.description ?? (profile as any).description,
          profileHoverColor: (settings as any)?.profileHoverColor ?? (profile as any).profileHoverColor,
          degBackgroundColor: (settings as any)?.degBackgroundColor ?? (profile as any).degBackgroundColor,
          neonEnable: (settings as any)?.neonEnable ?? (profile as any).neonEnable,
          buttonThemeEnable: (settings as any)?.buttonThemeEnable ?? (profile as any).buttonThemeEnable,
          EnableAnimationArticle: (settings as any)?.EnableAnimationArticle ?? (profile as any).EnableAnimationArticle,
          EnableAnimationButton: (settings as any)?.EnableAnimationButton ?? (profile as any).EnableAnimationButton,
          EnableAnimationBackground: (settings as any)?.EnableAnimationBackground ?? (profile as any).EnableAnimationBackground,
          backgroundSize: (settings as any)?.backgroundSize ?? (profile as any).backgroundSize,
          selectedThemeIndex: (settings as any)?.selectedThemeIndex ?? (profile as any).selectedThemeIndex,
          selectedAnimationIndex: (settings as any)?.selectedAnimationIndex ?? (profile as any).selectedAnimationIndex,
          selectedAnimationButtonIndex: (settings as any)?.selectedAnimationButtonIndex ?? (profile as any).selectedAnimationButtonIndex,
          selectedAnimationBackgroundIndex: (settings as any)?.selectedAnimationBackgroundIndex ?? (profile as any).selectedAnimationBackgroundIndex,
          animationDurationBackground: (settings as any)?.animationDurationBackground ?? (profile as any).animationDurationBackground,
          delayAnimationButton: (settings as any)?.delayAnimationButton ?? (profile as any).delayAnimationButton,
          // Support for per-Plinkk public email: if a PlinkkSettings.affichageEmail
          // exists we must prefer it for the generated profile config. We expose it
          // both as `affichageEmail` and override `publicEmail` so generateProfileConfig
          // (which reads profile.publicEmail) will pick up the page-specific value.
          affichageEmail: (settings as any)?.affichageEmail ?? null,
          publicEmail: (settings as any && Object.prototype.hasOwnProperty.call(settings, 'affichageEmail'))
            ? (settings as any).affichageEmail
            : (profile as any).publicEmail ?? null,
          canvaEnable: (settings as any)?.canvaEnable ?? (profile as any).canvaEnable,
          selectedCanvasIndex: (settings as any)?.selectedCanvasIndex ?? (profile as any).selectedCanvasIndex,
        };

        const generated = generateProfileConfig(
          pageProfile,
          links,
          background,
          labels,
          neonColors,
          socialIcons,
          (pageStatusbar ? { text: pageStatusbar.text, colorBg: pageStatusbar.colorBg, fontTextColor: pageStatusbar.fontTextColor, statusText: pageStatusbar.statusText } as any : (null as any)),
          injectedObj
        ).replaceAll("{{username}}", username);

        // If debug=1 in query, return the non-minified generated code for inspection
        const isDebug = (request.query as any)?.debug === '1';
        if (injectedObj) {
          reply.header('X-Plinkk-Injected', '1');
        }
        if (isDebug) {
          return reply.type('text/javascript').send(generated);
        }
        const mini = minify(generated);
        return reply.type("text/javascript").send(mini.code || '');
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
        if (configFileName === "btnIconThemeConfig.js") {
          return reply
          .type("text/javascript")
          .send(file.replaceAll("{{username}}", "https://plinkk.fr/" + username));
        }
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

  // Route publique pour pages Plinkk multiples – placée APRÈS les routes d’actifs
  fastify.get<{
    Params: { username: string; identifier?: string }
  }>("/:username/:identifier", async (request, reply) => {
    const { username, identifier } = request.params as any;
    // Ignore si l'identifiant correspond à un préfixe d'actifs
    if (["css", "js", "images", "canvaAnimation"].includes(String(identifier))) {
      return reply.code(404).view("erreurs/404.ejs", { user: null });
    }
    // Si l'identifiant est un slug qui existe globalement sur un autre utilisateur,
    // préférer l'URL globale '/:slug' et rediriger vers elle.
    try {
      const parsed = parseIdentifier(identifier);
      if (parsed.kind === 'slug') {
        const global = await prisma.plinkk.findFirst({ where: { slug: parsed.value as string }, select: { userId: true } });
        if (global && global.userId !== username) {
          // redirection permanente non obligatoire; on utilise 302 pour être sûr
          return reply.redirect(`/${parsed.value}`);
        }
      }
    } catch (e) {
      // ignore and continue resolving by username
    }
    const resolved = await resolvePlinkkPage(prisma, username, identifier, request);
    if (resolved.status !== 200) return reply.code(resolved.status).view("erreurs/404.ejs", { user: null });
  const links = await prisma.link.findMany({ where: { plinkkId: resolved.page.id, userId: resolved.user.id } });
  const isOwner = (request.session.get('data') as string | undefined) === resolved.user.id;
  const publicPath = resolved.page && resolved.page.slug ? resolved.page.slug : resolved.user.id;
  return reply.view("plinkk/show.ejs", { page: resolved.page, userId: resolved.user.id, username: resolved.user.id, isOwner, links, publicPath });
  });

  // Compat: /:username/0 -> page par défaut
  fastify.get<{
    Params: { username: string }
  }>("/:username/0", async (request, reply) => {
    const { username } = request.params as any;
    const resolved = await resolvePlinkkPage(prisma, username, undefined, request);
    if (resolved.status !== 200) return reply.code(resolved.status).view("erreurs/404.ejs", { user: null });
    const links = await prisma.link.findMany({ where: { plinkkId: resolved.page.id, userId: resolved.user.id } });
    const isOwner = (request.session.get('data') as string | undefined) === resolved.user.id;
    return reply.view("plinkk/show.ejs", { page: resolved.page, userId: resolved.user.id, username: resolved.user.id, isOwner, links });
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