import {
  FastifyReply,
  FastifySchema,
  FastifyTypeProviderDefault,
  RawServerDefault,
  RouteGenericInterface,
} from "fastify";
import ejs from "ejs";
import { Announcement, AnnouncementRoleTarget, AnnouncementTarget, PrismaClient, Role } from "@plinkk/prisma/generated/prisma/client";
import { IncomingMessage, ServerResponse } from "http";
import { toSafeUser, UserWithInclude } from "../types/user";
import "dotenv/config"

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
  user: UserWithInclude,
  data: ejs.Data,
  statusCode: number = 200
): Promise<string> {
  if (user === null) {
    return reply.code(statusCode).view(template, {
      dashboardUrl: process.env.DASHBOARD_URL,
      ...data,
    });
  }

  // Build a safe user object for templates and normalize role identifiers so older templates
  // that compare `user.role.id === 'ADMIN'` keep working even if role.id is a nanoid.
  const safe = toSafeUser(user);
  let isAdmin = false
  let isStaff = false
  if (safe && safe.role) {
    try {
      // Align role.id with role.name for template compatibility
      safe.role.id = safe.role.name;
    } catch (e) {}
    // Convenience flags for templates
    isAdmin = safe.role && safe.role.name === 'ADMIN';
    isStaff = safe.role && ['ADMIN', 'DEVELOPER', 'MODERATOR'].includes(safe.role.name);
  }

  return reply.view(template, {
    __SITE_MESSAGES__: await getActiveAnnouncementsForUser(user.id),
    user: toSafeUser(user),
    isAdmin: isAdmin,
    isStaff: isStaff,
    dashboardUrl: process.env.DASHBOARD_URL,
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
