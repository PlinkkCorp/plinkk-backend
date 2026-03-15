import type { PageServerLoad } from './$types';
import { prisma } from '@plinkk/prisma';

export const load: PageServerLoad = async () => {
    const patchNotes = await prisma.patchNote.findMany({
        where: { isPublished: true },
        include: { createdBy: { select: { id: true, name: true, image: true } } },
        orderBy: { publishedAt: 'desc' },
    });

    return {
        patchNotes: JSON.parse(JSON.stringify(patchNotes))
    };
};
