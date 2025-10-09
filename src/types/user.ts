import { User } from "../../generated/prisma/client";

export type SafeUser = Omit<User, 'password' | 'twoFactorSecret'>;

export function toSafeUser(user: User): SafeUser {
  const { password, twoFactorSecret, ...safe } = user;
  return safe;
}