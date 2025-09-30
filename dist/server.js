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
fastify.get("/", function (request, reply) {
    reply.view("index.ejs");
});
// Pages statiques utiles
fastify.get("/about", (request, reply) => reply.view("about.ejs"));
fastify.get("/privacy", (request, reply) => reply.view("privacy.ejs"));
fastify.get("/terms", (request, reply) => reply.view("terms.ejs"));
fastify.get("/cookies", (request, reply) => reply.view("cookies.ejs"));
fastify.get("/legal", (request, reply) => reply.view("legal.ejs"));
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
fastify.get("/login", function (request, reply) {
    reply.view("connect.ejs");
});
fastify.post("/register", async (req, reply) => {
    const { username, email, password, passwordVerif } = req.body;
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const hashedPasswordVerif = await bcrypt_1.default.hash(passwordVerif, 10);
    if (await bcrypt_1.default.compare(hashedPassword, hashedPasswordVerif))
        return reply.redirect("/login?error=" +
            encodeURIComponent("Password and Verif Password is not the same"));
    try {
        const emailVerified = zod_1.default.email().parse(email);
    }
    catch (error) {
        if (error instanceof zod_1.default.ZodError) {
            reply.redirect("/login?error=" + encodeURIComponent(error.issues[0].message));
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
            name: username,
            email: email,
            password: hashedPassword,
        },
    });
    reply.redirect("/login");
});
fastify.post("/login", async (request, reply) => {
    const { email, password } = request.body;
    try {
        const emailVerified = zod_1.default.email().parse(email);
    }
    catch (error) {
        if (error instanceof zod_1.default.ZodError) {
            reply.redirect("/login?error=" + encodeURIComponent(error.issues[0].message));
        }
    }
    const user = await prisma.user.findFirst({
        where: {
            email: email,
        },
    });
    if (!user)
        return reply.send("Utilisateur introuvable");
    const valid = await bcrypt_1.default.compare(password, user.password);
    if (!valid)
        return reply.send("Mot de passe incorrect");
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
        email: profile.email,
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
            email: body.email,
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
    const users = await prisma.user.findMany({
        select: { id: true, userName: true, email: true },
        orderBy: { createdAt: "asc" },
    });
    return reply.view("users.ejs", { users });
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
    return reply.code(404).view("404.ejs");
});
// Error handler
fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    if (request.raw.url?.startsWith("/api")) {
        return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.code(500).view("500.ejs", { message: error?.message ?? "" });
});
fastify.listen({ port: PORT, host: '0.0.0.0' }, function (err, address) {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    console.info(`Server is now listening on ${address}`);
});
