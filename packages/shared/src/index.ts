export * from "./lib/builtInThemes.js";
export * from "./lib/theme.js";
export * from "./lib/generateTheme.js";
export * from "./lib/generateConfig.js";
export * from "./lib/generateBundle.js";
export * from "./lib/resolvePlinkkPage.js";
export * from "./lib/fileUtils.js";
export * from "./lib/errors.js";
export * from "./lib/verifyRole.js";
export * from "./lib/replyView.js";
export * from "./lib/dateUtils.js";
export * from "./lib/plinkkUtils.js";
export * from "./lib/userUtils.js";
export * from "./lib/reservedSlugs.js";
export * from "./lib/bannedSlugs.js";
export * from "./lib/redirectService.js";
export * from "./types/user.js";

declare module "@fastify/secure-session" {
  interface SessionData {
    data?: string;
    sessionId?: string;
    returnTo?: string;
  }
}

