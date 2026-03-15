import { prisma } from '@plinkk/prisma';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

const METRICS_TTL_MS = 60_000;
let publicMetricsCache: { value: any; expiresAt: number } | null = null;

async function getPublicMetrics() {
	const now = Date.now();
	if (publicMetricsCache && publicMetricsCache.expiresAt > now) {
		return publicMetricsCache.value;
	}

	const [userCount, linkCount, viewsRes] = await Promise.all([
		prisma.user.count(),
		prisma.link.count(),
		prisma.plinkk.aggregate({
			_sum: { views: true }
		})
	]);

	const metrics = {
		userCount,
		linkCount,
		totalViews: viewsRes._sum.views || 0
	};

	publicMetricsCache = {
		value: metrics,
		expiresAt: now + METRICS_TTL_MS
	};

	return metrics;
}

export const load: PageServerLoad = async ({ locals }) => {
	const metrics = await getPublicMetrics();

	let announcements: any[] = [];
	try {
		const now = new Date();
		const anns = await prisma.announcement.findMany({
			where: {
				AND: [
					{ OR: [{ startAt: null }, { startAt: { lte: now } }] },
					{ OR: [{ endAt: null }, { endAt: { gte: now } }] }
				]
			},
			include: { targets: true, roleTargets: { include: { role: true } } },
			orderBy: { createdAt: 'desc' }
		});

		const currentUser = locals.user;
		if (currentUser) {
			for (const a of anns) {
				const toUser =
					a.global ||
					a.targets.some((t: any) => t.userId === currentUser.id) ||
					a.roleTargets.some((rt: any) => rt.role.name === currentUser.role?.name);
				if (toUser) announcements.push(a);
			}
		} else {
			announcements = anns.filter((a) => a.global);
		}
	} catch (e) {
		console.error('Failed to fetch announcements', e);
	}

	return {
		...metrics,
		announcements,
		dashboardUrl: env.DASHBOARD_URL || 'https://dash.plinkk.fr',
		frontendUrl: env.FRONTEND_URL || 'https://plinkk.fr'
	};
};
