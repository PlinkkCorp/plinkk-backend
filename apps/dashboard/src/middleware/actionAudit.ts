import { FastifyInstance, FastifyRequest } from "fastify";

import { logAdminAction } from "../lib/adminLogger";
import { logUserAction } from "../lib/userLogger";

const IGNORED_PATH_PREFIXES = [
  "/public/",
  "/css/",
  "/js/",
  "/images/",
  "/uploads/",
  "/canvaAnimation/",
  "/umami_script.js",
  "/favicon",
];

const SENSITIVE_KEYS = new Set([
  "password",
  "newPassword",
  "oldPassword",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "secret",
  "otp",
  "code",
]);

function getPathname(request: FastifyRequest): string {
  const rawUrl = request.raw.url || request.url || "";
  const qIndex = rawUrl.indexOf("?");
  return qIndex === -1 ? rawUrl : rawUrl.slice(0, qIndex);
}

function isIgnoredPath(pathname: string): boolean {
  return IGNORED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getSessionUserId(request: FastifyRequest): string | undefined {
  const sessionData = request.session.get("data");
  if (!sessionData) return undefined;

  if (typeof sessionData === "object") {
    return sessionData.id;
  }

  if (sessionData.includes("__totp")) {
    return undefined;
  }

  return sessionData;
}

function clipString(value: string, max = 500): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...[truncated:${value.length}]`;
}

function sanitizeValue(input: unknown, depth = 0): unknown {
  if (input == null) return input;
  if (depth > 4) return "[depth_limit]";

  if (typeof input === "string") {
    return clipString(input);
  }

  if (typeof input === "number" || typeof input === "boolean") {
    return input;
  }

  if (Array.isArray(input)) {
    return input.slice(0, 25).map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof input === "object") {
    const source = input as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    const entries = Object.entries(source).slice(0, 40);

    for (const [key, value] of entries) {
      if (SENSITIVE_KEYS.has(key)) {
        out[key] = "[redacted]";
      } else {
        out[key] = sanitizeValue(value, depth + 1);
      }
    }

    return out;
  }

  return String(input);
}

function getActionTargetId(request: FastifyRequest): string | undefined {
  const params = (request.params || {}) as Record<string, unknown>;
  const candidateKeys = ["id", "userId", "plinkkId", "redirectId", "linkId", "slug"];

  for (const key of candidateKeys) {
    const value = params[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

function isAdminAction(pathname: string): boolean {
  return (
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/dashboard/admin") ||
    pathname.startsWith("/admin")
  );
}

export function registerActionAuditHook(fastify: FastifyInstance) {
  fastify.addHook("onResponse", async (request, reply) => {
    const pathname = getPathname(request);

    if (!pathname || isIgnoredPath(pathname)) {
      return;
    }

    const userId = getSessionUserId(request);
    if (!userId) {
      return;
    }

    const method = request.method.toUpperCase();
    const action = `HTTP_${method}_${reply.statusCode}`;

    const details = {
      scope: isAdminAction(pathname) ? "ADMIN" : "USER",
      path: pathname,
      route: request.routeOptions?.url || pathname,
      method,
      statusCode: reply.statusCode,
      params: sanitizeValue(request.params),
      query: sanitizeValue(request.query),
      body: sanitizeValue(request.body),
      userAgent: request.headers["user-agent"] || null,
    };

    const targetId = getActionTargetId(request);

    if (isAdminAction(pathname)) {
      await logAdminAction(userId, action, targetId, details, request.ip);
      return;
    }

    await logUserAction(userId, action, targetId, details, request.ip);
  });
}
