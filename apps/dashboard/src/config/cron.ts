import { FastifyInstance } from "fastify";
import fastifyCron from "fastify-cron";
import { prisma } from "@plinkk/prisma";
import { cleanExpiredSessions } from "../services/sessionService";
import { emailQueueService } from "../services/emailQueueService";

export async function registerCronJobs(fastify: FastifyInstance) {
  await fastify.register(fastifyCron, {
    jobs: [
      {
        name: "Delete all inactive account",
        cronTime: "0 0 * * MON",
        onTick: async () => {
          const date = new Date(Date.now());
          date.setUTCFullYear(date.getUTCFullYear() - 3);
          console.log("Delete all to " + date.toISOString());
          
          const before = await prisma.user.count();
          await prisma.user.deleteMany({
            where: { lastLogin: { lte: date } },
          });
          const after = await prisma.user.count();
          
          console.log(
            `Finished deleted ${before - after} User(s) ( Before : ${before} User(s) / After : ${after} User(s) )`
          );
        },
      },
      {
        name: "Clean expired sessions",
        cronTime: "0 0 * * *",
        onTick: async () => {
          try {
            const count = await cleanExpiredSessions();
            console.log(`Cleaned ${count} expired sessions`);
          } catch (e) {
            console.error("Failed to clean expired sessions", e);
          }
        },
      },
      {
        name: "Process email queue",
        cronTime: "0 * * * *", // Toutes les heures
        onTick: async () => {
          try {
            const result = await emailQueueService.processQueue();
            console.log(`Email queue processed: ${result.sent} sent, ${result.failed} failed, ${result.remaining} remaining`);
          } catch (e) {
            console.error("Failed to process email queue", e);
          }
        },
      },
      {
        name: "Clean old email queue records",
        cronTime: "0 2 * * *", // Tous les jours à 2h du matin
        onTick: async () => {
          try {
            const count = await emailQueueService.cleanup();
            console.log(`Cleaned ${count} old email queue records`);
          } catch (e) {
            console.error("Failed to clean email queue", e);
          }
        },
      },
    ],
  });
}
