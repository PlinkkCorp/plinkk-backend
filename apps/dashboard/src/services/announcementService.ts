import { Announcement, AnnouncementRoleTarget, AnnouncementTarget, Role, prisma } from "@plinkk/prisma";
import { logAdminAction } from "../lib/adminLogger";

export async function getActiveAnnouncementsForUser(userId: string | null): Promise<Announcement[]> {
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
        (!!me && a.roleTargets.some((rt: AnnouncementRoleTarget & { role: Role }) => rt.role.name === me.role?.name));
      if (!toUser) continue;
      list.push(a);
    }
  } catch (e) {}
  return list;
}

export interface CreateAnnouncementPayload {
  level: string;
  text: string;
  dismissible: boolean;
  startAt: Date | null;
  endAt: Date | null;
  global: boolean;
}

export async function createOrUpdateAnnouncement(
  id: string | undefined,
  payload: CreateAnnouncementPayload,
  targetUserIds: string[],
  targetRoleIds: string[]
): Promise<Announcement> {
  let ann: Announcement;

  if (!id) {
    ann = await prisma.announcement.create({ data: { ...payload } });
  } else {
    ann = await prisma.announcement.update({
      where: { id },
      data: { ...payload },
    });
    await prisma.announcementTarget.deleteMany({
      where: { announcementId: ann.id },
    });
    await prisma.announcementRoleTarget.deleteMany({
      where: { announcementId: ann.id },
    });
  }

  if (!payload.global) {
    if (targetUserIds.length) {
      await prisma.announcementTarget.createMany({
        data: targetUserIds.map((uid) => ({
          announcementId: ann.id,
          userId: uid,
        })),
      });
    }
    if (targetRoleIds.length) {
      await prisma.announcementRoleTarget.createMany({
        data: targetRoleIds.map((rid) => ({
          announcementId: ann.id,
          roleId: rid,
        })),
      });
    }
  }

  return ann;
}

export async function deleteAnnouncement(id: string, adminId: string, ip: string): Promise<boolean> {
  try {
    await prisma.announcement.delete({ where: { id } });
    await logAdminAction(adminId, "DELETE_ANNOUNCEMENT", id, {}, ip);
    return true;
  } catch (e) {
    return false;
  }
}

export async function getAllRoles() {
  return prisma.role.findMany({
    orderBy: { priority: "desc" },
  });
}
