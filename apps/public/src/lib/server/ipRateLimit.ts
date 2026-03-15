const ipCache = new Map<string, number>();

function cleanupExpiredEntries(maxAgeMs: number) {
	const now = Date.now();
	const expiredKeys: string[] = [];
	for (const [key, timestamp] of ipCache.entries()) {
		if (now - timestamp > maxAgeMs) {
			expiredKeys.push(key);
		}
	}
	for (const key of expiredKeys) {
		ipCache.delete(key);
	}
}

// Clean every 10 minutes
setInterval(() => cleanupExpiredEntries(60 * 60 * 1000), 10 * 60 * 1000);

export function shouldTrackByIp(
	clientIp: string,
	type: 'view' | 'click',
	scope: string,
	cooldownMs: number = 60 * 60 * 1000
) {
	if (!clientIp) return true;

	const cacheKey = `${type}:${scope}:${clientIp}`;
	const now = Date.now();
	const lastAction = ipCache.get(cacheKey);

	if (lastAction && now - lastAction < cooldownMs) {
		return false;
	}

	ipCache.set(cacheKey, now);
	return true;
}

export function shouldRecordProfileView(clientIp: string, plinkkId: string, cooldownMs?: number) {
	return shouldTrackByIp(clientIp, 'view', plinkkId, cooldownMs);
}

export function shouldRecordLinkClick(clientIp: string, linkId: string, cooldownMs?: number) {
	return shouldTrackByIp(clientIp, 'click', linkId, cooldownMs);
}
