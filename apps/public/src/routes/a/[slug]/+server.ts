import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '@plinkk/prisma';
import { affiliateService } from '@plinkk/shared';

export const GET: RequestHandler = async ({ params }) => {
    const { slug } = params;

    try {
        const affiliateLink = await prisma.affiliateLink.findFirst({
            where: { slug }
        });

        if (!affiliateLink) {
            throw redirect(302, '/');
        }

        await affiliateService.recordClick(affiliateLink.slug);
        throw redirect(302, '/');
    } catch (e) {
        if (e && typeof e === 'object' && 'status' in e) throw e;
        throw redirect(302, '/');
    }
};
