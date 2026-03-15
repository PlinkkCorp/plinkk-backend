import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "@plinkk/prisma";
import { UnauthorizedError, ForbiddenError, BadRequestError, NotFoundError } from "@plinkk/shared";
import { logAdminAction, logDetailedAdminAction } from "../../../lib/adminLogger";
import { discordService } from "../../../services/discordService";
import { createPatchNoteInboxAnnouncement } from "../../../services/inboxNotificationService";
import z from "zod";

const createPatchNoteSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  version: z.string().min(1, "La version est requise").regex(/^\d+\.\d+\.\d+$/, "La version doit être au format X.Y.Z"),
  content: z.string().min(1, "Le contenu est requis"),
  isPublished: z.boolean().default(false),
  notifyEveryone: z.boolean().default(true),
});

const updatePatchNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
  notifyEveryone: z.boolean().optional(),
});

// Helper function to check specific permission
const checkPermission = async (request: FastifyRequest, requiredPermission: string) => {
  const sessionData = request.session.get("data");
  const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

  if (!currentUserId) throw new UnauthorizedError();

  const user = await prisma.user.findUnique({
    where: { id: currentUserId },
    include: { role: { include: { permissions: true } } },
  });

  const hasPermission = user?.role?.permissions.some((rp) => rp.permissionKey === requiredPermission);
  if (!hasPermission) {
    throw new ForbiddenError();
  }

  (request).currentUser = user;
};

export async function apiAdminPatchNotesRoutes(fastify: FastifyInstance) {
  // GET all patch notes (admin only, can see all including unpublished)
  fastify.get("/", async (request, reply) => {
    await checkPermission(request, "EDIT_PATCHNOTES");
    const patchNotes = await prisma.patchNote.findMany({
      include: { createdBy: { select: { id: true, userName: true } } },
      orderBy: { publishedAt: { sort: "desc", nulls: "last" } },
    });

    return reply.send(patchNotes);
  });

  // GET published patch notes only
  fastify.get("/published", async (request, reply) => {
    await checkPermission(request, "EDIT_PATCHNOTES");
    const patchNotes = await prisma.patchNote.findMany({
      where: { isPublished: true },
      include: { createdBy: { select: { id: true, userName: true } } },
      orderBy: { publishedAt: "desc" },
    });

    return reply.send(patchNotes);
  });

  // GET a specific patch note
  fastify.get("/:id", async (request, reply) => {
    await checkPermission(request, "EDIT_PATCHNOTES");
    const { id } = request.params as { id: string };

    const patchNote = await prisma.patchNote.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, userName: true } } },
    });

    if (!patchNote) throw new NotFoundError("Patch note not found");

    return reply.send(patchNote);
  });

  // CREATE a new patch note
  fastify.post("/", async (request, reply) => {
    await checkPermission(request, "CREATE_PATCHNOTES");
    try {
      const body = createPatchNoteSchema.parse(request.body);
      const currentUser = (request).currentUser;

      // Check if version already exists
      const existing = await prisma.patchNote.findUnique({ where: { version: body.version } });
      if (existing) {
        throw new BadRequestError(`Version ${body.version} already exists`);
      }

      const patchNote = await prisma.patchNote.create({
        data: {
          title: body.title,
          version: body.version,
          content: body.content,
          isPublished: body.isPublished,
          notifyEveryone: body.notifyEveryone,
          publishedAt: body.isPublished ? new Date() : null,
          createdById: currentUser.id,
        },
        include: { createdBy: { select: { id: true, userName: true, name: true, image: true } } },
      });

      await logAdminAction(currentUser.id, 'CREATE_PATCHNOTE', patchNote.id, { title: body.title, version: body.version, isPublished: body.isPublished }, (request).ip);

      // Publier sur Discord si le patch note est publié
      if (body.isPublished) {
        await createPatchNoteInboxAnnouncement(patchNote.version, patchNote.title).catch((error) => {
          request.log.error(error, "Failed to create inbox announcement for patch note");
        });

        try {
          await discordService.publishPatchNote(patchNote);
        } catch (error) {
          console.error('[Discord] Erreur lors de la publication sur Discord:', error);
          // On ne bloque pas la création du patch note en cas d'erreur Discord
        }
      }

      return reply.code(201).send(patchNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }
  });

  // UPDATE a patch note
  fastify.put("/:id", async (request, reply) => {
    // Require either EDIT or PUBLISH permission for updates
    const sessionData = request.session.get("data");
    const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

    if (!currentUserId) throw new UnauthorizedError();

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: { include: { permissions: true } } },
    });

    const hasPermission = user?.role?.permissions.some(
      (rp) => rp.permissionKey === "EDIT_PATCHNOTES" || rp.permissionKey === "PUBLISH_PATCHNOTES"
    );
    if (!hasPermission) {
      throw new ForbiddenError();
    }

    (request).currentUser = user;
    try {
      const { id } = request.params as { id: string };
      const body = updatePatchNoteSchema.parse(request.body);
      const currentUser = (request).currentUser;

      const patchNote = await prisma.patchNote.findUnique({ where: { id } });
      if (!patchNote) throw new NotFoundError("Patch note not found");

      const updated = await prisma.patchNote.update({
        where: { id },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.content && { content: body.content }),
          ...(body.notifyEveryone !== undefined && { notifyEveryone: body.notifyEveryone }),
          ...(body.isPublished !== undefined && {
            isPublished: body.isPublished,
            publishedAt: body.isPublished && !patchNote.publishedAt ? new Date() : patchNote.publishedAt,
          }),
          updatedAt: new Date(),
        },
        include: { createdBy: { select: { id: true, userName: true, name: true, image: true } } },
      });

      await logDetailedAdminAction(currentUser.id, 'UPDATE_PATCHNOTE', id, patchNote, updated, (request).ip);

      // Publier sur Discord si le patch note vient d'être publié
      if (body.isPublished === true && !patchNote.isPublished) {
        await createPatchNoteInboxAnnouncement(updated.version, updated.title).catch((error) => {
          request.log.error(error, "Failed to create inbox announcement for patch note");
        });

        try {
          await discordService.publishPatchNote(updated);
        } catch (error) {
          console.error('[Discord] Erreur lors de la publication sur Discord:', error);
          // On ne bloque pas la mise à jour du patch note en cas d'erreur Discord
        }
      }

      return reply.send(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }
  });

  // DELETE a patch note
  fastify.delete("/:id", async (request, reply) => {
    await checkPermission(request, "DELETE_PATCHNOTES");
    const { id } = request.params as { id: string };
    const currentUser = (request).currentUser;

    const patchNote = await prisma.patchNote.findUnique({ where: { id } });
    if (!patchNote) throw new NotFoundError("Patch note not found");

    await prisma.patchNote.delete({ where: { id } });

    await logAdminAction(currentUser.id, 'DELETE_PATCHNOTE', id, { title: patchNote.title, version: patchNote.version }, (request).ip);

    return reply.code(204).send();
  });
}
