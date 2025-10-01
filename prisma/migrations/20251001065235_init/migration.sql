-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'PARTNER', 'ADMIN', 'DEVELOPER', 'MODERATOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "publicEmail" TEXT,
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
    "delayAnimationButton" DOUBLE PRECISION DEFAULT 0.1,
    "canvaEnable" INTEGER NOT NULL DEFAULT 1,
    "selectedCanvasIndex" INTEGER DEFAULT 16,
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

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cosmetic" (
    "id" SERIAL NOT NULL,
    "flair" TEXT DEFAULT 'OG',
    "frame" TEXT DEFAULT 'none',
    "theme" TEXT DEFAULT 'system',
    "bannerUrl" TEXT DEFAULT '',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Cosmetic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Link" (
    "id" SERIAL NOT NULL,
    "icon" TEXT DEFAULT 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    "url" TEXT NOT NULL DEFAULT 'https://github.com/link',
    "text" TEXT DEFAULT 'Link',
    "name" TEXT DEFAULT 'Github',
    "description" TEXT DEFAULT 'Ma description',
    "showDescriptionOnHover" BOOLEAN DEFAULT true,
    "showDescription" BOOLEAN DEFAULT true,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Label" (
    "id" SERIAL NOT NULL,
    "data" TEXT NOT NULL DEFAULT 'Developer',
    "color" TEXT NOT NULL DEFAULT '#FF6384',
    "fontColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialIcon" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL DEFAULT 'https://github.com',
    "icon" TEXT NOT NULL DEFAULT 'Github',
    "userId" TEXT NOT NULL,

    CONSTRAINT "SocialIcon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundColor" (
    "id" SERIAL NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#FF5733',
    "userId" TEXT NOT NULL,

    CONSTRAINT "BackgroundColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeonColor" (
    "id" SERIAL NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#7289DA',
    "userId" TEXT NOT NULL,

    CONSTRAINT "NeonColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Statusbar" (
    "id" SERIAL NOT NULL,
    "text" TEXT DEFAULT 'Hello World!',
    "colorBg" TEXT DEFAULT '#222222',
    "colorText" TEXT DEFAULT '#cccccc',
    "fontTextColor" INTEGER DEFAULT 1,
    "statusText" TEXT DEFAULT 'busy',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Statusbar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cosmetic_userId_key" ON "Cosmetic"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Statusbar_userId_key" ON "Statusbar"("userId");

-- AddForeignKey
ALTER TABLE "Cosmetic" ADD CONSTRAINT "Cosmetic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialIcon" ADD CONSTRAINT "SocialIcon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundColor" ADD CONSTRAINT "BackgroundColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeonColor" ADD CONSTRAINT "NeonColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Statusbar" ADD CONSTRAINT "Statusbar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
