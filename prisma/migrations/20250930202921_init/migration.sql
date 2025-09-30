-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "publicEmail" TEXT DEFAULT 'email',
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

-- CreateTable
CREATE TABLE "Link" (
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

-- CreateTable
CREATE TABLE "Label" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" TEXT NOT NULL DEFAULT 'Developer',
    "color" TEXT NOT NULL DEFAULT '#FF6384',
    "fontColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "userId" TEXT NOT NULL,
    CONSTRAINT "Label_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialIcon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL DEFAULT 'https://github.com',
    "icon" TEXT NOT NULL DEFAULT 'Github',
    "userId" TEXT NOT NULL,
    CONSTRAINT "SocialIcon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BackgroundColor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "color" TEXT NOT NULL DEFAULT '#FF5733',
    "userId" TEXT NOT NULL,
    CONSTRAINT "BackgroundColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NeonColor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "color" TEXT NOT NULL DEFAULT '#7289DA',
    "userId" TEXT NOT NULL,
    CONSTRAINT "NeonColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Statusbar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT DEFAULT 'Hello World!',
    "colorBg" TEXT DEFAULT '#222222',
    "colorText" TEXT DEFAULT '#cccccc',
    "fontTextColor" INTEGER DEFAULT 1,
    "statusText" TEXT DEFAULT 'busy',
    "userId" TEXT NOT NULL,
    CONSTRAINT "Statusbar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Statusbar_userId_key" ON "Statusbar"("userId");
