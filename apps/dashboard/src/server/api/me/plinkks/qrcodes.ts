import { FastifyInstance } from "fastify";
import { prisma, QrTargetType } from "@plinkk/prisma";
import QRCode from "qrcode";
import { customAlphabet } from "nanoid";
import { ensurePermission } from "../../../../lib/permissions";
import { logUserAction } from "../../../../lib/userLogger";
import { getMaxQrCodes, isUserPremium, PREMIUM_MAX_QRCODES } from "@plinkk/shared";

const makeShortCode = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 8);

function getBaseUrl() {
  return (process.env.FRONTEND_URL || "https://plinkk.fr").replace(/\/$/, "");
}

function normalizeHex(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v;
  return fallback;
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function roundedRectPath(x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  if (radius <= 0) return `M${x},${y}h${w}v${h}h-${w}Z`;
  return [
    `M${x + radius},${y}`,
    `H${x + w - radius}`,
    `Q${x + w},${y} ${x + w},${y + radius}`,
    `V${y + h - radius}`,
    `Q${x + w},${y + h} ${x + w - radius},${y + h}`,
    `H${x + radius}`,
    `Q${x},${y + h} ${x},${y + h - radius}`,
    `V${y + radius}`,
    `Q${x},${y} ${x + radius},${y}`,
    "Z",
  ].join(" ");
}

function finderAt(row: number, col: number, size: number) {
  const inTopLeft = row < 7 && col < 7;
  const inTopRight = row < 7 && col >= size - 7;
  const inBottomLeft = row >= size - 7 && col < 7;
  return inTopLeft || inTopRight || inBottomLeft;
}

function makeQrSvg(params: {
  text: string;
  size: number;
  margin: number;
  dark: string;
  light: string;
  eye: string;
  rounded: boolean;
  errorCorrectionLevel?: string;
  includeImage?: boolean;
  imageUrl?: string | null;
  imageSize?: number;
  logoColor?: string | null;
}) {
  const level = ["L", "M", "Q", "H"].includes((params.errorCorrectionLevel || "M").toUpperCase())
    ? (params.errorCorrectionLevel || "M").toUpperCase()
    : "M";
  const qr = QRCode.create(params.text, { errorCorrectionLevel: level as "L" | "M" | "Q" | "H" });
  const moduleCount = qr.modules.size;
  const box = params.size;
  const total = moduleCount + params.margin * 2;
  const cell = box / total;
  const innerRadius = params.rounded ? cell * 0.35 : 0;
  const pieces: string[] = [];
  pieces.push(`<rect x="0" y="0" width="${box}" height="${box}" fill="${escapeXml(params.light)}"/>`);

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (!qr.modules.get(c, r)) continue;
      if (finderAt(r, c, moduleCount)) continue;
      const x = (c + params.margin) * cell;
      const y = (r + params.margin) * cell;
      if (innerRadius > 0) {
        const d = roundedRectPath(x, y, cell, cell, innerRadius);
        pieces.push(`<path d="${d}" fill="${escapeXml(params.dark)}"/>`);
      } else {
        pieces.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${escapeXml(params.dark)}"/>`);
      }
    }
  }

  const drawFinder = (gridX: number, gridY: number) => {
    const x = (gridX + params.margin) * cell;
    const y = (gridY + params.margin) * cell;
    const outer = 7 * cell;
    const middle = 5 * cell;
    const inner = 3 * cell;

    pieces.push(`<rect x="${x}" y="${y}" width="${outer}" height="${outer}" fill="${escapeXml(params.eye)}"/>`);
    pieces.push(`<rect x="${x + cell}" y="${y + cell}" width="${middle}" height="${middle}" fill="${escapeXml(params.light)}"/>`);
    pieces.push(`<rect x="${x + 2 * cell}" y="${y + 2 * cell}" width="${inner}" height="${inner}" fill="${escapeXml(params.eye)}"/>`);
  };

  drawFinder(0, 0);
  drawFinder(moduleCount - 7, 0);
  drawFinder(0, moduleCount - 7);

  if (params.includeImage && params.imageUrl) {
    const imageSizePercent = Math.max(10, Math.min(40, Math.round(params.imageSize ?? 25)));
    const logoSize = (box * imageSizePercent) / 100;
    const logoX = (box - logoSize) / 2;
    const logoY = (box - logoSize) / 2;
    const bgRadius = params.rounded ? logoSize * 0.22 : 8;
    pieces.push(`<rect x="${logoX - 6}" y="${logoY - 6}" width="${logoSize + 12}" height="${logoSize + 12}" rx="${bgRadius}" ry="${bgRadius}" fill="${escapeXml(params.light)}"/>`);
    const isSvgLogo = /^data:image\/svg\+xml/i.test(params.imageUrl) || /\.svg([?#].*)?$/i.test(params.imageUrl);
    if (isSvgLogo && params.logoColor) {
      const maskId = "logo-mask";
      pieces.push(`<defs><mask id="${maskId}" maskUnits="userSpaceOnUse"><rect x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" fill="black"/><image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${escapeXml(params.imageUrl)}" preserveAspectRatio="xMidYMid meet"/></mask></defs>`);
      pieces.push(`<rect x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" fill="${escapeXml(params.logoColor)}" mask="url(#${maskId})"/>`);
    } else {
      pieces.push(`<image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${escapeXml(params.imageUrl)}" preserveAspectRatio="xMidYMid meet"/>`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${box}" height="${box}" viewBox="0 0 ${box} ${box}">${pieces.join("")}</svg>`;
}

function normalizeImageUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v.slice(0, 255);
  if (/^data:image\//i.test(v)) return v.slice(0, 255);
  if (v.startsWith("/")) return v.slice(0, 255);
  return null;
}

async function resolveTargetUrl(input: {
  targetType: QrTargetType;
  userId: string;
  plinkkId: string;
  customUrl?: string;
  redirectId?: string;
}) {
  const base = getBaseUrl();

  if (input.targetType === "CUSTOM_URL") {
    const url = (input.customUrl || "").trim();
    if (!/^https?:\/\//i.test(url)) {
      throw new Error("invalid_custom_url");
    }
    return { targetUrl: url, redirectId: null as string | null };
  }

  if (input.targetType === "PROFILE") {
    const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { userName: true, id: true } });
    const username = user?.userName?.trim() || user?.id;
    if (!username) throw new Error("user_not_found");
    return { targetUrl: `${base}/${encodeURIComponent(username)}`, redirectId: null as string | null };
  }

  if (input.targetType === "PLINKK_PAGE") {
    const page = await prisma.plinkk.findFirst({
      where: { id: input.plinkkId, userId: input.userId },
      select: { slug: true },
    });
    if (!page?.slug) throw new Error("plinkk_not_found");
    return { targetUrl: `${base}/${encodeURIComponent(page.slug)}`, redirectId: null as string | null };
  }

  const redirect = await prisma.redirect.findFirst({
    where: { id: input.redirectId, userId: input.userId },
    select: { id: true, slug: true },
  });
  if (!redirect) throw new Error("redirect_not_found");
  return {
    targetUrl: `${base}/r/${encodeURIComponent(redirect.slug)}`,
    redirectId: redirect.id,
  };
}

async function ensurePlinkkOwner(userId: string, plinkkId: string) {
  return prisma.plinkk.findFirst({ where: { id: plinkkId, userId }, select: { id: true } });
}

async function createUniqueShortCode() {
  for (let i = 0; i < 8; i++) {
    const code = makeShortCode();
    const exists = await prisma.qrCode.findUnique({ where: { shortCode: code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error("short_code_generation_failed");
}

export function plinkksQrCodesRoutes(fastify: FastifyInstance) {
  fastify.get("/:id/qrcodes", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });

    const canManageQr = await ensurePermission(request, reply, ["MANAGE_QRCODES", "EDIT_PLINKK"]);
    if (!canManageQr) return;

    const { id } = request.params as { id: string };
    const owns = await ensurePlinkkOwner(userId, id);
    if (!owns) return reply.code(404).send({ error: "not_found" });

    const items = await prisma.qrCode.findMany({
      where: { userId, plinkkId: id },
      include: { redirect: { select: { id: true, slug: true, targetUrl: true } } },
      orderBy: { createdAt: "desc" },
    });

    return reply.send({
      items: items.map((item) => ({
        ...item,
        svgUrl: `/api/me/plinkks/${id}/qrcodes/${item.id}/image.svg`,
        shareUrl: (item.directTarget === true) ? item.targetUrl : `${getBaseUrl()}/q/${item.shortCode}`,
      })),
    });
  });

  fastify.post("/:id/qrcodes", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });

    const canManageQr = await ensurePermission(request, reply, ["MANAGE_QRCODES", "EDIT_PLINKK"]);
    if (!canManageQr) return;

    const { id } = request.params as { id: string };
    const owns = await ensurePlinkkOwner(userId, id);
    if (!owns) return reply.code(404).send({ error: "not_found" });

    // Vérifier la limite de QR codes
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPremium: true,
        premiumUntil: true,
        isPartner: true,
        extraQrCodes: true,
        role: { select: { id: true, name: true, isStaff: true, maxRedirects: true } },
      },
    });

    const currentCount = await prisma.qrCode.count({ where: { userId } });
    const maxQrCodes = getMaxQrCodes(user);

    if (currentCount >= maxQrCodes) {
      const isPremium = isUserPremium(user);
      const canUpgrade = !isPremium && PREMIUM_MAX_QRCODES > maxQrCodes;

      return reply.code(403).send({
        error: "qrcode_limit_reached",
        current: currentCount,
        max: maxQrCodes,
        canUpgrade,
        premiumLimit: canUpgrade ? PREMIUM_MAX_QRCODES : undefined,
      });
    }

    const body = request.body as {
      name?: string;
      targetType?: QrTargetType;
      customUrl?: string;
      redirectId?: string;
      foregroundHex?: string;
      backgroundHex?: string;
      eyeHex?: string;
      logoColor?: string;
      rounded?: boolean;
      margin?: number;
      size?: number;
      cornerStyle?: string;
      eyeStyle?: string;
      patternStyle?: string;
      includeImage?: boolean;
      imageUrl?: string;
      imageSize?: number;
      errorCorrectionLevel?: string;
      label?: string;
      labelColor?: string;
      preset?: string;
      directTarget?: boolean;
    };

    const targetType = (body.targetType || "PLINKK_PAGE") as QrTargetType;
    if (!["PROFILE", "PLINKK_PAGE", "REDIRECT", "CUSTOM_URL"].includes(targetType)) {
      return reply.code(400).send({ error: "invalid_target_type" });
    }

    const name = (body.name || "QR Code").trim().slice(0, 80) || "QR Code";

    let resolved: { targetUrl: string; redirectId: string | null };
    try {
      resolved = await resolveTargetUrl({
        targetType,
        userId,
        plinkkId: id,
        customUrl: body.customUrl,
        redirectId: body.redirectId,
      });
    } catch (e: any) {
      return reply.code(400).send({ error: e?.message || "invalid_target" });
    }

    const shortCode = await createUniqueShortCode();

    const created = await prisma.qrCode.create({
      data: {
        userId,
        plinkkId: id,
        redirectId: resolved.redirectId,
        name,
        targetType,
        targetUrl: resolved.targetUrl,
        shortCode,
        directTarget: Boolean(body.directTarget),
        foregroundHex: normalizeHex(body.foregroundHex, "#111827"),
        backgroundHex: normalizeHex(body.backgroundHex, "#ffffff"),
        eyeHex: normalizeHex(body.eyeHex, "#7c3aed"),
        logoColor: normalizeHex(body.logoColor, "#7c3aed"),
        rounded: Boolean(body.rounded),
        margin: clampInt(body.margin, 0, 8, 2),
        size: clampInt(body.size, 192, 1024, 384),
        cornerStyle: (body.cornerStyle || "rounded").toString().slice(0, 20),
        eyeStyle: (body.eyeStyle || "square").toString().slice(0, 20),
        patternStyle: (body.patternStyle || "square").toString().slice(0, 20),
        includeImage: Boolean(body.includeImage),
        imageUrl: body.includeImage && body.imageUrl ? body.imageUrl.toString().slice(0, 255) : undefined,
        imageSize: clampInt(body.imageSize, 10, 40, 25),
        errorCorrectionLevel: (body.errorCorrectionLevel || "M").toString().slice(0, 1),
        label: body.label ? body.label.toString().slice(0, 255) : undefined,
        labelColor: body.label ? normalizeHex(body.labelColor, "#ffffff") : undefined,
        preset: body.preset ? body.preset.toString().slice(0, 100) : undefined,
      },
    });

    await logUserAction(userId, "CREATE_QRCODE", created.id, {
      plinkkId: id,
      targetType: created.targetType,
      targetUrl: created.targetUrl,
      shortCode: created.shortCode,
    }, request.ip);

    return reply.code(201).send({
      item: {
        ...created,
        svgUrl: `/api/me/plinkks/${id}/qrcodes/${created.id}/image.svg`,
        shareUrl: created.directTarget ? created.targetUrl : `${getBaseUrl()}/q/${created.shortCode}`,
      },
    });
  });

  fastify.patch("/:id/qrcodes/:qrId", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });

    const canManageQr = await ensurePermission(request, reply, ["MANAGE_QRCODES", "EDIT_PLINKK"]);
    if (!canManageQr) return;

    const { id, qrId } = request.params as { id: string; qrId: string };
    const owns = await ensurePlinkkOwner(userId, id);
    if (!owns) return reply.code(404).send({ error: "not_found" });

    const existing = await prisma.qrCode.findFirst({ where: { id: qrId, userId, plinkkId: id } });
    if (!existing) return reply.code(404).send({ error: "qr_not_found" });

    const body = request.body as {
      name?: string;
      targetType?: QrTargetType;
      customUrl?: string;
      redirectId?: string;
      foregroundHex?: string;
      backgroundHex?: string;
      eyeHex?: string;
      logoColor?: string;
      rounded?: boolean;
      margin?: number;
      size?: number;
      cornerStyle?: string;
      eyeStyle?: string;
      patternStyle?: string;
      includeImage?: boolean;
      imageUrl?: string;
      imageSize?: number;
      errorCorrectionLevel?: string;
      label?: string;
      labelColor?: string;
      preset?: string;
      isActive?: boolean;
      directTarget?: boolean;
    };

    const patch: Record<string, unknown> = {};

    if (typeof body.name === "string") {
      patch.name = body.name.trim().slice(0, 80) || existing.name;
    }

    if (typeof body.isActive === "boolean") {
      patch.isActive = body.isActive;
    }

    if (typeof body.directTarget === "boolean") {
      patch.directTarget = body.directTarget;
    }

    if (body.foregroundHex !== undefined) patch.foregroundHex = normalizeHex(body.foregroundHex, existing.foregroundHex);
    if (body.backgroundHex !== undefined) patch.backgroundHex = normalizeHex(body.backgroundHex, existing.backgroundHex);
    if (body.eyeHex !== undefined) patch.eyeHex = normalizeHex(body.eyeHex, existing.eyeHex);
    if (body.logoColor !== undefined) patch.logoColor = normalizeHex(body.logoColor, existing.logoColor || "#7c3aed");
    if (body.rounded !== undefined) patch.rounded = Boolean(body.rounded);
    if (body.margin !== undefined) patch.margin = clampInt(body.margin, 0, 8, existing.margin);
    if (body.size !== undefined) patch.size = clampInt(body.size, 192, 1024, existing.size);
    if (body.cornerStyle !== undefined) patch.cornerStyle = body.cornerStyle.toString().slice(0, 20);
    if (body.eyeStyle !== undefined) patch.eyeStyle = body.eyeStyle.toString().slice(0, 20);
    if (body.patternStyle !== undefined) patch.patternStyle = body.patternStyle.toString().slice(0, 20);
    if (body.includeImage !== undefined) patch.includeImage = Boolean(body.includeImage);
    if (body.imageUrl !== undefined) patch.imageUrl = body.imageUrl ? body.imageUrl.toString().slice(0, 255) : null;
    if (body.imageSize !== undefined) patch.imageSize = clampInt(body.imageSize, 10, 40, existing.imageSize);
    if (body.errorCorrectionLevel !== undefined) patch.errorCorrectionLevel = body.errorCorrectionLevel.toString().slice(0, 1);
    if (body.label !== undefined) patch.label = body.label ? body.label.toString().slice(0, 255) : null;
    if (body.labelColor !== undefined) patch.labelColor = body.labelColor ? normalizeHex(body.labelColor, "#ffffff") : null;
    if (body.preset !== undefined) patch.preset = body.preset ? body.preset.toString().slice(0, 100) : null;

    if (body.targetType) {
      const targetType = body.targetType as QrTargetType;
      if (!["PROFILE", "PLINKK_PAGE", "REDIRECT", "CUSTOM_URL"].includes(targetType)) {
        return reply.code(400).send({ error: "invalid_target_type" });
      }
      try {
        const resolved = await resolveTargetUrl({
          targetType,
          userId,
          plinkkId: id,
          customUrl: body.customUrl,
          redirectId: body.redirectId,
        });
        patch.targetType = targetType;
        patch.targetUrl = resolved.targetUrl;
        patch.redirectId = resolved.redirectId;
      } catch (e: any) {
        return reply.code(400).send({ error: e?.message || "invalid_target" });
      }
    }

    const updated = await prisma.qrCode.update({
      where: { id: existing.id },
      data: patch,
    });

    await logUserAction(userId, "UPDATE_QRCODE", updated.id, {
      plinkkId: id,
      patch,
      previousTargetType: existing.targetType,
      previousTargetUrl: existing.targetUrl,
    }, request.ip);

    return reply.send({
      item: {
        ...updated,
        svgUrl: `/api/me/plinkks/${id}/qrcodes/${updated.id}/image.svg`,
        shareUrl: (updated.directTarget === true) ? updated.targetUrl : `${getBaseUrl()}/q/${updated.shortCode}`,
      },
    });
  });

  fastify.delete("/:id/qrcodes/:qrId", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });

    const canManageQr = await ensurePermission(request, reply, ["MANAGE_QRCODES", "EDIT_PLINKK"]);
    if (!canManageQr) return;

    const { id, qrId } = request.params as { id: string; qrId: string };
    const owns = await ensurePlinkkOwner(userId, id);
    if (!owns) return reply.code(404).send({ error: "not_found" });

    const existing = await prisma.qrCode.findFirst({
      where: { id: qrId, userId, plinkkId: id },
      select: { id: true, shortCode: true, targetType: true, targetUrl: true, scansCount: true },
    });
    if (!existing) return reply.code(404).send({ error: "qr_not_found" });

    await prisma.qrCode.delete({ where: { id: existing.id } });

    await logUserAction(userId, "DELETE_QRCODE", existing.id, {
      plinkkId: id,
      shortCode: existing.shortCode,
      targetType: existing.targetType,
      targetUrl: existing.targetUrl,
      scansCount: existing.scansCount,
    }, request.ip);

    return reply.send({ ok: true });
  });

  fastify.get("/:id/qrcodes/:qrId/image.svg", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });

    const canManageQr = await ensurePermission(request, reply, ["MANAGE_QRCODES", "EDIT_PLINKK"]);
    if (!canManageQr) return;

    const { id, qrId } = request.params as { id: string; qrId: string };
    const item = await prisma.qrCode.findFirst({
      where: { id: qrId, userId, plinkkId: id },
      select: {
        shortCode: true,
        directTarget: true,
        targetUrl: true,
        size: true,
        margin: true,
        foregroundHex: true,
        backgroundHex: true,
        eyeHex: true,
        logoColor: true,
        rounded: true,
        errorCorrectionLevel: true,
        includeImage: true,
        imageUrl: true,
        imageSize: true,
      },
    });

    if (!item) return reply.code(404).send({ error: "qr_not_found" });

    const svg = makeQrSvg({
      text: (item.directTarget === true) ? item.targetUrl : `${getBaseUrl()}/q/${item.shortCode}`,
      size: item.size,
      margin: item.margin,
      dark: item.foregroundHex,
      light: item.backgroundHex,
      eye: item.eyeHex,
      rounded: item.rounded,
      errorCorrectionLevel: item.errorCorrectionLevel,
      includeImage: item.includeImage,
      imageUrl: item.imageUrl,
      imageSize: item.imageSize,
      logoColor: item.logoColor,
    });

    return reply
      .header("content-type", "image/svg+xml; charset=utf-8")
      .header("cache-control", "private, max-age=60")
      .send(svg);
  });
  
  fastify.post("/:id/qrcodes/preview.svg", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "unauthorized" });

    const canManageQr = await ensurePermission(request, reply, ["MANAGE_QRCODES", "EDIT_PLINKK"]);
    if (!canManageQr) return;

    const { id } = request.params as { id: string };
    const owns = await ensurePlinkkOwner(userId, id);
    if (!owns) return reply.code(404).send({ error: "not_found" });

    const body = request.body as {
      targetType?: QrTargetType;
      customUrl?: string;
      redirectId?: string;
      qrId?: string;
      foregroundHex?: string;
      backgroundHex?: string;
      eyeHex?: string;
      logoColor?: string;
      rounded?: boolean;
      margin?: number;
      size?: number;
      errorCorrectionLevel?: string;
      includeImage?: boolean;
      imageUrl?: string;
      imageSize?: number;
      directTarget?: boolean;
    };

    const targetType = (body.targetType || "PLINKK_PAGE") as QrTargetType;
    if (!["PROFILE", "PLINKK_PAGE", "REDIRECT", "CUSTOM_URL"].includes(targetType)) {
      return reply.code(400).send({ error: "invalid_target_type" });
    }

    let resolved: { targetUrl: string; redirectId: string | null };
    try {
      resolved = await resolveTargetUrl({
        targetType,
        userId,
        plinkkId: id,
        customUrl: body.customUrl,
        redirectId: body.redirectId,
      });
    } catch (e: any) {
      return reply.code(400).send({ error: e?.message || "invalid_target" });
    }

    let previewText = resolved.targetUrl;
    if (!body.directTarget && body.qrId) {
      const existing = await prisma.qrCode.findFirst({
        where: { id: body.qrId, userId, plinkkId: id },
        select: { shortCode: true },
      });
      if (existing?.shortCode) {
        previewText = `${getBaseUrl()}/q/${existing.shortCode}`;
      }
    }

    const svg = makeQrSvg({
      text: previewText,
      size: clampInt(body.size, 192, 1024, 384),
      margin: clampInt(body.margin, 0, 8, 2),
      dark: normalizeHex(body.foregroundHex, "#111827"),
      light: normalizeHex(body.backgroundHex, "#ffffff"),
      eye: normalizeHex(body.eyeHex, "#7c3aed"),
      logoColor: normalizeHex(body.logoColor, "#7c3aed"),
      rounded: Boolean(body.rounded),
      errorCorrectionLevel: (body.errorCorrectionLevel || "M").toString(),
      includeImage: Boolean(body.includeImage),
      imageUrl: normalizeImageUrl(body.imageUrl),
      imageSize: clampInt(body.imageSize, 10, 40, 25),
    });

    return reply
      .header("content-type", "image/svg+xml; charset=utf-8")
      .header("cache-control", "no-store")
      .header("x-qr-target-url", previewText)
      .send(svg);
  });
}
