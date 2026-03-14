import { prisma } from "@plinkk/prisma";

function patchAnnouncementText(version: string, title: string) {
  return `[PATCH NOTE] Version ${version} disponible: ${title}`;
}

export async function createPatchNoteInboxAnnouncement(version: string, title: string) {
  const text = patchAnnouncementText(version, title);

  const existing = await prisma.announcement.findFirst({
    where: {
      global: false,
      platform: "dashboard",
      displayType: "notification",
      text,
    },
    select: { id: true },
  });

  if (existing) return existing;

  // Create a non-global announcement and target it to all users (inbox)
  const ann = await prisma.announcement.create({
    data: {
      level: "info",
      text,
      dismissible: true,
      startAt: new Date(),
      global: false,
      displayType: "notification",
      platform: "dashboard",
    },
    select: { id: true },
  });

  // Populate AnnouncementTarget for all users so it appears in each user's inbox
  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length) {
    // prepare data for createMany
    const data = users.map((u) => ({ announcementId: ann.id, userId: u.id }));
    // ignoreDuplicates may not be supported on all databases; wrap in try/catch
    try {
      await prisma.announcementTarget.createMany({ data });
    } catch (e) {
      // fallback: create targets one by one to avoid blocking the announcement creation
      for (const row of data) {
        try {
          await prisma.announcementTarget.create({ data: row });
        } catch (err) {
          // ignore individual insert errors
        }
      }
    }
  }

  return ann;
}
