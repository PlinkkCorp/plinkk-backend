import { prisma } from '@plinkk/prisma';

export interface MaintenanceStatus {
    global: boolean;
    dashboard: boolean;
    activePages: string[];
    maintenancePages: string[];
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
            maintenancePages: [],
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
        maintenancePages: config.maintenancePages,
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
            maintenancePages: data.maintenancePages ?? [],
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
        maintenancePages: config.maintenancePages,
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

    // 4. Determine Global Active State
    let globalActive = status.global || isScheduled;
    if (isDashboard && status.dashboard) globalActive = true;

    // 5. Logic
    if (globalActive) {
        // Global Maintenance Triggered.
        // Check Exceptions (Allowlist / activePages)
        // activePages SHOULD be a list of paths that are STILL accessible during maintenance.
        if (status.activePages.includes(path)) return false; // Allowed -> Not Maintenance

        return true; // Maintenance Active
    } else {
        // Global Maintenance OFF.
        // Check Specific Blocks (Blocklist / maintenancePages)
        if (status.maintenancePages && status.maintenancePages.includes(path)) return true; // Blocked -> Maintenance Active

        return false;
    }
}
