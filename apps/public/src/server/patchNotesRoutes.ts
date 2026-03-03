import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../lib/replyView";

async function getCurrentUser(request: FastifyRequest) {
  const sessionData = request.session.get("data");
  if (!sessionData) return null;
  const userId = typeof sessionData === "object" ? sessionData.id : sessionData;
  return await prisma.user.findUnique({ where: { id: userId } });
}

export function patchNotesRoutes(fastify: FastifyInstance) {
  // Get all published patch notes
  fastify.get("/patch-notes", async (request, reply) => {
    const currentUser = await getCurrentUser(request);
    
    const patchNotes = await prisma.patchNote.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        version: true,
        content: true,
        publishedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { publishedAt: "desc" },
    });

    return replyView(reply, "patch-notes/patch-notes.ejs", currentUser, {
      patchNotes,
    });
  });

  // Get specific patch note by version
  fastify.get("/patch-notes/:version", async (request, reply) => {
    const currentUser = await getCurrentUser(request);
    const { version } = request.params as { version: string };

    const patchNote = await prisma.patchNote.findUnique({
      where: { version },
      select: {
        id: true,
        title: true,
        version: true,
        content: true,
        publishedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!patchNote || !patchNote) {
      return reply.code(404).send({ error: "Patch note not found" });
    }

    return replyView(reply, "patch-notes/patch-note-detail.ejs", currentUser, {
      patchNote,
    });
  });

  // API endpoint for patch notes (JSON)
  fastify.get("/api/patch-notes", async (request, reply) => {
    const patchNotes = await prisma.patchNote.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        version: true,
        content: true,
        publishedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { publishedAt: "desc" },
    });

    return reply.send(patchNotes);
  });

  // API endpoint for specific patch note (JSON)
  fastify.get("/api/patch-notes/:version", async (request, reply) => {
    const { version } = request.params as { version: string };

    const patchNote = await prisma.patchNote.findUnique({
      where: { version },
      select: {
        id: true,
        title: true,
        version: true,
        content: true,
        publishedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!patchNote) {
      return reply.code(404).send({ error: "Patch note not found" });
    }

    return reply.send(patchNote);
  });
}
