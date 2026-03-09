import { prisma } from "@plinkk/prisma";
import { marked } from "marked";

export type InboxItemType = "admin" | "bug-response" | "patch-note";

export interface InboxItem {
  id: string;
  source: "announcement" | "patch-note";
  type: InboxItemType;
  title: string;
  text: string;
  htmlText?: string;
  level: string;
  createdAt: Date;
  link?: string;
}

interface InboxQuery {
  page?: number;
  limit?: number;
  type?: "all" | InboxItemType;
}

function classifyAnnouncement(text: string): InboxItemType {
  const trimmed = text.trim();
  if (trimmed.startsWith("[RÉPONSE BUG]")) return "bug-response";
  if (trimmed.startsWith("[PATCH NOTE]")) return "patch-note";
  return "admin";
}

function titleForAnnouncement(type: InboxItemType): string {
  if (type === "bug-response") return "Réponse à votre signalement";
  if (type === "patch-note") return "Nouvelle mise à jour";
  return "Message de l'administration";
}

function toPositiveInt(value: number | undefined, fallback: number) {
  if (!value || Number.isNaN(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

export async function getUserInboxItems(userId: string, query: InboxQuery = {}) {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 30), 100);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, roleId: true },
  });

  if (!user) {
    return { items: [] as InboxItem[], pagination: { page, limit, total: 0 } };
  }

  const targetOr: any[] = [
    { global: true },
    { targets: { some: { userId } } },
  ];
  if (user.roleId) {
    targetOr.push({ roleTargets: { some: { roleId: user.roleId } } });
  }

  const [announcements, patchNotes] = await Promise.all([
    prisma.announcement.findMany({
      where: {
        AND: [
          { OR: targetOr },
          { OR: [{ platform: "all" }, { platform: "dashboard" }] },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: Math.max(limit * 4, 80),
    }),
    prisma.patchNote.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: Math.max(limit * 3, 60),
      select: {
        id: true,
        title: true,
        version: true,
        content: true,
        createdAt: true,
        publishedAt: true,
      },
    }),
  ]);

  const announcementItems: InboxItem[] = announcements
    .map((ann) => {
    const type = classifyAnnouncement(ann.text);
    return {
      id: ann.id,
      source: "announcement" as const,
      type,
      title: titleForAnnouncement(type),
      text: ann.text,
      level: ann.level || "info",
      createdAt: ann.createdAt,
    };
    })
    // Patch notes are taken from PatchNote model to preserve markdown content.
    .filter((item) => item.type !== "patch-note");

  const patchItems: InboxItem[] = await Promise.all(
    patchNotes.map(async (note) => ({
      id: `patch-${note.id}`,
      source: "patch-note" as const,
      type: "patch-note",
      title: `[Patch ${note.version}] ${note.title}`,
      text: note.content,
      htmlText: String(await marked.parse(note.content)),
      level: "info",
      createdAt: note.publishedAt || note.createdAt,
      link: "/admin/patchnotes",
    }))
  );

  let items = [...announcementItems, ...patchItems].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  if (query.type && query.type !== "all") {
    items = items.filter((item) => item.type === query.type);
  }

  const total = items.length;
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);

  return {
    items: paged,
    pagination: {
      page,
      limit,
      total,
      hasMore: start + limit < total,
    },
  };
}
