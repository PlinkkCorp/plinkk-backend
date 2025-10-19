-- AlterTable
ALTER TABLE "PlinkkSettings" ADD COLUMN     "layoutOrder" JSONB DEFAULT '["profile","username","statusbar","labels","social","email","links"]';
