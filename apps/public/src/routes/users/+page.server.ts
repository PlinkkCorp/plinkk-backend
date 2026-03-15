import { prisma } from '@plinkk/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [plinkks, bannedEmailRows] = await Promise.all([
		prisma.plinkk.findMany({
			where: { isPublic: true },
			include: {
				settings: true,
				user: {
					include: {
						cosmetics: true,
						role: true
					}
				}
			},
			orderBy: { createdAt: 'asc' }
		}),
		prisma.bannedEmail.findMany({
			where: { revoquedAt: null },
			select: { email: true, reason: true, time: true, createdAt: true }
		})
	]);

	const bannedEmailsMap = new Map<string, { reason: string; until: string | null }>();
	for (const ban of bannedEmailRows) {
		const isActive =
			ban.time == null ||
			ban.time < 0 ||
			new Date(ban.createdAt).getTime() + ban.time * 60000 > Date.now();
		if (isActive) {
			const until =
				typeof ban.time === 'number' && ban.time > 0
					? new Date(new Date(ban.createdAt).getTime() + ban.time * 60000).toISOString()
					: null;
			bannedEmailsMap.set(ban.email, { reason: ban.reason, until });
		}
	}

	return {
		plinkks: JSON.parse(JSON.stringify(plinkks)), // Ensure serialization
		bannedEmails: Object.fromEntries(bannedEmailsMap)
	};
};
