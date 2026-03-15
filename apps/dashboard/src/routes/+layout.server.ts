import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
		frontendUrl: process.env.FRONTEND_URL || 'https://plinkk.fr'
	};
};
