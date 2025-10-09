-- CreateTable
CREATE TABLE "BannedSlug" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "BannedSlug_pkey" PRIMARY KEY ("id")
);
