// @ts-nocheck
import type { LayoutServerLoad } from './$types';

export const load = async ({ locals }: Parameters<LayoutServerLoad>[0]) => {
	return {
		user: locals.user,
		frontendUrl: process.env.FRONTEND_URL || 'https://plinkk.fr'
	};
};
