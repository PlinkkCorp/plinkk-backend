import { prisma } from "@plinkk/prisma";

const ONBOARDING_ENFORCED_FROM_RAW =
  process.env.ONBOARDING_ENFORCED_FROM || "2026-03-08T00:00:00.000Z";
const ONBOARDING_ENFORCED_FROM = new Date(ONBOARDING_ENFORCED_FROM_RAW);

export function isLegacyOnboardingAccount(createdAt: Date): boolean {
  return createdAt.getTime() < ONBOARDING_ENFORCED_FROM.getTime();
}

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
