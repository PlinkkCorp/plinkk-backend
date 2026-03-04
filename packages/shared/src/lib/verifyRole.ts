import { Role } from "@plinkk/prisma";

export function verifyRoleUser(role: Partial<Role> | null | undefined): boolean {
    if (!role) return true;
    return role.name === "USER";
}

export function verifyRoleBeta(role: Partial<Role> | null | undefined): boolean {
    if (!role) return false;
    return role.name === "BETA";
}

export function verifyRolePartner(role: Partial<Role> | null | undefined): boolean {
    if (!role) return false;
    return role.name === "PARTNER";
}

export function verifyRoleAdmin(role: Partial<Role> | null | undefined): boolean {
    if (!role) return false;
    return role.name === "ADMIN";
}

export function verifyRoleDeveloper(role: Partial<Role> | null | undefined): boolean {
    if (!role) return false;
    return role.name === "DEVELOPER";
}

export function verifyRoleModrator(role: Partial<Role> | null | undefined): boolean {
    if (!role) return false;
    return role.name === "MODERATOR";
}

export function verifyRoleIsStaff(role: Partial<Role> | null | undefined): boolean {
        if (!role) return false;
    if (role.isStaff === true) return true;
    return verifyRoleAdmin(role) || verifyRoleDeveloper(role) || verifyRoleModrator(role);
}