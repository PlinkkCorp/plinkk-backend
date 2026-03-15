import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '@plinkk/prisma';

export const POST: RequestHandler = async ({ params, locals }) => {
    const { questId } = params;
    // Note: Session handling in SvelteKit needs to be implemented. 
    // Assuming locals.user (populated by hooks.server.ts)
    const user = (locals as any).user;
    if (!user) {
        return json({ error: 'unauthorized', message: 'Connectez-vous pour gagner des gems' }, { status: 401 });
    }

    const userId = user.id;

    const quest = await prisma.partnerQuest.findUnique({
        where: { id: questId },
        include: { partner: true }
    });

    if (!quest || !quest.isActive || !quest.partner.isActive) {
        return json({ error: 'not_found', message: 'Quête introuvable ou inactive' }, { status: 404 });
    }

    const existing = await prisma.userQuest.findUnique({
        where: {
            userId_partnerQuestId: { userId, partnerQuestId: questId }
        }
    });

    if (existing) {
        return json({ ok: true, alreadyCompleted: true, actionUrl: quest.actionUrl });
    }

    await prisma.$transaction([
        prisma.userQuest.create({
            data: { userId, partnerQuestId: questId, gemsRewarded: quest.rewardGems }
        }),
        prisma.user.update({
            where: { id: userId },
            data: { plinkkGems: { increment: quest.rewardGems } }
        }),
        prisma.partnerStatDaily.upsert({
            where: {
                partnerId_date: {
                    partnerId: quest.partnerId,
                    date: new Date(new Date().setUTCHours(0, 0, 0, 0))
                }
            },
            update: { clicks: { increment: 1 } },
            create: {
                partnerId: quest.partnerId,
                date: new Date(new Date().setUTCHours(0, 0, 0, 0)),
                clicks: 1,
                views: 0
            }
        })
    ]);

    return json({ ok: true, rewardGems: quest.rewardGems, actionUrl: quest.actionUrl });
};
