import { Role } from "../../../../generated/prisma";

// Retourne true si l'utilisateur a le rôle USER (ou pas de rôle)
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

// Note: original had a typo 'Modrator' — keep compatibility by keeping the same export name
export function verifyRoleModrator(role: Role | null | undefined): boolean {
    if (!role) return false;
    return role.name === "MODERATOR";
}

export function verifyRoleIsStaff(role: Role | null | undefined): boolean {
    return verifyRoleAdmin(role) || verifyRoleDeveloper(role) || verifyRoleModrator(role);
}