-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profileLink" TEXT DEFAULT 'https://github.com',
    "profileImage" TEXT DEFAULT 'https://avatars.githubusercontent.com/u/9919?s=200&v=4',
    "profileIcon" TEXT DEFAULT 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    "profileSiteText" TEXT DEFAULT 'Github',
    "iconUrl" TEXT DEFAULT 'https://avatars.githubusercontent.com/u/9919?s=200&v=4',
    "description" TEXT DEFAULT 'Mollit laboris cupidatat do enim nulla ex laborum. Nulla labore reprehenderit nisi non anim aute.',
    "profileHoverColor" TEXT DEFAULT '#7289DA',
    "degBackgroundColor" INTEGER DEFAULT 45,
    "neonEnable" INTEGER NOT NULL DEFAULT 1,
    "buttonThemeEnable" INTEGER NOT NULL DEFAULT 1,
    "EnableAnimationArticle" INTEGER NOT NULL DEFAULT 1,
    "EnableAnimationButton" INTEGER NOT NULL DEFAULT 1,
    "EnableAnimationBackground" INTEGER NOT NULL DEFAULT 1,
    "backgroundSize" INTEGER DEFAULT 50,
    "selectedThemeIndex" INTEGER DEFAULT 13,
    "selectedAnimationIndex" INTEGER DEFAULT 0,
    "selectedAnimationButtonIndex" INTEGER DEFAULT 10,
    "selectedAnimationBackgroundIndex" INTEGER DEFAULT 10,
    "animationDurationBackground" INTEGER DEFAULT 30,
    "delayAnimationButton" REAL DEFAULT 0.1,
    "canvaEnable" INTEGER NOT NULL DEFAULT 1,
    "selectedCanvasIndex" INTEGER DEFAULT 16,
    "name" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "rankScore" INTEGER NOT NULL DEFAULT 0,
    "bumpedAt" DATETIME,
    "bumpExpiresAt" DATETIME,
    "bumpPaidUntil" DATETIME,
    "cosmetics" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_User" ("EnableAnimationArticle", "EnableAnimationBackground", "EnableAnimationButton", "animationDurationBackground", "backgroundSize", "bumpExpiresAt", "bumpPaidUntil", "bumpedAt", "buttonThemeEnable", "canvaEnable", "cosmetics", "createdAt", "degBackgroundColor", "delayAnimationButton", "description", "email", "emailVerified", "iconUrl", "id", "image", "name", "neonEnable", "password", "profileHoverColor", "profileIcon", "profileImage", "profileLink", "profileSiteText", "rankScore", "role", "selectedAnimationBackgroundIndex", "selectedAnimationButtonIndex", "selectedAnimationIndex", "selectedCanvasIndex", "selectedThemeIndex", "updatedAt", "userName") SELECT "EnableAnimationArticle", "EnableAnimationBackground", "EnableAnimationButton", "animationDurationBackground", "backgroundSize", "bumpExpiresAt", "bumpPaidUntil", "bumpedAt", "buttonThemeEnable", "canvaEnable", "cosmetics", "createdAt", "degBackgroundColor", "delayAnimationButton", "description", "email", "emailVerified", "iconUrl", "id", "image", "name", "neonEnable", "password", "profileHoverColor", "profileIcon", "profileImage", "profileLink", "profileSiteText", "rankScore", "role", "selectedAnimationBackgroundIndex", "selectedAnimationButtonIndex", "selectedAnimationIndex", "selectedCanvasIndex", "selectedThemeIndex", "updatedAt", "userName" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
