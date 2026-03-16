/**
 * Lib User Utils
 * - getPublicPath -> Promise<string>
 * - getUserWithRole -> Promise<UserWithRole>
 * - getUserWithRoleAndCosmetics -> Promise<UserWithRoleAndCosmetics>
 */

import { prisma } from "@plinkk/prisma";
import { 
  getPublicPath as sharedGetPublicPath, 
  getUserWithRole as sharedGetUserWithRole, 
  getUserWithRoleAndCosmetics as sharedGetUserWithRoleAndCosmetics 
} from "@plinkk/shared";

/**
 * Gets the public path for a user
 * @param userId The ID of the user
 * @returns A promise that resolves to the public path
 */
export async function getPublicPath(userId: string): Promise<string> {
  return sharedGetPublicPath(prisma, userId);
}

/**
 * Gets a user with their role
 * @param userId The ID of the user
 * @returns A promise that resolves to the user with their role
 */
export async function getUserWithRole(userId: string) {
  return sharedGetUserWithRole(prisma, userId);
}

/**
 * Gets a user with their role and cosmetics
 * @param userId The ID of the user
 * @returns A promise that resolves to the user with their role and cosmetics
 */
export async function getUserWithRoleAndCosmetics(userId: string) {
  return sharedGetUserWithRoleAndCosmetics(prisma, userId);
}
