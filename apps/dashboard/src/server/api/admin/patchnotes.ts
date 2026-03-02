import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "@plinkk/prisma";
import { UnauthorizedError, ForbiddenError, BadRequestError, NotFoundError } from "@plinkk/shared";
import z from "zod";

const createPatchNoteSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  version: z.string().min(1, "La version est requise").regex(/^\d+\.\d+\.\d+$/, "La version doit être au format X.Y.Z"),
  content: z.string().min(1, "Le contenu est requis"),
  isPublished: z.boolean().default(false),
});

const updatePatchNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
});

export async function apiAdminPatchNotesRoutes(fastify: FastifyInstance) {
  // Middleware to check permission
  fastify.addHook("preHandler", async (request, reply) => {
    const sessionData = request.session.get("data");
    const currentUserId = (typeof sessionData === "object" ? sessionData?.id : sessionData) as string | undefined;

    if (!currentUserId) throw new UnauthorizedError();

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: { include: { permissions: true } } },
    });

    const hasPermission = user?.role?.permissions.some((rp) => rp.permissionKey === "MANAGE_PATCHNOTES");
    if (!hasPermission) {
      throw new ForbiddenError();
    }

    (request as any).currentUser = user;
  });

  // GET all patch notes (admin only, can see all including unpublished)
  fastify.get("/", async (request, reply) => {
    const patchNotes = await prisma.patchNote.findMany({
      include: { createdBy: { select: { id: true, userName: true } } },
      orderBy: { publishedAt: { sort: "desc", nulls: "last" } },
    });

    return reply.send(patchNotes);
  });

  // GET published patch notes only
  fastify.get("/published", async (request, reply) => {
    const patchNotes = await prisma.patchNote.findMany({
      where: { isPublished: true },
      include: { createdBy: { select: { id: true, userName: true } } },
      orderBy: { publishedAt: "desc" },
    });

    return reply.send(patchNotes);
  });

  // GET a specific patch note
  fastify.get("/:id", async (request, reply) => {
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
    try {
      const body = createPatchNoteSchema.parse(request.body);
      const currentUser = (request as any).currentUser;

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
          publishedAt: body.isPublished ? new Date() : null,
          createdById: currentUser.id,
        },
        include: { createdBy: { select: { id: true, userName: true } } },
      });

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
    try {
      const { id } = request.params as { id: string };
      const body = updatePatchNoteSchema.parse(request.body);

      const patchNote = await prisma.patchNote.findUnique({ where: { id } });
      if (!patchNote) throw new NotFoundError("Patch note not found");

      const updated = await prisma.patchNote.update({
        where: { id },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.content && { content: body.content }),
          ...(body.isPublished !== undefined && {
            isPublished: body.isPublished,
            publishedAt: body.isPublished && !patchNote.publishedAt ? new Date() : patchNote.publishedAt,
          }),
          updatedAt: new Date(),
        },
        include: { createdBy: { select: { id: true, userName: true } } },
      });

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
    const { id } = request.params as { id: string };

    const patchNote = await prisma.patchNote.findUnique({ where: { id } });
    if (!patchNote) throw new NotFoundError("Patch note not found");

    await prisma.patchNote.delete({ where: { id } });

    return reply.code(204).send();
  });
}
