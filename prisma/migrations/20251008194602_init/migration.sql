-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "publicEmail" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "name" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "rankScore" INTEGER NOT NULL DEFAULT 0,
    "bumpedAt" DATETIME,
    "bumpExpiresAt" DATETIME,
    "bumpPaidUntil" DATETIME,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "selectedCustomThemeId" TEXT,
    "slags" JSONB NOT NULL DEFAULT []
);
INSERT INTO "new_User" ("bumpExpiresAt", "bumpPaidUntil", "bumpedAt", "createdAt", "email", "emailVerified", "id", "image", "isPublic", "name", "password", "publicEmail", "rankScore", "role", "selectedCustomThemeId", "slags", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "userName", "views") SELECT "bumpExpiresAt", "bumpPaidUntil", "bumpedAt", "createdAt", "email", "emailVerified", "id", "image", "isPublic", "name", "password", "publicEmail", "rankScore", "role", "selectedCustomThemeId", coalesce("slags", []) AS "slags", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "userName", "views" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
