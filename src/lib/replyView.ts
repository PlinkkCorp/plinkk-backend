import {
  FastifyReply,
  FastifySchema,
  FastifyTypeProviderDefault,
  RawServerDefault,
  RouteGenericInterface,
} from "fastify";
import ejs from "ejs";
import { PrismaClient, User } from "../../generated/prisma/client";
import { IncomingMessage, ServerResponse } from "http";
import { SafeUser, toSafeUser } from "../types/user";

const prisma = new PrismaClient();

export async function replyView(
  reply: FastifyReply<
    RouteGenericInterface,
    RawServerDefault,
    IncomingMessage,
    ServerResponse<IncomingMessage>,
    unknown,
    FastifySchema,
    FastifyTypeProviderDefault,
    unknown
  >,
  template: string,
  user: User,
  data: ejs.Data
): Promise<string> {
  return reply.view(template, {
    __SITE_MESSAGES__: await getActiveAnnouncementsForUser(user.id),
    user: toSafeUser(user),
    ...data,
  });
}
export async function getActiveAnnouncementsForUser(userId: string | null) {
  const list: any[] = [];
  try {
    const now = new Date();
    const me = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true },
        })
      : null;
    const anns = await (prisma as any).announcement.findMany({
      where: {
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      include: { targets: true, roleTargets: true },
      orderBy: { createdAt: "desc" },
    });
    for (const a of anns) {
      const toUser =
        a.global ||
        (!!me && a.targets.some((t: any) => t.userId === me.id)) ||
        (!!me && a.roleTargets.some((rt: any) => rt.role === me.role));
      if (!toUser) continue;
      list.push({
        id: a.id,
        level: a.level,
        text: a.text,
        dismissible: a.dismissible,
        startAt: a.startAt,
        endAt: a.endAt,
        createdAt: a.createdAt,
      });
    }
  } catch (e) {}
  return list;
}
