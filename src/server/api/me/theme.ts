import { FastifyInstance } from "fastify";
import { PrismaClient, Theme } from "../../../../generated/prisma/client";
import { coerceThemeData, readBuiltInThemes } from "../../../lib/theme";

const prisma = new PrismaClient();

export function apiMeThemesRoutes(fastify: FastifyInstance) {
    // Archive (owner hides from public list) -> sets status ARCHIVED
  fastify.post("/:id/archive", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });
    if (!t || t.authorId !== userId)
      return reply.code(404).send({ error: "Thème introuvable" });
    await prisma.theme.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    return reply.send({ ok: true });
  });

  // Create/update my theme draft
  fastify.post("/", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = request.body as { name: string, description: string, data: string, isPrivate: boolean };
    const name = String(body.name || "").trim();
    if (!name) return reply.code(400).send({ error: "Nom requis" });
    const description = body.description ? String(body.description) : null;
    const raw = body.data;
    if (!raw || typeof raw !== "object")
      return reply.code(400).send({ error: "Données du thème invalides" });
    let data;
    try {
      data = coerceThemeData(raw);
    } catch {
      return reply
        .code(400)
        .send({ error: "Données du thème invalides (format)" });
    }
    const isPrivate = Boolean(body.isPrivate);
    const created = await prisma.theme.create({
      data: {
        name,
        description,
        data,
        authorId: userId as string,
        status: "DRAFT",
        isPrivate,
      },
      select: { id: true, name: true, status: true },
    });
    return reply.send(created);
  });

  // Update my theme draft (only when status = DRAFT)
  fastify.patch("/:id", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({
      where: { id },
      select: { id: true, authorId: true, status: true },
    });
    if (!t || t.authorId !== userId)
      return reply.code(404).send({ error: "Thème introuvable" });
    if (t.status !== ("DRAFT"))
      return reply
        .code(400)
        .send({ error: "Seuls les brouillons sont modifiables" });
    const body = request.body as { name: string, description: string, data: string, isPrivate: boolean };
    let patch: Theme;
    if (typeof body.name === "string" && body.name.trim())
      patch.name = body.name.trim();
    if (typeof body.description === "string")
      patch.description = body.description;
    if (body.data) {
      try {
        patch.data = coerceThemeData(body.data);
      } catch {
        return reply
          .code(400)
          .send({ error: "Données du thème invalides (format)" });
      }
    }
    if (typeof body.isPrivate === "boolean")
      patch.isPrivate = Boolean(body.isPrivate);
    const updated = await prisma.theme.update({
      where: { id },
      data: patch,
      select: { id: true, name: true, status: true },
    });
    return reply.send(updated);
  });

  // Delete my theme draft (allow for DRAFT or REJECTED)
  fastify.delete("/:id", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({
      where: { id },
      select: { id: true, authorId: true, status: true },
    });
    if (!t || t.authorId !== userId)
      return reply.code(404).send({ error: "Thème introuvable" });
    // Allow the owner to delete their theme at any status (DRAFT/SUBMITTED/APPROVED/REJECTED)
    await prisma.theme.delete({ where: { id } });
    return reply.send({ ok: true });
  });

  // Submit a draft for approval
  fastify.post("/:id/submit", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const theme = await prisma.theme.findUnique({
      where: { id },
      select: { id: true, authorId: true, status: true },
    });
    if (!theme || theme.authorId !== userId)
      return reply.code(404).send({ error: "Thème introuvable" });
    const updated = await prisma.theme.update({
      where: { id },
      data: { status: "SUBMITTED" },
      select: { id: true, status: true },
    });
    return reply.send(updated);
  });

  // Toggle private flag on my theme (owner only)
  fastify.post("/:id/privacy", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });
    if (!t || t.authorId !== userId)
      return reply.code(404).send({ error: "Thème introuvable" });
    const { isPrivate } = request.body as { isPrivate: boolean };
    const updated = await prisma.theme.update({
      where: { id },
      data: { isPrivate: Boolean(isPrivate) },
      select: { id: true, isPrivate: true },
    });
    return reply.send(updated);
  });

  // Select a private theme to use on my profile (doesn't publish it)
  fastify.post("/select", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = request.body as { themeId: string, builtInIndex: number };
    const { themeId, builtInIndex } = body;
    if (typeof builtInIndex === "number") {
      // Use built-in theme: read built-ins and pick index
      const built = readBuiltInThemes();
      if (!Array.isArray(built) || built.length === 0)
        return reply.code(400).send({ error: "No built-in themes available" });
      if (builtInIndex < 0 || builtInIndex >= built.length)
        return reply.code(400).send({ error: "builtInIndex out of range" });
      const themeData = built[builtInIndex];
      // create a private theme in DB for this user and select it
      const created = await prisma.theme.create({
        data: {
          name: `builtin-${builtInIndex}`,
          data: themeData,
          authorId: userId as string,
          status: "APPROVED",
          isPrivate: true,
        },
        select: { id: true },
      });
      await prisma.user.update({
        where: { id: userId as string },
        data: { selectedCustomThemeId: created.id },
      });
      return reply.send({ ok: true, selected: created.id });
    }
    if (!themeId || typeof themeId !== "string")
      return reply.code(400).send({ error: "themeId requis" });
    const t = await prisma.theme.findUnique({
      where: { id: themeId },
      select: { id: true, authorId: true, isPrivate: true, status: true },
    });
    if (!t || t.authorId !== userId)
      return reply.code(404).send({ error: "Thème introuvable" });
    // Autoriser l’utilisation de n’importe quel thème qui t’appartient (privé, brouillon, soumis ou approuvé)
    await prisma.user.update({
      where: { id: userId as string },
      data: { selectedCustomThemeId: t.id },
    });
    return reply.send({ ok: true });
  });

  // Submit an update for an approved theme (store as pendingUpdate)
  fastify.post("/:id/update", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({
      where: { id },
      select: { id: true, authorId: true, status: true },
    });
    if (!t || t.authorId !== userId)
      return reply.code(404).send({ error: "Thème introuvable" });
    if (t.status !== ("APPROVED"))
      return reply.code(400).send({
        error: "Seuls les thèmes approuvés peuvent proposer une mise à jour",
      });
    const body = request.body as { data: object, message: string };
    if (!body.data || typeof body.data !== "object")
      return reply.code(400).send({ error: "Données invalides" });
    let normalized;
    try {
      normalized = coerceThemeData(body.data);
    } catch {
      return reply
        .code(400)
        .send({ error: "Données du thème invalides (format)" });
    }
    const message =
      typeof body.message === "string" ? body.message.slice(0, 280) : null;
    const updated = await prisma.theme.update({
      where: { id },
      data: {
        pendingUpdate: normalized,
        pendingUpdateAt: new Date(),
        pendingUpdateMessage: message,
      },
    });
    return reply.send({ id: updated.id, pending: true });
  });
}