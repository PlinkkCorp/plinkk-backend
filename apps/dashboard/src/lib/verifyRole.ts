import { Role } from "@plinkk/prisma";

export function verifyRoleUser(role: Role | null | undefined): boolean {
    if (!role) return true;
    return role.name === "USER";
}

export function verifyRoleBeta(role: Role | null | undefined): boolean {
    if (!role) return false;
    return role.name === "BETA";
}

export function verifyRolePartner(role: Role | null | undefined): boolean {
    if (!role) return false;
    return role.name === "PARTNER";
}

export function verifyRoleAdmin(role: Role | null | undefined): boolean {
    if (!role) return false;
    return role.name === "ADMIN";
}

export function verifyRoleDeveloper(role: Role | null | undefined): boolean {
    if (!role) return false;
    return role.name === "DEVELOPER";
}

export function verifyRoleModrator(role: Role | null | undefined): boolean {
    if (!role) return false;
    return role.name === "MODERATOR";
}

export function verifyRoleIsStaff(role: Role | null | undefined): boolean {
        if (!role) return false;
    // Support both legacy name-based check and new isStaff flag
    if (role.isStaff === true) return true;
    return verifyRoleAdmin(role) || verifyRoleDeveloper(role) || verifyRoleModrator(role);
}