-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profileLink" TEXT,
    "profileImage" TEXT,
    "profileIcon" TEXT,
    "profileSiteText" TEXT,
    "iconUrl" TEXT,
    "description" TEXT,
    "profileHoverColor" TEXT,
    "degBackgroundColor" INTEGER,
    "neonEnable" INTEGER NOT NULL DEFAULT 0,
    "buttonThemeEnable" INTEGER NOT NULL DEFAULT 0,
    "EnableAnimationArticle" INTEGER NOT NULL DEFAULT 0,
    "EnableAnimationButton" INTEGER NOT NULL DEFAULT 0,
    "EnableAnimationBackground" INTEGER NOT NULL DEFAULT 0,
    "backgroundSize" INTEGER,
    "selectedThemeIndex" INTEGER,
    "selectedAnimationIndex" INTEGER,
    "selectedAnimationButtonIndex" INTEGER,
    "selectedAnimationBackgroundIndex" INTEGER,
    "animationDurationBackground" INTEGER,
    "delayAnimationButton" REAL,
    "canvaEnable" INTEGER NOT NULL DEFAULT 0,
    "selectedCanvasIndex" INTEGER
);

-- CreateTable
CREATE TABLE "Link" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "icon" TEXT,
    "url" TEXT NOT NULL,
    "text" TEXT,
    "name" TEXT,
    "description" TEXT,
    "showDescriptionOnHover" BOOLEAN DEFAULT false,
    "showDescription" BOOLEAN DEFAULT false,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Label" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "fontColor" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Label_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialIcon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SocialIcon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BackgroundColor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "color" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "BackgroundColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NeonColor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "color" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "NeonColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Statusbar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT,
    "colorBg" TEXT,
    "colorText" TEXT,
    "fontTextColor" INTEGER,
    "statusText" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Statusbar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Statusbar_userId_key" ON "Statusbar"("userId");
