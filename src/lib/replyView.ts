import {
  FastifyReply,
  FastifySchema,
  FastifyTypeProviderDefault,
  RawServerDefault,
  RouteGenericInterface,
} from "fastify";
import ejs from "ejs";
import { Announcement, AnnouncementRoleTarget, AnnouncementTarget, PrismaClient, Role, User } from "../../generated/prisma/client";
import { IncomingMessage, ServerResponse } from "http";
import { toSafeUser } from "../types/user";

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
  user: User | null,
  data: ejs.Data,
  statusCode: number = 200
): Promise<string> {
  if (user === null) {
    return reply.code(statusCode).view(template, {
      ...data,
    });
  }
  return reply.view(template, {
    __SITE_MESSAGES__: getActiveAnnouncementsForUser(user.id),
    user: toSafeUser(user),
    ...data,
  });
}
export async function getActiveAnnouncementsForUser(userId: string | null) {
  const list: Announcement[] = [];
  try {
    const now = new Date();
    const me = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true },
        })
      : null;
    const anns = await prisma.announcement.findMany({
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
        (!!me && a.targets.some((t: AnnouncementTarget) => t.userId === me.id)) ||
        (!!me && a.roleTargets.some((rt: AnnouncementRoleTarget & { role: Role }) => rt.role.name === me.role.name));
      if (!toUser) continue;
      list.push(a);
    }
  } catch (e) {}
  return list;
}
