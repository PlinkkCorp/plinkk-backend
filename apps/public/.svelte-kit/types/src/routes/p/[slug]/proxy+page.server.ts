// @ts-nocheck
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '@plinkk/prisma';
import { resolvePlinkkPage, filterScheduledLinks } from '@plinkk/shared';

export const load = async ({ params, request, locals }: Parameters<PageServerLoad>[0]) => {
    const { slug } = params;

    // Reserved routes check (though SvelteKit handles this via file routing)
    const reserved = ['public', 'api', 'dashboard', 'login', 'logout', 'register', 'totp', 'users', 'patch-notes', 'pricing', 'features', 'about', 'terms', 'cgv', 'privacy', 'cookies', 'legal', 'partners', 'docs'];
    if (reserved.includes(slug)) {
        throw error(404, 'Not found');
    }

    try {
        const resolved = await resolvePlinkkPage(prisma, slug, undefined, {
            headers: Object.fromEntries(request.headers),
            ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
        } as any);

        if (resolved.status !== 200) {
            throw error(resolved.status || 404, 'Page not found');
        }

        // Banned check
        const u = await prisma.user.findUnique({
            where: { id: resolved.user.id },
            select: { email: true }
        });
        if (u?.email) {
            const ban = await prisma.bannedEmail.findFirst({
                where: { email: u.email, revoquedAt: null }
            });
            if (ban) {
                // Simplified ban check for now
                throw error(403, 'User is banned');
            }
        }

        // Password protection check
        if (resolved.isPasswordProtected && !resolved.isOwner) {
            // In SvelteKit, we might want to redirect to a /p/[slug]/password page
            // For now, let's just pass the state
            return {
                isPasswordProtected: true,
                page: JSON.parse(JSON.stringify(resolved.page)),
                slug
            };
        }

        const allLinks = await prisma.link.findMany({
            where: { plinkkId: resolved.page.id, userId: resolved.user.id },
            orderBy: { index: 'asc' }
        });
        const links = filterScheduledLinks(allLinks);
        
        const settings = await prisma.plinkkSettings.findUnique({
            where: { plinkkId: resolved.page.id }
        });

        return {
            page: JSON.parse(JSON.stringify(resolved.page)),
            user: JSON.parse(JSON.stringify(resolved.user)),
            links: JSON.parse(JSON.stringify(links)),
            settings: JSON.parse(JSON.stringify(settings)),
            isOwner: resolved.isOwner,
            publicPath: resolved.page.slug || resolved.user.id
        };
    } catch (e) {
        if (e && typeof e === 'object' && 'status' in e) throw e;
        console.error('Error resolving plinkk page:', e);
        throw error(500, 'Internal Server Error');
    }
};
