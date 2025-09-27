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
    const data = request.session.get("data");
    if (!data)
        return reply.redirect("/login");
    const userInfo = await prisma.user.findFirst({
        where: {
            id: data
        },
        omit: {
            password: true
        }
    });
    if (userInfo === null)
        return reply.redirect("/login");
    return reply.view("/dashboard.ejs", { user: userInfo });
});
fastify.get("/logout", (req, reply) => {
    req.session.delete();
    reply.redirect("/login");
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
