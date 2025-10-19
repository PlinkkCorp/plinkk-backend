/*
  Warnings:

  - The primary key for the `BannedSlug` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `BannedSlug` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BannedSlug" DROP CONSTRAINT "BannedSlug_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "BannedSlug_pkey" PRIMARY KEY ("slug");
