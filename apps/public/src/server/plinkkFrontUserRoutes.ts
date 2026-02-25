import { FastifyInstance } from "fastify";
import "@fastify/static";
import { existsSync } from "fs";
import path from "path";
import { generateProfileConfig } from "../lib/generateConfig";
import { minify } from "uglify-js";
import { PlinkkSettings, User } from "@plinkk/prisma";
import { prisma } from "@plinkk/prisma";
import bcrypt from "bcrypt";
import { resolvePlinkkPage, parseIdentifier } from "../lib/resolvePlinkkPage";
import { recordPlinkkView } from "../lib/plinkkUtils";
import { filterScheduledLinks } from "@plinkk/shared";
import { coerceThemeData } from "../lib/theme";
import { generateBundle } from "../lib/generateBundle";
import { replyView } from "../lib/replyView";
import { generateTheme } from "../lib/generateTheme";
import { roundedRect, wrapText } from "../lib/fileUtils";
import { PlinkkSnapshot } from "../types/plinkk";

type CanvasMod = typeof import("canvas") | null;
let _canvasMod: CanvasMod = null;
async function ensureCanvas(): Promise<CanvasMod> {
  if (_canvasMod !== null) return _canvasMod;
  try {
    const mod: typeof import("canvas") = await import("canvas");
    _canvasMod = mod;
  } catch (e) {
    _canvasMod = null;
  }
  return _canvasMod;
}

async function getCurrentUser(request: any) {
  const sessionData = request.session.get("data");
  const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
  if (!currentUserId) return null;
  return await prisma.user.findUnique({ where: { id: currentUserId }, include: { role: true } });
}

export function plinkkFrontUserRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/plinkk/verify-password",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async function (request, reply) {
      const { username, identifier, password } = request.body as {
        username: string;
        identifier?: string;
        password?: string;
      };
      if (!username) return reply.redirect("/");

      const resolved = await resolvePlinkkPage(prisma, username, identifier);

      if (resolved.status !== 200 || !resolved.page || !resolved.user) {
        return reply.redirect(`/${username}`);
      }

      const targetUrl = identifier
        ? `/${username}/${identifier}`
        : `/${username}`;

      if (!resolved.isPasswordProtected) {
        return reply.redirect(targetUrl);
      }

      const sessionData = request.session.get("data");
      const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
      if (currentUserId === resolved.user.id) {
        return reply.redirect(targetUrl);
      }

      if (!password) {
        const currentUser = await getCurrentUser(request);
        return await replyView(reply, "plinkk/password.ejs", currentUser as any, {
          page: resolved.page,
          username,
          identifier,
          error: "Mot de passe requis",
        });
      }

      const isValid = await bcrypt.compare(
        password,
        resolved.page.passwordHash || "",
      );

      if (isValid) {
        request.session.set(`plinkk_unlocked_${resolved.page.id}`, true);
        return reply.redirect(targetUrl);
      } else {
        const currentUser = await getCurrentUser(request);
        return await replyView(reply, "plinkk/password.ejs", currentUser as any, {
          page: resolved.page,
          username,
          identifier,
          error: "Mot de passe incorrect",
        });
      }
    },
  );

  fastify.post(
    "/api/lead",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async function (request, reply) {
      const body = request.body as {
        linkId: string;
        data: any;
      };

      if (!body.linkId || !body.data) {
        return reply.code(400).send({ error: "Missing linkId or data" });
      }

      try {
        const link = await prisma.link.findUnique({
          where: { id: body.linkId },
          select: { id: true, plinkkId: true, userId: true }
        });

        if (!link) return reply.code(404).send({ error: "Link not found" });

        // Enregistrer le lead dans PageStat (eventType=LEAD)
        await prisma.pageStat.create({
          data: {
            plinkkId: link.plinkkId || "",
            eventType: "LEAD",
            ip: String(request.ip || request.headers?.["x-forwarded-for"] || ""),
            meta: {
              linkId: link.id,
              formData: body.data
            }
          }
        });

        return reply.send({ ok: true });
      } catch (e) {
        request.log.error(e);
        return reply.code(500).send({ error: "Internal Server Error" });
      }
    }
  );

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
            request,
          );
          if (resolved.status === 200) {
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
                          new Date(ban.createdAt).getTime() +
                          ban.time * 60000,
                        ).toISOString()
                        : null;
                    const currentUser = await getCurrentUser(request);
                    return await replyView(reply, "erreurs/banned.ejs", currentUser as any, {
                      reason: ban.reason || "Violation des règles",
                      email: u.email,
                      until,
                    });
                  }
                }
              }
            } catch (e) { }

            // Plinkk protégé par mot de passe : afficher le formulaire
            if (resolved.isPasswordProtected && !resolved.isOwner) {
              const sessionKey = `plinkk_unlocked_${resolved.page.id}`;
              const unlocked = request.session.get(sessionKey);
              if (!unlocked) {
                const currentUser = await getCurrentUser(request);
                return await replyView(reply, "plinkk/password.ejs", currentUser as any, {
                  page: resolved.page,
                  username,
                  identifier: undefined,
                  error: null,
                });
              }
            }

            const allLinks = await prisma.link.findMany({
              where: { plinkkId: resolved.page.id, userId: resolved.user.id },
              orderBy: { index: "asc" },
            });
            // Filtrer les liens schedulés (ne montrer que ceux actuellement actifs)
            const links = filterScheduledLinks(allLinks);
            const sessionData = request.session.get("data");
            const isOwner =
              ((typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined) ===
              resolved.user.id;
            const publicPath =
              resolved.page && resolved.page.slug
                ? resolved.page.slug
                : resolved.user.id;
            if (!isPreview) {
              await recordPlinkkView(
                prisma,
                resolved.page.id,
                resolved.user.id,
                request,
              );
            }

            // HISTORY PREVIEW LOGIC
            const { versionId } = request.query as unknown as { versionId?: string };
            let displayPage = resolved.page;
            let displayLinks = links;

            if (versionId) {
              const version = await prisma.plinkkVersion.findUnique({ where: { id: versionId } });
              if (version && version.plinkkId === resolved.page.id) {
                const snap = version.snapshot as PlinkkSnapshot;
                if (snap?.plinkk) displayPage = { ...displayPage, ...snap.plinkk };
                if (snap?.links) displayLinks = snap.links;
                console.log(`[Preview] Applied version ${versionId} to server-render for ${resolved.page.id}`);
              }
            }

            const settings = await prisma.plinkkSettings.findUnique({ where: { plinkkId: resolved.page.id } });
            const currentUser = await getCurrentUser(request);
            return await replyView(reply, "plinkk/show.ejs", currentUser as any, {
              page: displayPage,
              userId: resolved.user.id,
              username: resolved.user.id,
              isOwner,
              links: displayLinks,
              publicPath,
              settings,
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

      // Résoudre toujours la page par défaut Plinkk; ne plus faire de fallback vers l'ancien rendu
      const resolved = await resolvePlinkkPage(
        prisma,
        username,
        undefined,
        request,
      );
      if (resolved.status !== 200) {
        return reply
          .code(resolved.status)
          .view("erreurs/404.ejs", { user: null });
      }

      // En mode aperçu on n'incrémente pas les vues ni les agrégations journalières
      if (!isPreview && resolved.page) {
        await recordPlinkkView(
          prisma,
          resolved.page.id,
          resolved.user.id,
          request,
        );
        if (!isPreview) {
          // Incrément des vues utilisateur, robuste aux erreurs SQLite (code 14)
          try {
            await prisma.user.updateMany({
              where: { id: resolved.user.id },
              data: { views: { increment: 1 } },
            });
          } catch (e) {
            request.log?.warn(
              { err: e },
              "user.updateMany failed (views increment) - skipping",
            );
          }

          // Agrégation quotidienne des vues (UserViewDaily)
          try {
            const now = new Date();
            const y = now.getUTCFullYear();
            const m = String(now.getUTCMonth() + 1).padStart(2, "0");
            const d = String(now.getUTCDate()).padStart(2, "0");
            const dateStr = `${y}-${m}-${d}`; // YYYY-MM-DD (UTC)
            await prisma.userViewDaily.upsert({
              where: {
                userId_date: {
                  userId: resolved.user.id,
                  date: dateStr,
                },
              },
              create: { userId: resolved.user.id, date: dateStr, count: 1 },
              update: { count: { increment: 1 } },
            });
          } catch (e) {
            request.log?.warn(
              { err: e },
              "Failed to record daily view (userViewDaily upsert)",
            );
          }
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
                new Date(ban.createdAt).getTime() + ban.time * 60000 >
                Date.now();
              if (isActive) {
                const until =
                  typeof ban.time === "number" && ban.time > 0
                    ? new Date(
                      new Date(ban.createdAt).getTime() + ban.time * 60000,
                    ).toISOString()
                    : null;
                const currentUser = await getCurrentUser(request);
                return await replyView(reply, "erreurs/banned.ejs", currentUser as any, {
                  reason: ban.reason || "Violation des règles",
                  email: u.email,
                  until,
                });
              }
            }
          }
        } catch (e) { }

        // Plinkk protégé par mot de passe : afficher le formulaire
        if (resolved.isPasswordProtected && !resolved.isOwner) {
          const sessionKey = `plinkk_unlocked_${resolved.page.id}`;
          const unlocked = request.session.get(sessionKey);
            if (!unlocked) {
              const currentUser = await getCurrentUser(request);
              return await replyView(reply, "plinkk/password.ejs", currentUser as any, {
                page: resolved.page,
                username,
                identifier: undefined,
                error: null,
              });
            }
        }

        const allLinks = await prisma.link.findMany({
          where: { plinkkId: resolved.page.id, userId: resolved.user.id },
          orderBy: { index: "asc" },
        });
        // Filtrer les liens schedulés (ne montrer que ceux actuellement actifs)
        const links = filterScheduledLinks(allLinks);
        const sessionData = request.session.get("data");
        const isOwner =
          ((typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined) ===
          resolved.user.id;
        const publicPath =
          resolved.page && resolved.page.slug
            ? resolved.page.slug
            : resolved.user.id;
        if (!isPreview) {
          await recordPlinkkView(
            prisma,
            resolved.page.id,
            resolved.user.id,
            request,
          );
        }

        // HISTORY PREVIEW LOGIC
        const { versionId } = request.query as unknown as { versionId?: string };
        let displayPage = resolved.page;
        let displayLinks = links;

        if (versionId) {
          const version = await prisma.plinkkVersion.findUnique({ where: { id: versionId } });
          if (version && version.plinkkId === resolved.page.id) {
            const snap = version.snapshot as PlinkkSnapshot;
            if (snap?.plinkk) displayPage = { ...displayPage, ...snap.plinkk };
            if (snap?.links) displayLinks = snap.links;
            console.log(`[Preview] Applied version ${versionId} to server-render (fallback) for ${resolved.page.id}`);
          }
        }

        const settings = await prisma.plinkkSettings.findUnique({ where: { plinkkId: resolved.page.id } });
        const currentUser = await getCurrentUser(request);
        return await replyView(reply, "plinkk/show.ejs", currentUser as any, {
          page: displayPage,
          userId: resolved.user.id,
          username: resolved.user.id,
          isOwner,
          links: displayLinks,
          publicPath,
          settings,
        });
      }
    },
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
    },
  );

  fastify.get(
    "/:username.js",
    { config: { compress: false } },
    async function (request, reply) {
      const { username } = request.params as {
        username: string;
      };
      if (username === "") {
        reply.code(404).send("// please specify a username");
        return;
      }

      const js = await generateBundle();

      reply.type("application/javascript").send(js);
    },
  );

  fastify.get("/:username.png", async function (request, reply) {
    const { username } = request.params as {
      username: string;
    };
    if (!username) {
      reply.code(404).send("// please specify a username");
      return;
    }

    const resolved = await resolvePlinkkPage(
      prisma,
      username,
      undefined,
      request,
    );
    if (resolved.status !== 200) {
      return reply.redirect("https://cdn.plinkk.fr/default_profile.png");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: resolved.user.id,
      },
      select: {
        image: true,
      },
    });

    const userIcon = user?.image;

    if (
      userIcon &&
      (userIcon.startsWith("http://") || userIcon.startsWith("https://"))
    ) {
      return reply.redirect(userIcon);
    }

    return reply.redirect("https://cdn.plinkk.fr/default_profile.png");
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
            animationFileName,
          ),
        )
      ) {
        return reply.sendFile(`canvaAnimation/${animationFileName}`);
      }
      return reply.code(404).send({ error: "non existant file" });
    },
  );

  fastify.get(
    "/config.js",
    { config: { rateLimit: false } },
    async function (request, reply) {
      let { username } = request.query as {
        username: string;
      };
      if (!username) {
        reply.code(400).send({ error: "please specify a username" });
        return;
      }
      // Eviter le cache pour garantir l'actualisation immédiate du preview
      reply.header("Cache-Control", "no-store, max-age=0, must-revalidate");
      reply.header("Vary", "Referer");

      const resolved = await resolvePlinkkPage(
        prisma,
        username,
        undefined,
        request,
      );
      if (resolved.status !== 200) {
        return reply.code(resolved.status).send({ error: "Page introuvable" });
      }

      const page = await prisma.plinkk.findUnique({
        where: { id: resolved.page.id },
        include: {
          user: {
            include: {
              cosmetics: true,
              role: true,
            },
          },
        },
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
        categories,
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
          orderBy: { index: "asc" },
        }),
        prisma.plinkkStatusbar.findUnique({ where: { plinkkId: page.id } }),
        prisma.category.findMany({
          where: { plinkkId: page.id },
          orderBy: { order: "asc" },
        }),
      ]);

      // HISTORY PREVIEW LOGIC
      // Check referer for versionId (if loaded in iframe) or query
      const { versionId: tmpVersion } = request.query as unknown as { versionId?: string };
      let versionIdArg: string | null = tmpVersion || null;
      if (!versionIdArg) {
        try {
          const referer = request.headers.referer;
          if (referer) {
            const u = new URL(referer);
            versionIdArg = u.searchParams.get("versionId");
          }
        } catch (e) { }
      }

      let finalSettings = settings;
      let finalBackground = background;
      let finalLabels = labels;
      let finalNeon = neonColors;
      let finalSocial = socialIcons;
      let finalStatusbar = pageStatusbar;
      let finalCategories = categories;

      // Filter links by active categories
      const activeCategoryIds = new Set(finalCategories.filter(c => c.isActive !== false).map(c => c.id));
      let finalLinks = links.filter(l => !l.categoryId || activeCategoryIds.has(l.categoryId));

      if (versionIdArg) {
        const version = await prisma.plinkkVersion.findUnique({ where: { id: versionIdArg } });
        if (version && version.plinkkId === page.id) {
          const snap = version.snapshot as PlinkkSnapshot;
          if (snap.background) finalBackground = snap.background;
          if (snap.neonColors) finalNeon = snap.neonColors;
          if (snap.labels) finalLabels = snap.labels;
          if (snap.socialIcon) finalSocial = snap.socialIcon;
          if (snap.links) finalLinks = snap.links;
          if (snap.statusbar) finalStatusbar = snap.statusbar;
          if (snap.categories) finalCategories = snap.categories;
        }
      }
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
            v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
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
              parseInt(b.slice(i, i + 2), 16) * ratio,
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
          dark: SimplifiedVariant,
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
            select: { data: true, isPrivate: true, authorId: true, pendingUpdate: true },
          });
          if (t && t.authorId === page.user.id) {
            const source = t.pendingUpdate || t.data;
            const full = coerceThemeData(source);
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
      } catch { }
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
      const pageProfile: any = {
        plinkkId: null,
        ...page.user,
        profileLink: finalSettings?.profileLink ?? "",
        profileImage: finalSettings?.profileImage ?? "",
        profileIcon: finalSettings?.profileIcon ?? "",
        profileSiteText: finalSettings?.profileSiteText ?? "",
        userName: finalSettings?.userName ?? page.user.userName,
        iconUrl: finalSettings?.iconUrl ?? "",
        description: finalSettings?.description ?? "",
        profileHoverColor: finalSettings?.profileHoverColor ?? "",
        degBackgroundColor: finalSettings?.degBackgroundColor ?? 45,
        neonEnable: finalSettings?.neonEnable ?? 1,
        buttonThemeEnable: finalSettings?.buttonThemeEnable ?? 1,
        EnableAnimationArticle: finalSettings?.EnableAnimationArticle ?? 1,
        EnableAnimationButton: finalSettings?.EnableAnimationButton ?? 1,
        EnableAnimationBackground: finalSettings?.EnableAnimationBackground ?? 1,
        backgroundSize: finalSettings?.backgroundSize ?? 50,
        selectedThemeIndex: finalSettings?.selectedThemeIndex ?? 13,
        selectedAnimationIndex: finalSettings?.selectedAnimationIndex ?? 0,
        selectedAnimationButtonIndex:
          finalSettings?.selectedAnimationButtonIndex ?? 10,
        selectedAnimationBackgroundIndex:
          finalSettings?.selectedAnimationBackgroundIndex ?? 0,
        animationDurationBackground:
          finalSettings?.animationDurationBackground ?? 30,
        delayAnimationButton: finalSettings?.delayAnimationButton ?? 0.1,
        // Support for per-Plinkk public email
        affichageEmail: finalSettings?.affichageEmail ?? null,
        publicEmail:
          finalSettings &&
            Object.prototype.hasOwnProperty.call(finalSettings, "affichageEmail")
            ? finalSettings.affichageEmail
            : (page.user.publicEmail ?? null),
        canvaEnable: finalSettings?.canvaEnable ?? 1,
        selectedCanvasIndex: finalSettings?.selectedCanvasIndex ?? 16,
        layoutOrder: finalSettings?.layoutOrder ?? null,
        showVerifiedBadge: finalSettings?.showVerifiedBadge ?? false,
        showPartnerBadge: finalSettings?.showPartnerBadge ?? false,
        enableVCard: finalSettings?.enableVCard ?? true,
        publicPhone: finalSettings?.publicPhone ?? "",
        enableLinkCategories: finalSettings?.enableLinkCategories ?? false,
        fontFamily: finalSettings?.fontFamily ?? "",
        buttonStyle: finalSettings?.buttonStyle ?? "",
      };

      const generated = generateProfileConfig(
        pageProfile,
        finalLinks,
        finalBackground,
        finalLabels,
        finalNeon,
        finalSocial,
        finalStatusbar,
        injectedObj,
        finalCategories,
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
    },
  );

  fastify.get(
    "/themes.json",
    { config: { rateLimit: false } },
    async function (request, reply) {
      const { userId } = request.query as { userId: string };

      // Return built-ins first, then community and mine
      return reply.send(await generateTheme(userId));
    },
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
    // Prévisualisation (preview=1) ne doit pas compter les vues
    const isPreview = (request.query as { preview?: string })?.preview === "1";
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
      request,
    );
    if (resolved.status !== 200) {
      return await replyView(reply, "erreurs/404.ejs", null as any, { user: null }, resolved.status);
    }

    // Plinkk protégé par mot de passe
    if (resolved.isPasswordProtected && !resolved.isOwner) {
      const sessionKey = `plinkk_unlocked_${resolved.page.id}`;
      const unlocked = request.session.get(sessionKey);
      if (!unlocked) {
        const currentUser = await getCurrentUser(request);
        return await replyView(reply, "plinkk/password.ejs", currentUser as any, {
          page: resolved.page,
          username,
          identifier,
          error: null,
        });
      }
    }

    const [allLinks, categories] = await Promise.all([
      prisma.link.findMany({
        where: { plinkkId: resolved.page.id, userId: resolved.user.id },
      }),
      prisma.category.findMany({
        where: { plinkkId: resolved.page.id },
      })
    ]);

    // Filter by schedule and active categories
    const activeCategoryIds = new Set(categories.filter(c => c.isActive !== false).map(c => c.id));
    const links = filterScheduledLinks(allLinks).filter(l => !l.categoryId || activeCategoryIds.has(l.categoryId));
    const sessionData = request.session.get("data");
    const isOwner =
      ((typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined) === resolved.user.id;
    const publicPath =
      resolved.page && resolved.page.slug
        ? resolved.page.slug
        : resolved.user.id;
    if (!isPreview) {
      await recordPlinkkView(
        prisma,
        resolved.page.id,
        resolved.user.id,
        request,
      );
    }
    const currentUser = await getCurrentUser(request);
    return await replyView(reply, "plinkk/show.ejs", currentUser as any, {
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
    const isPreview = (request.query as { preview?: string })?.preview === "1";
    const resolved = await resolvePlinkkPage(
      prisma,
      username,
      undefined,
      request,
    );
    if (resolved.status !== 200) {
      return await replyView(reply, "erreurs/404.ejs", null as any, { user: null }, resolved.status);
    }

    // Plinkk protégé par mot de passe
    if (resolved.isPasswordProtected && !resolved.isOwner) {
      const sessionKey = `plinkk_unlocked_${resolved.page.id}`;
      const unlocked = request.session.get(sessionKey);
      if (!unlocked) {
        const currentUser = await getCurrentUser(request);
        return await replyView(reply, "plinkk/password.ejs", currentUser as any, {
          page: resolved.page,
          username,
          identifier: "0",
          error: null,
        });
      }
    }

    const [allLinks, categories] = await Promise.all([
      prisma.link.findMany({
        where: { plinkkId: resolved.page.id, userId: resolved.user.id },
      }),
      prisma.category.findMany({
        where: { plinkkId: resolved.page.id },
      })
    ]);

    // Filter by schedule and active categories
    const activeCategoryIds = new Set(categories.filter(c => c.isActive !== false).map(c => c.id));
    const links = filterScheduledLinks(allLinks).filter(l => !l.categoryId || activeCategoryIds.has(l.categoryId));

    const sessionData = request.session.get("data");
    const isOwner =
      ((typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined) === resolved.user.id;
    if (!isPreview) {
      await recordPlinkkView(
        prisma,
        resolved.page.id,
        resolved.user.id,
        request,
      );
    }
    const currentUser = await getCurrentUser(request);
    return await replyView(reply, "plinkk/show.ejs", currentUser as any, {
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
        'CREATE TABLE IF NOT EXISTS "LinkClickDaily" ("linkId" TEXT NOT NULL, "date" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("linkId","date"))',
      );
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = String(now.getUTCMonth() + 1).padStart(2, "0");
      const d = String(now.getUTCDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      await prisma.$executeRawUnsafe(
        'INSERT INTO "LinkClickDaily" ("linkId","date","count") VALUES (?,?,1) ON CONFLICT("linkId","date") DO UPDATE SET "count" = "count" + 1',
        linkId,
        dateStr,
      );
    } catch (e) { }

    try {
      if (link.plinkkId) {
        await prisma.pageStat.create({
          data: {
            plinkkId: link.plinkkId,
            eventType: "click",
            ip: String(req.ip || req.headers?.["x-forwarded-for"] || ""),
            meta: { linkId, userId: link.userId },
          },
        });
      }
    } catch (e) {
      req.log?.warn({ err: e }, "record click pageStat failed");
    }
    return reply.redirect(link.url);
  });

  fastify.get("/og/:id", async (request, reply) => {
    const canvasMod = await ensureCanvas();
    if (!canvasMod) {
      // Si canvas indisponible (ex: Node 22 sous Windows sans précompilé),
      // on renvoie une image statique par défaut pour débloquer le dev.
      try {
        return reply.redirect(
          "https://cdn.plinkk.fr/default_profile.png",
        );
      } catch {
        return reply.code(501).send({
          error: "canvas_unavailable",
          hint: "Le module 'canvas' n'est pas chargé. Utilisez Node 20 LTS ou installez une version compatible de canvas.",
        });
      }
    }
    const { createCanvas, loadImage, registerFont } = canvasMod;

    // Charger les polices (chemins relatifs au cwd du service)
    try {
      registerFont(path.resolve("assets/fonts/Inter-Bold.ttf"), {
        family: "Inter",
      });
      registerFont(path.resolve("assets/fonts/Inter-Regular.ttf"), {
        family: "Inter",
      });
    } catch { }

    const { id } = request.params as { id: string };
    const resolved = await resolvePlinkkPage(prisma, id, undefined, request);
    if (resolved.status !== 200)
      return reply.code(404).send({ error: "not_found" });

    const page = await prisma.plinkk.findUnique({
      where: { id: resolved.page.id },
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
        request.host +
        "https://cdn.plinkk.fr/default_profile.png";

      /* const image = page.settings.profileImage.startsWith("/public/")
        ? request.protocol + "://" + request.host + page.settings.profileImage
        : "https://plinkk.fr/" + page.settings.slug + ".png" ||
          request.host +
            "https://cdn.plinkk.fr/default_profile.png"; */

      const avatar = await loadImage(image);

      // Halo néon violet autour de l'avatar
      const glowRadius = avatarSize * 0.65;
      const gradientGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        glowRadius * 0.4,
        centerX,
        centerY,
        glowRadius,
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
        avatarSize,
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
