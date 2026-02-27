import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import z from "zod";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../lib/replyView";
import { generateToken } from "../../lib/token";
import { logUserAction } from "../../lib/userLogger";

export function forgotPasswordRoutes(fastify: FastifyInstance) {
    // GET: Show forgot password request page
    fastify.get("/auth/forgot-password", async (request, reply) => {
        return await replyView(reply, "auth/forgot-password.ejs", null, {});
    });

    // POST: Process forgot password request
    fastify.post("/auth/forgot-password", async (request, reply) => {
        const { email } = request.body as { email?: string };

        if (!email) {
            return await replyView(reply, "auth/forgot-password.ejs", null, { error: "L'e-mail est requis." });
        }

        try {
            z.string().email().parse(email);
        } catch {
            return await replyView(reply, "auth/forgot-password.ejs", null, { error: "E-mail invalide.", email });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, userName: true },
        });

        // We don't reveal if user exists for security, but we only create ticket if it does
        if (user) {
            const token = generateToken(32);
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await prisma.magicLink.create({
                data: {
                    token,
                    userId: user.id,
                    expiresAt,
                },
            });

            const resetLink = `${process.env.FRONTEND_URL || "https://dash.plinkk.fr"}/auth/reset-password?token=${token}`;

            // In a real app, send email here. For now, log to console.
            console.log(`[PASSWORD RESET] User: ${user.userName} (${email})`);
            console.log(`[PASSWORD RESET] Link: ${resetLink}`);

            await logUserAction(user.id, "PASSWORD_RESET_REQUESTED", null, { email }, request.ip);
        }

        // Always show success to prevent email enumeration
        return await replyView(reply, "auth/forgot-password.ejs", null, { success: true });
    });

    // GET: Show password reset form
    fastify.get("/auth/reset-password", async (request, reply) => {
        const { token } = request.query as { token?: string };

        if (!token) {
            return reply.redirect("/login?error=Lien invalide.");
        }

        const magic = await prisma.magicLink.findUnique({ where: { token } });

        if (!magic || magic.expiresAt < new Date()) {
            return reply.redirect("/login?error=Lien expiré ou invalide.");
        }

        return await replyView(reply, "auth/reset-password.ejs", null, { token });
    });

    // POST: Process password reset
    fastify.post("/auth/reset-password", async (request, reply) => {
        const { token, password, confirmPassword } = request.body as {
            token?: string;
            password?: string;
            confirmPassword?: string;
        };

        if (!token || !password || !confirmPassword) {
            return await replyView(reply, "auth/reset-password.ejs", null, { token, error: "Tous les champs sont requis." });
        }

        if (password !== confirmPassword) {
            return await replyView(reply, "auth/reset-password.ejs", null, { token, error: "Les mots de passe ne correspondent pas." });
        }

        if (password.length < 8) {
            return await replyView(reply, "auth/reset-password.ejs", null, { token, error: "Le mot de passe doit faire au moins 8 caractères." });
        }

        const magic = await prisma.magicLink.findUnique({ where: { token } });

        if (!magic || magic.expiresAt < new Date()) {
            return reply.redirect("/login?error=Lien expiré ou invalide.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: magic.userId },
                data: { password: hashedPassword, updatedAt: new Date() },
            }),
            prisma.magicLink.delete({ where: { token } }),
        ]);

        await logUserAction(magic.userId, "PASSWORD_RESET_SUCCESS", null, {}, request.ip);

        return reply.redirect("/login?message=Votre mot de passe a été réinitialisé.");
    });
}
