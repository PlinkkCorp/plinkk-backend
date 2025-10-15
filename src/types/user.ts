import { Prisma, User } from "../../generated/prisma/client";

export type UserWithInclude = Prisma.UserGetPayload<{
  include: {
    role?: true,
    announcement?: true,
    backgroundColors?: true,
    cosmetics?: true,
    host?: true,
    labels?: true,
    links?: true,
    neonColors?: true,
    plinkks?: true,
    socialIcons?: true,
    statusbar?: true,
    themes?: true
  };
}>;

export type SafeUser = Omit<UserWithInclude, 'password' | 'twoFactorSecret'>;

export function toSafeUser(user: UserWithInclude): SafeUser {
  const { password, twoFactorSecret, ...safe } = user;
  return safe;
}