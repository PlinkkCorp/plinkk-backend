import { prisma } from "@plinkk/prisma";
import { marked } from "marked";

export type InboxItemType = "admin" | "bug-response" | "patch-note";
export type NotificationPriority = "URGENT" | "NORMAL" | "INFO";

export interface InboxItem {
  id: string;
  source: "announcement" | "patch-note";
  type: InboxItemType;
  threadId?: string;
  title: string;
  text: string;
  htmlText?: string;
  level: string;
  priority: NotificationPriority;
  createdAt: Date;
  link?: string;
  isRead: boolean;
}

interface InboxQuery {
  page?: number;
  limit?: number;
  type?: "all" | InboxItemType;
  compact?: boolean;
}

function classifyAnnouncement(text: string): InboxItemType {
  const trimmed = text.trim();
  if (trimmed.startsWith("[RÉPONSE BUG")) return "bug-response";
  if (trimmed.startsWith("[PATCH NOTE]")) return "patch-note";
  return "admin";
}

function extractBugThreadId(text: string): string | undefined {
  const match = text.match(/^\[RÉPONSE BUG\s*#([^\]]+)\]/i);
  return match?.[1]?.trim() || undefined;
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

function toPreviewText(text: string, maxLen: number = 220) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLen) return normalized;
  return normalized.slice(0, maxLen - 1).trimEnd() + "…";
}

function markdownToPreview(markdown: string, maxLen: number = 220) {
  const plain = String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^\)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1")
    .replace(/[>#*_~-]/g, " ");
  return toPreviewText(plain, maxLen);
}

export async function getUserInboxItems(userId: string, query: InboxQuery = {}) {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 30), 100);
  const compact = !!query.compact;

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

  const [announcements, patchNotes, readRecords, _bugReportMessages] = await Promise.all([
    prisma.announcement.findMany({
      where: {
        AND: [
          { OR: targetOr },
          { OR: [{ platform: "all" }, { platform: "dashboard" }] },
        ],
      },
      orderBy: [
        { priority: "asc" }, // URGENT first, then NORMAL, then INFO
        { createdAt: "desc" },
      ],
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
    prisma.inboxRead.findMany({
      where: { userId },
      select: { itemId: true, itemType: true },
    }),
    prisma.conversationMessage.findMany({
        where: { 
            conversation: {
                bugReport: { userId }
            },
            from: "admin"
        },
        orderBy: { createdAt: "desc" },
        include: { 
            conversation: {
                include: { bugReport: true }
            } 
        },
        take: limit
    })
  ]) as [any[], any[], any[], any[]];

  const bugReportMessages = _bugReportMessages;

  const readSet = new Set(readRecords.map((r) => `${r.itemId}:${r.itemType}`));

  const bugResponseItems: InboxItem[] = bugReportMessages.map((msg) => {
      const isRead = readSet.has(`${msg.id}:bug-response`);
      return {
          id: msg.id,
          source: "announcement" as const,
          type: "bug-response",
          threadId: msg.conversation?.bugReport?.id,
          title: "Réponse à votre signalement",
          text: compact ? toPreviewText(msg.message) : msg.message,
          level: "info",
          priority: "NORMAL",
          createdAt: msg.createdAt,
          isRead,
      };
  });

  const announcementItems: InboxItem[] = announcements
    .map((ann) => {
      const type = classifyAnnouncement(ann.text);
      // Skip if it's a legacy bug response or patch note
      if (type === "bug-response" || type === "patch-note") return null;
      
      const isRead = readSet.has(`${ann.id}:announcement`);
      return {
        id: ann.id,
        source: "announcement" as const,
        type,
        threadId: undefined,
        title: titleForAnnouncement(type),
        text: compact ? toPreviewText(ann.text) : ann.text,
        level: ann.level || "info",
        priority: ann.priority as NotificationPriority,
        createdAt: ann.createdAt,
        isRead,
      };
    })
    .filter((item): item is InboxItem => item !== null);

  const patchItems: InboxItem[] = await Promise.all(
    patchNotes.map(async (note) => {
      const isRead = readSet.has(`patch-${note.id}:patch-note`);
      return {
        id: `patch-${note.id}`,
        source: "patch-note" as const,
        type: "patch-note",
        title: `[Patch ${note.version}] ${note.title}`,
        text: compact ? markdownToPreview(note.content) : note.content,
        htmlText: compact ? undefined : String(await marked.parse(note.content)),
        level: "info",
        priority: "NORMAL" as NotificationPriority,
        createdAt: note.publishedAt || note.createdAt,
        // Link to the public patch-note detail page (version-based)
        link: `/patch-notes/${note.version}`,
        isRead,
      };
    })
  );

  let items = [...announcementItems, ...patchItems, ...bugResponseItems]
    // Sort by priority first, then by date
    .sort((a, b) => {
      const priorityOrder = { URGENT: 0, NORMAL: 1, INFO: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

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

export async function markInboxItemAsRead(userId: string, itemId: string, itemType: string = "announcement") {
  return prisma.inboxRead.upsert({
    where: { userId_itemId_itemType: { userId, itemId, itemType } },
    create: { userId, itemId, itemType },
    update: { readAt: new Date() },
  });
}

export async function markAllInboxAsRead(userId: string) {
  // Récupérer tous les items visibles pour l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, roleId: true },
  });

  if (!user) return;

  const targetOr: any[] = [
    { global: true },
    { targets: { some: { userId } } },
  ];
  if (user.roleId) {
    targetOr.push({ roleTargets: { some: { roleId: user.roleId } } });
  }

  const [announcements, patchNotes, bugMessages] = await Promise.all([
    prisma.announcement.findMany({
      where: {
        AND: [
          { OR: targetOr },
          { OR: [{ platform: "all" }, { platform: "dashboard" }] },
        ],
      },
      select: { id: true },
    }),
    prisma.patchNote.findMany({
      where: { isPublished: true },
      select: { id: true },
    }),
    prisma.conversationMessage.findMany({
        where: { 
            conversation: {
                bugReport: { userId }
            },
            from: "admin" 
        },
        select: { id: true }
    })
  ]);

  const reads = [
    ...announcements.map((a) => ({ userId, itemId: a.id, itemType: "announcement" })),
    ...patchNotes.map((p) => ({ userId, itemId: `patch-${p.id}`, itemType: "patch-note" })),
    ...bugMessages.map((m) => ({ userId, itemId: m.id, itemType: "bug-response" })),
  ];

  // Bulk upsert
  for (const read of reads) {
    await prisma.inboxRead.upsert({
      where: { userId_itemId_itemType: { userId, itemId: read.itemId, itemType: read.itemType } },
      create: read,
      update: { readAt: new Date() },
    });
  }
}

export async function getInboxItemDetail(userId: string, itemId: string) {
  const result = await getUserInboxItems(userId, {
    page: 1,
    limit: 500,
    type: "all",
    compact: false,
  });

  return result.items.find((item) => item.id === itemId) || null;
}
