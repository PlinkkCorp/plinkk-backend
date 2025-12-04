export interface PermissionDefinition {
    key: string;
    category: string;
    description?: string;
    defaultRoles?: string[];
}
export declare const PERMISSIONS: PermissionDefinition[];
