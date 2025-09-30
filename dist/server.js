"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const static_1 = __importDefault(require("@fastify/static"));
const view_1 = __importDefault(require("@fastify/view"));
const fastify_1 = __importDefault(require("fastify"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const fs_1 = require("fs");
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("../generated/prisma/client");
const generateConfig_1 = require("./generateConfig");
const uglify_js_1 = require("uglify-js");
const cookie_1 = __importDefault(require("@fastify/cookie"));
const formbody_1 = __importDefault(require("@fastify/formbody"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const secure_session_1 = __importDefault(require("@fastify/secure-session"));
const zod_1 = __importDefault(require("zod"));
const prisma = new client_1.PrismaClient();
const fastify = (0, fastify_1.default)({
    logger: true,
});
const PORT = Number(process.env.PORT) || 3001;
fastify.register(view_1.default, {
    engine: {
        ejs: ejs_1.default,
    },
    root: path_1.default.join(__dirname, "views"),
});
fastify.register(static_1.default, {
    root: path_1.default.join(__dirname, "public"),
    prefix: "/public/", // optional: default '/'
});
fastify.register(formbody_1.default);
fastify.register(cookie_1.default);
fastify.register(secure_session_1.default, {
    sessionName: "session",
    cookieName: "plinkk-backend",
    key: (0, fs_1.readFileSync)(path_1.default.join(__dirname, "secret-key")),
    expiry: 24 * 60 * 60,
    cookie: {
        path: "/",
    },
});
fastify.get("/", async function (request, reply) {
    const currentUserId = request.session.get("data");
    const currentUser = currentUserId ? await prisma.user.findUnique({ where: { id: currentUserId }, select: { id: true, userName: true, isPublic: true, email: true, image: true } }) : null;
    return reply.view("index.ejs", { currentUser });
});
// Pages statiques utiles
fastify.get("/about", async (request, reply) => {
    const currentUserId = request.session.get("data");
    const currentUser = currentUserId ? await prisma.user.findUnique({ where: { id: currentUserId }, select: { id: true, userName: true, isPublic: true, email: true, image: true } }) : null;
    return reply.view("about.ejs", { currentUser });
});
fastify.get("/privacy", async (request, reply) => {
    const currentUserId = request.session.get("data");
    const currentUser = currentUserId ? await prisma.user.findUnique({ where: { id: currentUserId }, select: { id: true, userName: true, isPublic: true, email: true, image: true } }) : null;
    return reply.view("privacy.ejs", { currentUser });
});
fastify.get("/terms", async (request, reply) => {
    const currentUserId = request.session.get("data");
    const currentUser = currentUserId ? await prisma.user.findUnique({ where: { id: currentUserId }, select: { id: true, userName: true, isPublic: true, email: true, image: true } }) : null;
    return reply.view("terms.ejs", { currentUser });
});
fastify.get("/cookies", async (request, reply) => {
    const currentUserId = request.session.get("data");
    const currentUser = currentUserId ? await prisma.user.findUnique({ where: { id: currentUserId }, select: { id: true, userName: true, isPublic: true, email: true, image: true } }) : null;
    return reply.view("cookies.ejs", { currentUser });
});
fastify.get("/legal", async (request, reply) => {
    const currentUserId = request.session.get("data");
    const currentUser = currentUserId ? await prisma.user.findUnique({ where: { id: currentUserId }, select: { id: true, userName: true, isPublic: true, email: true, image: true } }) : null;
    return reply.view("legal.ejs", { currentUser });
});
// robots.txt
fastify.get("/robots.txt", async (request, reply) => {
    const host = request.headers["x-forwarded-host"] || request.headers.host || "0.0.0.0:3001";
    const proto = (request.headers["x-forwarded-proto"] || request.protocol || "http").split(",")[0];
    const base = `${proto}://${host}`;
    reply.type("text/plain").send(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
});
// sitemap.xml
fastify.get("/sitemap.xml", async (request, reply) => {
    const host = request.headers["x-forwarded-host"] || request.headers.host || "0.0.0.0:3001";
    const proto = (request.headers["x-forwarded-proto"] || request.protocol || "http").split(",")[0];
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
    const users = await prisma.user.findMany({ select: { id: true }, orderBy: { createdAt: "asc" } });
    const userUrls = users.map((u) => `${base}/${encodeURIComponent(u.id)}`);
    const urls = [...staticUrls, ...userUrls];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
        urls
            .map((loc) => `\n  <url><loc>${loc}</loc></url>`)
            .join("") +
        "\n</urlset>\n";
    reply.type("application/xml").send(xml);
});
fastify.get("/login", async function (request, reply) {
    const currentUserId = request.session.get("data");
    const currentUser = currentUserId ? await prisma.user.findUnique({ where: { id: currentUserId }, select: { id: true, userName: true, isPublic: true, email: true, image: true } }) : null;
    return reply.view("connect.ejs", { currentUser });
});
fastify.post("/register", async (req, reply) => {
    const { username, email, password, passwordVerif } = req.body;
    // Nettoyage / validations de base
    const rawUsername = (username || "").trim();
    const rawEmail = (email || "").trim();
    const rawPassword = password || "";
    const rawPasswordVerif = passwordVerif || "";
    // Vérif mots de passe
    if (rawPassword !== rawPasswordVerif) {
        const emailParam = encodeURIComponent(rawEmail);
        const userParam = encodeURIComponent(rawUsername);
        return reply.redirect(`/login?error=${encodeURIComponent("Les mots de passe ne correspondent pas")}&email=${emailParam}&username=${userParam}#signup`);
    }
    if (rawPassword.length < 8) {
        const emailParam = encodeURIComponent(rawEmail);
        const userParam = encodeURIComponent(rawUsername);
        return reply.redirect(`/login?error=${encodeURIComponent("Le mot de passe doit contenir au moins 8 caractères")}&email=${emailParam}&username=${userParam}#signup`);
    }
    try {
        zod_1.default.email().parse(rawEmail);
    }
    catch (error) {
        if (error instanceof zod_1.default.ZodError) {
            const emailParam = encodeURIComponent(rawEmail);
            const userParam = encodeURIComponent(rawUsername);
            return reply.redirect(`/login?error=${encodeURIComponent("Email invalide")}&email=${emailParam}&username=${userParam}#signup`);
        }
    }
    // Générer le slug id basé sur le username
    const normalizedId = rawUsername
        .replaceAll(" ", "-")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    if (!normalizedId) {
        const emailParam = encodeURIComponent(rawEmail);
        const userParam = encodeURIComponent(rawUsername);
        return reply.redirect(`/login?error=${encodeURIComponent("Nom d'utilisateur invalide")}&email=${emailParam}&username=${userParam}#signup`);
    }
    // Vérifier doublons (email et id)
    const [emailExists, idExists] = await Promise.all([
        prisma.user.findFirst({ where: { email: rawEmail }, select: { id: true } }),
        prisma.user.findUnique({ where: { id: normalizedId }, select: { id: true } }),
    ]);
    if (emailExists) {
        const emailParam = encodeURIComponent(rawEmail);
        const userParam = encodeURIComponent(rawUsername);
        return reply.redirect(`/login?error=${encodeURIComponent("Email déjà utilisé")}&email=${emailParam}&username=${userParam}#signup`);
    }
    if (idExists) {
        const emailParam = encodeURIComponent(rawEmail);
        const userParam = encodeURIComponent(rawUsername);
        return reply.redirect(`/login?error=${encodeURIComponent("Nom d'utilisateur déjà pris")}&email=${emailParam}&username=${userParam}#signup`);
    }
    const hashedPassword = await bcrypt_1.default.hash(rawPassword, 10);
    await prisma.user.create({
        data: {
            id: normalizedId,
            userName: rawUsername,
            name: rawUsername,
            email: rawEmail,
            password: hashedPassword,
        },
    });
    return reply.redirect("/login?success=" + encodeURIComponent("Compte créé. Vous pouvez vous connecter."));
});
fastify.post("/login", async (request, reply) => {
    const { email, password } = request.body;
    const emailTrim = (email || "").trim();
    try {
        zod_1.default.email().parse(emailTrim);
    }
    catch (error) {
        if (error instanceof zod_1.default.ZodError) {
            return reply.redirect(`/login?error=${encodeURIComponent("Email invalide")}&email=${encodeURIComponent(emailTrim)}`);
        }
    }
    const user = await prisma.user.findFirst({
        where: {
            email: emailTrim,
        },
    });
    if (!user)
        return reply.redirect(`/login?error=${encodeURIComponent("Utilisateur introuvable")}&email=${encodeURIComponent(emailTrim)}`);
    const valid = await bcrypt_1.default.compare(password, user.password);
    if (!valid)
        return reply.redirect(`/login?error=${encodeURIComponent("Mot de passe incorrect")}&email=${encodeURIComponent(emailTrim)}`);
    request.session.set("data", user.id);
    reply.redirect("/dashboard");
});
fastify.get("/dashboard", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId)
        return reply.redirect("/login");
    const userInfo = await prisma.user.findFirst({
        where: { id: userId },
        omit: { password: true },
    });
    if (!userInfo)
        return reply.redirect("/login");
    const [linksCount, socialsCount, labelsCount, recentLinks] = await Promise.all([
        prisma.link.count({ where: { userId: userId } }),
        prisma.socialIcon.count({ where: { userId: userId } }),
        prisma.label.count({ where: { userId: userId } }),
        prisma.link.findMany({ where: { userId: userId }, orderBy: { id: "desc" }, take: 10 }),
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
    if (!userId)
        return reply.redirect("/login");
    const userInfo = await prisma.user.findFirst({ where: { id: userId }, omit: { password: true } });
    if (!userInfo)
        return reply.redirect("/login");
    // Dérive les préférences depuis cosmetics json (pour éviter une migration)
    const cosmetics = userInfo.cosmetics || {};
    const privacy = cosmetics.settings || {};
    const isEmailPublic = Boolean(privacy.isEmailPublic);
    return reply.view("dashboard-account.ejs", { user: userInfo, isEmailPublic });
});
// Dashboard: Cosmétiques (aperçu et sélection)
fastify.get("/dashboard/cosmetics", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId)
        return reply.redirect("/login");
    const userInfo = await prisma.user.findFirst({ where: { id: userId }, omit: { password: true } });
    if (!userInfo)
        return reply.redirect("/login");
    const cosmetics = userInfo.cosmetics || {};
    // Petit catalogue par défaut (certaines entrées "verrouillées" selon le rôle)
    const catalog = {
        flairs: [
            { key: "OG", label: "OG", locked: false },
            { key: "PARTNER", label: "PARTNER", locked: false },
            { key: "ADMIN", label: "ADMIN", locked: !(userInfo.role === client_1.Role.ADMIN || userInfo.role === client_1.Role.DEVELOPER) },
            { key: "DEVELOPER", label: "DEVELOPER", locked: !(userInfo.role === client_1.Role.ADMIN || userInfo.role === client_1.Role.DEVELOPER) },
            { key: "FOUNDER", label: "FOUNDER", locked: !(userInfo.role === client_1.Role.ADMIN || userInfo.role === client_1.Role.DEVELOPER) },
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
            { key: "gradient-emerald", label: "Dégradé Émeraude", url: "", locked: false },
            { key: "gradient-fuchsia", label: "Dégradé Fuchsia", url: "", locked: false },
        ],
    };
    return reply.view("dashboard-cosmetics.ejs", { user: userInfo, cosmetics, catalog });
});
// Page d'édition du profil (éditeur complet)
fastify.get("/dashboard/edit", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId)
        return reply.redirect("/login");
    const userInfo = await prisma.user.findFirst({
        where: { id: userId },
        omit: { password: true },
    });
    if (!userInfo)
        return reply.redirect("/login");
    return reply.view("dashboard-edit.ejs", { user: userInfo });
});
// Dashboard: Statistiques (vue dédiée)
fastify.get("/dashboard/stats", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId)
        return reply.redirect("/login");
    const userInfo = await prisma.user.findFirst({ where: { id: userId }, omit: { password: true } });
    if (!userInfo)
        return reply.redirect("/login");
    return reply.view("dashboard-stats.ejs", { user: userInfo });
});
// Dashboard: Versions (vue dédiée)
fastify.get("/dashboard/versions", async function (request, reply) {
    const userId = request.session.get("data");
    if (!userId)
        return reply.redirect("/login");
    const userInfo = await prisma.user.findFirst({ where: { id: userId }, omit: { password: true } });
    if (!userInfo)
        return reply.redirect("/login");
    return reply.view("dashboard-versions.ejs", { user: userInfo });
});
// API: Récupérer la configuration complète du profil pour l'éditeur
fastify.get("/api/me/config", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId)
        return reply.code(401).send({ error: "Unauthorized" });
    const profile = await prisma.user.findFirst({
        where: { id: userId },
        include: {
            background: true,
            labels: true,
            neonColors: true,
            socialIcons: true,
            statusbar: true,
            links: true,
        },
    });
    if (!profile)
        return reply.code(404).send({ error: "Not found" });
    const config = {
        profileLink: profile.profileLink,
        profileImage: profile.profileImage,
        profileIcon: profile.profileIcon,
        profileSiteText: profile.profileSiteText,
        userName: profile.userName,
        // Email public (découplé de l'email de connexion): stocké dans User.publicEmail
        // Fallback vers l'email de compte pour compat rétro (affichage uniquement)
        email: profile.publicEmail ?? profile.email ?? "",
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
        labels: profile.labels?.map((l) => ({
            data: l.data,
            color: l.color,
            fontColor: l.fontColor,
        })) ?? [],
        socialIcon: profile.socialIcons?.map((s) => ({ url: s.url, icon: s.icon })) ?? [],
        links: profile.links?.map((l) => ({
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
});
// API: Mettre à jour la configuration du profil depuis l'éditeur
fastify.put("/api/me/config", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId)
        return reply.code(401).send({ error: "Unauthorized" });
    const body = request.body ?? {};
    const pickDefined = (obj) => Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
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
            await tx.user.update({ where: { id: userId }, data: userData });
        }
        // Plus de persistance dans cosmetics: publicEmail est un champ dédié.
        if (Array.isArray(body.background)) {
            await tx.backgroundColor.deleteMany({ where: { userId: userId } });
            if (body.background.length > 0) {
                await tx.backgroundColor.createMany({
                    data: body.background.map((color) => ({ color, userId: userId })),
                });
            }
        }
        if (Array.isArray(body.neonColors)) {
            await tx.neonColor.deleteMany({ where: { userId: userId } });
            if (body.neonColors.length > 0) {
                await tx.neonColor.createMany({
                    data: body.neonColors.map((color) => ({ color, userId: userId })),
                });
            }
        }
        if (Array.isArray(body.labels)) {
            await tx.label.deleteMany({ where: { userId: userId } });
            if (body.labels.length > 0) {
                await tx.label.createMany({
                    data: body.labels.map((l) => ({
                        data: l.data,
                        color: l.color,
                        fontColor: l.fontColor,
                        userId: userId,
                    })),
                });
            }
        }
        if (Array.isArray(body.socialIcon)) {
            await tx.socialIcon.deleteMany({ where: { userId: userId } });
            if (body.socialIcon.length > 0) {
                await tx.socialIcon.createMany({
                    data: body.socialIcon.map((s) => ({
                        url: s.url,
                        icon: s.icon,
                        userId: userId,
                    })),
                });
            }
        }
        if (Array.isArray(body.links)) {
            await tx.link.deleteMany({ where: { userId: userId } });
            if (body.links.length > 0) {
                await tx.link.createMany({
                    data: body.links.map((l) => ({
                        icon: l.icon ?? undefined,
                        url: l.url,
                        text: l.text ?? undefined,
                        name: l.name ?? undefined,
                        description: l.description ?? undefined,
                        showDescriptionOnHover: l.showDescriptionOnHover ?? undefined,
                        showDescription: l.showDescription ?? undefined,
                        userId: userId,
                    })),
                });
            }
        }
        if (body.statusbar !== undefined) {
            const s = body.statusbar;
            if (s === null) {
                await tx.statusbar.deleteMany({ where: { userId: userId } });
            }
            else {
                await tx.statusbar.upsert({
                    where: { userId: userId },
                    create: {
                        userId: userId,
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
    const iconsDir = path_1.default.join(__dirname, "public", "images", "icons");
    if (!(0, fs_1.existsSync)(iconsDir))
        return reply.send([]);
    const entries = (0, fs_1.readdirSync)(iconsDir, { withFileTypes: true });
    const toTitle = (s) => s
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b(\w)/g, (_, c) => c.toUpperCase());
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
    const currentUserId = request.session.get("data");
    const currentUser = currentUserId ? await prisma.user.findUnique({ where: { id: currentUserId }, select: { id: true, userName: true, isPublic: true, email: true, image: true } }) : null;
    const users = await prisma.user.findMany({
        where: { isPublic: true },
        select: { id: true, userName: true, email: true, role: true, cosmetics: true, profileImage: true },
        orderBy: { createdAt: "asc" },
    });
    return reply.view("users.ejs", { users, currentUser });
});
// API: uploader/remplacer la photo de profil (avatar) via data URL (base64)
fastify.post("/api/me/avatar", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId)
        return reply.code(401).send({ error: "Unauthorized" });
    const { dataUrl } = request.body || {};
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
        return reply.code(400).send({ error: "Invalid payload" });
    }
    try {
        const match = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i.exec(dataUrl);
        if (!match)
            return reply.code(400).send({ error: "Unsupported image format" });
        const mime = match[1].toLowerCase();
        const base64 = match[3];
        const buf = Buffer.from(base64, "base64");
        // Limite stricte: 128 Ko
        if (buf.byteLength > 128 * 1024) {
            return reply.code(413).send({ error: "Image trop lourde (max 128 Ko)" });
        }
        const ext = mime.endsWith("png") ? "png" : mime.endsWith("webp") ? "webp" : "jpg";
        const dir = path_1.default.join(__dirname, "public", "uploads", "avatars");
        if (!(0, fs_1.existsSync)(dir))
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        // Déduplication par hash
        const hash = crypto_1.default.createHash("sha256").update(buf).digest("hex");
        const dedupName = `${hash}.${ext}`;
        const filePath = path_1.default.join(dir, dedupName);
        const publicUrl = `/public/uploads/avatars/${dedupName}`;
        // Récupérer l'ancienne image du compte (stockée comme nom de fichier ou ancienne URL)
        const me = await prisma.user.findUnique({ where: { id: userId }, select: { image: true } });
        const oldVal = me?.image || null;
        if (!(0, fs_1.existsSync)(filePath)) {
            (0, fs_1.writeFileSync)(filePath, buf);
        }
        // Mettre à jour l'utilisateur avec l'URL publique complète (compat templates/UI)
        await prisma.user.update({ where: { id: userId }, data: { image: publicUrl } });
        // Nettoyage: tenter de supprimer l'ancienne image si non référencée par d'autres
        if (oldVal && oldVal !== publicUrl) {
            const refs = await prisma.user.count({ where: { image: oldVal } });
            if (refs === 0) {
                try {
                    let oldPath = "";
                    if (oldVal.startsWith("/public/uploads/avatars/")) {
                        oldPath = path_1.default.join(__dirname, oldVal.replace(/^\/public\//, "public/"));
                    }
                    else {
                        // ancien format stocké comme "hash.ext"
                        oldPath = path_1.default.join(dir, oldVal);
                    }
                    if ((0, fs_1.existsSync)(oldPath))
                        (0, fs_1.unlinkSync)(oldPath);
                }
                catch { }
            }
        }
        return reply.send({ ok: true, file: dedupName, url: publicUrl });
    }
    catch (e) {
        request.log.error(e);
        return reply.code(500).send({ error: "Upload failed" });
    }
});
// API: mise à jour de rôle (admin only - garde-fou minimal à compléter)
fastify.post("/api/users/:id/role", async (request, reply) => {
    const { id } = request.params;
    const { role } = request.body || {};
    if (!Object.values(client_1.Role).includes(role))
        return reply.code(400).send({ error: "Invalid role" });
    const updated = await prisma.user.update({ where: { id }, data: { role } });
    return reply.send({ id: updated.id, role: updated.role });
});
// API: régler les cosmétiques (ex: flair, bannerUrl, frame)
fastify.post("/api/users/:id/cosmetics", async (request, reply) => {
    const { id } = request.params;
    const cosmetics = request.body ?? null;
    const updated = await prisma.user.update({ where: { id }, data: { cosmetics } });
    return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
});
fastify.get("/:username", function (request, reply) {
    const { username } = request.params;
    if (username === "") {
        reply.code(404).send({ error: "please specify a username" });
        return;
    }
    reply.view("links.ejs", { username: username });
});
fastify.get("/:username/css/:cssFileName", function (request, reply) {
    const { username, cssFileName } = request.params;
    if (username === "") {
        reply.code(404).send({ error: "please specify a username" });
        return;
    }
    if (cssFileName === "") {
        reply.code(404).send({ error: "please specify a js file" });
        return;
    }
    if ((0, fs_1.existsSync)(path_1.default.join(__dirname, "public", "css", cssFileName))) {
        return reply.sendFile(`css/${cssFileName}`);
    }
    return reply.code(404).send({ error: "non existant file" });
});
fastify.get("/:username/js/:jsFileName", function (request, reply) {
    const { username, jsFileName } = request.params;
    if (username === "") {
        reply.code(404).send({ error: "please specify a username" });
        return;
    }
    if (jsFileName === "") {
        reply.code(404).send({ error: "please specify a css file" });
        return;
    }
    if ((0, fs_1.existsSync)(path_1.default.join(__dirname, "public", "js", jsFileName))) {
        const file = (0, fs_1.readFileSync)(path_1.default.join(__dirname, "public", "js", jsFileName), { encoding: "utf-8" });
        const mini = (0, uglify_js_1.minify)(file.replaceAll("{{username}}", username));
        return reply.type("text/javascript").send(mini.code);
    }
    return reply.code(404).send({ error: "non existant file" });
});
fastify.get("/:username/canvaAnimation/*", function (request, reply) {
    const { username } = request.params;
    const animationFileName = request.params["*"];
    if (username === "") {
        reply.code(404).send({ error: "please specify a username" });
        return;
    }
    if (animationFileName === "") {
        reply.code(404).send({ error: "please specify a css file" });
        return;
    }
    if ((0, fs_1.existsSync)(path_1.default.join(__dirname, "public", "canvaAnimation", animationFileName))) {
        return reply.sendFile(`canvaAnimation/${animationFileName}`);
    }
    return reply.code(404).send({ error: "non existant file" });
});
fastify.get("/:username/js/config/:configFileName", async function (request, reply) {
    const { username, configFileName } = request.params;
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
        const mini = (0, uglify_js_1.minify)((0, generateConfig_1.generateProfileConfig)(profile, profile.links, profile.background, profile.labels, profile.neonColors, profile.socialIcons, profile.statusbar).replaceAll("{{username}}", username));
        return reply.type("text/javascript").send(mini.code);
    }
    if ((0, fs_1.existsSync)(path_1.default.join(__dirname, "public", "config", configFileName))) {
        const file = (0, fs_1.readFileSync)(path_1.default.join(__dirname, "public", "config", configFileName), { encoding: "utf-8" });
        return reply
            .type("text/javascript")
            .send(file.replaceAll("{{username}}", username));
    }
    return reply.code(404).send({ error: "non existant file" });
});
fastify.get("/:username/images/*", function (request, reply) {
    const { username } = request.params;
    const image = request.params["*"];
    if (username === "") {
        reply.code(404).send({ error: "please specify a username" });
        return;
    }
    if (image === "") {
        reply.code(404).send({ error: "please specify a css file" });
        return;
    }
    if ((0, fs_1.existsSync)(path_1.default.join(__dirname, "public", "images", image))) {
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
    return reply.code(404).view("404.ejs", { currentUser: userId ? { id: userId } : null });
});
// Error handler
fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    if (request.raw.url?.startsWith("/api")) {
        return reply.code(500).send({ error: "Internal Server Error" });
    }
    const userId = request.session.get("data");
    return reply.code(500).view("500.ejs", { message: error?.message ?? "", currentUser: userId ? { id: userId } : null });
});
// API: basculer la visibilité publique/privée de son profil
fastify.post("/api/me/visibility", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId)
        return reply.code(401).send({ error: "Unauthorized" });
    const { isPublic } = request.body ?? {};
    const updated = await prisma.user.update({ where: { id: userId }, data: { isPublic: Boolean(isPublic) }, select: { id: true, isPublic: true } });
    return reply.send(updated);
});
// API: changer l'email
fastify.post("/api/me/email", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId)
        return reply.code(401).send({ error: "Unauthorized" });
    const { email } = request.body || {};
    try {
        zod_1.default.email().parse(email);
    }
    catch (e) {
        return reply.code(400).send({ error: "Email invalide" });
    }
    // vérifier unicité
    const exists = await prisma.user.findFirst({ where: { email, NOT: { id: userId } }, select: { id: true } });
    if (exists)
        return reply.code(409).send({ error: "Email déjà utilisé" });
    const updated = await prisma.user.update({ where: { id: userId }, data: { email }, select: { id: true, email: true } });
    return reply.send(updated);
});
// API: changer le mot de passe
fastify.post("/api/me/password", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId)
        return reply.code(401).send({ error: "Unauthorized" });
    const { currentPassword, newPassword, confirmPassword } = request.body || {};
    if (!currentPassword || !newPassword || !confirmPassword)
        return reply.code(400).send({ error: "Champs manquants" });
    if (newPassword !== confirmPassword)
        return reply.code(400).send({ error: "Les mots de passe ne correspondent pas" });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        return reply.code(404).send({ error: "Utilisateur introuvable" });
    const ok = await bcrypt_1.default.compare(currentPassword, user.password);
    if (!ok)
        return reply.code(403).send({ error: "Mot de passe actuel incorrect" });
    if (await bcrypt_1.default.compare(newPassword, user.password))
        return reply.code(400).send({ error: "Nouveau mot de passe identique à l'actuel" });
    const hashed = await bcrypt_1.default.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return reply.send({ ok: true });
});
// API: basculer la visibilité publique de l'email (stockée dans cosmetics.settings.isEmailPublic)
fastify.post("/api/me/email-visibility", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId)
        return reply.code(401).send({ error: "Unauthorized" });
    const { isEmailPublic } = request.body ?? {};
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { cosmetics: true } });
    const cosmetics = u?.cosmetics || {};
    cosmetics.settings = { ...(cosmetics.settings || {}), isEmailPublic: Boolean(isEmailPublic) };
    const updated = await prisma.user.update({ where: { id: userId }, data: { cosmetics }, select: { id: true, cosmetics: true } });
    return reply.send({ id: updated.id, isEmailPublic: Boolean(updated.cosmetics?.settings?.isEmailPublic) });
});
// API: mettre à jour des infos de base du compte (username, name, description)
fastify.post("/api/me/profile", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId)
        return reply.code(401).send({ error: "Unauthorized" });
    const body = request.body || {};
    const data = {};
    if (typeof body.userName === 'string' && body.userName.trim())
        data.userName = body.userName.trim();
    if (typeof body.name === 'string' && body.name.trim())
        data.name = body.name.trim();
    if (typeof body.description === 'string')
        data.description = body.description;
    const updated = await prisma.user.update({ where: { id: userId }, data, select: { id: true, userName: true, name: true, description: true } });
    return reply.send(updated);
});
// API: sélectionner des cosmétiques (flair, bannerUrl, frame, theme)
fastify.post("/api/me/cosmetics", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId)
        return reply.code(401).send({ error: "Unauthorized" });
    const body = request.body || {};
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { cosmetics: true } });
    const cosmetics = u?.cosmetics || {};
    cosmetics.selected = {
        // Le flair n'est plus modifiable par l'utilisateur (uniquement via code/admin)
        flair: cosmetics.selected?.flair ?? null,
        bannerUrl: body.bannerUrl ?? cosmetics.selected?.bannerUrl ?? null,
        banner: body.banner ?? cosmetics.selected?.banner ?? null,
        frame: body.frame ?? cosmetics.selected?.frame ?? null,
        theme: body.theme ?? cosmetics.selected?.theme ?? null,
    };
    const updated = await prisma.user.update({ where: { id: userId }, data: { cosmetics }, select: { id: true, cosmetics: true } });
    return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
});
// API: appliquer un starter pack de cosmétiques
fastify.post("/api/me/cosmetics/starter-pack", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId)
        return reply.code(401).send({ error: "Unauthorized" });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, cosmetics: true } });
    if (!u)
        return reply.code(404).send({ error: "Utilisateur introuvable" });
    const baseFlair = u.role === client_1.Role.ADMIN || u.role === client_1.Role.DEVELOPER ? "DEVELOPER" : "OG";
    const cosmetics = u.cosmetics || {};
    // Le starter pack n'attribue plus de flair automatiquement (laisse tel quel)
    cosmetics.selected = { flair: cosmetics.selected?.flair ?? null, frame: "neon", theme: "dark-emerald", banner: "gradient-emerald", bannerUrl: "" };
    const updated = await prisma.user.update({ where: { id: userId }, data: { cosmetics }, select: { id: true, cosmetics: true } });
    return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
});
fastify.listen({ port: PORT, host: '0.0.0.0' }, function (err, address) {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    console.info(`Server is now listening on ${address}`);
});
