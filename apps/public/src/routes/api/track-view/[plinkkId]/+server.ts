import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '@plinkk/prisma';
import { recordPlinkkView } from '@plinkk/shared';
import { shouldRecordProfileView } from '$lib/server/ipRateLimit';

export const POST: RequestHandler = async ({ params, request, getClientAddress }) => {
    const { plinkkId } = params;
    const clientIp = getClientAddress();

    if (!plinkkId) {
        return json({ error: 'missing_plinkk_id' }, { status: 400 });
    }

    const plinkk = await prisma.plinkk.findUnique({
        where: { id: plinkkId },
        select: { id: true, userId: true },
    });

    if (!plinkk) {
        return json({ error: 'plinkk_not_found' }, { status: 404 });
    }

    if (!shouldRecordProfileView(clientIp, plinkkId)) {
        return json({ ok: true, tracked: false, reason: 'ip_cooldown' });
    }

    await recordPlinkkView(prisma, plinkkId, plinkk.userId, {
        ip: clientIp,
        headers: Object.fromEntries(request.headers)
    } as any);

    return json({ ok: true, tracked: true });
};
