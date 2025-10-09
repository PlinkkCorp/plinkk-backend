/*
  Warnings:

  - A unique constraint covering the columns `[verifyToken]` on the table `Host` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `verifyToken` to the `Host` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Host" ADD COLUMN     "verifyToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Host_verifyToken_key" ON "Host"("verifyToken");
