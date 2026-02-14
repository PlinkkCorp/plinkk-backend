import { prisma, Prisma } from "@plinkk/prisma";
import { isUserPremium } from "@plinkk/shared";

const SNAPSHOT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const FREE_VERSION_LIMIT = 5;

export interface PlinkkSnapshot {
    plinkk: {
        name: string;
        slug: string;
        visibility: "PUBLIC" | "PRIVATE";
        isActive: boolean;
    };
    settings: any;
    links: any[];
    categories: any[];
    labels: any[];
    socialIcons: any[];
    background: any[];
    neonColors: any[];
    statusbar: any;
}

/**
 * Captures a full state snapshot of a Plinkk.
 * If a snapshot was created recently (within cooldown), it updates the existing one.
 */
export async function captureSnapshot(plinkkId: string, label?: string) {
    const plinkk = await prisma.plinkk.findUnique({
        where: { id: plinkkId },
        include: {
            settings: true,
            links: { orderBy: { id: "asc" } },
            categories: { orderBy: { order: "asc" } },
            labels: true,
            socialIcons: true,
            background: true,
            neonColors: true,
            statusbar: true,
            user: { include: { role: true } },
        },
    });

    if (!plinkk) return;

    const snapshot: PlinkkSnapshot = {
        plinkk: {
            name: plinkk.name,
            slug: plinkk.slug,
            visibility: plinkk.visibility,
            isActive: plinkk.isActive,
        },
        settings: plinkk.settings ? { ...plinkk.settings, id: undefined, plinkkId: undefined } : null,
        links: plinkk.links.map(l => ({ ...l, userId: undefined, plinkkId: undefined, createdAt: undefined, updatedAt: undefined, clicks: undefined })),
        categories: plinkk.categories.map(c => ({ ...c, plinkkId: undefined, createdAt: undefined, updatedAt: undefined })),
        labels: plinkk.labels.map(l => ({ ...l, id: undefined, userId: undefined, plinkkId: undefined })),
        socialIcons: plinkk.socialIcons.map(s => ({ ...s, id: undefined, userId: undefined, plinkkId: undefined })),
        background: plinkk.background.map(b => ({ ...b, id: undefined, userId: undefined, plinkkId: undefined })),
        neonColors: plinkk.neonColors.map(n => ({ ...n, id: undefined, userId: undefined, plinkkId: undefined })),
        statusbar: plinkk.statusbar ? { ...plinkk.statusbar, id: undefined, plinkkId: undefined } : null,
    };

    // Check for recent version to avoid spamming
    const lastVersion = await prisma.plinkkVersion.findFirst({
        where: { plinkkId },
        orderBy: { createdAt: "desc" },
    });

    if (lastVersion && Date.now() - new Date(lastVersion.createdAt).getTime() < SNAPSHOT_COOLDOWN_MS) {
        // Update existing version
        return prisma.plinkkVersion.update({
            where: { id: lastVersion.id },
            data: {
                snapshot: snapshot as any,
                label: label || lastVersion.label,
            },
        });
    }

    // Create new version
    const newVersion = await prisma.plinkkVersion.create({
        data: {
            plinkkId,
            snapshot: snapshot as any,
            label,
        },
    });

    // Enforce limits for free users
    const isPremium = isUserPremium(plinkk.user);
    if (!isPremium) {
        const versions = await prisma.plinkkVersion.findMany({
            where: { plinkkId },
            orderBy: { createdAt: "desc" },
            select: { id: true },
        });

        if (versions.length > FREE_VERSION_LIMIT) {
            const toDelete = versions.slice(FREE_VERSION_LIMIT).map(v => v.id);
            await prisma.plinkkVersion.deleteMany({
                where: { id: { in: toDelete } },
            });
        }
    }

    return newVersion;
}

/**
 * Restores a Plinkk to a specific version state.
 */
export async function restoreVersion(plinkkId: string, versionId: string, userId: string) {
    const version = await prisma.plinkkVersion.findFirst({
        where: { id: versionId, plinkkId },
    });

    if (!version) throw new Error("Version not found");

    const snapshot = version.snapshot as unknown as PlinkkSnapshot;

    await prisma.$transaction(async (tx) => {
        // 1. Update base Plinkk
        await tx.plinkk.update({
            where: { id: plinkkId },
            data: {
                name: snapshot.plinkk.name,
                slug: snapshot.plinkk.slug,
                visibility: snapshot.plinkk.visibility,
                isActive: snapshot.plinkk.isActive,
            },
        });

        // 2. Update Settings
        if (snapshot.settings) {
            await tx.plinkkSettings.upsert({
                where: { plinkkId },
                create: { ...snapshot.settings, plinkkId },
                update: { ...snapshot.settings, plinkkId },
            });
        } else {
            await tx.plinkkSettings.deleteMany({ where: { plinkkId } });
        }

        // 3. Batch deletes for linked data
        await Promise.all([
            tx.plinkkStatusbar.deleteMany({ where: { plinkkId } }),
            tx.link.deleteMany({ where: { plinkkId } }),
            tx.category.deleteMany({ where: { plinkkId } }),
            tx.label.deleteMany({ where: { plinkkId } }),
            tx.socialIcon.deleteMany({ where: { plinkkId } }),
            tx.backgroundColor.deleteMany({ where: { plinkkId } }),
            tx.neonColor.deleteMany({ where: { plinkkId } }),
        ]);

        // 4. Restore Statusbar
        if (snapshot.statusbar) {
            await tx.plinkkStatusbar.create({
                data: { ...snapshot.statusbar, plinkkId },
            });
        }

        // 5. Restore Categories (and keep mapping for links)
        const categoryMapping = new Map<string, string>();
        if (snapshot.categories && snapshot.categories.length > 0) {
            for (const cat of snapshot.categories) {
                const originalId = cat.id; // Corrected: Cat will have an ID in the snapshot
                const { id, ...data } = cat;
                const created = await tx.category.create({
                    data: { ...data, plinkkId },
                });
                if (originalId) categoryMapping.set(originalId, created.id);
            }
        }

        // 6. Restore Links
        if (snapshot.links && snapshot.links.length > 0) {
            await tx.link.createMany({
                data: snapshot.links.map(l => {
                    const { id, categoryId, ...data } = l;
                    return {
                        ...data,
                        userId,
                        plinkkId,
                        categoryId: categoryId ? categoryMapping.get(categoryId) || null : null,
                    };
                }),
            });
        }

        // 7. Restore Simple Lists (createMany)
        if (snapshot.labels?.length > 0) {
            await tx.label.createMany({
                data: snapshot.labels.map(l => ({ ...l, userId, plinkkId })),
            });
        }
        if (snapshot.socialIcons?.length > 0) {
            await tx.socialIcon.createMany({
                data: snapshot.socialIcons.map(s => ({ ...s, userId, plinkkId })),
            });
        }
        if (snapshot.background?.length > 0) {
            await tx.backgroundColor.createMany({
                data: snapshot.background.map(b => ({ ...b, userId, plinkkId })),
            });
        }
        if (snapshot.neonColors?.length > 0) {
            await tx.neonColor.createMany({
                data: snapshot.neonColors.map(n => ({ ...n, userId, plinkkId })),
            });
        }
    });

    return { ok: true };
}
