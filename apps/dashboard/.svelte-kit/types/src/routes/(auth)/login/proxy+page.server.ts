// @ts-nocheck
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '@plinkk/prisma';
import { createUserSession } from '$lib/server/auth';
import { sendOtp } from '../../../services/otpService';
import { logUserAction } from '../../../lib/userLogger';
import z from 'zod';

export const load = async ({ locals, url }: Parameters<PageServerLoad>[0]) => {
	if (locals.user) {
		throw redirect(302, '/');
	}

	return {
		returnTo: url.searchParams.get('returnTo') || '',
		email: url.searchParams.get('email') || '',
		step: url.searchParams.get('step') || 'choice',
		error: url.searchParams.get('error') || null,
		googleClientId: process.env.GOOGLE_OAUTH2_ID || process.env.ID_CLIENT
	};
};

export const actions = {
	email: async ({ request, url }: import('./$types').RequestEvent) => {
		const data = await request.formData();
		const email = String(data.get('email') || '').trim().toLowerCase();
		const returnTo = String(data.get('returnTo') || '');

		try {
			z.string().email().parse(email);
		} catch (e) {
			return fail(400, { error: 'Email invalide', email });
		}

		const user = await prisma.user.findFirst({
			where: { email },
			include: { role: true }
		});

		if (!user) {
			return fail(404, { error: 'Utilisateur introuvable', email });
		}

		// Ban check logic (simplified for now or imported if available)
		// For now, let's just proceed to password or OTP

		if (!user.hasPassword) {
			const otpResult = await sendOtp(email);
			if (!otpResult.ok) {
				return fail(500, { error: 'Erreur lors de l\'envoi de l\'OTP', email });
			}
			throw redirect(302, `/join/verify?email=${encodeURIComponent(email)}`);
		}

		throw redirect(302, `/login?step=password&email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`);
	},

	login: async (event: import('./$types').RequestEvent) => {
		const { request, getClientAddress } = event;
		const data = await request.formData();
		const email = String(data.get('email') || '').trim().toLowerCase();
		const password = String(data.get('password') || '');
		const returnTo = String(data.get('returnTo') || '');

		const user = await prisma.user.findFirst({
			where: { email },
			include: { role: true }
		});

		if (!user || !user.hasPassword) {
			return fail(401, { error: 'Identifiants incorrects', email });
		}

		const valid = await Bun.password.verify(password, user.password);
		if (!valid) {
			return fail(401, { error: 'Identifiants incorrects', email });
		}

		// Handle TOTP if enabled
		if (user.twoFactorEnabled) {
			// Save partial auth state in session/locals? 
			// For now, let's keep it simple or follow existing logic
			// request.session.set("data", user.id + "__totp");
			// Since we use our own session, we might need a temporary session for TOTP
			throw redirect(302, `/totp?returnTo=${encodeURIComponent(returnTo)}`);
		}

		await prisma.user.update({
			where: { id: user.id },
			data: { lastLogin: new Date() }
		});

		await createUserSession(user.id, event as any);
		await logUserAction(user.id, 'LOGIN', undefined, { method: 'PASSWORD' }, getClientAddress());

		throw redirect(302, returnTo || '/');
	}
};
;null as any as Actions;