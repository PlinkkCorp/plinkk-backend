/**
 * Lib Onboarding
 * - isLegacyOnboardingAccount                 -> boolean
 * - ensureOnboardingCompletedForLegacyAccount -> Promise<boolean>
 */

import { prisma } from "@plinkk/prisma";

const ONBOARDING_ENFORCED_FROM_RAW =
  process.env.ONBOARDING_ENFORCED_FROM || "2026-03-08T00:00:00.000Z";
const ONBOARDING_ENFORCED_FROM = new Date(ONBOARDING_ENFORCED_FROM_RAW);

/**
 * Checks if an account is a legacy account (created before onboarding was enforced)
 * @param createdAt The creation date of the account
 * @returns True if the account is a legacy account, false otherwise
 */
export function isLegacyOnboardingAccount(createdAt: Date): boolean {
  return createdAt.getTime() < ONBOARDING_ENFORCED_FROM.getTime();
}

/**
 * Ensures that onboarding is completed for legacy accounts
 * @param user The user to ensure onboarding is completed for
 * @returns A promise that resolves to true if onboarding is completed, false otherwise
 */
export async function ensureOnboardingCompletedForLegacyAccount(user: {
  id: string;
  createdAt: Date;
  onboardingCompleted: boolean;
}): Promise<boolean> {
  if (user.onboardingCompleted || !isLegacyOnboardingAccount(user.createdAt)) {
    return user.onboardingCompleted;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingCompleted: true },
  });

  return true;
}
