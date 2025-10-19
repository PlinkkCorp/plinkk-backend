-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BannedEmail" (
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletePlinkk" BOOLEAN NOT NULL DEFAULT false,
    "time" INTEGER DEFAULT -1,
    "revoquedAt" TIMESTAMP(3),

    CONSTRAINT "BannedEmail_pkey" PRIMARY KEY ("email")
);
