
import { prisma, Plinkk, User } from "@plinkk/prisma";
import { isUserPremium } from "@plinkk/shared";

const MAX_VERSIONS_FREE = 5;
const MAX_VERSIONS_PREMIUM = 50;
const MAX_MANUAL_BACKUPS = 10; // Separate limit for manual backups

export interface Change {
    key: string;
    old?: any;
    new?: any;
    type?: 'added' | 'removed' | 'updated' | 'reordered';
}

/**
 * Creates a new version (snapshot) of the Plinkk configuration.
 * Should be called AFTER a successful update.
 */
export async function createPlinkkVersion(
    plinkkId: string,
    userId: string,
    label?: string,
    isManual: boolean = false,
    changes: (string | Change)[] = [] // New parameter for detailed changes
) {
    try {
        // 1. Fetch complete current state
        const [
            plinkk,
            settings,
            background,
            neonColors,
            labels,
            socialIcons,
            statusbar,
            links,
            categories,
            user
        ] = await Promise.all([
            prisma.plinkk.findUnique({ where: { id: plinkkId } }),
            prisma.plinkkSettings.findUnique({ where: { plinkkId } }),
            prisma.backgroundColor.findMany({ where: { plinkkId, userId } }),
            prisma.neonColor.findMany({ where: { plinkkId, userId } }),
            prisma.label.findMany({ where: { plinkkId, userId } }),
            prisma.socialIcon.findMany({ where: { plinkkId, userId } }),
            prisma.plinkkStatusbar.findUnique({ where: { plinkkId } }),
            prisma.link.findMany({ where: { plinkkId, userId } }),
            prisma.category.findMany({ where: { plinkkId }, orderBy: { order: "asc" } }),
            prisma.user.findUnique({ where: { id: userId }, include: { role: true } }) // Need user to check premium
        ]);

        if (!plinkk || !user) return;

        // 2. Build Snapshot Object
        const snapshot = {
            meta: {
                timestamp: new Date().toISOString(),
                changes: changes // Store changes here
            },
            plinkk: {
                name: plinkk.name,
                slug: plinkk.slug,
                isDefault: plinkk.isDefault,
                isPublic: plinkk.isPublic,
                visibility: plinkk.visibility,
            },
            settings,
            background,
            neonColors,
            labels,
            socialIcons,
            statusbar,
            links,
            categories
        };

        // 3. Create Version
        // Create new version
        // We repurpose 'label' to store "Manual Backup: <name>" if manual, or just the label.
        // Ideally we should have a 'type' field in PlinkkVersion but for now we can infer or add it.
        // Let's rely on label prefix or adding a metadata field if schema allows.
        // Checking schema... PlinkkVersion usually has id, plinkkId, snapshot, createdAt, label.
        // We will preserve the label as passed.

        const changeLabel = isManual ? `[BACKUP] ${label}` : label;

        const limit = isUserPremium(user) ? MAX_VERSIONS_PREMIUM : MAX_VERSIONS_FREE;
        const maxManual = MAX_MANUAL_BACKUPS;

        const allVersions = await prisma.plinkkVersion.findMany({
            where: { plinkkId },
            orderBy: { createdAt: "desc" },
            select: { id: true, label: true }
        });

        const manualVersions = allVersions.filter(v => v.label && v.label.startsWith("[BACKUP]"));
        const autoVersions = allVersions.filter(v => !v.label || !v.label.startsWith("[BACKUP]"));

        if (isManual) {
            if (manualVersions.length >= maxManual) { // Use >= to delete if at limit
                const toDelete = manualVersions.slice(maxManual - 1); // Keep 'maxManual - 1' versions, delete the rest
                if (toDelete.length > 0) {
                    await prisma.plinkkVersion.deleteMany({ where: { id: { in: toDelete.map(v => v.id) } } });
                }
            }
        } else {
            if (autoVersions.length >= limit) { // Use >= to delete if at limit
                const toDelete = autoVersions.slice(limit - 1); // Keep 'limit - 1' versions, delete the rest
                if (toDelete.length > 0) {
                    await prisma.plinkkVersion.deleteMany({ where: { id: { in: toDelete.map(v => v.id) } } });
                }
            }
        }

        await prisma.plinkkVersion.create({
            data: {
                plinkkId,
                snapshot: snapshot as any, // Store the full snapshot
                label: changeLabel,
            }
        });

    } catch (error) {
        console.error("Failed to create plinkk version snapshot", error);
        // Silent fail to not block main flow?
    }
}

/**
 * Restores a version by overwriting current data with snapshot data.
 */
export async function restorePlinkkVersion(plinkkId: string, versionId: string, userId: string) {
    const version = await prisma.plinkkVersion.findUnique({
        where: { id: versionId },
    });

    if (!version || version.plinkkId !== plinkkId) {
        throw new Error("Version not found");
    }

    const snapshot = version.snapshot as any;
    if (!snapshot) throw new Error("Corrupted snapshot");

    // Transaction to atomic restore
    await prisma.$transaction(async (tx) => {
        // 1. Restore Plinkk basics
        if (snapshot.plinkk) {
            await tx.plinkk.update({
                where: { id: plinkkId },
                data: {
                    name: snapshot.plinkk.name,
                    // Don't restore slug/isDefault blindly as it might conflict or break routing logic?
                    // User requested "restore", usually implies complete state.
                    // But slug changes are dangerous. Let's restore safe props.
                    isPublic: snapshot.plinkk.isPublic,
                    visibility: snapshot.plinkk.visibility
                }
            });
        }

        // 2. Restore Settings
        if (snapshot.settings) {
            // Remove ID/relation fields AND removed Bento fields from data
            const {
                id,
                plinkkId: _pid,
                // @ts-ignore - removed fields might still be in snapshots
                layoutMode: _lm,
                ...rest
            } = snapshot.settings;

            await tx.plinkkSettings.upsert({
                where: { plinkkId },
                create: { plinkkId, ...rest },
                update: { ...rest }
            });
        }

        // 3. Restore Background
        await tx.backgroundColor.deleteMany({ where: { plinkkId } });
        if (snapshot.background?.length) {
            await tx.backgroundColor.createMany({
                data: snapshot.background.map((b: any) => ({
                    color: b.color,
                    userId,
                    plinkkId
                }))
            });
        }

        // 4. Restore Neon
        await tx.neonColor.deleteMany({ where: { plinkkId } });
        if (snapshot.neonColors?.length) {
            await tx.neonColor.createMany({
                data: snapshot.neonColors.map((n: any) => ({
                    color: n.color,
                    userId,
                    plinkkId
                }))
            });
        }

        // 5. Restore Labels
        await tx.label.deleteMany({ where: { plinkkId } });
        if (snapshot.labels?.length) {
            await tx.label.createMany({
                data: snapshot.labels.map((l: any) => ({
                    data: l.data,
                    color: l.color,
                    fontColor: l.fontColor,
                    userId,
                    plinkkId
                }))
            });
        }

        // 6. Restore Socials
        await tx.socialIcon.deleteMany({ where: { plinkkId } });
        if (snapshot.socialIcons?.length) {
            await tx.socialIcon.createMany({
                data: snapshot.socialIcons.map((s: any) => ({
                    url: s.url,
                    icon: s.icon,
                    userId,
                    plinkkId
                }))
            });
        }

        // 7. Restore Statusbar
        if (snapshot.statusbar) {
            const { id, plinkkId: _pid, userId: _uid, ...rest } = snapshot.statusbar;
            await tx.plinkkStatusbar.upsert({
                where: { plinkkId },
                create: { plinkkId, ...rest },
                update: { ...rest }
            });
        } else {
            await tx.plinkkStatusbar.deleteMany({ where: { plinkkId } });
        }

        // 8. Restore Categories
        await tx.category.deleteMany({ where: { plinkkId } });
        // Map old IDs to new IDs to keep Link relations?
        // This is tricky. Links reference categoryId.
        // If we delete categories, we must recreate them AND update links to point to new IDs.
        // OR we restore categories first, get new IDs, then restore links mapping old_cat_id -> new_cat_id.

        const catMap = new Map<string, string>(); // OldID -> NewID
        if (snapshot.categories?.length) {
            for (const cat of snapshot.categories) {
                const newCat = await tx.category.create({
                    data: {
                        name: cat.name,
                        order: cat.order,
                        plinkkId,
                        // If we want to preserve IDs, we can't because they are usually autogenerated nanoids. 
                        // But if prisma schema allows setting ID (default is nanoid), we *could* try to reuse ID if it doesn't exist?
                        // Safer to generate new IDs.
                    }
                });
                catMap.set(cat.id, newCat.id);
            }
        }

        // 9. Restore Links
        await tx.link.deleteMany({ where: { plinkkId } });
        if (snapshot.links?.length) {
            await tx.link.createMany({
                data: snapshot.links.map((l: any) => ({
                    icon: l.icon,
                    url: l.url,
                    text: l.text,
                    name: l.name,
                    description: l.description,
                    showDescriptionOnHover: l.showDescriptionOnHover,
                    showDescription: l.showDescription,
                    categoryId: l.categoryId ? catMap.get(l.categoryId) : null,
                    userId,
                    plinkkId,
                    // Premium scheduled?
                    scheduledAt: l.scheduledAt,
                    expiresAt: l.expiresAt,
                }))
            });
        }

    });
}
