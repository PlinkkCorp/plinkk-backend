import { FastifyInstance } from "fastify";
import { request as undiciRequest } from "undici";
import { prisma } from "@plinkk/prisma";
import { slugify } from "../../lib/plinkkUtils";
import { createUserSession } from "../../services/sessionService";
import { createDefaultPlinkk } from "./register";

export function googleAuthRoutes(fastify: FastifyInstance) {
	interface GoogleTokenPayload {
		aud?: string;
		email?: string;
		name?: string;
        picture?: string;
		[key: string]: unknown;
	}
	fastify.get("/auth/google", async (request, reply) => {
		return reply.redirect("/login");
	});

	fastify.post("/auth/google/callback", async (request, reply) => {
		try {
			const body = request.body as { credential?: string };
			const idToken = body?.credential;
			if (!idToken) {
				return reply.code(400).send({ success: false, error: "missing_token" });
			}

			const res = await undiciRequest(
				`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
			);

			if (res.statusCode !== 200) {
				return reply.code(400).send({ success: false, error: "invalid_token" });
			}

			const payload = (await res.body.json()) as GoogleTokenPayload;

			const googleClientId = process.env.GOOGLE_OAUTH2_ID || process.env.ID_CLIENT;
			if (googleClientId && payload.aud && payload.aud !== googleClientId) {
				return reply.code(400).send({ success: false, error: "invalid_audience" });
			}

			const email = payload.email as string | undefined;
			const name = (payload.name as string) || (payload.email as string) || "user";
            const picture = payload.picture as string | undefined;
			const googleId = payload.sub as string | undefined;

			if (!email || !googleId) {
				return reply.code(400).send({ success: false, error: "no_email_or_sub" });
			}

			const currentUserId = request.session?.get("data"); 

			if (currentUserId && !String(currentUserId).includes("__totp")) {
				 const existingConnection = await prisma.connection.findUnique({
					 where: {
						 provider_providerId: {
							 provider: 'google',
							 providerId: googleId
						 }
					 }
				 });

				 if (existingConnection) {
					 if (existingConnection.userId !== currentUserId) {
						 return reply.code(400).send({ success: false, error: "already_linked_to_other_user" });
					 }
				 } else {
					 await prisma.connection.create({
						 data: {
							 provider: 'google',
							 providerId: googleId,
							 email: email,
							 name: name,
							 userId: currentUserId as string,
                             isIdentity: true
						 }
					 });
				 }
				 return reply.code(200).send({ success: true, redirect: "/account" });
			}

			let connection = await prisma.connection.findUnique({
				where: {
					provider_providerId: {
						provider: 'google',
						providerId: googleId
					}
				}
			});

			let user;

			if (connection) {
                // If the connection is not marked as identity but should be (migration), update it?
                // For now, assume Google is always identity.
				user = await prisma.user.findUnique({ where: { id: connection.userId }, include: { role: true } });
                if (user && !user.image && picture) {
                    await prisma.user.update({ where: { id: user.id }, data: { image: picture } });
                    user.image = picture;
                }
			} else {
				user = await prisma.user.findFirst({ where: { email }, include: { role: true } });

				if (user) {
                    if (!user.image && picture) {
                        await prisma.user.update({ where: { id: user.id }, data: { image: picture } });
                    }
					await prisma.connection.create({
						data: {
							provider: 'google',
							providerId: googleId,
							email: email,
							name: name,
							userId: user.id,
                            isIdentity: true
						}
					});
				} else {
					const generatedId = slugify(name);
					user = await prisma.user.create({
						data: {
							id: generatedId,
							userName: name,
							name: name,
							email: email,
                            image: picture || undefined,
							password: idToken,
                            hasPassword: false, // User created via Google has no real password
							role: {
								connectOrCreate: {
									where: { name: "USER" },
									create: { id: "USER", name: "USER" },
								},
							},
							connections: {
								create: {
									provider: 'google',
									providerId: googleId,
									email: email,
									name: name,
                                    isIdentity: true
								}
							}
						},
						include: { role: true },
					});

					try {
						await prisma.cosmetic.create({ data: { userId: user.id } });
					} catch (e) {
						request.log?.warn({ e }, "create default cosmetic failed");
					}

					try {
						await createDefaultPlinkk(request, user.id, name);
					} catch (e) {
						request.log?.warn({ e }, "create default plinkk failed");
					}
				}
			}

			if (user) await createUserSession(user.id, request);

			return reply.send({ success: true, redirect: "/" });
		} catch (e) {
			request.log?.warn({ e }, "google callback error");
			return reply.code(500).send({ success: false, error: "server_error" });
		}
	});
}
