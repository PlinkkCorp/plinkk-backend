/**
 * Middleware to audit user and admin actions
 * - registerActionAuditHook -> void
 */

import { FastifyInstance, FastifyRequest } from "fastify";
import { logAdminAction } from "../lib/adminLogger";
import { logUserAction } from "../lib/userLogger";

/**
 * Type for the audit request
 * @param request The fastify request
 * @property auditError The error to audit
 * @property auditError.message The error message
 * @property auditError.name The error name
 * @property auditError.code The error code
 * @property auditError.statusCode The error status code
 * @returns The audit request
 */
type AuditRequest = FastifyRequest & {
  auditError?: {
    message: string;
    name?: string;
    code?: string;
    statusCode?: number;
  };
};

const IGNORED_PATH_PREFIXES = [
  "/public/",
  "/css/",
  "/js/",
  "/images/",
  "/uploads/",
  "/canvaAnimation/",
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

/**
 * Function to get the pathname from the request
 * @param request The fastify request
 * @returns The pathname of the request
 */
function getPathname(request: FastifyRequest): string {
  const rawUrl = request.raw.url || request.url || "";
  const qIndex = rawUrl.indexOf("?");
  return qIndex === -1 ? rawUrl : rawUrl.slice(0, qIndex);
}

/**
 * Checks if the pathname should be ignored
 * @param pathname The pathname to check
 * @returns True if the pathname should be ignored, false otherwise
 */
function isIgnoredPath(pathname: string): boolean {
  return IGNORED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Gets the user ID from the session
 * @param request The fastify request
 * @returns The user ID if found, undefined otherwise
 */
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

/**
 * Clips a string to a maximum length
 * @param value The string to clip
 * @param max The maximum length
 * @returns The clipped string
 */
function clipString(value: string, max = 500): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...[truncated:${value.length}]`;
}

/**
 * Sanitizes a value for logging
 * @param input The value to sanitize
 * @param depth The current depth
 * @returns The sanitized value
 */
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

/**
 * Gets the action target ID from the request
 * @param request The fastify request
 * @returns The action target ID if found, undefined otherwise
 */
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

/**
 * Checks if the pathname is an admin action
 * @param pathname The pathname to check
 * @returns True if the pathname is an admin action, false otherwise
 */
function isAdminAction(pathname: string): boolean {
  return (
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/dashboard/admin") ||
    pathname.startsWith("/admin")
  );
}

/**
 * Registers the action audit hook
 * @param fastify The fastify instance
 */
export function registerActionAuditHook(fastify: FastifyInstance) {
  fastify.addHook("onError", async (request, _reply, error) => {
    const req = request as AuditRequest;
    req.auditError = {
      message: error.message,
      name: error.name,
      code: (error as { code?: string }).code,
      statusCode: (error as { statusCode?: number }).statusCode,
    };
  });

  fastify.addHook("onResponse", async (request, reply) => {
    const req = request as AuditRequest;
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
      ...(method === "GET" && reply.statusCode >= 500 && req.auditError
        ? { error: sanitizeValue(req.auditError) }
        : {}),
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
