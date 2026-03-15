import { FastifyReply } from "fastify";
import ejs from "ejs";
import { UserWithInclude, replyView as sharedReplyView } from "@plinkk/shared";
import "dotenv/config"

export { getActiveAnnouncementsForUser } from "@plinkk/shared";

export async function replyView(
  reply: FastifyReply<any, any, any, any, any, any, any, any>,
  template: string,
  user: UserWithInclude,
  data: ejs.Data,
  statusCode: number = 200
): Promise<string> {
  return sharedReplyView(reply, template, user, data, {
    dashboardUrl: process.env.DASHBOARD_URL,
    __platform: 'public'
  }, statusCode);
}
