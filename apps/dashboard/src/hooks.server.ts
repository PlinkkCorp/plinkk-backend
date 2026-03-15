import type { Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Root (plinkk.fr) or localhost only
	const host = event.url.host;
	const allowedHosts = ['plinkk.fr', 'beta.plinkk.fr', 'localhost:3001', '127.0.0.1:3001'];
	
	// Optional: Check hosts if we want to limit dashboard access
	// if (!allowedHosts.includes(host) && !host.startsWith('localhost')) {
	// 	return new Response('Not Found', { status: 404 });
	// }

	const user = await validateSession(event);
	event.locals.user = user;

	// Protected routes (everything except auth)
	const isAuthRoute = event.url.pathname.startsWith('/login') || 
						event.url.pathname.startsWith('/register') || 
						event.url.pathname.startsWith('/forgot-password') ||
						event.url.pathname.startsWith('/verify') ||
						event.url.pathname.startsWith('/join');

	if (!user && !isAuthRoute && event.url.pathname !== '/logout') {
		const returnTo = event.url.pathname + event.url.search;
		return Response.redirect(`${event.url.origin}/login?returnTo=${encodeURIComponent(returnTo)}`, 302);
	}

	const response = await resolve(event);
	return response;
};
