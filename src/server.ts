import "dotenv/config";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import Fastify from "fastify";
import path from "path";
import ejs from "ejs";
import {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
  unlinkSync,
} from "fs";
import crypto from "crypto";
import { PrismaClient, Role } from "../generated/prisma/client";
import { generateProfileConfig } from "./generateConfig";
import { minify } from "uglify-js";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import fastifyMultipart from '@fastify/multipart';
import bcrypt from "bcrypt";
import fastifySecureSession, { Session } from "@fastify/secure-session";
import z from "zod";

const prisma = new PrismaClient();
const fastify = Fastify({
  logger: true,
});
const PORT = Number(process.env.PORT) || 3001;

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
// support file uploads via multipart/form-data
fastify.register(fastifyMultipart, { attachFieldsToBody: true });
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

fastify.get("/", async function (request, reply) {
  const currentUserId = request.session.get("data") as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          userName: true,
          isPublic: true,
          email: true,
          image: true,
        },
      })
    : null;
  return reply.view("index.ejs", { currentUser });
});

// Pages statiques utiles
fastify.get("/about", async (request, reply) => {
  const currentUserId = request.session.get("data") as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          userName: true,
          isPublic: true,
          email: true,
          image: true,
        },
      })
    : null;
  return reply.view("about.ejs", { currentUser });
});
fastify.get("/privacy", async (request, reply) => {
  const currentUserId = request.session.get("data") as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          userName: true,
          isPublic: true,
          email: true,
          image: true,
        },
      })
    : null;
  return reply.view("privacy.ejs", { currentUser });
});
fastify.get("/terms", async (request, reply) => {
  const currentUserId = request.session.get("data") as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          userName: true,
          isPublic: true,
          email: true,
          image: true,
        },
      })
    : null;
  return reply.view("terms.ejs", { currentUser });
});
fastify.get("/cookies", async (request, reply) => {
  const currentUserId = request.session.get("data") as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          userName: true,
          isPublic: true,
          email: true,
          image: true,
        },
      })
    : null;
  return reply.view("cookies.ejs", { currentUser });
});
fastify.get("/legal", async (request, reply) => {
  const currentUserId = request.session.get("data") as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          userName: true,
          isPublic: true,
          email: true,
          image: true,
        },
      })
    : null;
  return reply.view("legal.ejs", { currentUser });
});

// robots.txt
fastify.get("/robots.txt", async (request, reply) => {
  const host =
    (request.headers["x-forwarded-host"] as string) ||
    (request.headers.host as string) ||
    "0.0.0.0:3001";
  const proto = (
    (request.headers["x-forwarded-proto"] as string) ||
    (request.protocol as string) ||
    "http"
  ).split(",")[0];
  const base = `${proto}://${host}`;
  reply
    .type("text/plain")
    .send(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
});

// sitemap.xml
fastify.get("/sitemap.xml", async (request, reply) => {
  const host =
    (request.headers["x-forwarded-host"] as string) ||
    (request.headers.host as string) ||
    "0.0.0.0:3001";
  const proto = (
    (request.headers["x-forwarded-proto"] as string) ||
    (request.protocol as string) ||
    "http"
  ).split(",")[0];
  const base = `${proto}://${host}`;
  const staticUrls = [
    "",
    "about",
    "contact",
    "privacy",
    "terms",
    "cookies",
    "legal",
    "users",
    "dashboard",
  ].map((p) => (p ? `${base}/${p}` : `${base}/`));
  const users = await prisma.user.findMany({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  const userUrls = users.map((u) => `${base}/${encodeURIComponent(u.id)}`);
  const urls = [...staticUrls, ...userUrls];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls.map((loc) => `\n  <url><loc>${loc}</loc></url>`).join("") +
    "\n</urlset>\n";
  reply.type("application/xml").send(xml);
});

fastify.get("/login", async function (request, reply) {
  const currentUserId = request.session.get("data") as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          userName: true,
          isPublic: true,
          email: true,
          image: true,
        },
      })
    : null;
  return reply.view("connect.ejs", { currentUser });
});

fastify.post("/register", async (req, reply) => {
  const { username, email, password, passwordVerif } = req.body as {
    username: string;
    email: string;
    password: string;
    passwordVerif: string;
  };
  // Nettoyage / validations de base
  const rawUsername = (username || "").trim();
  const rawEmail = (email || "").trim();
  const rawPassword = password || "";
  const rawPasswordVerif = passwordVerif || "";

  const hashedPassword = await bcrypt.hash(password, 10);

  // Vérif mots de passe
  if (password !== passwordVerif) {
    const emailParam = encodeURIComponent(rawEmail);
    const userParam = encodeURIComponent(rawUsername);
    return reply.redirect(
      `/login?error=${encodeURIComponent(
        "Les mots de passe ne correspondent pas"
      )}&email=${emailParam}&username=${userParam}#signup`
    );
  }
  if (rawPassword.length < 8) {
    const emailParam = encodeURIComponent(rawEmail);
    const userParam = encodeURIComponent(rawUsername);
    return reply.redirect(
      `/login?error=${encodeURIComponent(
        "Le mot de passe doit contenir au moins 8 caractères"
      )}&email=${emailParam}&username=${userParam}#signup`
    );
  }

  try {
    z.email().parse(rawEmail);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const emailParam = encodeURIComponent(rawEmail);
      const userParam = encodeURIComponent(rawUsername);
      return reply.redirect(
        `/login?error=${encodeURIComponent(
          "Email invalide"
        )}&email=${emailParam}&username=${userParam}#signup`
      );
    }
  }
  try {
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
        name: username,
        email: email,
        password: hashedPassword,
      },
    });
  } catch (error) {
    reply.redirect(
      "/login?error=" + encodeURIComponent("Utilisateur deja existant")
    );
  }

  return reply.redirect(
    "/login?success=" +
      encodeURIComponent("Compte créé. Vous pouvez vous connecter.")
  );
});

fastify.post("/login", async (request, reply) => {
  const { email, password } = request.body as {
    email: string;
    password: string;
  };
  const emailTrim = (email || "").trim();
  try {
    z.email().parse(emailTrim);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.redirect(
        `/login?error=${encodeURIComponent(
          "Email invalide"
        )}&email=${encodeURIComponent(emailTrim)}`
      );
    }
  }
  const user = await prisma.user.findFirst({
    where: {
      email: emailTrim,
    },
  });

  if (!user)
    return reply.redirect(
      `/login?error=${encodeURIComponent(
        "Utilisateur introuvable"
      )}&email=${encodeURIComponent(emailTrim)}`
    );
  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return reply.redirect(
      `/login?error=${encodeURIComponent(
        "Mot de passe incorrect"
      )}&email=${encodeURIComponent(emailTrim)}`
    );

  request.session.set("data", user.id);
  reply.redirect("/dashboard");
});

fastify.get("/dashboard", async function (request, reply) {
  const userId = request.session.get("data");
  if (!userId) return reply.redirect("/login");

  const userInfo = await prisma.user.findFirst({
    where: { id: userId },
    select: { cosmetics: true },
    omit: { password: true },
  });
  if (!userInfo) return reply.redirect("/login");

  const [linksCount, socialsCount, labelsCount, recentLinks] =
    await Promise.all([
      prisma.link.count({ where: { userId: userId as string } }),
      prisma.socialIcon.count({ where: { userId: userId as string } }),
      prisma.label.count({ where: { userId: userId as string } }),
      prisma.link.findMany({
        where: { userId: userId as string },
        orderBy: { id: "desc" },
        take: 10,
      }),
    ]);

  return reply.view("dashboard.ejs", {
    user: userInfo,
    stats: { links: linksCount, socials: socialsCount, labels: labelsCount },
    links: recentLinks,
  });
});

// Dashboard: Compte (gestion infos, confidentialité, cosmétiques)
fastify.get("/dashboard/account", async function (request, reply) {
  const userId = request.session.get("data");
  if (!userId) return reply.redirect("/login");
  const userInfo = await prisma.user.findFirst({
    where: { id: userId },
    select: { cosmetics: true },
    omit: { password: true },
  });
  if (!userInfo) return reply.redirect("/login");
  // Dérive les préférences depuis cosmetics json (pour éviter une migration)
  const cosmetics = (userInfo.cosmetics as any) || {};
  const privacy = cosmetics.settings || {};
  const isEmailPublic = Boolean(privacy.isEmailPublic);
  return reply.view("dashboard/account.ejs", { user: userInfo, isEmailPublic });
});

// Dashboard: Cosmétiques (aperçu et sélection)
fastify.get("/dashboard/cosmetics", async function (request, reply) {
  const userId = request.session.get("data");
  if (!userId) return reply.redirect("/login");
  const userInfo = await prisma.user.findFirst({
    where: { id: userId },
  select: { cosmetics: true },
    omit: { password: true },
  });
  if (!userInfo) return reply.redirect("/login");
  const cosmetics = (userInfo.cosmetics as any) || {};
  // Petit catalogue par défaut (certaines entrées "verrouillées" selon le rôle)
  const catalog = {
    flairs: [
      { key: "OG", label: "OG", locked: false },
      { key: "PARTNER", label: "PARTNER", locked: false },
      {
        key: "ADMIN",
        label: "ADMIN",
        locked: !(
          userInfo.role === Role.ADMIN || userInfo.role === Role.DEVELOPER
        ),
      },
      {
        key: "DEVELOPER",
        label: "DEVELOPER",
        locked: !(
          userInfo.role === Role.ADMIN || userInfo.role === Role.DEVELOPER
        ),
      },
      {
        key: "FOUNDER",
        label: "FOUNDER",
        locked: !(
          userInfo.role === Role.ADMIN || userInfo.role === Role.DEVELOPER
        ),
      },
    ],
    frames: [
      { key: "none", label: "Aucun", locked: false },
      { key: "neon", label: "Néon", locked: false },
      { key: "glow", label: "Glow", locked: false },
      { key: "gold", label: "Gold", locked: false },
    ],
    themes: [
      { key: "system", label: "Système", locked: false },
      { key: "dark-emerald", label: "Dark Emerald", locked: false },
      { key: "midnight", label: "Midnight", locked: false },
      { key: "plasma", label: "Plasma", locked: false },
    ],
    banners: [
      { key: "none", label: "Aucune", url: "", locked: false },
      {
        key: "gradient-emerald",
        label: "Dégradé Émeraude",
        url: "",
        locked: false,
      },
      {
        key: "gradient-fuchsia",
        label: "Dégradé Fuchsia",
        url: "",
        locked: false,
      },
    ],
  };
  return reply.view("dashboard/cosmetics.ejs", {
    user: userInfo,
    cosmetics,
    catalog,
  });
});

// Page d'édition du profil (éditeur complet)
fastify.get("/dashboard/edit", async function (request, reply) {
  const userId = request.session.get("data");
  if (!userId) return reply.redirect("/login");
  const userInfo = await prisma.user.findFirst({
    where: { id: userId },
    omit: { password: true },
  });
  if (!userInfo) return reply.redirect("/login");
  return reply.view("dashboard/edit.ejs", { user: userInfo });
});

// Dashboard: Statistiques (vue dédiée)
fastify.get("/dashboard/stats", async function (request, reply) {
  const userId = request.session.get("data");
  if (!userId) return reply.redirect("/login");
  const userInfo = await prisma.user.findFirst({
    where: { id: userId },
    omit: { password: true },
  });
  if (!userInfo) return reply.redirect("/login");
  return reply.view("dashboard/stats.ejs", { user: userInfo });
});

// Dashboard: Versions (vue dédiée)
fastify.get("/dashboard/versions", async function (request, reply) {
  const userId = request.session.get("data");
  if (!userId) return reply.redirect("/login");
  const userInfo = await prisma.user.findFirst({
    where: { id: userId },
    omit: { password: true },
  });
  if (!userInfo) return reply.redirect("/login");
  return reply.view("dashboard/versions.ejs", { user: userInfo });
});

// API: Récupérer la configuration complète du profil pour l'éditeur
fastify.get("/api/me/config", async (request, reply) => {
  const userId = request.session.get("data");
  if (!userId) return reply.code(401).send({ error: "Unauthorized" });
  try {
    const profile = await prisma.user.findFirst({
      where: { id: userId as string },
      include: {
        background: true,
        labels: true,
        neonColors: true,
        socialIcons: true,
        statusbar: true,
        links: true,
      },
    });
    if (!profile) return reply.code(404).send({ error: "Not found" });

    const config = {
      profileLink: profile.profileLink,
      profileImage: profile.profileImage,
      profileIcon: profile.profileIcon,
      profileSiteText: profile.profileSiteText,
      userName: profile.userName,
      // Email public (découplé de l'email de connexion): stocké dans User.publicEmail
      // Fallback vers l'email de compte pour compat rétro (affichage uniquement)
      email: (profile as any).publicEmail ?? profile.email ?? "",
      iconUrl: profile.iconUrl,
      description: profile.description,
      profileHoverColor: profile.profileHoverColor,
      degBackgroundColor: profile.degBackgroundColor,
      neonEnable: profile.neonEnable,
      buttonThemeEnable: profile.buttonThemeEnable,
      EnableAnimationArticle: profile.EnableAnimationArticle,
      EnableAnimationButton: profile.EnableAnimationButton,
      EnableAnimationBackground: profile.EnableAnimationBackground,
      backgroundSize: profile.backgroundSize,
      selectedThemeIndex: profile.selectedThemeIndex,
      selectedAnimationIndex: profile.selectedAnimationIndex,
      selectedAnimationButtonIndex: profile.selectedAnimationButtonIndex,
      selectedAnimationBackgroundIndex: profile.selectedAnimationBackgroundIndex,
      animationDurationBackground: profile.animationDurationBackground,
      delayAnimationButton: profile.delayAnimationButton,
      canvaEnable: profile.canvaEnable,
      selectedCanvasIndex: profile.selectedCanvasIndex,
      background: profile.background?.map((c) => c.color) ?? [],
      neonColors: profile.neonColors?.map((c) => c.color) ?? [],
      labels:
        profile.labels?.map((l) => ({
          data: l.data,
          color: l.color,
          fontColor: l.fontColor,
        })) ?? [],
      socialIcon:
        profile.socialIcons?.map((s) => ({ url: s.url, icon: s.icon })) ?? [],
      links:
        profile.links?.map((l) => ({
          icon: l.icon,
          url: l.url,
          text: l.text,
          name: l.name,
          description: l.description,
          showDescriptionOnHover: l.showDescriptionOnHover,
          showDescription: l.showDescription,
        })) ?? [],
      statusbar: profile.statusbar ?? null,
    };

    return reply.send(config);
  } catch (e) {
    request.log.error(e);
    // Return a minimal error payload to help identify the problem from the browser
    return reply.code(500).send({ error: "Internal Server Error", detail: String(e) });
  }
});

// API: Mettre à jour la configuration du profil depuis l'éditeur
fastify.put("/api/me/config", async (request, reply) => {
  const userId = request.session.get("data");
  if (!userId) return reply.code(401).send({ error: "Unauthorized" });

  const body = (request.body as any) ?? {};
  const pickDefined = (obj: Record<string, any>) =>
    Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

  await prisma.$transaction(async (tx) => {
    const userData = pickDefined({
      profileLink: body.profileLink,
      profileImage: body.profileImage,
      profileIcon: body.profileIcon,
      profileSiteText: body.profileSiteText,
      userName: body.userName,
      // email public (champ distinct)
      publicEmail: body.email,
      iconUrl: body.iconUrl,
      description: body.description,
      profileHoverColor: body.profileHoverColor,
      degBackgroundColor: body.degBackgroundColor,
      neonEnable: body.neonEnable,
      buttonThemeEnable: body.buttonThemeEnable,
      EnableAnimationArticle: body.EnableAnimationArticle,
      EnableAnimationButton: body.EnableAnimationButton,
      EnableAnimationBackground: body.EnableAnimationBackground,
      backgroundSize: body.backgroundSize,
      selectedThemeIndex: body.selectedThemeIndex,
      selectedAnimationIndex: body.selectedAnimationIndex,
      selectedAnimationButtonIndex: body.selectedAnimationButtonIndex,
      selectedAnimationBackgroundIndex: body.selectedAnimationBackgroundIndex,
      animationDurationBackground: body.animationDurationBackground,
      delayAnimationButton: body.delayAnimationButton,
      canvaEnable: body.canvaEnable,
      selectedCanvasIndex: body.selectedCanvasIndex,
    });
    if (Object.keys(userData).length > 0) {
      await tx.user.update({ where: { id: userId as string }, data: userData });
    }

    // Plus de persistance dans cosmetics: publicEmail est un champ dédié.

    if (Array.isArray(body.background)) {
      await tx.backgroundColor.deleteMany({
        where: { userId: userId as string },
      });
      if (body.background.length > 0) {
        await tx.backgroundColor.createMany({
          data: body.background.map((color: string) => ({
            color,
            userId: userId as string,
          })),
        });
      }
    }

    if (Array.isArray(body.neonColors)) {
      await tx.neonColor.deleteMany({ where: { userId: userId as string } });
      if (body.neonColors.length > 0) {
        await tx.neonColor.createMany({
          data: body.neonColors.map((color: string) => ({
            color,
            userId: userId as string,
          })),
        });
      }
    }

    if (Array.isArray(body.labels)) {
      await tx.label.deleteMany({ where: { userId: userId as string } });
      if (body.labels.length > 0) {
        await tx.label.createMany({
          data: body.labels.map((l: any) => ({
            data: l.data,
            color: l.color,
            fontColor: l.fontColor,
            userId: userId as string,
          })),
        });
      }
    }

    if (Array.isArray(body.socialIcon)) {
      await tx.socialIcon.deleteMany({ where: { userId: userId as string } });
      if (body.socialIcon.length > 0) {
        await tx.socialIcon.createMany({
          data: body.socialIcon.map((s: any) => ({
            url: s.url,
            icon: s.icon,
            userId: userId as string,
          })),
        });
      }
    }

    if (Array.isArray(body.links)) {
      await tx.link.deleteMany({ where: { userId: userId as string } });
      if (body.links.length > 0) {
        await tx.link.createMany({
          data: body.links.map((l: any) => ({
            icon: l.icon ?? undefined,
            url: l.url,
            text: l.text ?? undefined,
            name: l.name ?? undefined,
            description: l.description ?? undefined,
            showDescriptionOnHover: l.showDescriptionOnHover ?? undefined,
            showDescription: l.showDescription ?? undefined,
            userId: userId as string,
          })),
        });
      }
    }

    if (body.statusbar !== undefined) {
      const s = body.statusbar;
      if (s === null) {
        await tx.statusbar.deleteMany({ where: { userId: userId as string } });
      } else {
        await tx.statusbar.upsert({
          where: { userId: userId as string },
          create: {
            userId: userId as string,
            text: s.text ?? undefined,
            colorBg: s.colorBg ?? undefined,
            fontTextColor: s.fontTextColor ?? undefined,
            statusText: s.statusText ?? undefined,
          },
          update: pickDefined({
            text: s.text ?? undefined,
            colorBg: s.colorBg ?? undefined,
            fontTextColor: s.fontTextColor ?? undefined,
            statusText: s.statusText ?? undefined,
          }),
        });
      }
    }
  });

  return reply.send({ ok: true });
});

// Catalogue d'icônes disponibles pour l'éditeur
fastify.get("/api/icons", async (request, reply) => {
  const iconsDir = path.join(__dirname, "public", "images", "icons");
  if (!existsSync(iconsDir)) return reply.send([]);
  const entries = readdirSync(iconsDir, { withFileTypes: true });
  const toTitle = (s: string) =>
    s
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b(\w)/g, (_, c: string) => c.toUpperCase());
  const list = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".svg"))
    .map((e) => {
      const slug = e.name.replace(/\.svg$/i, "");
      return { slug, displayName: toTitle(slug) };
    });
  return reply.send(list);
});

fastify.get("/logout", (req, reply) => {
  req.session.delete();
  reply.redirect("/login");
});

// Liste publique de tous les profils
fastify.get("/users", async (request, reply) => {
  const currentUserId = request.session.get("data") as string | undefined;
  const currentUser = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          userName: true,
          isPublic: true,
          email: true,
          image: true,
        },
      })
    : null;
  const users = await prisma.user.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      userName: true,
      email: true,
      role: true,
      cosmetics: true,
      profileImage: true,
    },
    orderBy: { createdAt: "asc" },
  });
  return reply.view("users.ejs", { users, currentUser });
});

// API: uploader/remplacer la photo de profil (avatar) via data URL (base64)
fastify.post("/api/me/avatar", async (request, reply) => {
  const userId = request.session.get("data");
  if (!userId) return reply.code(401).send({ error: "Unauthorized" });
  const { dataUrl } = (request.body as any) || {};
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return reply.code(400).send({ error: "Invalid payload" });
  }
  try {
    const match = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i.exec(
      dataUrl
    );
    if (!match)
      return reply.code(400).send({ error: "Unsupported image format" });
    const mime = match[1].toLowerCase();
    const base64 = match[3];
    const buf = Buffer.from(base64, "base64");
    // Limite stricte: 128 Ko
    if (buf.byteLength > 128 * 1024) {
      return reply.code(413).send({ error: "Image trop lourde (max 128 Ko)" });
    }
    const ext = mime.endsWith("png")
      ? "png"
      : mime.endsWith("webp")
      ? "webp"
      : "jpg";
    const dir = path.join(__dirname, "public", "uploads", "avatars");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    // Déduplication par hash
    const hash = crypto.createHash("sha256").update(buf).digest("hex");
    const dedupName = `${hash}.${ext}`;
    const filePath = path.join(dir, dedupName);
    const publicUrl = `/public/uploads/avatars/${dedupName}`;

    // Récupérer l'ancienne image du compte (stockée comme nom de fichier ou ancienne URL)
    const me = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { image: true },
    });
    const oldVal = me?.image || null;

    if (!existsSync(filePath)) {
      writeFileSync(filePath, buf);
    }

    // Mettre à jour l'utilisateur avec l'URL publique complète (compat templates/UI)
    await prisma.user.update({
      where: { id: userId as string },
      data: { image: publicUrl },
    });

    // Nettoyage: tenter de supprimer l'ancienne image si non référencée par d'autres
    if (oldVal && oldVal !== publicUrl) {
      const refs = await prisma.user.count({ where: { image: oldVal } });
      if (refs === 0) {
        try {
          let oldPath = "";
          if (oldVal.startsWith("/public/uploads/avatars/")) {
            oldPath = path.join(
              __dirname,
              oldVal.replace(/^\/public\//, "public/")
            );
          } else {
            // ancien format stocké comme "hash.ext"
            oldPath = path.join(dir, oldVal);
          }
          if (existsSync(oldPath)) unlinkSync(oldPath);
        } catch {}
      }
    }

    return reply.send({ ok: true, file: dedupName, url: publicUrl });
  } catch (e) {
    request.log.error(e);
    return reply.code(500).send({ error: "Upload failed" });
  }
});

// API: uploader via multipart/form-data (file input)
fastify.post('/api/me/avatar-file', async (request, reply) => {
  const userId = request.session.get('data');
  if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
  try {
    // @ts-ignore - fastify multipart typings
    const parts = request.files || request.raw.files;
    // Fastify's multipart exposes a file stream via request.file() but depending on config we may read from request.body
    const mp = await (request as any).file();
    if (!mp) return reply.code(400).send({ error: 'No file uploaded' });
    const { file, filename, mimetype } = mp;
    if (!/^image\//i.test(mimetype)) return reply.code(400).send({ error: 'Invalid file type' });
    // limit size: 2MB
    const chunks: Buffer[] = [];
    for await (const chunk of file) chunks.push(Buffer.from(chunk));
    const buf = Buffer.concat(chunks);
    if (buf.length > 2 * 1024 * 1024) return reply.code(413).send({ error: 'Image too large' });

    const extMatch = (filename || '').match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : (mimetype.includes('png') ? 'png' : mimetype.includes('webp') ? 'webp' : 'jpg');

    const dir = path.join(__dirname, 'public', 'uploads', 'plinkk');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    const name = `${hash}.${ext}`;
    const filePath = path.join(dir, name);
    const publicUrl = `/public/uploads/plinkk/${name}`;

    if (!existsSync(filePath)) writeFileSync(filePath, buf);

    // update user image to new path for compatibility
    await prisma.user.update({ where: { id: userId as string }, data: { image: publicUrl } });

    return reply.send({ ok: true, url: publicUrl, file: name });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Upload failed' });
  }
});

// API: mise à jour de rôle (admin only - garde-fou minimal à compléter)
fastify.post("/api/users/:id/role", async (request, reply) => {
  const { id } = request.params as { id: string };
  const { role } = (request.body as any) || {};
  if (!Object.values(Role).includes(role))
    return reply.code(400).send({ error: "Invalid role" });
  const updated = await prisma.user.update({ where: { id }, data: { role } });
  return reply.send({ id: updated.id, role: updated.role });
});

// API: régler les cosmétiques (ex: flair, bannerUrl, frame)
fastify.post("/api/users/:id/cosmetics", async (request, reply) => {
  const { id } = request.params as { id: string };
  const cosmetics = (request.body as any) ?? null;
  const updated = await prisma.user.update({
    where: { id },
    data: { cosmetics },
  select: { cosmetics: true },
  });
  return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
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

// 404 handler (après routes spécifiques)
fastify.setNotFoundHandler((request, reply) => {
  if (request.raw.url?.startsWith("/api")) {
    return reply.code(404).send({ error: "Not Found" });
  }
  const userId = request.session.get("data");
  return reply
    .code(404)
    .view("erreurs/404.ejs", { currentUser: userId ? { id: userId } : null });
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  if (request.raw.url?.startsWith("/api")) {
    return reply.code(500).send({ error: "Internal Server Error" });
  }
  const userId = request.session.get("data");
  return reply.code(500).view("erreurs/500.ejs", {
    message: error?.message ?? "",
    currentUser: userId ? { id: userId } : null,
  });
});

// API: basculer la visibilité publique/privée de son profil
fastify.post("/api/me/visibility", async (request, reply) => {
  const userId = request.session.get("data");
  if (!userId) return reply.code(401).send({ error: "Unauthorized" });
  const { isPublic } = (request.body as any) ?? {};
  const updated = await prisma.user.update({
    where: { id: userId as string },
    data: { isPublic: Boolean(isPublic) },
    select: { id: true, isPublic: true },
  });
  return reply.send(updated);
});

// API: changer l'email
fastify.post("/api/me/email", async (request, reply) => {
  const userId = request.session.get("data");
  if (!userId) return reply.code(401).send({ error: "Unauthorized" });
  const { email } = (request.body as any) || {};
  try {
    z.email().parse(email);
  } catch (e) {
    return reply.code(400).send({ error: "Email invalide" });
  }
  // vérifier unicité
  const exists = await prisma.user.findFirst({
    where: { email, NOT: { id: userId as string } },
    select: { id: true },
  });
  if (exists) return reply.code(409).send({ error: "Email déjà utilisé" });
  const updated = await prisma.user.update({
    where: { id: userId as string },
    data: { email },
    select: { id: true, email: true },
  });
  return reply.send(updated);
});

// API: changer le mot de passe
fastify.post("/api/me/password", async (request, reply) => {
  const userId = request.session.get("data");
  if (!userId) return reply.code(401).send({ error: "Unauthorized" });
  const { currentPassword, newPassword, confirmPassword } =
    (request.body as any) || {};
  if (!currentPassword || !newPassword || !confirmPassword)
    return reply.code(400).send({ error: "Champs manquants" });
  if (newPassword !== confirmPassword)
    return reply
      .code(400)
      .send({ error: "Les mots de passe ne correspondent pas" });
  const user = await prisma.user.findUnique({
    where: { id: userId as string },
  });
  if (!user) return reply.code(404).send({ error: "Utilisateur introuvable" });
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok)
    return reply.code(403).send({ error: "Mot de passe actuel incorrect" });
  if (await bcrypt.compare(newPassword, user.password))
    return reply
      .code(400)
      .send({ error: "Nouveau mot de passe identique à l'actuel" });
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId as string },
    data: { password: hashed },
  });
  return reply.send({ ok: true });
});

// API: basculer la visibilité publique de l'email (stockée dans cosmetics.settings.isEmailPublic)
fastify.post("/api/me/email-visibility", async (request, reply) => {
  const userId = request.session.get("data");
  if (!userId) return reply.code(401).send({ error: "Unauthorized" });
  const { isEmailPublic } = (request.body as any) ?? {};
  const u = await prisma.user.findUnique({
    where: { id: userId as string },
    select: { cosmetics: true },
  });
  const cosmetics: any = (u?.cosmetics as any) || {};
  cosmetics.settings = {
    ...(cosmetics.settings || {}),
    isEmailPublic: Boolean(isEmailPublic),
  };
  // If the user enables public email but doesn't have publicEmail set,
  // promote the account email to publicEmail so it becomes visible in the users list.
  if (isEmailPublic) {
    const me = await prisma.user.findUnique({ where: { id: userId as string }, select: { publicEmail: true, email: true } });
    if (me && (!me.publicEmail || String(me.publicEmail).trim() === '')) {
      // set publicEmail to current account email
      await prisma.user.update({ where: { id: userId as string }, data: { publicEmail: me.email } });
    }
  }
  const updated = await prisma.user.update({
    where: { id: userId as string },
    data: { cosmetics },
    select: { id: true, cosmetics: true },
  });
  return reply.send({
    id: updated.id,
    isEmailPublic: Boolean((updated.cosmetics as any)?.settings?.isEmailPublic),
  });
});

// API: mettre à jour des infos de base du compte (username, name, description)
fastify.post("/api/me/profile", async (request, reply) => {
  const userId = request.session.get("data");
  if (!userId) return reply.code(401).send({ error: "Unauthorized" });
  const body = (request.body as any) || {};
  const data: any = {};
  if (typeof body.userName === "string" && body.userName.trim())
    data.userName = body.userName.trim();
  if (typeof body.name === "string" && body.name.trim())
    data.name = body.name.trim();
  if (typeof body.description === "string") data.description = body.description;
  const updated = await prisma.user.update({
    where: { id: userId as string },
    data,
    select: { id: true, userName: true, name: true, description: true },
  });
  return reply.send(updated);
});

// API: sélectionner des cosmétiques (flair, bannerUrl, frame, theme)
fastify.post("/api/me/cosmetics", async (request, reply) => {
  const userId = request.session.get("data");
  if (!userId) return reply.code(401).send({ error: "Unauthorized" });
  const body = (request.body as any) || {};
  const u = await prisma.user.findUnique({
    where: { id: userId as string },
    select: { cosmetics: true },
  });
  const cosmetics: any = (u?.cosmetics as any) || {};
  cosmetics.selected = {
    // Le flair n'est plus modifiable par l'utilisateur (uniquement via code/admin)
    flair: cosmetics.selected?.flair ?? null,
    bannerUrl: body.bannerUrl ?? cosmetics.selected?.bannerUrl ?? null,
    banner: body.banner ?? cosmetics.selected?.banner ?? null,
    frame: body.frame ?? cosmetics.selected?.frame ?? null,
    theme: body.theme ?? cosmetics.selected?.theme ?? null,
  };
  const updated = await prisma.user.update({
    where: { id: userId as string },
    data: { cosmetics },
    select: { id: true, cosmetics: true },
  });
  return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
});

// API: appliquer un starter pack de cosmétiques
fastify.post("/api/me/cosmetics/starter-pack", async (request, reply) => {
  const userId = request.session.get("data");
  if (!userId) return reply.code(401).send({ error: "Unauthorized" });
  const u = await prisma.user.findUnique({
    where: { id: userId as string },
    select: { role: true, cosmetics: true },
  });
  if (!u) return reply.code(404).send({ error: "Utilisateur introuvable" });
  const baseFlair =
    u.role === Role.ADMIN || u.role === Role.DEVELOPER ? "DEVELOPER" : "OG";
  const cosmetics: any = (u.cosmetics as any) || {};
  // Le starter pack n'attribue plus de flair automatiquement (laisse tel quel)
  cosmetics.selected = {
    flair: cosmetics.selected?.flair ?? null,
    frame: "neon",
    theme: "dark-emerald",
    banner: "gradient-emerald",
    bannerUrl: "",
  };
  const updated = await prisma.user.update({
    where: { id: userId as string },
    data: { cosmetics },
    select: { id: true, cosmetics: true },
  });
  return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
});

fastify.listen({ port: PORT, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.info(`Server is now listening on ${address}`);
});
