-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "publicEmail" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
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
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "selectedCustomThemeId" TEXT
);

-- CreateTable
CREATE TABLE "Cosmetic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flair" TEXT DEFAULT 'OG',
    "frame" TEXT DEFAULT 'none',
    "theme" TEXT DEFAULT 'system',
    "bannerUrl" TEXT DEFAULT '',
    "banner" TEXT DEFAULT '',
    "userId" TEXT NOT NULL,
    CONSTRAINT "Cosmetic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "icon" TEXT DEFAULT 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    "url" TEXT NOT NULL DEFAULT 'https://github.com/link',
    "text" TEXT DEFAULT 'Link',
    "name" TEXT DEFAULT 'Github',
    "description" TEXT DEFAULT 'Ma description',
    "showDescriptionOnHover" BOOLEAN DEFAULT true,
    "showDescription" BOOLEAN DEFAULT true,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "plinkkId" TEXT,
    CONSTRAINT "Link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Link_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL DEFAULT 'Developer',
    "color" TEXT NOT NULL DEFAULT '#FF6384',
    "fontColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "userId" TEXT NOT NULL,
    "plinkkId" TEXT,
    CONSTRAINT "Label_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Label_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialIcon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL DEFAULT 'https://github.com',
    "icon" TEXT NOT NULL DEFAULT 'Github',
    "userId" TEXT NOT NULL,
    "plinkkId" TEXT,
    CONSTRAINT "SocialIcon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocialIcon_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BackgroundColor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "color" TEXT NOT NULL DEFAULT '#FF5733',
    "userId" TEXT NOT NULL,
    "plinkkId" TEXT,
    CONSTRAINT "BackgroundColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BackgroundColor_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NeonColor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "color" TEXT NOT NULL DEFAULT '#7289DA',
    "userId" TEXT NOT NULL,
    "plinkkId" TEXT,
    CONSTRAINT "NeonColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NeonColor_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Statusbar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT DEFAULT 'Hello World!',
    "colorBg" TEXT DEFAULT '#222222',
    "colorText" TEXT DEFAULT '#cccccc',
    "fontTextColor" INTEGER DEFAULT 1,
    "statusText" TEXT DEFAULT 'busy',
    "userId" TEXT NOT NULL,
    CONSTRAINT "Statusbar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlinkkStatusbar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT DEFAULT 'Hello World!',
    "colorBg" TEXT DEFAULT '#222222',
    "colorText" TEXT DEFAULT '#cccccc',
    "fontTextColor" INTEGER DEFAULT 1,
    "statusText" TEXT DEFAULT 'busy',
    "plinkkId" TEXT NOT NULL,
    CONSTRAINT "PlinkkStatusbar_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" TEXT NOT NULL DEFAULT 'info',
    "text" TEXT NOT NULL,
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "startAt" DATETIME,
    "endAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "global" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "AnnouncementTarget" (
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("announcementId", "userId"),
    CONSTRAINT "AnnouncementTarget_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnnouncementTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnnouncementRoleTarget" (
    "announcementId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    PRIMARY KEY ("announcementId", "role"),
    CONSTRAINT "AnnouncementRoleTarget_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pendingUpdate" JSONB,
    "pendingUpdateAt" DATETIME,
    "pendingUpdateMessage" TEXT,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Theme_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Plinkk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "index" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Plinkk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlinkkSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plinkkId" TEXT NOT NULL,
    "profileLink" TEXT,
    "profileImage" TEXT,
    "profileIcon" TEXT,
    "profileSiteText" TEXT,
    "userName" TEXT,
    "iconUrl" TEXT,
    "description" TEXT,
    "profileHoverColor" TEXT,
    "degBackgroundColor" INTEGER,
    "neonEnable" INTEGER,
    "buttonThemeEnable" INTEGER,
    "EnableAnimationArticle" INTEGER,
    "EnableAnimationButton" INTEGER,
    "EnableAnimationBackground" INTEGER,
    "backgroundSize" INTEGER,
    "selectedThemeIndex" INTEGER,
    "selectedAnimationIndex" INTEGER,
    "selectedAnimationButtonIndex" INTEGER,
    "selectedAnimationBackgroundIndex" INTEGER,
    "animationDurationBackground" INTEGER,
    "delayAnimationButton" REAL,
    "canvaEnable" INTEGER,
    "selectedCanvasIndex" INTEGER,
    CONSTRAINT "PlinkkSettings_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlinkkEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plinkkId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserViewDaily" (
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "date")
);

-- CreateTable
CREATE TABLE "LinkClickDaily" (
    "linkId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    PRIMARY KEY ("linkId", "date")
);

-- CreateTable
CREATE TABLE "PlinkkViewDaily" (
    "plinkkId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    PRIMARY KEY ("plinkkId", "date")
);

-- CreateTable
CREATE TABLE "PageStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plinkkId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "meta" JSONB,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageStat_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cosmetic_userId_key" ON "Cosmetic"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Statusbar_userId_key" ON "Statusbar"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlinkkStatusbar_plinkkId_key" ON "PlinkkStatusbar"("plinkkId");

-- CreateIndex
CREATE UNIQUE INDEX "Plinkk_userId_slug_key" ON "Plinkk"("userId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Plinkk_userId_index_key" ON "Plinkk"("userId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "PlinkkSettings_plinkkId_key" ON "PlinkkSettings"("plinkkId");

-- CreateIndex
CREATE INDEX "PageStat_plinkkId_eventType_createdAt_idx" ON "PageStat"("plinkkId", "eventType", "createdAt");
