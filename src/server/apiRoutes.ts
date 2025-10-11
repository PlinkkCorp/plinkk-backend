import { FastifyInstance } from "fastify";
import { PrismaClient, Role } from "../../generated/prisma/client";
import {
  getMaxPagesForRole,
  getNextIndex,
  reindexNonDefault,
  slugify,
  suggestUniqueSlug,
  createPlinkkForUser,
  isReservedSlug,
} from "./plinkkUtils";
import {
  listBannedSlugs,
  createBannedSlug,
  deleteBannedSlugById,
} from "./bannedSlugs";
import path from "path";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import crypto from "crypto";
import z from "zod";
import bcrypt from "bcrypt";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { verifyDomain } from "../lib/verifyDNS";
import { createCanvas, loadImage, registerFont } from "canvas";

const prisma = new PrismaClient();
// In-memory store for pending 2FA secrets awaiting user confirmation (keyed by userId)
const pending2fa = new Map<
  string,
  { secret: string; otpauth: string; createdAt: number }
>();

export function apiRoutes(fastify: FastifyInstance) {
  // === API: Gestion de mes Plinkks (profils secondaires) ===
  // Create plinkk
  fastify.post("/me/plinkks", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const body = (request.body as any) || {};
    const rawSlug = typeof body.slug === "string" ? body.slug : "";
    const rawName = typeof body.name === "string" ? body.name : "";
    try {
      // Normaliser la base; éviter mots réservés
      const base = slugify(rawSlug || rawName || "page");
      if (!base || (await isReservedSlug(prisma as any, base)))
        return reply.code(400).send({ error: "invalid_or_reserved_slug" });
      // Interdire conflit avec un @ d'utilisateur
      const userConflict = await prisma.user.findUnique({
        where: { id: base },
        select: { id: true },
      });
      if (userConflict)
        return reply.code(409).send({ error: "slug_conflicts_with_user" });
      // Interdire conflit direct avec un autre plinkk (suggestion générera une variante de toute façon)
      const created = await createPlinkkForUser(prisma as any, userId, {
        name: rawName,
        slugBase: base,
      });
      return reply
        .code(201)
        .send({ id: created.id, slug: created.slug, name: created.name });
    } catch (e: any) {
      if (e?.message === "max_pages_reached")
        return reply.code(400).send({ error: "max_pages_reached" });
      if (e?.message === "user_not_found")
        return reply.code(401).send({ error: "unauthorized" });
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  // Admin: bans API (mounted under /api because apiRoutes is registered with prefix '/api')
  fastify.get("/bans", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    if (
      !(
        me &&
        (me.role === Role.ADMIN ||
          me.role === Role.DEVELOPER ||
          me.role === Role.MODERATOR)
      )
    )
      return reply.code(403).send({ error: "forbidden" });
    const list = await listBannedSlugs();
    return reply.send({ bans: list });
  });

  fastify.post("/bans", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "unauthorized" });
    const me = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    if (
      !(
        me &&
        (me.role === Role.ADMIN ||
          me.role === Role.DEVELOPER ||
          me.role === Role.MODERATOR)
      )
    )
      return reply.code(403).send({ error: "forbidden" });
    const body = request.body as any;
    const slug = (body.slug || "").trim();
    if (!slug) return reply.code(400).send({ error: "missing_slug" });
    try {
      const created = await createBannedSlug(slug, body.reason);
      return reply.send({ ok: true, ban: created });
    } catch (e: any) {
      // If the DB table is missing, return a clear error so the frontend can show guidance.
      if (String(e?.message) === "bannedslug_table_missing") {
        request.log?.error(e, "BannedSlug table missing in DB");
        return reply.code(500).send({
          error: "bannedslug_table_missing",
          message:
            "La table BannedSlug est absente; ex
