import { FastifyInstance } from "fastify";
import {
  prisma,
  Announcement,
  AnnouncementTarget,
  AnnouncementRoleTarget,
  Role,
} from "@plinkk/prisma";
import { replyView } from "../lib/replyView";
import { getCurrentUser } from "../lib/auth";
import { getPublicMetrics } from "../lib/metrics";

export function indexRoutes(fastify: FastifyInstance) {
  fastify.get("/", async function (request, reply) {
    const currentUser = await getCurrentUser(request);
    const { userCount, linkCount, totalViews } = await getPublicMetrics(request);

    let msgs: Announcement[] = [];
    try {
      const now = new Date();
      const anns = await prisma.announcement.findMany({
        where: {
          AND: [
            { OR: [{ startAt: null }, { startAt: { lte: now } }] },
            { OR: [{ endAt: null }, { endAt: { gte: now } }] },
          ],
        },
        include: { targets: true, roleTargets: { include: { role: true } } },
        orderBy: { createdAt: "desc" },
      });
      if (currentUser) {
        for (const a of anns) {
          const toUser =
            a.global ||
            a.targets.some((t: AnnouncementTarget) => t.userId === currentUser.id) ||
            a.roleTargets.some(
              (rt: AnnouncementRoleTarget & { role: Role }) =>
                rt.role.name === currentUser.role.name
            );
          if (toUser) msgs.push(a);
        }
      } else {
        msgs = anns.filter((a) => a.global);
      }
    } catch (e) {}
    
    return await replyView(reply, "index.ejs", currentUser, {
      userCount,
      linkCount,
      totalViews,
    });
  });

  fastify.get("/users", async (request, reply) => {
    const currentUser = await getCurrentUser(request);
    
    const [plinkks, bannedEmailRows] = await Promise.all([
      prisma.plinkk.findMany({
        where: { isPublic: true },
        include: {
          settings: true,
          user: {
            include: {
              cosmetics: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.bannedEmail.findMany({
        where: { revoquedAt: null },
        select: { email: true, reason: true, time: true, createdAt: true },
      }),
    ]);
    
    // Build a map of banned emails -> ban info (only currently active bans)
    const bannedEmailsMap = new Map<string, { reason: string; until: string | null }>();
    for (const ban of bannedEmailRows) {
      const isActive =
        ban.time == null ||
        ban.time < 0 ||
        new Date(ban.createdAt).getTime() + ban.time * 60000 > Date.now();
      if (isActive) {
        const until =
          typeof ban.time === "number" && ban.time > 0
            ? new Date(new Date(ban.createdAt).getTime() + ban.time * 60000).toISOString()
            : null;
        bannedEmailsMap.set(ban.email, { reason: ban.reason, until });
      }
    }
    
    let msgs: Announcement[] = [];
    try {
      const now = new Date();
      const anns = await prisma.announcement.findMany({
        where: {
          AND: [
            { OR: [{ startAt: null }, { startAt: { lte: now } }] },
            { OR: [{ endAt: null }, { endAt: { gte: now } }] },
          ],
        },
        include: { targets: true, roleTargets: { include: { role: true } } },
        orderBy: { createdAt: "desc" },
      });
      if (currentUser) {
        for (const a of anns) {
          const toUser =
            a.global ||
            a.targets.some((t: AnnouncementTarget) => t.userId === currentUser.id) ||
            a.roleTargets.some(
              (rt: AnnouncementRoleTarget & { role: Role }) =>
                rt.role.name === currentUser.role.name
            );
          if (toUser) msgs.push(a);
        }
      } else {
        msgs = anns.filter((a) => a.global);
      }
    } catch (e) {}
    
    return await replyView(reply, "users.ejs", currentUser, {
      plinkks: plinkks,
      bannedEmails: Object.fromEntries(bannedEmailsMap),
    });
  });

  fastify.get("/patchnotes", async (request, reply) => {
    const currentUser = await getCurrentUser(request);

    const patchNotes = await prisma.patchNote.findMany({
      where: { isPublished: true },
      include: { createdBy: { select: { id: true, name: true, image: true } } },
      orderBy: { publishedAt: "desc" },
    });

    return await replyView(reply, "patch-notes/patch-notes.ejs", currentUser, {
      patchNotes: patchNotes,
    });
  });

  fastify.get("/*", async (request, reply) => {
    const url = request.raw.url || "";
    if (
      url.startsWith("/api") ||
      url.startsWith("/public") ||
      url.startsWith("/dashboard")
    ) {
      return reply.callNotFound();
    }
    const host = request.headers.host || "";
    const allowedHosts = new Set([
      "plinkk.fr",
      "127.0.0.1:3002",
      "localhost:3002",
      "127.0.0.1",
      "localhost"
    ]);
    if (!allowedHosts.has(host)) {
      return reply.callNotFound();
    }
    if (/\.[a-zA-Z0-9]+$/.test(url)) {
      return reply.callNotFound();
    }
    const accept = request.headers.accept || "";
    if (!accept.includes("text/html")) {
      return reply.callNotFound();
    }
    
    const currentUser = await getCurrentUser(request);
    const { userCount, linkCount, totalViews } = await getPublicMetrics(request);

    return await replyView(reply, "index.ejs", currentUser, {
      userCount,
      linkCount,
      totalViews,
    });
  });
}
