import { Prisma } from "@plinkk/prisma";

export type UserWithIncludeStrict = Prisma.UserGetPayload<{
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

export type UserWithInclude = Omit<UserWithIncludeStrict, keyof UserWithIncludeStrict> &
  Partial<UserWithIncludeStrict>;

export type SafeUser = Omit<UserWithInclude, 'password' | 'twoFactorSecret'>;

export function toSafeUser(user: UserWithInclude): SafeUser {
  const { password, twoFactorSecret, ...safe } = user;
  return safe;
}