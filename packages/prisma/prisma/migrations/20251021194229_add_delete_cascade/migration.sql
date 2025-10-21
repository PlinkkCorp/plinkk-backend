-- DropForeignKey
ALTER TABLE "public"."BackgroundColor" DROP CONSTRAINT "BackgroundColor_plinkkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."BackgroundColor" DROP CONSTRAINT "BackgroundColor_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Cosmetic" DROP CONSTRAINT "Cosmetic_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Host" DROP CONSTRAINT "Host_plinkkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Label" DROP CONSTRAINT "Label_plinkkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Label" DROP CONSTRAINT "Label_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Link" DROP CONSTRAINT "Link_plinkkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Link" DROP CONSTRAINT "Link_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NeonColor" DROP CONSTRAINT "NeonColor_plinkkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NeonColor" DROP CONSTRAINT "NeonColor_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SocialIcon" DROP CONSTRAINT "SocialIcon_plinkkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SocialIcon" DROP CONSTRAINT "SocialIcon_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Statusbar" DROP CONSTRAINT "Statusbar_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Theme" DROP CONSTRAINT "Theme_authorId_fkey";

-- AddForeignKey
ALTER TABLE "Cosmetic" ADD CONSTRAINT "Cosmetic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Host" ADD CONSTRAINT "Host_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialIcon" ADD CONSTRAINT "SocialIcon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialIcon" ADD CONSTRAINT "SocialIcon_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundColor" ADD CONSTRAINT "BackgroundColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundColor" ADD CONSTRAINT "BackgroundColor_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeonColor" ADD CONSTRAINT "NeonColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeonColor" ADD CONSTRAINT "NeonColor_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Statusbar" ADD CONSTRAINT "Statusbar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
