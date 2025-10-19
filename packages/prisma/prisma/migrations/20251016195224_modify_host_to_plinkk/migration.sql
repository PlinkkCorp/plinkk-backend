/*
  Warnings:

  - You are about to drop the column `userId` on the `Host` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[plinkkId]` on the table `Host` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `plinkkId` to the `Host` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Host" DROP CONSTRAINT "Host_userId_fkey";

-- DropIndex
DROP INDEX "public"."Host_userId_key";

-- AlterTable
ALTER TABLE "Host" DROP COLUMN "userId",
ADD COLUMN     "plinkkId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Host_plinkkId_key" ON "Host"("plinkkId");

-- AddForeignKey
ALTER TABLE "Host" ADD CONSTRAINT "Host_plinkkId_fkey" FOREIGN KEY ("plinkkId") REFERENCES "Plinkk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
