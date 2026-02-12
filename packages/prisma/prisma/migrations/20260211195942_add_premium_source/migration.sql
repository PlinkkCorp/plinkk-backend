-- AlterTable
ALTER TABLE "User" ADD COLUMN "premiumSource" TEXT;

-- Backfill existing data
-- Users with Stripe customer ID get STRIPE source
UPDATE "User"
SET "premiumSource" = 'STRIPE'
WHERE "isPremium" = true
  AND "stripeCustomerId" IS NOT NULL;

-- Users with premium but no Stripe ID get MANUAL source (staff, partners)
UPDATE "User"
SET "premiumSource" = 'MANUAL'
WHERE "isPremium" = true
  AND "stripeCustomerId" IS NULL;
