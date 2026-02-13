import { FastifyInstance } from 'fastify';
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { logUserAction } from "../../../lib/userLogger";

// const prisma = new PrismaClient();

export default async function dashboardUserSessionsRoutes(fastify: FastifyInstance) {
    fastify.get('/', async (req, reply) => {
        const userId = req.session.get("data");
        if (!userId) return reply.redirect('/login');

        const user = await prisma.user.findUnique({ where: { id: String(userId) }, include: { role: true } });
        if (!user) return reply.redirect('/login');

        const sessions = await prisma.session.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        const currentSessionId = req.session.get('sessionId');

        let publicPath;
        try {
            const defaultPlinkk = await prisma.plinkk.findFirst({
                where: { userId: user.id, isDefault: true },
            });
            publicPath = defaultPlinkk && defaultPlinkk.slug ? defaultPlinkk.slug : user.id;
        } catch (e) {}

        return await replyView(reply, 'dashboard/user/sessions.ejs', user, {
            sessions,
            currentSessionId,
            active: 'sessions',
            publicPath
        });
    });

    fastify.delete('/:id', async (req, reply) => {
        const userId = req.session.get("data");
        if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

        const { id } = req.params as { id: string };

        const session = await prisma.session.findUnique({ where: { id } });
        if (!session || session.userId !== String(userId)) {
            return reply.code(404).send({ error: 'Session not found' });
        }

        await prisma.session.delete({ where: { id } });
        await logUserAction(String(userId), "REVOKE_SESSION", id, { ip: session.ip, userAgent: session.userAgent }, req.ip);
        return { success: true };
    });
}
