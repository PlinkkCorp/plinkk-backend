"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
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
        background: (_b = (_a = profile.background) === null || _a === void 0 ? void 0 : _a.map((c) => c.color)) !== null && _b !== void 0 ? _b : [],
        neonColors: (_d = (_c = profile.neonColors) === null || _c === void 0 ? void 0 : _c.map((c) => c.color)) !== null && _d !== void 0 ? _d : [],
        labels: (_f = (_e = profile.labels) === null || _e === void 0 ? void 0 : _e.map((l) => ({
            data: l.data,
            color: l.color,
            fontColor: l.fontColor,
        }))) !== null && _f !== void 0 ? _f : [],
        socialIcon: (_h = (_g = profile.socialIcons) === null || _g === void 0 ? void 0 : _g.map((s) => ({ url: s.url, icon: s.icon }))) !== null && _h !== void 0 ? _h : [],
        links: (_k = (_j = profile.links) === null || _j === void 0 ? void 0 : _j.map((l) => ({
            icon: l.icon,
            url: l.url,
            text: l.text,
            name: l.name,
            description: l.description,
            showDescriptionOnHover: l.showDescriptionOnHover,
            showDescription: l.showDescription,
        }))) !== null && _k !== void 0 ? _k : [],
        statusbar: (_l = profile.statusbar) !== null && _l !== void 0 ? _l : null,
    };
    return reply.send(config);
});
// API: Mettre à jour la configuration du profil depuis l'éditeur
fastify.put("/api/me/config", async (request, reply) => {
    var _a;
    const userId = request.session.get("data");
    if (!userId)
        return reply.code(401).send({ error: "Unauthorized" });
    const body = (_a = request.body) !== null && _a !== void 0 ? _a : {};
    const pickDefined = (obj) => Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
    await prisma.$transaction(async (tx) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
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
                    data: body.links.map((l) => {
                        var _a, _b, _c, _d, _e, _f;
                        return ({
                            icon: (_a = l.icon) !== null && _a !== void 0 ? _a : undefined,
                            url: l.url,
                            text: (_b = l.text) !== null && _b !== void 0 ? _b : undefined,
                            name: (_c = l.name) !== null && _c !== void 0 ? _c : undefined,
                            description: (_d = l.description) !== null && _d !== void 0 ? _d : undefined,
                            showDescriptionOnHover: (_e = l.showDescriptionOnHover) !== null && _e !== void 0 ? _e : undefined,
                            showDescription: (_f = l.showDescription) !== null && _f !== void 0 ? _f : undefined,
                            userId: userId,
                        });
                    }),
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
                        text: (_a = s.text) !== null && _a !== void 0 ? _a : undefined,
                        colorBg: (_b = s.colorBg) !== null && _b !== void 0 ? _b : undefined,
                        colorText: (_c = s.colorText) !== null && _c !== void 0 ? _c : undefined,
                        fontTextColor: (_d = s.fontTextColor) !== null && _d !== void 0 ? _d : undefined,
                        statusText: (_e = s.statusText) !== null && _e !== void 0 ? _e : undefined,
                    },
                    update: pickDefined({
                        text: (_f = s.text) !== null && _f !== void 0 ? _f : undefined,
                        colorBg: (_g = s.colorBg) !== null && _g !== void 0 ? _g : undefined,
                        colorText: (_h = s.colorText) !== null && _h !== void 0 ? _h : undefined,
                        fontTextColor: (_j = s.fontTextColor) !== null && _j !== void 0 ? _j : undefined,
                        statusText: (_k = s.statusText) !== null && _k !== void 0 ? _k : undefined,
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
fastify.listen({ port: 3000 }, function (err, address) {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    console.info(`Server is now listening on ${address}`);
});
