/*
  Warnings:

  - The primary key for the `BackgroundColor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Cosmetic` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Label` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Link` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `NeonColor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `SocialIcon` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Statusbar` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "BackgroundColor" DROP CONSTRAINT "BackgroundColor_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "BackgroundColor_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "BackgroundColor_id_seq";

-- AlterTable
ALTER TABLE "Cosmetic" DROP CONSTRAINT "Cosmetic_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Cosmetic_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Cosmetic_id_seq";

-- AlterTable
ALTER TABLE "Label" DROP CONSTRAINT "Label_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Label_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Label_id_seq";

-- AlterTable
ALTER TABLE "Link" DROP CONSTRAINT "Link_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Link_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Link_id_seq";

-- AlterTable
ALTER TABLE "NeonColor" DROP CONSTRAINT "NeonColor_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "NeonColor_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "NeonColor_id_seq";

-- AlterTable
ALTER TABLE "SocialIcon" DROP CONSTRAINT "SocialIcon_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "SocialIcon_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "SocialIcon_id_seq";

-- AlterTable
ALTER TABLE "Statusbar" DROP CONSTRAINT "Statusbar_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Statusbar_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Statusbar_id_seq";
