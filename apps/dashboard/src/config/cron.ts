import { FastifyInstance } from "fastify";
import fastifyCron from "fastify-cron";
import { prisma } from "@plinkk/prisma";
import { cleanExpiredSessions } from "../services/sessionService";

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
    ],
  });
}
