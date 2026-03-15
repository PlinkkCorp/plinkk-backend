import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '@plinkk/prisma';
import { shouldRecordLinkClick } from '$lib/server/ipRateLimit';

export const POST: RequestHandler = async ({ params, getClientAddress }) => {
    const { linkId } = params;
    const clientIp = getClientAddress();

    if (!linkId) {
        return json({ error: 'missing_link_id' }, { status: 400 });
    }

    const link = await prisma.link.findUnique({
        where: { id: linkId },
        select: { id: true, url: true, plinkkId: true, userId: true },
    });

    if (!link) {
        return json({ error: 'link_not_found' }, { status: 404 });
    }

    const shouldTrack = shouldRecordLinkClick(clientIp, linkId);

    if (shouldTrack) {
        await prisma.link.update({
            where: { id: linkId },
            data: { clicks: { increment: 1 } },
        });

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        try {
            await prisma.$executeRawUnsafe(
                'INSERT INTO "LinkClickDaily" ("linkId","date","count") VALUES (?,?,1) ON CONFLICT("linkId","date") DO UPDATE SET "count" = "count" + 1',
                linkId,
                dateStr,
            );
        } catch (e) {
            console.warn('LinkClickDaily failed', e);
        }

        if (link.plinkkId) {
            await prisma.pageStat.create({
                data: {
                    plinkkId: link.plinkkId,
                    eventType: 'click',
                    ip: clientIp,
                    meta: { linkId, userId: link.userId },
                },
            });
        }
    }

    return json({
        ok: true,
        tracked: shouldTrack,
        url: link.url,
    });
};
