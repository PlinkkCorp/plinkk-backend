/*
  Warnings:

  - The primary key for the `AnnouncementRoleTarget` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `role` on the `AnnouncementRoleTarget` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - Added the required column `roleId` to the `AnnouncementRoleTarget` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AnnouncementRoleTarget" DROP CONSTRAINT "AnnouncementRoleTarget_pkey",
DROP COLUMN "role",
ADD COLUMN     "roleId" TEXT NOT NULL,
ADD CONSTRAINT "AnnouncementRoleTarget_pkey" PRIMARY KEY ("announcementId", "roleId");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "roleId" TEXT;

-- DropEnum
DROP TYPE "public"."Role";

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRoleTarget" ADD CONSTRAINT "AnnouncementRoleTarget_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
