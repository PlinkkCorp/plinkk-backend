import { FastifyInstance } from "fastify";
import { prisma } from "@plinkk/prisma";
import { replyView } from "../../../lib/replyView";
import { ensurePermission } from "../../../lib/permissions";
import { requireAuthRedirect, requireAuth } from "../../../middleware/auth";
import { getUserStats, findAllUsersForAdmin } from "../../../services/userService";
import { getPendingThemesPreview } from "../../../services/themeService";
import { dashboardAdminReportsRoutes } from "./reports";
import { dashboardAdminSessionsRoutes } from "./sessions";
import { adminThemesRoutes } from "./themes";
import { adminAnnouncementsRoutes } from "./announcements";
import { adminStatsRoutes } from "./stats";
import { adminLogsRoutes } from "./logs";
import { adminRolesRoutes } from "./roles";
import { adminSystemRoutes } from "./system";
import { adminUsersRoutes } from "./users";
import { adminBansRoutes } from "./bans";
import { adminPlinkksRoutes } from "./plinkks";
import { adminMaintenanceRoutes } from "./maintenance";

export function dashboardAdminRoutes(fastify: FastifyInstance) {
  fastify.register(dashboardAdminReportsRoutes, { prefix: "/reports" });
  fastify.register(dashboardAdminSessionsRoutes, { prefix: "/sessions" });
  fastify.register(adminThemesRoutes, { prefix: "/themes" });
  fastify.register(adminAnnouncementsRoutes, { prefix: "/message" });
  fastify.register(adminStatsRoutes, { prefix: "/stats" });
  fastify.register(adminLogsRoutes, { prefix: "/logs" });
  fastify.register(adminRolesRoutes, { prefix: "/roles" });
  fastify.register(adminSystemRoutes, { prefix: "/system" });
  fastify.register(adminUsersRoutes, { prefix: "/users" });
  fastify.register(adminBansRoutes, { prefix: "/bans" });
  fastify.register(adminPlinkksRoutes, { prefix: "/plinkks" });
  fastify.register(adminMaintenanceRoutes, { prefix: "/maintenance" });

  fastify.get("/", { preHandler: [requireAuthRedirect] }, async function (request, reply) {
    const ok = await ensurePermission(request, reply, "VIEW_ADMIN", { mode: "redirect" });
    if (!ok) return;

    const [usersRaw, totals, pendingThemes, roles] = await Promise.all([
      findAllUsersForAdmin(),
      getUserStats(),
      getPendingThemesPreview(10),
      prisma.role.findMany({ orderBy: [{ priority: "desc" }, { name: "asc" }] }),
    ]);

    let users = usersRaw;
    try {
      const bans = await prisma.bannedEmail.findMany({ where: { revoquedAt: null } });
      const now = Date.now();
      const activeEmails = new Set(
        bans
          .filter((b) => {
            if (b.revoquedAt) return false;
            if (b.time == null || b.time < 0) return true;
            const until = new Date(b.createdAt).getTime() + b.time * 60000;
            return until > now;
          })
          .map((b) => String(b.email).toLowerCase())
      );
      users = users.filter((u) => !activeEmails.has(String(u.email).toLowerCase()));
    } catch { }

    return replyView(reply, "dashboard/admin/dash.ejs", request.currentUser!, {
      users,
      totals,
      pendingThemes,
      roles,
      publicPath: request.publicPath,
    });
  });
}
