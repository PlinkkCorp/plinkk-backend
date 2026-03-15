// @ts-nocheck
import type { PageServerLoad } from './$types';
import { prisma } from '@plinkk/prisma';

export const load = async () => {
    const patchNotes = await prisma.patchNote.findMany({
        where: { isPublished: true },
        include: { createdBy: { select: { id: true, name: true, image: true } } },
        orderBy: { publishedAt: 'desc' },
    });

    return {
        patchNotes: JSON.parse(JSON.stringify(patchNotes))
    };
};
;null as any as PageServerLoad;