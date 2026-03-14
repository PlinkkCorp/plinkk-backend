import { FastifyInstance } from "fastify";
import { UnauthorizedError } from "@plinkk/shared";
import { prisma } from "@plinkk/prisma";
import { getUserInboxItems, InboxItemType, markInboxItemAsRead, markAllInboxAsRead, getInboxItemDetail } from "../../../services/inboxService";

export function apiMeInboxRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (request, reply) => {
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!userId) throw new UnauthorizedError();

    const query = request.query as { page?: string; limit?: string; type?: string; compact?: string };

    const type =
      query.type === "admin" || query.type === "bug-response" || query.type === "patch-note"
        ? (query.type as InboxItemType)
        : "all";

    const result = await getUserInboxItems(userId, {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 30,
      type,
      compact: query.compact === "1" || query.compact === "true",
    });

    const unreadCount = result.items.filter((item) => !item.isRead).length;

    return reply.send({
      ...result,
      unreadCount,
    });
  });

  fastify.get("/unread-count", async (request, reply) => {
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!userId) throw new UnauthorizedError();

    // Get all unread items for the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, roleId: true },
    });

    if (!user) return reply.send({ unreadCount: 0 });

    const targetOr: any[] = [
      { global: true },
      { targets: { some: { userId } } },
    ];
    if (user.roleId) {
      targetOr.push({ roleTargets: { some: { roleId: user.roleId } } });
    }

    const readRecords = await prisma.inboxRead.findMany({
      where: { userId },
      select: { itemId: true, itemType: true },
    });
    const readSet = new Set(readRecords.map((r) => `${r.itemId}:${r.itemType}`));

    const [announcements, patchNotes] = await Promise.all([
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
    ]);

    const allItems = [
      ...announcements.map((a) => ({ id: a.id, type: "announcement" })),
      ...patchNotes.map((p) => ({ id: `patch-${p.id}`, type: "patch-note" })),
    ];

    const unreadCount = allItems.filter((item) => !readSet.has(`${item.id}:${item.type}`)).length;

    return reply.send({ unreadCount });
  });

  fastify.get("/:itemId/detail", async (request, reply) => {
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!userId) throw new UnauthorizedError();

    const params = request.params as { itemId?: string };
    const itemId = (params?.itemId || "").trim();
    if (!itemId) return reply.code(400).send({ error: "missing_item_id" });

    const item = await getInboxItemDetail(userId, itemId);
    if (!item) return reply.code(404).send({ error: "item_not_found" });

    return reply.send({ item });
  });

  fastify.post("/:itemId/read", async (request, reply) => {
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!userId) throw new UnauthorizedError();

    const params = request.params as { itemId?: string };
    const itemId = (params?.itemId || "").trim();
    if (!itemId) return reply.code(400).send({ error: "missing_item_id" });

    const body = request.body as { itemType?: string } | undefined;
    const itemType = (body?.itemType || "announcement").trim();

    await markInboxItemAsRead(userId, itemId, itemType);

    return reply.send({ ok: true });
  });

  fastify.post("/read-all", async (request, reply) => {
    const sessionData = request.session.get("data");
    const userId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;
    if (!userId) throw new UnauthorizedError();

    await markAllInboxAsRead(userId);

    return reply.send({ ok: true });
  });
}
