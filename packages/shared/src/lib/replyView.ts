import {
  FastifyReply,
  FastifySchema,
  FastifyTypeProviderDefault,
  RawServerDefault,
  RouteGenericInterface,
} from "fastify";
import "@fastify/view";
import ejs from "ejs";
import { Announcement, AnnouncementRoleTarget, AnnouncementTarget, prisma } from "@plinkk/prisma";
import { IncomingMessage, ServerResponse } from "http";
import { toSafeUser, UserWithInclude } from "../types/user.js";
import { getGravatarUrl } from "./userUtils.js";
import "dotenv/config"

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
  user: UserWithInclude,
  data: ejs.Data,
  extraData: Record<string, any> = {},
  statusCode: number = 200
): Promise<string> {
  const frontendUrl = process.env.FRONTEND_URL || process.env.PUBLIC_URL || (process.env.NODE_ENV !== 'production' ? 'http://127.0.0.1:3002' : '');

  if (user === null) {
    return reply.code(statusCode).view(template, {
      __SITE_MESSAGES__: await getActiveAnnouncementsForUser(null, extraData.__platform),
      user: null,
      isAdmin: false,
      isStaff: false,
      getGravatarUrl,
      frontendUrl,
      ...extraData,
      ...data,
    });
  }

  const safe = toSafeUser(user);
  let isAdmin = false
  let isStaff = false
  if (safe && safe.role) {
    isAdmin = safe.role && safe.role.name === 'ADMIN';
    isStaff = safe.role && ['ADMIN', 'DEVELOPER', 'MODERATOR'].includes(safe.role.name);
  }

  return reply.code(statusCode).view(template, {
    __SITE_MESSAGES__: await getActiveAnnouncementsForUser(user.id, extraData.__platform),
    user: toSafeUser(user),
    isAdmin: isAdmin,
    isStaff: isStaff,
    getGravatarUrl,
    frontendUrl,
    ...extraData,
    ...data,
  });
}

export async function getActiveAnnouncementsForUser(userId: string | null, platform?: string) {
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
      // Filter by platform
      if (platform && a.platform && a.platform !== 'all' && a.platform !== platform) continue;

      const toUser =
        a.global ||
        (!!me && a.targets.some((t: AnnouncementTarget) => t.userId === me.id)) ||
        (!!me && me.role && a.roleTargets.some((rt: AnnouncementRoleTarget) => rt.roleId === me.role.id));
      if (!toUser) continue;
      list.push(a);
    }
  } catch (e) {}
  return list;
}
