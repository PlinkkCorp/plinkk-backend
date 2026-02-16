import { prisma } from '@plinkk/prisma';

export interface MaintenanceStatus {
    global: boolean;
    dashboard: boolean;
    activePages: string[];
    reason: string | null;
    scheduledStart: Date | null;
    scheduledEnd: Date | null;
    allowedIps: string[];
    allowedRoles: string[];
}

const DEFAULT_CONFIG_ID = 'config';

export async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
    const config = await prisma.maintenance.findUnique({
        where: { id: DEFAULT_CONFIG_ID },
    });

    if (!config) {
        return {
            global: false,
            dashboard: false,
            activePages: [],
            reason: null,
            scheduledStart: null,
            scheduledEnd: null,
            allowedIps: [],
            allowedRoles: [],
        };
    }

    return {
        global: config.global,
        dashboard: config.dashboard,
        activePages: config.activePages,
        reason: config.reason,
        scheduledStart: config.scheduledStart,
        scheduledEnd: config.scheduledEnd,
        allowedIps: config.allowedIps,
        allowedRoles: config.allowedRoles,
    };
}

export async function updateMaintenanceStatus(data: Partial<MaintenanceStatus>): Promise<MaintenanceStatus> {
    const config = await prisma.maintenance.upsert({
        where: { id: DEFAULT_CONFIG_ID },
        create: {
            id: DEFAULT_CONFIG_ID,
            global: data.global ?? false,
            dashboard: data.dashboard ?? false,
            activePages: data.activePages ?? [],
            reason: data.reason ?? null,
            scheduledStart: data.scheduledStart ?? null,
            scheduledEnd: data.scheduledEnd ?? null,
            allowedIps: data.allowedIps ?? [],
            allowedRoles: data.allowedRoles ?? [],
        },
        update: {
            ...data,
        },
    });

    return {
        global: config.global,
        dashboard: config.dashboard,
        activePages: config.activePages,
        reason: config.reason,
        scheduledStart: config.scheduledStart,
        scheduledEnd: config.scheduledEnd,
        allowedIps: config.allowedIps,
        allowedRoles: config.allowedRoles,
    };
}

export function isMaintenanceActive(status: MaintenanceStatus, path: string, isDashboard: boolean, userIp?: string, userRole?: string, hasMaintenanceAccess?: boolean): boolean {
    // 1. Check Permissions Bypass
    if (hasMaintenanceAccess) return false;

    // 2. Check Whitelists
    if (userIp && status.allowedIps.includes(userIp)) return false;
    if (userRole && status.allowedRoles.includes(userRole)) return false;

    // 3. Check Scheduled Maintenance
    const now = new Date();
    const isScheduled = status.scheduledStart && status.scheduledEnd && now >= status.scheduledStart && now <= status.scheduledEnd;

    // 4. Determine Active State
    let active = status.global || isScheduled;
    if (isDashboard && status.dashboard) active = true;

    // 5. Check Page Specific Exceptions (if active)
    if (active) {
        // If maintenance IS active, check if current page is allowed (activePages is a WHITELIST of allowed pages during maintenance, wait...)
        // Actually, looking at original code: `if (status.activePages.includes(path)) return true;`
        // Wait, the original code logic was weird: `if (status.activePages.includes(path)) return true;` -> This means activePages were "Pages in Maintenance", NOT "Allowed Pages".
        // BUT usually activePages means "Allowed pages". Let's re-read the original View.
        // View says: "Pages Spécifiques". "Gérez l'accès au site".
        // Code: `if (status.activePages.includes(path)) return true;` -> If path is in activePages, maintenance IS active for it?
        // Let's assume activePages in the NEW design should be a WHITELIST (Pages ALLOWED during maintenance).
        // OR we stick to the old logic where `activePages` defined specific pages that are DOWN.
        // The prompt says "whitelist pages". So I will implement it as a WHITELIST.
        // Meaning: If maintenance is active, BUT path is in activePages, then return FALSE (not active for this page).

        if (status.activePages.includes(path)) return false; // ALLOWED page

        return true; // Maintenance IS active and page is NOT allowed
    }

    return false;
}
