import { prisma } from "@plinkk/prisma";
import { 
  getPublicPath as sharedGetPublicPath, 
  getUserWithRole as sharedGetUserWithRole, 
  getUserWithRoleAndCosmetics as sharedGetUserWithRoleAndCosmetics 
} from "@plinkk/shared";

export async function getPublicPath(userId: string): Promise<string> {
  return sharedGetPublicPath(prisma, userId);
}

export async function getUserWithRole(userId: string) {
  return sharedGetUserWithRole(prisma, userId);
}

export async function getUserWithRoleAndCosmetics(userId: string) {
  return sharedGetUserWithRoleAndCosmetics(prisma, userId);
}
