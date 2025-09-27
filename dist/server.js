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
fastify.get("/createFirst", async function (request, reply) {
    const user = await prisma.user.create({
        data: {
            id: "marvideo",
            email: "marvideomc.pro@gmail.com",
            userName: "Marvideo",
        },
    });
    const background = await prisma.backgroundColor.create({
        data: {
            userId: user.id,
        },
    });
    const labels = await prisma.label.create({
        data: {
            userId: user.id,
        },
    });
    const link = await prisma.link.create({
        data: {
            userId: user.id,
        },
    });
    const neonColor = await prisma.neonColor.create({
        data: {
            userId: user.id,
        },
    });
    const social = await prisma.socialIcon.create({
        data: {
            userId: user.id,
        },
    });
    const bar = await prisma.statusbar.create({
        data: {
            userId: user.id,
        },
    });
    reply.send({ user });
});
fastify.get("/:username", function (request, reply) {
    const { username } = request.params;
    if (username === "") {
        reply.code(404).send({ error: "please specify a username" });
        return;
    }
    reply.view("index.ejs", { username: username });
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
