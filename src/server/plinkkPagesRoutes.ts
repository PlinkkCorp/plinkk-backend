import { FastifyInstance } from "fastify";
import { Plinkk, PrismaClient } from "../../generated/prisma/client";
import {
  getMaxPagesForRole,
  reindexNonDefault,
  slugify,
  suggestUniqueSlug,
  createPlinkkForUser,
  isReservedSlug,
} from "../lib/plinkkUtils";
import { replyView } from "../lib/replyView";

const prisma = new PrismaClient();

export function plinkkPagesRoutes(fastify: FastifyInstance) {
  // List pages
  fastify.get("/plinkks", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/plinkks")}`
      );
    const me = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });
    if (!me)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent(
          String(request.raw.url || "/dashboard/plinkks")
        )}`
      );
    const pages = await prisma.plinkk.findMany({
      where: { userId: me.id },
      include: { settings: true },
      orderBy: [{ isDefault: "desc" }, { index: "asc" }, { createdAt: "asc" }],
    });
    const maxPages = getMaxPagesForRole(me.role);
    // Passe aussi user et un alias plinkks pour la vue intégrée
    const pagesForView = pages.map((p) => ({
      ...p,
      affichageEmail: p.settings?.affichageEmail ?? null,
    }));
    return replyView(reply, "dashboard/user/plinkks.ejs", me, {
      userId: me.id,
      userName: me.userName,
      pages: pagesForView,
      plinkks: pagesForView,
      maxPages,
    });
  });

  // Create
  fastify.post<{
    Body: {
      title: string;
      slug?: string;
      visibility?: string;
      isActive?: string;
    };
  }>("/plinkks", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/plinkks")}`
      );
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!me)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/plinkks")}`
      );
    const body = request.body as { title: string, slug: string, visibility: string, isActive: string };
    const title = String(body.title || "").trim();
    const slugBase = String(body.slug || title);
    const visibility =
      String(body.visibility || "public").toLowerCase() === "private"
        ? "PRIVATE"
        : "PUBLIC";
    const isActive = !!body.isActive;
    await createPlinkkForUser(prisma, me.id, {
      name: title || "Page",
      slugBase,
      visibility,
      isActive,
    });
    return reply.redirect("/dashboard/plinkks");
  });

  // Edit: redirect to classic editor with plinkkId param
  fastify.get<{ Params: { id: string } }>(
    "/plinkks/:id/edit",
    async (request, reply) => {
      const userId = request.session.get("data") as string | undefined;
      if (!userId)
        return reply.redirect(
          `/login?returnTo=${encodeURIComponent("/dashboard/edit")}`
        );
      const { id } = request.params;
      const page = await prisma.plinkk.findUnique({ where: { id } });
      if (!page || page.userId !== userId)
        return reply
          .code(404)
          .view("erreurs/404.ejs", { user: { id: userId } });
      return reply.redirect(
        `/dashboard/edit?plinkkId=${encodeURIComponent(id)}`
      );
    }
  );

  // Update
  fastify.post<{
    Params: { id: string };
    Body: {
      title?: string;
      slug?: string;
      visibility?: string;
      isActive?: string;
      isDefault?: string;
    };
  }>("/plinkks/:id", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId)
      return reply.redirect(
        `/login?returnTo=${encodeURIComponent("/dashboard/plinkks")}`
      );
    const { id } = request.params;
    const body = request.body as { title: string, slug: string, visibility: string, isActive: string, isDefault: string };
    const page = await prisma.plinkk.findUnique({ where: { id } });
    if (!page || page.userId !== userId)
      return reply.code(404).view("erreurs/404.ejs", { user: { id: userId } });
    let data: Plinkk;
    if (typeof body.title === "string" && body.title.trim())
      data.name = body.title.trim();
    if (typeof body.slug === "string" && body.slug.trim()) {
      const s = slugify(body.slug);
      if (s !== page.slug) {
        if (await isReservedSlug(prisma, s))
          return reply
            .code(400)
            .view("erreurs/500.ejs", {
              message: "Slug réservé",
              user: { id: userId },
            });
        data.slug = await suggestUniqueSlug(prisma, userId, s);
      }
    }
    if (typeof body.visibility === "string")
      data.visibility =
        body.visibility.toLowerCase() === "private" ? "PRIVATE" : "PUBLIC";
    if (typeof body.isActive !== "undefined") data.isActive = !!body.isActive;
    const setDefault = !!body.isDefault;
    if (setDefault && !page.isDefault) {
      // unset previous default and set this one as index 0
      const prev = await prisma.plinkk.findFirst({
        where: { userId, isDefault: true },
      });
      await prisma.$transaction([
        ...(prev
          ? [
              prisma.plinkk.update({
                where: { id: prev.id },
                data: { isDefault: false, index: Math.max(1, prev.index || 1) },
              }),
            ]
          : []),
        prisma.plinkk.update({
          where: { id },
          data: { isDefault: true, index: 0 },
        }),
      ]);
      await reindexNonDefault(prisma, userId);
    }
    if (Object.keys(data).length) {
      await prisma.plinkk.update({ where: { id }, data });
    }
    return reply.redirect("/dashboard/plinkks");
  });

  // Delete (soft or hard)
  fastify.post<{ Params: { id: string }; Body: { mode?: string } }>(
    "/plinkks/:id/delete",
    async (request, reply) => {
      const userId = request.session.get("data") as string | undefined;
      if (!userId)
        return reply.redirect(
          `/login?returnTo=${encodeURIComponent("/dashboard/plinkks")}`
        );
      const { id } = request.params;
      const mode = String((request.body as { mode: string })?.mode || "soft");
      const page = await prisma.plinkk.findUnique({ where: { id } });
      if (!page || page.userId !== userId)
        return reply
          .code(404)
          .view("erreurs/404.ejs", { user: { id: userId } });
      if (page.isDefault) {
        // prevent deletion of default if other pages exist
        const others = await prisma.plinkk.count({
          where: { userId, NOT: { id } },
        });
        if (others > 0)
          return reply.code(400).send({ error: "cannot_delete_default" });
      }
      if (mode === "hard") {
        await prisma.plinkk.delete({ where: { id } });
      } else {
        await prisma.plinkk.update({
          where: { id },
          data: { isActive: false },
        });
      }
      await reindexNonDefault(prisma, userId);
      return reply.redirect("/dashboard/plinkks");
    }
  );

  // Set default explicitly
  fastify.post<{ Params: { id: string } }>(
    "/plinkks/:id/set-default",
    async (request, reply) => {
      const userId = request.session.get("data") as string | undefined;
      if (!userId)
        return reply.redirect(
          `/login?returnTo=${encodeURIComponent("/dashboard/plinkks")}`
        );
      const { id } = request.params;
      const page = await prisma.plinkk.findUnique({ where: { id } });
      if (!page || page.userId !== userId)
        return reply
          .code(404)
          .view("erreurs/404.ejs", { user: { id: userId } });
      if (page.isDefault) return reply.redirect("/dashboard/plinkks");
      const prev = await prisma.plinkk.findFirst({
        where: { userId, isDefault: true },
      });
      await prisma.$transaction([
        ...(prev
          ? [
              prisma.plinkk.update({
                where: { id: prev.id },
                data: { isDefault: false, index: Math.max(1, prev.index || 1) },
              }),
            ]
          : []),
        prisma.plinkk.update({
          where: { id },
          data: { isDefault: true, index: 0 },
        }),
      ]);
      await reindexNonDefault(prisma, userId);
      return reply.redirect("/dashboard/plinkks");
    }
  );

  // Stats: redirect to classic stats with plinkkId param
  fastify.get<{ Params: { id: string } }>(
    "/plinkks/:id/stats",
    async (request, reply) => {
      const userId = request.session.get("data") as string | undefined;
      if (!userId)
        return reply.redirect(
          `/login?returnTo=${encodeURIComponent("/dashboard/stats")}`
        );
      const { id } = request.params;
      const page = await prisma.plinkk.findUnique({ where: { id } });
      if (!page || page.userId !== userId)
        return reply
          .code(404)
          .view("erreurs/404.ejs", { user: { id: userId } });
      return reply.redirect(
        `/dashboard/stats?plinkkId=${encodeURIComponent(id)}`
      );
    }
  );
}