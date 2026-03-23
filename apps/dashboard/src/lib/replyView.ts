/**
 * Lib Reply View
 * - replyView                     -> Promise<string>
 * - getActiveAnnouncementsForUser -> Promise<Announcement[]>
 * - computeFrontendUrl            -> string
 * - UserWithInclude               -> Type
 * - Announcement                  -> Type
 */

import { FastifyReply } from "fastify";
import ejs from "ejs";
import { UserWithInclude, replyView as sharedReplyView } from "@plinkk/shared";
import "dotenv/config"

/**
 * Interface for session data
 * @property id - The ID of the session
 */
export { getActiveAnnouncementsForUser } from "@plinkk/shared";

/**
 * Computes the frontend URL
 * @param reply The fastify reply
 * @returns The frontend URL
 */
function computeFrontendUrl(reply: FastifyReply) {
  const env = (process.env.FRONTEND_URL || "").trim();
  if (env) return env.replace(/\/$/, "");
  try {
    const req = reply.request;
    const host = String(req?.headers?.host || "");
    const xfProto = String(req?.headers?.["x-forwarded-proto"] || "").toLowerCase();
    const proto = (xfProto || req?.protocol || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https")).replace(/:$/, "");
    let domain = host.replace(/^dash\./i, "");
    // En dev: dashboard sur 3001 -> public sur 3002
    domain = domain.replace(/:3001$/i, ":3002");
    return `${proto}://${domain}`.replace(/\/$/, "");
  } catch {
    return "https://plinkk.fr";
  }
}

/**
 * Replies to a fastify request with a view
 * @param reply The fastify reply
 * @param template The template to use
 * @param user The user to use
 * @param data The data to use
 * @param statusCode The status code to use
 * @returns A promise that resolves when the reply is sent
 */
export async function replyView(
  reply: FastifyReply<any, any, any, any, any, any, any, any>,
  template: string,
  user: UserWithInclude,
  data: ejs.Data,
  statusCode: number = 200
): Promise<string> {
  return sharedReplyView(reply, template, user, data, {
    frontendUrl: computeFrontendUrl(reply),
    __platform: 'dashboard'
  }, statusCode);
}
