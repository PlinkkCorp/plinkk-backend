// @ts-nocheck
import type { PageServerLoad } from './$types';

export const load = async ({ fetch }: Parameters<PageServerLoad>[0]) => {
	try {
		// Fetching partners data from the internal API
		const res = await fetch('/api/partners');
		if (!res.ok) {
			return {
				partners: [],
				userQuests: [],
				plinkkGems: 0,
				error: 'Failed to fetch partners'
			};
		}
		const data = await res.json();
		return {
			partners: data.partners || [],
			userQuests: data.userQuests || [],
			plinkkGems: data.plinkkGems || 0
		};
	} catch (e) {
		return {
			partners: [],
			userQuests: [],
			plinkkGems: 0,
			error: 'An error occurred while fetching partners'
		};
	}
};
