import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '@plinkk/prisma';

export const POST: RequestHandler = async ({ params }) => {
    const { partnerId } = params;

    try {
        await prisma.partnerStatDaily.upsert({
            where: {
                partnerId_date: {
                    partnerId,
                    date: new Date(new Date().setUTCHours(0, 0, 0, 0))
                }
            },
            update: { views: { increment: 1 } },
            create: {
                partnerId,
                date: new Date(new Date().setUTCHours(0, 0, 0, 0)),
                views: 1,
                clicks: 0
            }
        });
    } catch (e) {
        // ignore
    }

    return json({ ok: true });
};
