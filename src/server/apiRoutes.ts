import { FastifyInstance } from "fastify";
import { PrismaClient, Role } from "../../generated/prisma/client";
import { getMaxPagesForRole, getNextIndex, reindexNonDefault, slugify, suggestUniqueSlug, createPlinkkForUser, RESERVED_SLUGS } from './plinkkUtils';
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

const prisma = new PrismaClient();
// In-memory store for pending 2FA secrets awaiting user confirmation (keyed by userId)
const pending2fa = new Map<
  string,
  { secret: string; otpauth: string; createdAt: number }
>();

export function apiRoutes(fastify: FastifyInstance) {
  // === API: Gestion de mes Plinkks (profils secondaires) ===
  // Create plinkk
  fastify.post('/me/plinkks', async (request, reply) => {
    const userId = request.session.get('data') as string | undefined;
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });
    const body = (request.body as any) || {};
    const rawSlug = typeof body.slug === 'string' ? body.slug : '';
    const rawName = typeof body.name === 'string' ? body.name : '';
    try {
      // Normaliser la base; éviter mots réservés
      const base = slugify(rawSlug || rawName || 'page');
      if (!base || RESERVED_SLUGS.has(base)) return reply.code(400).send({ error: 'invalid_or_reserved_slug' });
      // Interdire conflit avec un @ d'utilisateur
      const userConflict = await prisma.user.findUnique({ where: { id: base }, select: { id: true } });
      if (userConflict) return reply.code(409).send({ error: 'slug_conflicts_with_user' });
      // Interdire conflit direct avec un autre plinkk (suggestion générera une variante de toute façon)
      const created = await createPlinkkForUser(prisma as any, userId, { name: rawName, slugBase: base });
      return reply.code(201).send({ id: created.id, slug: created.slug, name: created.name });
    } catch (e: any) {
      if (e?.message === 'max_pages_reached') return reply.code(400).send({ error: 'max_pages_reached' });
      if (e?.message === 'user_not_found') return reply.code(401).send({ error: 'unauthorized' });
      return reply.code(500).send({ error: 'internal_error' });
    }
  });

  // Update plinkk (toggle default/public)
  fastify.patch('/me/plinkks/:id', async (request, reply) => {
    const userId = request.session.get('data') as string | undefined;
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });
    const { id } = request.params as { id: string };
    const p = await prisma.plinkk.findUnique({ where: { id } });
    if (!p || p.userId !== userId) return reply.code(404).send({ error: 'not_found' });
    const body = (request.body as any) || {};
    const patch: any = {};
    // Toggle public
    if (typeof body.isPublic === 'boolean') {
      patch.isPublic = Boolean(body.isPublic);
      patch.visibility = (body.isPublic ? 'PUBLIC' : 'PRIVATE') as any;
    }
    // Set default
    if (body.isDefault === true && !p.isDefault) {
      const prev = await prisma.plinkk.findFirst({ where: { userId, isDefault: true } });
      await prisma.$transaction([
        ...(prev ? [prisma.plinkk.update({ where: { id: prev.id }, data: { isDefault: false, index: Math.max(1, prev.index || 1) } })] : []),
        prisma.plinkk.update({ where: { id }, data: { isDefault: true, index: 0 } }),
      ]);
      await reindexNonDefault(prisma as any, userId);
    }
    if (Object.keys(patch).length) {
      await prisma.plinkk.update({ where: { id }, data: patch });
    }
    return reply.send({ ok: true });
  });

  // Delete plinkk
  fastify.delete('/me/plinkks/:id', async (request, reply) => {
    const userId = request.session.get('data') as string | undefined;
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findUnique({ where: { id } });
    if (!page || page.userId !== userId) return reply.code(404).send({ error: 'not_found' });
    if (page.isDefault) {
      const others = await prisma.plinkk.count({ where: { userId, NOT: { id } } });
      if (others > 0) return reply.code(400).send({ error: 'cannot_delete_default' });
    }
    await prisma.plinkk.delete({ where: { id } });
    await reindexNonDefault(prisma as any, userId);
    return reply.send({ ok: true });
  });
  // Helpers: thème simplifié (3 couleurs) -> format complet avec opposite (light/dark)
  function normalizeHex(v?: string) {
    if (!v || typeof v !== 'string') return '#000000';
    const s = v.trim();
    if (/^#?[0-9a-fA-F]{3}$/.test(s)) {
      const t = s.replace('#', '');
      return '#' + t.split('').map((c) => c + c).join('');
    }
    if (/^#?[0-9a-fA-F]{6}$/.test(s)) return s.startsWith('#') ? s : ('#' + s);
    return '#000000';
  }
  function luminance(hex: string) {
    const h = normalizeHex(hex).slice(1);
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function contrastText(bg: string) { return luminance(bg) > 0.5 ? '#111827' : '#ffffff'; }
  function mix(hexA: string, hexB: string, ratio = 0.2) {
    const a = normalizeHex(hexA).slice(1);
    const b = normalizeHex(hexB).slice(1);
    const c = (i: number) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - ratio) + parseInt(b.slice(i, i + 2), 16) * ratio);
    const r = c(0), g = c(2), bl = c(4);
    return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
  }
  function hoverVariant(color: string) {
    // Crée une variante hover en mélangeant avec blanc/noir selon la luminance
    return luminance(color) > 0.5 ? mix(color, '#000000', 0.2) : mix(color, '#ffffff', 0.2);
  }
  type SimplifiedVariant = { bg: string; button: string; hover: string };
  function toFullTheme(light: SimplifiedVariant, dark: SimplifiedVariant) {
    const L = {
      background: normalizeHex(light.bg),
      hoverColor: normalizeHex(light.hover),
      textColor: contrastText(light.bg),
      buttonBackground: normalizeHex(light.button),
      buttonHoverBackground: hoverVariant(light.button),
      buttonTextColor: contrastText(light.button),
      linkHoverColor: normalizeHex(light.hover),
      articleHoverBoxShadow: `0 4px 12px ${normalizeHex(light.hover)}55`,
      darkTheme: false,
    };
    const D = {
      background: normalizeHex(dark.bg),
      hoverColor: normalizeHex(dark.hover),
      textColor: contrastText(dark.bg),
      buttonBackground: normalizeHex(dark.button),
      buttonHoverBackground: hoverVariant(dark.button),
      buttonTextColor: contrastText(dark.button),
      linkHoverColor: normalizeHex(dark.hover),
      articleHoverBoxShadow: `0 4px 12px ${normalizeHex(dark.hover)}55`,
      darkTheme: true,
    };
    return { ...L, opposite: D } as any;
  }
  function coerceThemeData(data: any) {
    // Si déjà au format complet (background/hoverColor/etc.), le retourner tel quel
    if (data && typeof data === 'object' && 'background' in data && ('opposite' in data || 'darkTheme' in data)) return data;
    // Sinon si format simplifié { light: {bg,button,hover}, dark: {bg,button,hover} }
    if (data && data.light && data.dark) {
      const l = data.light as SimplifiedVariant; const d = data.dark as SimplifiedVariant;
      return toFullTheme(l, d);
    }
    // Dernier recours: si ne contient que 3 couleurs uniques, dupliquer pour dark en inversant légèrement
    if (data && data.bg && data.button && data.hover) {
      const l = { bg: data.bg, button: data.button, hover: data.hover } as SimplifiedVariant;
      const d = { bg: hoverVariant(data.bg), button: hoverVariant(data.button), hover: data.hover } as SimplifiedVariant;
      return toFullTheme(l, d);
    }
    throw new Error('invalid_theme_payload');
  }
  // THEME APIs
  // List approved themes (public)
  fastify.get("/themes/approved", async (request, reply) => {
    const themes = await prisma.theme.findMany({
      where: { status: "APPROVED" as any, isPrivate: false },
      select: ({ id: true, name: true, description: true, data: true, author: { select: { id: true, userName: true } } } as any),
      orderBy: { createdAt: "desc" },
    });
    // Ensure data has the shape expected by front
    const list = themes.map((t) => {
      let full: any;
      try { full = coerceThemeData(t.data as any); } catch { full = t.data as any; }
      return {
        id: t.id,
        name: t.name,
        description: t.description || "",
        source: "community",
        author: t.author,
        ...(full || {}),
      };
    });
    return reply.send(list);
  });

  // List all themes: built-in + approved community themes (and optionally owner's themes if requested)
  fastify.get('/themes/list', async (request, reply) => {
    // Use server-side builtInThemes module
    let builtIns: any[] = [];
    try {
      // Lazy require to avoid potential startup ordering issues
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { builtInThemes } = require('./builtInThemes');
      if (Array.isArray(builtInThemes)) builtIns = builtInThemes;
    } catch (e) {
      builtIns = [];
    }

    // Load approved community themes from DB
    const community = await prisma.theme.findMany({ where: { status: 'APPROVED' as any, isPrivate: false }, select: { id: true, name: true, description: true, data: true, author: { select: { id: true, userName: true } } }, orderBy: { createdAt: 'desc' } });
    const list = [] as any[];
    // normalize community themes using coerceThemeData
    for (const t of community) {
      let full: any;
      try { full = coerceThemeData(t.data as any); } catch { full = t.data as any; }
      list.push({ id: t.id, name: t.name, description: t.description || '', source: 'community', author: t.author, ...(full || {}) });
    }

    // Optionally include user's own themes when query userId is provided (for editor)
    const userId = (request.query as any)?.userId;
    if (userId && typeof userId === 'string') {
      const mine = await prisma.theme.findMany({ where: { authorId: userId }, select: { id: true, name: true, description: true, data: true, status: true } });
      for (const t of mine) {
        let full: any;
        try { full = coerceThemeData(t.data as any); } catch { full = t.data as any; }
        list.push({ id: t.id, name: t.name, description: t.description || '', source: 'mine', status: t.status, ...(full || {}) });
      }
    }

    // Return built-ins first, then community and mine
    return reply.send({ builtIns, themes: list });
  });

  // Helper: read built-in themes from server module
  function readBuiltInThemes(): any[] {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { builtInThemes } = require('./builtInThemes');
      return Array.isArray(builtInThemes) ? builtInThemes : [];
    } catch (e) {
      return [];
    }
  }

  // Create/update my theme draft
  fastify.post("/me/themes", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = (request.body as any) || {};
    const name = String(body.name || "").trim();
    if (!name) return reply.code(400).send({ error: "Nom requis" });
    const description = body.description ? String(body.description) : null;
    const raw = body.data;
    if (!raw || typeof raw !== "object") return reply.code(400).send({ error: "Données du thème invalides" });
    let data: any;
    try { data = coerceThemeData(raw); } catch { return reply.code(400).send({ error: "Données du thème invalides (format)" }); }
    const isPrivate = Boolean(body.isPrivate);
    const created = await prisma.theme.create({
      data: { name, description, data, authorId: userId as string, status: "DRAFT" as any, isPrivate },
      select: { id: true, name: true, status: true },
    });
    return reply.send(created);
  });

  // Update my theme draft (only when status = DRAFT)
  fastify.patch("/me/themes/:id", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({ where: { id }, select: { id: true, authorId: true, status: true } });
    if (!t || t.authorId !== userId) return reply.code(404).send({ error: "Thème introuvable" });
    if (t.status !== ("DRAFT" as any)) return reply.code(400).send({ error: "Seuls les brouillons sont modifiables" });
    const body = (request.body as any) || {};
    const patch: any = {};
    if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();
    if (typeof body.description === 'string') patch.description = body.description;
    if (body.data) {
      try { patch.data = coerceThemeData(body.data); } catch { return reply.code(400).send({ error: "Données du thème invalides (format)" }); }
    }
    if (typeof body.isPrivate === 'boolean') patch.isPrivate = Boolean(body.isPrivate);
    const updated = await prisma.theme.update({ where: { id }, data: patch, select: { id: true, name: true, status: true } });
    return reply.send(updated);
  });

  // Delete my theme draft (allow for DRAFT or REJECTED)
  fastify.delete("/me/themes/:id", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({ where: { id }, select: { id: true, authorId: true, status: true } });
    if (!t || t.authorId !== userId) return reply.code(404).send({ error: "Thème introuvable" });
    // Allow the owner to delete their theme at any status (DRAFT/SUBMITTED/APPROVED/REJECTED)
    await prisma.theme.delete({ where: { id } });
    return reply.send({ ok: true });
  });

  // Submit a draft for approval
  fastify.post("/me/themes/:id/submit", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const theme = await prisma.theme.findUnique({ where: { id }, select: { id: true, authorId: true, status: true } });
    if (!theme || theme.authorId !== userId) return reply.code(404).send({ error: "Thème introuvable" });
    const updated = await prisma.theme.update({ where: { id }, data: { status: "SUBMITTED" as any }, select: { id: true, status: true } });
    return reply.send(updated);
  });

  // Toggle private flag on my theme (owner only)
  fastify.post('/me/themes/:id/privacy', async (request, reply) => {
    const userId = request.session.get('data');
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({ where: { id }, select: { id: true, authorId: true } });
    if (!t || t.authorId !== userId) return reply.code(404).send({ error: 'Thème introuvable' });
    const { isPrivate } = (request.body as any) ?? {};
    const updated = await prisma.theme.update({ where: { id }, data: { isPrivate: Boolean(isPrivate) }, select: { id: true, isPrivate: true } });
    return reply.send(updated);
  });

  // Select a private theme to use on my profile (doesn't publish it)
  fastify.post('/me/themes/select', async (request, reply) => {
    const userId = request.session.get('data');
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
    const body = (request.body as any) ?? {};
    const { themeId, builtInIndex } = body;
    if (typeof builtInIndex === 'number') {
      // Use built-in theme: read built-ins and pick index
      const built = readBuiltInThemes();
      if (!Array.isArray(built) || built.length === 0) return reply.code(400).send({ error: 'No built-in themes available' });
      if (builtInIndex < 0 || builtInIndex >= built.length) return reply.code(400).send({ error: 'builtInIndex out of range' });
      const themeData = built[builtInIndex];
      // create a private theme in DB for this user and select it
  const created = await prisma.theme.create({ data: { name: `builtin-${builtInIndex}`, data: themeData as any, authorId: userId as string, status: 'APPROVED' as any, isPrivate: true }, select: { id: true } });
      await prisma.user.update({ where: { id: userId as string }, data: { selectedCustomThemeId: created.id } });
      return reply.send({ ok: true, selected: created.id });
    }
    if (!themeId || typeof themeId !== 'string') return reply.code(400).send({ error: 'themeId requis' });
    const t = await prisma.theme.findUnique({ where: { id: themeId }, select: { id: true, authorId: true, isPrivate: true, status: true } });
    if (!t || t.authorId !== userId) return reply.code(404).send({ error: 'Thème introuvable' });
    // Autoriser l’utilisation de n’importe quel thème qui t’appartient (privé, brouillon, soumis ou approuvé)
    await prisma.user.update({ where: { id: userId as string }, data: { selectedCustomThemeId: t.id } });
    return reply.send({ ok: true });
  });

  // Submit an update for an approved theme (store as pendingUpdate)
  fastify.post("/me/themes/:id/update", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({ where: { id }, select: { id: true, authorId: true, status: true } });
    if (!t || t.authorId !== userId) return reply.code(404).send({ error: "Thème introuvable" });
    if (t.status !== ("APPROVED" as any)) return reply.code(400).send({ error: "Seuls les thèmes approuvés peuvent proposer une mise à jour" });
    const body = (request.body as any) || {};
    if (!body.data || typeof body.data !== 'object') return reply.code(400).send({ error: 'Données invalides' });
    let normalized: any;
    try { normalized = coerceThemeData(body.data); } catch { return reply.code(400).send({ error: 'Données du thème invalides (format)' }); }
    const message = typeof body.message === 'string' ? body.message.slice(0, 280) : null;
    const updated = await prisma.theme.update({ where: { id }, data: { pendingUpdate: normalized as any, pendingUpdateAt: new Date(), pendingUpdateMessage: message } });
    return reply.send({ id: updated.id, pending: true });
  });

  // Admin: approve a pending update -> replace data and clear pending
  fastify.post("/themes/:id/approve-update", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({ where: { id: meId as string }, select: { role: true } });
    if (!(me && (me.role === Role.ADMIN || me.role === Role.DEVELOPER || me.role === Role.MODERATOR))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({ where: { id }, select: { pendingUpdate: true } });
    if (!t || !t.pendingUpdate) return reply.code(400).send({ error: 'Aucune mise à jour en attente' });
    await prisma.theme.update({ where: { id }, data: { data: t.pendingUpdate as any, pendingUpdate: null, pendingUpdateAt: null, pendingUpdateMessage: null } });
    return reply.send({ ok: true });
  });

  // Archive (owner hides from public list) -> sets status ARCHIVED
  fastify.post("/me/themes/:id/archive", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    const t = await prisma.theme.findUnique({ where: { id }, select: { id: true, authorId: true } });
    if (!t || t.authorId !== userId) return reply.code(404).send({ error: "Thème introuvable" });
    await prisma.theme.update({ where: { id }, data: { status: "ARCHIVED" as any } });
    return reply.send({ ok: true });
  });

  // Admin: unarchive (republish) -> sets status APPROVED
  fastify.post("/themes/:id/unarchive", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({ where: { id: meId as string }, select: { role: true } });
    if (!(me && (me.role === Role.ADMIN || me.role === Role.DEVELOPER || me.role === Role.MODERATOR))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    await prisma.theme.update({ where: { id }, data: { status: "APPROVED" as any } });
    return reply.send({ ok: true });
  });

  // Admin: archive a theme (any status) -> sets status ARCHIVED
  fastify.post("/themes/:id/archive", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({ where: { id: meId as string }, select: { role: true } });
    if (!(me && (me.role === Role.ADMIN || me.role === Role.DEVELOPER || me.role === Role.MODERATOR))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    await prisma.theme.update({ where: { id }, data: { status: "ARCHIVED" as any } });
    return reply.send({ ok: true });
  });

  // Admin: approve / reject
  fastify.post("/themes/:id/approve", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({ where: { id: meId as string }, select: { role: true } });
    if (!(me && (me.role === Role.ADMIN || me.role === Role.DEVELOPER || me.role === Role.MODERATOR))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    const updated = await prisma.theme.update({ where: { id }, data: { status: "APPROVED" as any }, select: { id: true, status: true } });
    return reply.send(updated);
  });

  fastify.post("/themes/:id/reject", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({ where: { id: meId as string }, select: { role: true } });
    if (!(me && (me.role === Role.ADMIN || me.role === Role.DEVELOPER || me.role === Role.MODERATOR))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    const updated = await prisma.theme.update({ where: { id }, data: { status: "REJECTED" as any }, select: { id: true, status: true } });
    return reply.send(updated);
  });

  // Admin: delete a theme (any status)
  fastify.delete("/themes/:id", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({ where: { id: meId as string }, select: { role: true } });
    if (!(me && (me.role === Role.ADMIN || me.role === Role.DEVELOPER || me.role === Role.MODERATOR))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    try {
      await prisma.theme.delete({ where: { id } });
      return reply.send({ ok: true });
    } catch (e) {
      return reply.code(404).send({ error: 'Not found' });
    }
  });
  // API: uploader/remplacer la photo de profil (avatar) via data URL (base64)
  fastify.post("/me/avatar", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { dataUrl } = (request.body as any) || {};
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
      return reply.code(400).send({ error: "Invalid payload" });
    }
    try {
      const match = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i.exec(
        dataUrl
      );
      if (!match)
        return reply.code(400).send({ error: "Unsupported image format" });
      const mime = match[1].toLowerCase();
      const base64 = match[3];
      const buf = Buffer.from(base64, "base64");
      // Limite stricte: 128 Ko
      if (buf.byteLength > 128 * 1024) {
        return reply
          .code(413)
          .send({ error: "Image trop lourde (max 128 Ko)" });
      }
      const ext = mime.endsWith("png")
        ? "png"
        : mime.endsWith("webp")
        ? "webp"
        : "jpg";
      const dir = path.join(__dirname, "public", "uploads", "avatars");
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      // Déduplication par hash
      const hash = crypto.createHash("sha256").update(buf).digest("hex");
      const dedupName = `${hash}.${ext}`;
      const filePath = path.join(dir, dedupName);
      const publicUrl = `/public/uploads/avatars/${dedupName}`;

      // Récupérer l'ancienne image du compte (stockée comme nom de fichier ou ancienne URL)
      const me = await prisma.user.findUnique({
        where: { id: userId as string },
        select: { image: true },
      });
      const oldVal = me?.image || null;

      if (!existsSync(filePath)) {
        writeFileSync(filePath, buf);
      }

      // Mettre à jour l'utilisateur avec l'URL publique complète (compat templates/UI)
      await prisma.user.update({
        where: { id: userId as string },
        data: { image: publicUrl },
      });

      // Nettoyage: tenter de supprimer l'ancienne image si non référencée par d'autres
      if (oldVal && oldVal !== publicUrl) {
        const refs = await prisma.user.count({ where: { image: oldVal } });
        if (refs === 0) {
          try {
            let oldPath = "";
            if (oldVal.startsWith("/public/uploads/avatars/")) {
              oldPath = path.join(
                __dirname,
                oldVal.replace(/^\/public\//, "public/")
              );
            } else {
              // ancien format stocké comme "hash.ext"
              oldPath = path.join(dir, oldVal);
            }
            if (existsSync(oldPath)) unlinkSync(oldPath);
          } catch {}
        }
      }

      return reply.send({ ok: true, file: dedupName, url: publicUrl });
    } catch (e) {
      request.log.error(e);
      return reply.code(500).send({ error: "Upload failed" });
    }
  });

  // API: mise à jour de rôle (admin/dev/moderator)
  fastify.post("/users/:id/role", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: meId as string },
      select: { role: true },
    });
    if (
      !(
        me &&
        (me.role === Role.ADMIN ||
          me.role === Role.DEVELOPER ||
          me.role === Role.MODERATOR)
      )
    ) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    const { role } = (request.body as any) || {};
    if (!Object.values(Role).includes(role))
      return reply.code(400).send({ error: "Invalid role" });
    // Enforce role hierarchy rules:
    // hierarchy: USER(0) < MODERATOR(1) < DEVELOPER(2) < ADMIN(3)
    const rank: Record<string, number> = { USER: 0, MODERATOR: 1, DEVELOPER: 2, ADMIN: 3 };
    const meRole = me.role as string;
    const targetRole = role as string;

    // Admin may do anything
    if (meRole !== Role.ADMIN) {
      // Developer cannot promote to ADMIN
      if (meRole === Role.DEVELOPER) {
        if (targetRole === Role.ADMIN) return reply.code(403).send({ error: 'Forbidden' });
      } else {
        // Others (moderator) cannot set a role equal or higher than themselves
        if (rank[targetRole] >= rank[meRole]) return reply.code(403).send({ error: 'Forbidden' });
      }
    }

    const updated = await prisma.user.update({ where: { id }, data: { role } });
    return reply.send({ id: updated.id, role: updated.role });
  });

  // API: régler les cosmétiques (ex: flair, bannerUrl, frame) — admin/dev/moderator
  fastify.post("/users/:id/cosmetics", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: meId as string },
      select: { role: true },
    });
    if (
      !(
        me &&
        (me.role === Role.ADMIN ||
          me.role === Role.DEVELOPER ||
          me.role === Role.MODERATOR)
      )
    ) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    const cosmetics = (request.body as any) ?? null;
    const updated = await prisma.user.update({
      where: { id },
      data: { cosmetics },
      include: { cosmetics: true },
    });
    return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
  });

  // API: suppression d'un utilisateur (admin/dev/moderator)
  fastify.delete("/users/:id", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: meId as string },
      select: { role: true },
    });
    if (
      !(
        me &&
        (me.role === Role.ADMIN ||
          me.role === Role.DEVELOPER ||
          me.role === Role.MODERATOR)
      )
    ) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    await prisma.$transaction([
      prisma.link.deleteMany({ where: { userId: id } }),
      prisma.label.deleteMany({ where: { userId: id } }),
      prisma.socialIcon.deleteMany({ where: { userId: id } }),
      prisma.backgroundColor.deleteMany({ where: { userId: id } }),
      prisma.neonColor.deleteMany({ where: { userId: id } }),
      prisma.statusbar.deleteMany({ where: { userId: id } }),
      prisma.cosmetic.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);
    return reply.send({ ok: true });
  });

  // API: désactiver la 2FA d'un utilisateur (admin/dev/moderator)
  fastify.post("/users/:id/2fa/disable", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({
      where: { id: meId as string },
      select: { role: true },
    });
    if (
      !(
        me &&
        (me.role === Role.ADMIN ||
          me.role === Role.DEVELOPER ||
          me.role === Role.MODERATOR)
      )
    ) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, twoFactorEnabled: true, twoFactorSecret: true },
    });
    if (!target) return reply.code(404).send({ error: "Utilisateur introuvable" });

    const alreadyDisabled = !target.twoFactorEnabled && !target.twoFactorSecret;
    if (alreadyDisabled) return reply.send({ ok: true, changed: false });

    await prisma.user.update({
      where: { id },
      data: { twoFactorSecret: "", twoFactorEnabled: false },
    });
    return reply.send({ ok: true, changed: true });
  });

  // API: Récupérer la configuration complète du profil pour l'éditeur
  // Version par Plinkk (édition indépendante par page)
  fastify.get('/me/plinkks/:id/config', async (request, reply) => {
    const userId = request.session.get('data');
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({ where: { id, userId: String(userId) } });
    if (!page) return reply.code(404).send({ error: 'Plinkk introuvable' });

    const [settings, user, background, neonColors, labels, socialIcon, statusbar, links] = await Promise.all([
        prisma.plinkkSettings.findUnique({ where: { plinkkId: id } }),
        prisma.user.findUnique({ where: { id: String(userId) } }) as any,
      prisma.backgroundColor.findMany({ where: { userId: String(userId), plinkkId: id } }),
      prisma.neonColor.findMany({ where: { userId: String(userId), plinkkId: id } }),
      prisma.label.findMany({ where: { userId: String(userId), plinkkId: id } }),
      prisma.socialIcon.findMany({ where: { userId: String(userId), plinkkId: id } }),
      prisma.plinkkStatusbar.findUnique({ where: { plinkkId: id } }),
      prisma.link.findMany({ where: { userId: String(userId), plinkkId: id } }),
    ]);

    const cfg = {
      // Champs d'identité/texte: si un enregistrement PlinkkSettings existe, on respecte ses valeurs
      // même si elles valent null (ce qui signifie "effacé"), sinon on fallback vers user.
      profileLink: settings != null ? settings.profileLink : ((user as any)?.profileLink ?? null),
      profileImage: settings != null ? settings.profileImage : ((user as any)?.profileImage ?? null),
      profileIcon: settings != null ? settings.profileIcon : ((user as any)?.profileIcon ?? null),
      profileSiteText: settings != null ? settings.profileSiteText : ((user as any)?.profileSiteText ?? null),
      userName: settings != null ? settings.userName : ((user as any)?.userName ?? null),
      // Email public spécifique à la Plinkk : si settings présent ET que la
      // propriété `affichageEmail` est définie, l'utiliser (même si null =>
      // effacement explicite). Sinon fallback vers user.publicEmail || user.email.
      email: (settings != null && Object.prototype.hasOwnProperty.call(settings, 'affichageEmail'))
        ? (settings as any).affichageEmail
        : ((user as any)?.publicEmail ?? (user as any)?.email ?? ''),
      iconUrl: settings != null ? settings.iconUrl : ((user as any)?.iconUrl ?? null),
      description: settings != null ? settings.description : ((user as any)?.description ?? null),
      profileHoverColor: settings?.profileHoverColor ?? (user as any)?.profileHoverColor ?? null,
      degBackgroundColor: settings?.degBackgroundColor ?? (user as any)?.degBackgroundColor ?? null,
      neonEnable: settings?.neonEnable ?? (user as any)?.neonEnable ?? 0,
      buttonThemeEnable: settings?.buttonThemeEnable ?? (user as any)?.buttonThemeEnable ?? 0,
      EnableAnimationArticle: settings?.EnableAnimationArticle ?? (user as any)?.EnableAnimationArticle ?? 0,
      EnableAnimationButton: settings?.EnableAnimationButton ?? (user as any)?.EnableAnimationButton ?? 0,
      EnableAnimationBackground: settings?.EnableAnimationBackground ?? (user as any)?.EnableAnimationBackground ?? 0,
      backgroundSize: settings?.backgroundSize ?? (user as any)?.backgroundSize ?? null,
      selectedThemeIndex: settings?.selectedThemeIndex ?? (user as any)?.selectedThemeIndex ?? null,
      selectedAnimationIndex: settings?.selectedAnimationIndex ?? (user as any)?.selectedAnimationIndex ?? null,
      selectedAnimationButtonIndex: settings?.selectedAnimationButtonIndex ?? (user as any)?.selectedAnimationButtonIndex ?? null,
      selectedAnimationBackgroundIndex: settings?.selectedAnimationBackgroundIndex ?? (user as any)?.selectedAnimationBackgroundIndex ?? null,
      animationDurationBackground: settings?.animationDurationBackground ?? (user as any)?.animationDurationBackground ?? null,
      delayAnimationButton: settings?.delayAnimationButton ?? (user as any)?.delayAnimationButton ?? null,
      canvaEnable: settings?.canvaEnable ?? (user as any)?.canvaEnable ?? 0,
      selectedCanvasIndex: settings?.selectedCanvasIndex ?? (user as any)?.selectedCanvasIndex ?? null,
      background: background.map((c) => c.color),
      neonColors: neonColors.map((c) => c.color),
      labels: labels.map((l) => ({ data: l.data, color: l.color, fontColor: l.fontColor })),
      socialIcon: socialIcon.map((s) => ({ url: s.url, icon: s.icon })),
      links: links.map((l) => ({ id: l.id, icon: l.icon, url: l.url, text: l.text, name: l.name, description: l.description, showDescriptionOnHover: l.showDescriptionOnHover, showDescription: l.showDescription })),
      statusbar: statusbar ? { text: statusbar.text, colorBg: statusbar.colorBg, fontTextColor: statusbar.fontTextColor, statusText: statusbar.statusText } : null,
    };
    return reply.send(cfg);
  });

  // API: Mettre à jour la configuration du profil depuis l'éditeur (par Plinkk)
  fastify.put('/me/plinkks/:id/config', async (request, reply) => {
    const userId = request.session.get('data');
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    const page = await prisma.plinkk.findFirst({ where: { id, userId: String(userId) } });
    if (!page) return reply.code(404).send({ error: 'Plinkk introuvable' });

    const body = (request.body as any) ?? {};
    const pickDefined = (obj: Record<string, any>) => Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

    await prisma.$transaction(async (tx) => {
      // Upsert des réglages de page
      const data = pickDefined({
        profileLink: body.profileLink,
        profileImage: body.profileImage,
        profileIcon: body.profileIcon,
        profileSiteText: body.profileSiteText,
        userName: body.userName,
        // affichageEmail: valeur publique spécifique à cette Plinkk
        affichageEmail: body.email,
        iconUrl: body.iconUrl,
        description: body.description,
        profileHoverColor: body.profileHoverColor,
        degBackgroundColor: body.degBackgroundColor,
        neonEnable: body.neonEnable,
        buttonThemeEnable: body.buttonThemeEnable,
        EnableAnimationArticle: body.EnableAnimationArticle,
        EnableAnimationButton: body.EnableAnimationButton,
        EnableAnimationBackground: body.EnableAnimationBackground,
        backgroundSize: body.backgroundSize,
        selectedThemeIndex: body.selectedThemeIndex,
        selectedAnimationIndex: body.selectedAnimationIndex,
        selectedAnimationButtonIndex: body.selectedAnimationButtonIndex,
        selectedAnimationBackgroundIndex: body.selectedAnimationBackgroundIndex,
        animationDurationBackground: body.animationDurationBackground,
        delayAnimationButton: body.delayAnimationButton,
        canvaEnable: body.canvaEnable,
        selectedCanvasIndex: body.selectedCanvasIndex,
      });
      if (Object.keys(data).length > 0) {
        await tx.plinkkSettings.upsert({
          where: { plinkkId: id },
          create: { plinkkId: id, ...data },
          update: data,
        });
      }

      // If the editor submitted a userName, persist it as the plinkk's public name
      // so that the "Nom affiché" shown in the editor is the canonical plinkk.name.
      if (typeof body.userName === 'string' && body.userName.trim()) {
        await tx.plinkk.update({ where: { id }, data: { name: body.userName.trim() } });
      }

      // NOTE: email for a specific Plinkk must be stored on PlinkkSettings.affichageEmail
      // so that it is detached per page. The global publicEmail on User is only
      // updated via account-level endpoints (/me/config or /me/email).

      // Couleurs de fond
      if (Array.isArray(body.background)) {
        await tx.backgroundColor.deleteMany({ where: { userId: String(userId), plinkkId: id } });
        if (body.background.length > 0) {
          await tx.backgroundColor.createMany({
            data: body.background.map((color: string) => ({ color, userId: String(userId), plinkkId: id })),
          });
        }
      }

      // Néon
      if (Array.isArray(body.neonColors)) {
        await tx.neonColor.deleteMany({ where: { userId: String(userId), plinkkId: id } });
        if (body.neonColors.length > 0) {
          await tx.neonColor.createMany({ data: body.neonColors.map((color: string) => ({ color, userId: String(userId), plinkkId: id })) });
        }
      }

      // Labels
      if (Array.isArray(body.labels)) {
        await tx.label.deleteMany({ where: { userId: String(userId), plinkkId: id } });
        if (body.labels.length > 0) {
          await tx.label.createMany({ data: body.labels.map((l: any) => ({ data: l.data, color: l.color, fontColor: l.fontColor, userId: String(userId), plinkkId: id })) });
        }
      }

      // Icônes sociales
      if (Array.isArray(body.socialIcon)) {
        await tx.socialIcon.deleteMany({ where: { userId: String(userId), plinkkId: id } });
        if (body.socialIcon.length > 0) {
          await tx.socialIcon.createMany({ data: body.socialIcon.map((s: any) => ({ url: s.url, icon: s.icon, userId: String(userId), plinkkId: id })) });
        }
      }

      // Liens
      if (Array.isArray(body.links)) {
        const existing = await tx.link.findMany({ where: { userId: String(userId), plinkkId: id }, select: { id: true } });
        const existingIds = new Set(existing.map((l) => l.id));
        const incomingIds = new Set(body.links.map((l: any) => l.id).filter(Boolean));
        const toDelete = Array.from(existingIds).filter((x) => !incomingIds.has(x));
        if (toDelete.length > 0) await tx.link.deleteMany({ where: { id: { in: toDelete } } });
        for (const l of body.links) {
          if (l.id && existingIds.has(l.id)) {
            await tx.link.update({ where: { id: l.id }, data: { icon: l.icon ?? undefined, url: l.url, text: l.text ?? undefined, name: l.name ?? undefined, description: l.description ?? undefined, showDescriptionOnHover: l.showDescriptionOnHover ?? undefined, showDescription: l.showDescription ?? undefined } });
          } else {
            await tx.link.create({ data: { icon: l.icon ?? undefined, url: l.url, text: l.text ?? undefined, name: l.name ?? undefined, description: l.description ?? undefined, showDescriptionOnHover: l.showDescriptionOnHover ?? undefined, showDescription: l.showDescription ?? undefined, userId: String(userId), plinkkId: id } });
          }
        }
      }

      // Statusbar dédié à la page
      if (body.statusbar !== undefined) {
        const s = body.statusbar;
        if (s === null) {
          await tx.plinkkStatusbar.deleteMany({ where: { plinkkId: id } });
        } else {
          await tx.plinkkStatusbar.upsert({
            where: { plinkkId: id },
            create: { plinkkId: id, text: s.text ?? undefined, colorBg: s.colorBg ?? undefined, fontTextColor: s.fontTextColor ?? undefined, statusText: s.statusText ?? undefined },
            update: pickDefined({ text: s.text ?? undefined, colorBg: s.colorBg ?? undefined, fontTextColor: s.fontTextColor ?? undefined, statusText: s.statusText ?? undefined }),
          });
        }
      }
    });

    return reply.send({ ok: true });
  });

  // API: Récupérer la configuration complète du profil pour l'éditeur
  fastify.get("/me/config", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    const profile = await prisma.user.findFirst({
      where: { id: userId as string },
      include: ({
        background: true,
        labels: true,
        neonColors: true,
        socialIcons: true,
        statusbar: true,
        links: true,
      } as any),
    }) as any;
    if (!profile) return reply.code(404).send({ error: "Not found" });

    const config = {
      profileLink: profile.profileLink,
      profileImage: profile.profileImage,
      profileIcon: profile.profileIcon,
      profileSiteText: profile.profileSiteText,
      userName: profile.userName,
      // Email public (découplé de l'email de connexion): stocké dans User.publicEmail
      // Fallback vers l'email de compte pour compat rétro (affichage uniquement)
      email: (profile as any).publicEmail ?? profile.email ?? "",
      iconUrl: profile.iconUrl,
      description: profile.description,
      profileHoverColor: profile.profileHoverColor,
      degBackgroundColor: profile.degBackgroundColor,
      neonEnable: profile.neonEnable,
      buttonThemeEnable: profile.buttonThemeEnable,
      EnableAnimationArticle: profile.EnableAnimationArticle,
      EnableAnimationButton: profile.EnableAnimationButton,
      EnableAnimationBackground: profile.EnableAnimationBackground,
      backgroundSize: profile.backgroundSize,
      selectedThemeIndex: profile.selectedThemeIndex,
      selectedAnimationIndex: profile.selectedAnimationIndex,
      selectedAnimationButtonIndex: profile.selectedAnimationButtonIndex,
      selectedAnimationBackgroundIndex:
        profile.selectedAnimationBackgroundIndex,
      animationDurationBackground: profile.animationDurationBackground,
      delayAnimationButton: profile.delayAnimationButton,
      canvaEnable: profile.canvaEnable,
      selectedCanvasIndex: profile.selectedCanvasIndex,
      background: profile.background?.map((c) => c.color) ?? [],
      neonColors: profile.neonColors?.map((c) => c.color) ?? [],
      labels:
        profile.labels?.map((l) => ({
          data: l.data,
          color: l.color,
          fontColor: l.fontColor,
        })) ?? [],
      socialIcon:
        profile.socialIcons?.map((s) => ({ url: s.url, icon: s.icon })) ?? [],
      links:
        profile.links?.map((l) => ({
          id: l.id,
          icon: l.icon,
          url: l.url,
          text: l.text,
          name: l.name,
          description: l.description,
          showDescriptionOnHover: l.showDescriptionOnHover,
          showDescription: l.showDescription,
        })) ?? [],
      statusbar: profile.statusbar ?? null,
    };

    return reply.send(config);
  });

  // API: Mettre à jour la configuration du profil depuis l'éditeur
  fastify.put("/me/config", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    const body = (request.body as any) ?? {};
    const pickDefined = (obj: Record<string, any>) =>
      Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined)
      );

    await prisma.$transaction(async (tx) => {
      const userData = pickDefined({
        profileLink: body.profileLink,
        profileImage: body.profileImage,
        profileIcon: body.profileIcon,
        profileSiteText: body.profileSiteText,
        userName: body.userName,
        // email public (champ distinct)
        publicEmail: body.email,
        iconUrl: body.iconUrl,
        description: body.description,
        profileHoverColor: body.profileHoverColor,
        degBackgroundColor: body.degBackgroundColor,
        neonEnable: body.neonEnable,
        buttonThemeEnable: body.buttonThemeEnable,
        EnableAnimationArticle: body.EnableAnimationArticle,
        EnableAnimationButton: body.EnableAnimationButton,
        EnableAnimationBackground: body.EnableAnimationBackground,
        backgroundSize: body.backgroundSize,
        selectedThemeIndex: body.selectedThemeIndex,
        selectedAnimationIndex: body.selectedAnimationIndex,
        selectedAnimationButtonIndex: body.selectedAnimationButtonIndex,
        selectedAnimationBackgroundIndex: body.selectedAnimationBackgroundIndex,
        animationDurationBackground: body.animationDurationBackground,
        delayAnimationButton: body.delayAnimationButton,
        canvaEnable: body.canvaEnable,
        selectedCanvasIndex: body.selectedCanvasIndex,
      });
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: userId as string },
          data: userData,
        });
      }

      // Plus de persistance dans cosmetics: publicEmail est un champ dédié.

      if (Array.isArray(body.background)) {
        await tx.backgroundColor.deleteMany({
          where: { userId: userId as string },
        });
        if (body.background.length > 0) {
          await tx.backgroundColor.createMany({
            data: body.background.map((color: string) => ({
              color,
              userId: userId as string,
            })),
          });
        }
      }

      if (Array.isArray(body.neonColors)) {
        await tx.neonColor.deleteMany({ where: { userId: userId as string } });
        if (body.neonColors.length > 0) {
          await tx.neonColor.createMany({
            data: body.neonColors.map((color: string) => ({
              color,
              userId: userId as string,
            })),
          });
        }
      }

      if (Array.isArray(body.labels)) {
        await tx.label.deleteMany({ where: { userId: userId as string } });
        if (body.labels.length > 0) {
          await tx.label.createMany({
            data: body.labels.map((l: any) => ({
              data: l.data,
              color: l.color,
              fontColor: l.fontColor,
              userId: userId as string,
            })),
          });
        }
      }

      if (Array.isArray(body.socialIcon)) {
        await tx.socialIcon.deleteMany({ where: { userId: userId as string } });
        if (body.socialIcon.length > 0) {
          await tx.socialIcon.createMany({
            data: body.socialIcon.map((s: any) => ({
              url: s.url,
              icon: s.icon,
              userId: userId as string,
            })),
          });
        }
      }

      if (Array.isArray(body.links)) {
        const existingLinks = await tx.link.findMany({
          where: { userId: userId as string },
          select: { id: true },
        });

        const incomingIds = body.links.map((l: any) => l.id).filter(Boolean);
        const existingIds = existingLinks.map((l) => l.id);

        const toDelete = existingIds.filter((id) => !incomingIds.includes(id));
        if (toDelete.length > 0) {
          await tx.link.deleteMany({ where: { id: { in: toDelete } } });
        }

        for (const l of body.links) {
          if (l.id && existingIds.includes(l.id)) {
            await tx.link.update({
              where: { id: l.id },
              data: {
                icon: l.icon ?? undefined,
                url: l.url,
                text: l.text ?? undefined,
                name: l.name ?? undefined,
                description: l.description ?? undefined,
                showDescriptionOnHover: l.showDescriptionOnHover ?? undefined,
                showDescription: l.showDescription ?? undefined,
              },
            });
          } else {
            await tx.link.create({
              data: {
                icon: l.icon ?? undefined,
                url: l.url,
                text: l.text ?? undefined,
                name: l.name ?? undefined,
                description: l.description ?? undefined,
                showDescriptionOnHover: l.showDescriptionOnHover ?? undefined,
                showDescription: l.showDescription ?? undefined,
                userId: userId as string,
              },
            });
          }
        }
      }

      if (body.statusbar !== undefined) {
        const s = body.statusbar;
        if (s === null) {
          await tx.statusbar.deleteMany({
            where: { userId: userId as string },
          });
        } else {
          await tx.statusbar.upsert({
            where: { userId: userId as string },
            create: {
              userId: userId as string,
              text: s.text ?? undefined,
              colorBg: s.colorBg ?? undefined,
              fontTextColor: s.fontTextColor ?? undefined,
              statusText: s.statusText ?? undefined,
            },
            update: pickDefined({
              text: s.text ?? undefined,
              colorBg: s.colorBg ?? undefined,
              fontTextColor: s.fontTextColor ?? undefined,
              statusText: s.statusText ?? undefined,
            }),
          });
        }
      }
    });

    return reply.send({ ok: true });
  });

  // Catalogue d'icônes disponibles pour l'éditeur
  fastify.get("/icons", async (request, reply) => {
    const iconsDir = path.join(__dirname, "..", "public", "images", "icons");
    if (!existsSync(iconsDir)) return reply.send([]);
    const entries = readdirSync(iconsDir, { withFileTypes: true });
    const toTitle = (s: string) =>
      s
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b(\w)/g, (_, c: string) => c.toUpperCase());
    const list = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".svg"))
      .map((e) => {
        const slug = e.name.replace(/\.svg$/i, "");
        return { slug, displayName: toTitle(slug) };
      });
    return reply.send(list);
  });

  // API: basculer la visibilité publique/privée de son profil
  fastify.post("/me/visibility", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { isPublic } = (request.body as any) ?? {};
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: { isPublic: Boolean(isPublic) },
      select: { id: true, isPublic: true },
    });
    return reply.send(updated);
  });

  // API: changer l'email
  fastify.post("/me/email", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { email } = (request.body as any) || {};
    try {
      z.email().parse(email);
    } catch (e) {
      return reply.code(400).send({ error: "Email invalide" });
    }
    // vérifier unicité
    const exists = await prisma.user.findFirst({
      where: { email, NOT: { id: userId as string } },
      select: { id: true },
    });
    if (exists) return reply.code(409).send({ error: "Email déjà utilisé" });
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: { email },
      select: { id: true, email: true },
    });
    return reply.send(updated);
  });

  // API: changer le mot de passe
  fastify.post("/me/password", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { currentPassword, newPassword, confirmPassword } =
      (request.body as any) || {};
    if (!currentPassword || !newPassword || !confirmPassword)
      return reply.code(400).send({ error: "Champs manquants" });
    if (newPassword !== confirmPassword)
      return reply
        .code(400)
        .send({ error: "Les mots de passe ne correspondent pas" });
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });
    if (!user)
      return reply.code(404).send({ error: "Utilisateur introuvable" });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok)
      return reply.code(403).send({ error: "Mot de passe actuel incorrect" });
    if (await bcrypt.compare(newPassword, user.password))
      return reply
        .code(400)
        .send({ error: "Nouveau mot de passe identique à l'actuel" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId as string },
      data: { password: hashed },
    });
    return reply.send({ ok: true });
  });

  // API: supprimer mon compte (mdp + TOTP si activé)
  fastify.post("/me/delete", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { password, otp } = (request.body as any) || {};
    if (!password)
      return reply.code(400).send({ error: "Mot de passe requis" });
    const me = await prisma.user.findUnique({
      where: { id: userId as string },
    });
    if (!me) return reply.code(404).send({ error: "Utilisateur introuvable" });
    const ok = await bcrypt.compare(password, me.password);
    if (!ok) return reply.code(403).send({ error: "Mot de passe incorrect" });
    if (me.twoFactorEnabled) {
      if (!otp || typeof otp !== "string")
        return reply.code(400).send({ error: "Code 2FA requis" });
      const valid = authenticator.check(otp, me.twoFactorSecret);
      if (!valid) return reply.code(403).send({ error: "Code 2FA invalide" });
    }
    await prisma.$transaction([
      prisma.link.deleteMany({ where: { userId: userId as string } }),
      prisma.label.deleteMany({ where: { userId: userId as string } }),
      prisma.socialIcon.deleteMany({ where: { userId: userId as string } }),
      prisma.backgroundColor.deleteMany({
        where: { userId: userId as string },
      }),
      prisma.neonColor.deleteMany({ where: { userId: userId as string } }),
      prisma.statusbar.deleteMany({ where: { userId: userId as string } }),
      prisma.cosmetic.deleteMany({ where: { userId: userId as string } }),
      prisma.user.delete({ where: { id: userId as string } }),
    ]);
    request.session.delete();
    return reply.send({ ok: true });
  });

  // API: basculer la visibilité publique de l'email (stockée dans cosmetics.settings.isEmailPublic)
  fastify.post("/me/email-visibility", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    // New behavior: use the dedicated `publicEmail` column on User to
    // control whether the account email is publicly visible. This avoids
    // coupling visibility to a cosmetics JSON object which doesn't exist
    // in the Prisma schema.
    const { isEmailPublic } = (request.body as any) ?? {};
    const me = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { email: true, publicEmail: true },
    });
    if (!me) return reply.code(404).send({ error: "Utilisateur introuvable" });
    const newPublicEmail = Boolean(isEmailPublic)
      ? me.publicEmail || me.email
      : null;
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: { publicEmail: newPublicEmail },
      select: { id: true, publicEmail: true },
    });
    return reply.send({
      id: updated.id,
      isEmailPublic: Boolean(updated.publicEmail),
    });
  });

  // API: basculer la 2FA
  fastify.post("/me/2fa", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    // If no secret yet -> generate a temporary secret stored in session, return qr/otpauth
    if (!user.twoFactorEnabled) {
      // Reuse a pending secret stored in session if present and not expired
      const pending: any = pending2fa.get(userId as string) || null;
      const now = Date.now();
      let secret: string | null = null;
      let otpauth: string | null = null;
      if (
        pending &&
        pending.secret &&
        pending.createdAt &&
        now - pending.createdAt < 10 * 60 * 1000
      ) {
        secret = pending.secret;
        otpauth = pending.otpauth;
      } else {
        secret = authenticator.generateSecret();
        otpauth = authenticator.keyuri(user.userName, "Plinkk", secret);
        // store pending secret in session for confirmation step (expires after 10min)
        pending2fa.set(userId as string, { secret, otpauth, createdAt: now });
      }
      const qrCode = await QRCode.toDataURL(otpauth as string);
      return { qrCode, otpauth };
    }

    // If secret exists in DB -> expect an OTP to disable 2FA
    const { otp } = (request.body as any) || {};
    if (!otp || typeof otp !== "string") {
      return reply
        .code(400)
        .send({ error: "OTP requis pour désactiver la 2FA" });
    }
    const valid = authenticator.check(otp, user.twoFactorSecret);
    if (!valid) return reply.code(403).send({ error: "Code 2FA invalide" });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: "", twoFactorEnabled: false },
    });
    return { successful: true };
  });

  // API: confirmer l'activation 2FA en vérifiant un OTP (ne désactive pas)
  fastify.post("/me/2fa/confirm", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { otp } = (request.body as any) || {};
    if (!otp || typeof otp !== "string")
      return reply.code(400).send({ error: "OTP requis" });

    // Retrieve pending secret from session
    const pending: any = pending2fa.get(userId as string) || null;
    if (!pending || !pending.secret)
      return reply.code(400).send({ error: "Aucune clé 2FA en attente" });
    // optional expiry check
    const now = Date.now();
    if (!pending.createdAt || now - pending.createdAt > 10 * 60 * 1000) {
      pending2fa.delete(userId as string);
      return reply
        .code(400)
        .send({ error: "La clé 2FA a expiré, régénère le QR" });
    }

    const valid = authenticator.check(otp, pending.secret);
    if (!valid) return reply.code(403).send({ error: "Code 2FA invalide" });

    // Persist to DB and clear pending
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: pending.secret, twoFactorEnabled: true },
    });
    pending2fa.delete(userId as string);
    return reply.send({ successful: true });
  });

  // API: mettre à jour des infos de base du compte (username, name, description)
  fastify.post("/me/profile", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = (request.body as any) || {};
    const data: any = {};
    if (typeof body.userName === "string" && body.userName.trim())
      data.userName = body.userName.trim();
    if (typeof body.name === "string" && body.name.trim())
      data.name = body.name.trim();
    if (typeof body.description === "string")
      data.description = body.description;
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data,
  select: ({ id: true, userName: true, name: true, description: true } as any),
    });

    // If the account's display name was updated, also update the user's default Plinkk
    // so that account-level name and the main public page remain consistent.
    try {
      if (typeof body.name === 'string' && body.name.trim()) {
        const defaultP = await prisma.plinkk.findFirst({ where: { userId: userId as string, isDefault: true } });
        if (defaultP) {
          await prisma.plinkk.update({ where: { id: defaultP.id }, data: { name: body.name.trim() } });
        }
      }
    } catch (e) {
      // Non-blocking: log and continue
      request.log?.warn({ e }, 'sync default plinkk name failed');
    }
    return reply.send(updated);
  });

  // API: sélectionner des cosmétiques (flair, bannerUrl, frame, theme)
  fastify.post("/me/cosmetics", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = (request.body as any) || {};
    const u = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { cosmetics: true },
    });
    const cosmetics = u?.cosmetics;
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: { cosmetics: {
        upsert: {
          create: {
            flair: null,
            bannerUrl: body.bannerUrl ?? cosmetics.bannerUrl ?? null,
            banner: body.banner ?? cosmetics.banner ?? null,
            frame: body.frame ?? cosmetics.frame ?? null,
            theme: body.theme ?? cosmetics.theme ?? null
          },
          update: {
            flair: null,
            bannerUrl: body.bannerUrl ?? cosmetics.bannerUrl ?? null,
            banner: body.banner ?? cosmetics.banner ?? null,
            frame: body.frame ?? cosmetics.frame ?? null,
            theme: body.theme ?? cosmetics.theme ?? null
          }
        }
      } },
      select: { id: true, cosmetics: true },
    });
    return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
  });

  // API: appliquer un starter pack de cosmétiques
  fastify.post("/me/cosmetics/starter-pack", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const u = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { role: true, cosmetics: true },
    });
    if (!u) return reply.code(404).send({ error: "Utilisateur introuvable" });
    const baseFlair =
      u.role === Role.ADMIN || u.role === Role.DEVELOPER ? "DEVELOPER" : "OG";
    const cosmetics: any = (u.cosmetics as any) || {};
    // Le starter pack n'attribue plus de flair automatiquement (laisse tel quel)
    cosmetics.selected = {
      flair: cosmetics.selected?.flair ?? null,
      frame: "neon",
      theme: "dark-emerald",
      banner: "gradient-emerald",
      bannerUrl: "",
    };
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: { cosmetics },
      select: { id: true, cosmetics: true },
    });
    return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
  });
}
