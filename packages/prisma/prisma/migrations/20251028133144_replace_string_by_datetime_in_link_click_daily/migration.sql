/*
  Warnings:

  - The primary key for the `LinkClickDaily` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `date` column on the `LinkClickDaily` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `UserViewDaily` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `date` column on the `UserViewDaily` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "LinkClickDaily" DROP CONSTRAINT "LinkClickDaily_pkey",
DROP COLUMN "date",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "LinkClickDaily_pkey" PRIMARY KEY ("linkId", "date");

-- AlterTable
ALTER TABLE "UserViewDaily" DROP CONSTRAINT "UserViewDaily_pkey",
DROP COLUMN "date",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "UserViewDaily_pkey" PRIMARY KEY ("userId", "date");
