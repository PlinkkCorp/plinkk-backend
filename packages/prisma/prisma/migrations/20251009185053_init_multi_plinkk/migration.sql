-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'PARTNER', 'ADMIN', 'DEVELOPER', 'MODERATOR');

-- CreateEnum
CREATE TYPE "ThemeStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "PlinkkEventType" AS ENUM ('CREATED', 'DELETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "publicEmail" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "name" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "rankScore" INTEGER NOT NULL DEFAULT 0,
    "bumpedAt" TIMESTAMP(3),
    "bumpExpiresAt" TIMESTAMP(3),
    "bumpPaidUntil" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "selectedCustomThemeId" TEXT,
    "slags" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cosmetic" (
    "id" TEXT NOT NULL,
    "flair" TEXT DEFAULT 'OG',
    "frame" TEXT DEFAULT 'none',
    "theme" TEXT DEFAULT 'system',
    "bannerUrl" TEXT DEFAULT '',
    "banner" TEXT DEFAULT '',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Cosmetic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Host" (
    "id" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifyToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Host_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL DEFAULT 'Developer',
    "color" TEXT NOT NULL DEFAULT '#FF6384',
    "fontColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "userId" TEXT NOT NULL,
    "plinkkId" TEXT,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialIcon" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT 'https://github.com',
    "icon" TEXT NOT NULL DEFAULT 'Github',
    "userId" TEXT NOT NULL,
    "plinkkId" TEXT,

    CONSTRAINT "SocialIcon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundColor" (
    "id" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#FF5733',
    "userId" TEXT NOT NULL,
    "plinkkId" TEXT,

    CONSTRAINT "BackgroundColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeonColor" (
    "id" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#7289DA',
    "userId" TEXT NOT NULL,
    "plinkkId" TEXT,

    CONSTRAINT "NeonColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Statusbar" (
    "id" TEXT NOT NULL,
    "text" TEXT DEFAULT 'Hello World!',
    "colorBg" TEXT DEFAULT '#222222',
    "colorText" TEXT DEFAULT '#cccccc',
    "fontTextColor" INTEGER DEFAULT 1,
    "statusText" TEXT DEFAULT 'busy',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Statusbar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlinkkStatusbar" (
    "id" TEXT NOT NULL,
    "text" TEXT DEFAULT 'Hello World!',
    "colorBg" TEXT DEFAULT '#222222',
    "colorText" TEXT DEFAULT '#cccccc',
    "fontTextColor" INTEGER DEFAULT 1,
    "statusText" TEXT DEFAULT 'busy',
    "plinkkId" TEXT NOT NULL,

    CONSTRAINT "PlinkkStatusbar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "text" TEXT NOT NULL,
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "global" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementTarget" (
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AnnouncementTarget_pkey" PRIMARY KEY ("announcementId","userId")
);

-- CreateTable
CREATE TABLE "AnnouncementRoleTarget" (
    "announcementId" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "AnnouncementRoleTarget_pkey" PRIMARY KEY ("announcementId","role")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB NOT NULL,
    "status" "ThemeStatus" NOT NULL DEFAULT 'DRAFT',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pendingUpdate" JSONB,
    "pendingUpdateAt" TIMESTAMP(3),
    "pendingUpdateMessage" TEXT,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plinkk" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "index" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plinkk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlinkkSettings" (
    "id" TEXT NOT NULL,
    "plinkkId" TEXT NOT NULL,
    "profileLink" TEXT,
    "profileImage" TEXT,
    "profileIcon" TEXT,
    "profileSiteText" TEXT,
    "userName" TEXT,
    "iconUrl" TEXT,
    "description" TEXT,
    "profileHoverColor" TEXT,
    "affichageEmail" TEXT,
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
    "delayAnimationButton" DOUBLE PRECISION,
    "canvaEnable" INTEGER,
    "selectedCanvasIndex" INTEGER,

    CONSTRAINT "PlinkkSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlinkkEvent" (
    "id" TEXT NOT NULL,
    "type" "PlinkkEventType" NOT NULL,
    "userId" TEXT NOT NULL,
    "plinkkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlinkkEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserViewDaily" (
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "UserViewDaily_pkey" PRIMARY KEY ("userId","date")
);

-- CreateTable
CREATE TABLE "LinkClickDaily" (
    "linkId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "LinkClickDaily_pkey" PRIMARY KEY ("linkId","date")
);

-- CreateTable
CREATE TABLE "PlinkkViewDaily" (
    "plinkkId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "PlinkkViewDaily_pkey" PRIMARY KEY ("plinkkId","date")
);

-- CreateTable
CREATE TABLE "PageStat" (
    "id" TEXT NOT NULL,
    "plinkkId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "meta" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cosmetic_userId_key" ON "Cosmetic"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Host_verifyToken_key" ON "Host"("verifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "Host_userId_key" ON "Host"("userId");

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

-- AddForeignKey
ALTER TABLE "Cosmetic" ADD CONSTRAINT "Cosmetic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Host" ADD CONSTRAINT "Host_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialIcon" ADD CONSTRAINT "SocialIcon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialIcon" ADD CONSTRAINT "SocialIcon_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundColor" ADD CONSTRAINT "BackgroundColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundColor" ADD CONSTRAINT "BackgroundColor_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeonColor" ADD CONSTRAINT "NeonColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeonColor" ADD CONSTRAINT "NeonColor_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Statusbar" ADD CONSTRAINT "Statusbar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlinkkStatusbar" ADD CONSTRAINT "PlinkkStatusbar_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementTarget" ADD CONSTRAINT "AnnouncementTarget_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementTarget" ADD CONSTRAINT "AnnouncementTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRoleTarget" ADD CONSTRAINT "AnnouncementRoleTarget_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plinkk" ADD CONSTRAINT "Plinkk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlinkkSettings" ADD CONSTRAINT "PlinkkSettings_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageStat" ADD CONSTRAINT "PageStat_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
