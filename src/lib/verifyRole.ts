import { Role } from "../../generated/prisma";

export function verifyRoleUser(role: Role) {
    return role.id === "USER" ? true : false
}

export function verifyRoleBeta(role: Role) {
    return role.id === "BETA" ? true : false
}

export function verifyRolePartner(role: Role) {
    return role.id === "PARTNER" ? true : false
}

export function verifyRoleAdmin(role: Role) {
    return role.id === "ADMIN" ? true : false
}

export function verifyRoleDeveloper(role: Role) {
    return role.id === "DEVELOPER" ? true : false
}

export function verifyRoleModrator(role: Role) {
    return role.id === "MODERATOR" ? true : false
}

export function verifyRoleIsStaff(role: Role) {
    return verifyRoleAdmin(role) || verifyRoleDeveloper(role) || verifyRoleModrator(role)
}