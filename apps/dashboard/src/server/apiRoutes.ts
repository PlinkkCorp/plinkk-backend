import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import {
  listBannedSlugs,
  createBannedSlug,
  deleteBannedSlugById,
} from "../lib/bannedSlugs";
import path from "path";
import { existsSync, readdirSync } from "fs";
import { verifyRoleIsStaff } from "../lib/verifyRole";
import { logAdminAction } from "../lib/adminLogger";
import { apiMeRoutes } from "./api/me";
import { apiThemeRoutes } from "./api/theme";
import { apiUsersRoutes } from "./api/users";
import { apiAdminPlinkksRoutes } from "./api/admin/plinkks";
import { apiAdminRolesRoutes } from "./api/admin/roles";
import { apiAdminRedirectsRoutes } from "./api/admin/redirects";
import { apiStripeRoutes } from "./api/stripe";
import { UnauthorizedError, ForbiddenError, BadRequestError, ConflictError } from "@plinkk/shared";
import { apiAdminMaintenanceRoutes } from "./api/admin/maintenance";

// const prisma = new PrismaClient();

let bootstrapIconsCache: { slug: string; displayName: string; url: string }[] | null = null;

export function apiRoutes(fastify: FastifyInstance) {
  fastify.register(apiMeRoutes, { prefix: "/me" });
  fastify.register(apiThemeRoutes, { prefix: "/themes" });
  fastify.register(apiUsersRoutes, { prefix: "/users" });
  fastify.register(apiAdminPlinkksRoutes, { prefix: "/admin/plinkks" });
  fastify.register(apiAdminRolesRoutes, { prefix: "/admin/roles" });
  fastify.register(apiAdminRedirectsRoutes, { prefix: "/admin/redirects" });
  fastify.register(apiAdminMaintenanceRoutes, { prefix: "/admin/maintenance" });
  fastify.register(apiStripeRoutes, { prefix: "/stripe" });

  fastify.get("/roles", async (request, reply) => {
    const sessionData = request.session.get("data");
    if (!sessionData) throw new UnauthorizedError();
    const userId = typeof sessionData === "object" ? sessionData.id : sessionData;
    const me = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role)))
      throw new ForbiddenError();
    const roles = await prisma.role.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return reply.send({ roles });
  });

  fastify.get("/bans", async (request, reply) => {
    const sessionData = request.session.get("data");
    if (!sessionData) throw new UnauthorizedError();
    const userId = typeof sessionData === "object" ? sessionData.id : sessionData;
    const me = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role)))
      throw new ForbiddenError();
    const list = await listBannedSlugs();
    return reply.send({ bans: list });
  });

  fastify.post("/bans", async (request, reply) => {
    const sessionData = request.session.get("data");
    if (!sessionData) throw new UnauthorizedError();
    const userId = typeof sessionData === "object" ? sessionData.id : sessionData;
    if (!userId) throw new UnauthorizedError();
    const me = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role)))
      throw new ForbiddenError();
    const body = request.body as { slug: string; reason: string };
    const slug = (body.slug || "").trim();
    if (!slug) throw new BadRequestError("missing_slug");
    try {
      const created = await createBannedSlug(slug, body.reason);
      await logAdminAction(userId, 'BAN_SLUG', slug, { reason: body.reason }, request.ip);
      return reply.send({ ok: true, ban: created });
    } catch (e: any) {
      if (String(e?.message) === "bannedslug_table_missing") {
        request.log?.error(e, "BannedSlug table missing in DB");
        return reply.code(500).send({
          error: "bannedslug_table_missing",
          message:
            "La table BannedSlug est absente; exécutez `npx prisma db push` ou appliquez la migration.",
        });
      }
      if (
        String(e?.message).includes("Unique") ||
        String(e?.message).includes("UNIQUE")
      )
        throw new ConflictError("already_banned");
      throw e;
    }
  });

  fastify.delete("/bans", async (request, reply) => {
    const sessionData = request.session.get("data");
    if (!sessionData) return reply.code(401).send({ error: "unauthorized" });
    const userId = typeof sessionData === "object" ? sessionData.id : sessionData;
    const me = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    if (!(me && verifyRoleIsStaff(me.role)))
      return reply.code(403).send({ error: "forbidden" });
    const { id } = request.query as { id: string };
    if (!id) return reply.code(400).send({ error: "missing_id" });
    try {
      await deleteBannedSlugById(String(id));
      await logAdminAction(userId, 'UNBAN_SLUG', id, {}, request.ip);
      return reply.send({ ok: true });
    } catch (e) {
      if (String(e?.message) === "bannedslug_table_missing") {
        request.log?.error(e, "BannedSlug table missing in DB");
        return reply.code(500).send({
          error: "bannedslug_table_missing",
          message:
            "La table BannedSlug est absente; exécutez `npx prisma db push` ou appliquez la migration.",
        });
      }
      return reply.code(404).send({ error: "not_found" });
    }
  });

  fastify.get("/icons", async (request, reply) => {
    const iconsDir = path.join(__dirname, "..", "public", "images", "icons");
    const toTitle = (s: string) =>
      s
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b(\w)/g, (_, c: string) => c.toUpperCase());

    let list: { slug: string; displayName: string; url?: string }[] = [];
    if (existsSync(iconsDir)) {
      const entries = readdirSync(iconsDir, { withFileTypes: true });
      list = entries
        .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".svg"))
        .map((e) => {
          const slug = e.name.replace(/\.svg$/i, "");
          return { slug, displayName: toTitle(slug) };
        });
    }

    if (!bootstrapIconsCache) {
      try {
        const res = await fetch(
          "https://raw.githubusercontent.com/twbs/icons/main/font/bootstrap-icons.json"
        );
        if (res.ok) {
          const data = (await res.json()) as Record<string, number>;
          bootstrapIconsCache = Object.keys(data).map((slug) => ({
            slug: `bi-${slug}`,
            displayName: toTitle(slug),
            url: `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/${slug}.svg`,
          }));
        }
      } catch (e) {
        console.error("Failed to fetch bootstrap icons", e);
      }
    }

    const combined = [...list, ...(bootstrapIconsCache || [])];
    combined.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return reply.send(combined);
  });
}
