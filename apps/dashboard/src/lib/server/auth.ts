import { prisma } from '@plinkk/prisma';
import type { RequestEvent } from '@sveltejs/kit';

export const SESSION_COOKIE_NAME = 'plinkk-session';

export async function createUserSession(userId: string, event: RequestEvent) {
	const session = await prisma.session.create({
		data: {
			userId,
			ip: event.getClientAddress(),
			userAgent: event.request.headers.get('user-agent') || 'Unknown',
			expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
		}
	});

	event.cookies.set(SESSION_COOKIE_NAME, session.id, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 30 // 30 days
	});

	return session;
}

export async function validateSession(event: RequestEvent) {
	const sessionId = event.cookies.get(SESSION_COOKIE_NAME);
	if (!sessionId) return null;

	const session = await prisma.session.findUnique({
		where: { id: sessionId },
		include: {
			user: {
				include: { role: true }
			}
		}
	});

	if (!session || session.expiresAt < new Date()) {
		if (sessionId) event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		return null;
	}

	// Throttle activity updates (once per minute)
	const now = new Date();
	const lastActive = session.lastActiveAt ? new Date(session.lastActiveAt) : new Date(0);
	if (now.getTime() - lastActive.getTime() > 60 * 1000) {
		await prisma.session.update({
			where: { id: session.id },
			data: { 
				lastActiveAt: now,
				lastPage: event.url.pathname
			}
		});
	}

	return session.user;
}

export async function deleteSession(event: RequestEvent) {
	const sessionId = event.cookies.get(SESSION_COOKIE_NAME);
	if (sessionId) {
		await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
		event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
	}
}
