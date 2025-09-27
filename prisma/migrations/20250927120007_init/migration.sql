-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BackgroundColor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "color" TEXT NOT NULL DEFAULT '#FF5733',
    "userId" TEXT NOT NULL,
    CONSTRAINT "BackgroundColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BackgroundColor" ("color", "id", "userId") SELECT "color", "id", "userId" FROM "BackgroundColor";
DROP TABLE "BackgroundColor";
ALTER TABLE "new_BackgroundColor" RENAME TO "BackgroundColor";
CREATE TABLE "new_Label" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" TEXT NOT NULL DEFAULT 'Developer',
    "color" TEXT NOT NULL DEFAULT '#FF6384',
    "fontColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "userId" TEXT NOT NULL,
    CONSTRAINT "Label_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Label" ("color", "data", "fontColor", "id", "userId") SELECT "color", "data", "fontColor", "id", "userId" FROM "Label";
DROP TABLE "Label";
ALTER TABLE "new_Label" RENAME TO "Label";
CREATE TABLE "new_Link" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "icon" TEXT DEFAULT 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    "url" TEXT NOT NULL DEFAULT 'https://github.com/link',
    "text" TEXT DEFAULT 'Link',
    "name" TEXT DEFAULT 'Github',
    "description" TEXT DEFAULT 'Ma description',
    "showDescriptionOnHover" BOOLEAN DEFAULT true,
    "showDescription" BOOLEAN DEFAULT true,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Link" ("description", "icon", "id", "name", "showDescription", "showDescriptionOnHover", "text", "url", "userId") SELECT "description", "icon", "id", "name", "showDescription", "showDescriptionOnHover", "text", "url", "userId" FROM "Link";
DROP TABLE "Link";
ALTER TABLE "new_Link" RENAME TO "Link";
CREATE TABLE "new_NeonColor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "color" TEXT NOT NULL DEFAULT '#7289DA',
    "userId" TEXT NOT NULL,
    CONSTRAINT "NeonColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_NeonColor" ("color", "id", "userId") SELECT "color", "id", "userId" FROM "NeonColor";
DROP TABLE "NeonColor";
ALTER TABLE "new_NeonColor" RENAME TO "NeonColor";
CREATE TABLE "new_SocialIcon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL DEFAULT 'https://github.com',
    "icon" TEXT NOT NULL DEFAULT 'Github',
    "userId" TEXT NOT NULL,
    CONSTRAINT "SocialIcon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SocialIcon" ("icon", "id", "url", "userId") SELECT "icon", "id", "url", "userId" FROM "SocialIcon";
DROP TABLE "SocialIcon";
ALTER TABLE "new_SocialIcon" RENAME TO "SocialIcon";
CREATE TABLE "new_Statusbar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT DEFAULT 'Hello World!',
    "colorBg" TEXT DEFAULT '#222222',
    "colorText" TEXT DEFAULT '#cccccc',
    "fontTextColor" INTEGER DEFAULT 1,
    "statusText" TEXT DEFAULT 'busy',
    "userId" TEXT NOT NULL,
    CONSTRAINT "Statusbar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Statusbar" ("colorBg", "colorText", "fontTextColor", "id", "statusText", "text", "userId") SELECT "colorBg", "colorText", "fontTextColor", "id", "statusText", "text", "userId" FROM "Statusbar";
DROP TABLE "Statusbar";
ALTER TABLE "new_Statusbar" RENAME TO "Statusbar";
CREATE UNIQUE INDEX "Statusbar_userId_key" ON "Statusbar"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userName" TEXT NOT NULL,
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
    "selectedCanvasIndex" INTEGER DEFAULT 16
);
INSERT INTO "new_User" ("EnableAnimationArticle", "EnableAnimationBackground", "EnableAnimationButton", "animationDurationBackground", "backgroundSize", "buttonThemeEnable", "canvaEnable", "degBackgroundColor", "delayAnimationButton", "description", "email", "iconUrl", "id", "neonEnable", "profileHoverColor", "profileIcon", "profileImage", "profileLink", "profileSiteText", "selectedAnimationBackgroundIndex", "selectedAnimationButtonIndex", "selectedAnimationIndex", "selectedCanvasIndex", "selectedThemeIndex", "userName") SELECT "EnableAnimationArticle", "EnableAnimationBackground", "EnableAnimationButton", "animationDurationBackground", "backgroundSize", "buttonThemeEnable", "canvaEnable", "degBackgroundColor", "delayAnimationButton", "description", "email", "iconUrl", "id", "neonEnable", "profileHoverColor", "profileIcon", "profileImage", "profileLink", "profileSiteText", "selectedAnimationBackgroundIndex", "selectedAnimationButtonIndex", "selectedAnimationIndex", "selectedCanvasIndex", "selectedThemeIndex", "userName" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
