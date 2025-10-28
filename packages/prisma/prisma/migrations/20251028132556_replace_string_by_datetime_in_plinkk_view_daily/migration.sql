/*
  Warnings:

  - The primary key for the `PlinkkViewDaily` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `date` column on the `PlinkkViewDaily` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PlinkkViewDaily" DROP CONSTRAINT "PlinkkViewDaily_pkey",
DROP COLUMN "date",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "PlinkkViewDaily_pkey" PRIMARY KEY ("plinkkId", "date");
