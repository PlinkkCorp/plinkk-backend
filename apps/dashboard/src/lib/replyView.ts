import { FastifyReply } from "fastify";
import ejs from "ejs";
import { UserWithInclude, replyView as sharedReplyView } from "@plinkk/shared";
import "dotenv/config"

export { getActiveAnnouncementsForUser } from "@plinkk/shared";

function computeFrontendUrl(reply: FastifyReply) {
  const env = (process.env.FRONTEND_URL || "").trim();
  if (env) return env.replace(/\/$/, "");
  try {
    const req = reply.request;
    const host = String(req?.headers?.host || "");
    const xfProto = String(req?.headers?.["x-forwarded-proto"] || "").toLowerCase();
    const proto = (xfProto || req?.protocol || "https").replace(/:$/, "");
    let domain = host.replace(/^dash\./i, "");
    // En dev: dashboard sur 3001 -> public sur 3002
    domain = domain.replace(/:3001$/i, ":3002");
    return `${proto}://${domain}`.replace(/\/$/, "");
  } catch {
    return "https://plinkk.fr";
  }
}

export async function replyView(
  reply: FastifyReply,
  template: string,
  user: UserWithInclude,
  data: ejs.Data,
  statusCode: number = 200
): Promise<string> {
  return sharedReplyView(reply, template, user, data, {
    frontendUrl: computeFrontendUrl(reply)
  }, statusCode);
}
