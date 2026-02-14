import { FastifyInstance } from "fastify";
import { plinkksCrudRoutes } from "./crud";
import { plinkksConfigRoutes } from "./config";
import { plinkksSettingsRoutes } from "./settings";
import { plinkksExportRoutes } from "./export";
import { plinkksPremiumRoutes } from "./premium";


export function apiMePlinkksRoutes(fastify: FastifyInstance) {
  fastify.register(plinkksCrudRoutes);
  fastify.register(plinkksConfigRoutes);
  fastify.register(plinkksSettingsRoutes);
  fastify.register(plinkksExportRoutes);
  fastify.register(plinkksPremiumRoutes);
  fastify.register(import("./history.js").then(m => m.plinkksHistoryRoutes));
}
