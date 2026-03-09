import { prisma } from "@plinkk/prisma";

function patchAnnouncementText(version: string, title: string) {
  return `[PATCH NOTE] Version ${version} disponible: ${title}`;
}

export async function createPatchNoteInboxAnnouncement(version: string, title: string) {
  const text = patchAnnouncementText(version, title);

  const existing = await prisma.announcement.findFirst({
    where: {
      global: true,
      platform: "dashboard",
      displayType: "notification",
      text,
    },
    select: { id: true },
  });

  if (existing) return existing;

  return prisma.announcement.create({
    data: {
      level: "info",
      text,
      dismissible: true,
      startAt: new Date(),
      global: true,
      displayType: "notification",
      platform: "dashboard",
    },
    select: { id: true },
  });
}
