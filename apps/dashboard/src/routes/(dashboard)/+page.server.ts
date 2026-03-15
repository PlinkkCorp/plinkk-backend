import type { PageServerLoad } from './$types';
import { prisma } from '@plinkk/prisma';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) return {}; // Hooks should handle redirect, but for safety

	const plinkks = await prisma.plinkk.findMany({
		where: { userId: user.id },
		select: { id: true, name: true, slug: true, isDefault: true, views: true },
		orderBy: [{ isDefault: 'desc' }, { index: 'asc' }]
	});

	const defaultPlinkk = plinkks.find((p) => p.isDefault) ?? plinkks[0] ?? null;

	// Fetch some initial stats to avoid too many client-side fetches if possible
	// although the original EJS used a separate fetch for summary.
	
	const stats = {
		views: plinkks.reduce((acc, p) => acc + (p.views || 0), 0),
		clicks: 0, // Need to aggregate from DailyLinkClick
		ctr: '0%'
	};

	// Get total clicks
	const totalClicks = await prisma.dailyLinkClick.aggregate({
		where: { link: { plinkk: { userId: user.id } } },
		_sum: { count: true }
	});
	stats.clicks = totalClicks._sum.count || 0;
	
	if (stats.views > 0) {
		stats.ctr = ((stats.clicks / stats.views) * 100).toFixed(1) + '%';
	}

	const links = await prisma.link.findMany({
		where: { plinkk: { userId: user.id } },
		orderBy: { clicks: 'desc' },
		take: 5
	});

	return {
		plinkks,
		plinkk: defaultPlinkk,
		stats,
		links: JSON.parse(JSON.stringify(links)) // Handle dates/types
	};
};
