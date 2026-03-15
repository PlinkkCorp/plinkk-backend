import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '@plinkk/prisma';

export const load: PageServerLoad = async ({ params }) => {
    const { version } = params;

    const patchNote = await prisma.patchNote.findFirst({
        where: { version, isPublished: true },
        include: { createdBy: { select: { id: true, name: true, image: true } } },
    });

    if (!patchNote) {
        throw error(404, 'Patch note not found');
    }

    return {
        patchNote: JSON.parse(JSON.stringify(patchNote))
    };
};
