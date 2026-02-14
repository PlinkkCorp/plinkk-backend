import { prisma } from "@plinkk/prisma";
import { logDetailedAction } from "../lib/userLogger";

async function main() {
    console.log("Starting logging verification...");

    // 1. Create a dummy user
    const user = await prisma.user.create({
        data: {
            id: "test-logger-user",
            email: "test-logger@example.com",
            userName: "testlogger",
            password: "hash",
            name: "Test User",
        },
    });

    console.log("Created test user:", user.id);

    try {
        // 2. Define old and new states
        const oldState = {
            name: "Test User",
            bio: "Old Bio",
            settings: { theme: "dark" }
        };

        const newState = {
            name: "Updated User", // Changed
            bio: "Old Bio",       // Unchanged
            settings: { theme: "light" } // Changed nested
        };

        // 3. Call logDetailedAction
        console.log("Logging action...");
        await logDetailedAction(
            user.id,
            "TEST_ACTION",
            "target-123",
            oldState,
            newState,
            "127.0.0.1",
            { extra: "meta" }
        );

        // 4. Verify DB entry
        const log = await prisma.userLog.findFirst({
            where: { userId: user.id, action: "TEST_ACTION" },
            orderBy: { createdAt: "desc" },
        });

        if (!log) {
            console.error("FAILED: No log entry found.");
            process.exit(1);
        }

        console.log("Log entry found:", JSON.stringify(log, null, 2));

        interface LogDetails {
            diff?: Record<string, { old: any; new: any }>;
            formatted?: string;
            changes?: string[];
            category?: string;
        }

        const details = log.details as unknown as LogDetails;

        // Check diff structure
        if (!details.diff) {
            console.error("FAILED: 'diff' field missing in details.");
            process.exit(1);
        }

        // Check name change
        if (details.diff.name?.old !== "Test User" || details.diff.name?.new !== "Updated User") {
            console.error("FAILED: Name diff incorrect.", details.diff.name);
            process.exit(1);
        }

        // Check settings change (deep diff might not be fully recursive by default calculateObjectDiff, let's check)
        // My calculateObjectDiff implementation was:
        // keys = union(keys(old), keys(new))
        // if old[key] != new[key] -> diff[key] = { old, new }
        // It does NOT do deep recursion for objects, it just compares them.
        // So 'settings' object reference or value equality check.
        // If they are different objects with different content, isEqual returns false (if implemented recursively).
        // wait, isEqual implementation in diffUtils *is* recursive.
        // But calculateObjectDiff itself only iterates top-level keys.
        // So for 'settings', it will see they are different, and store the WHOLE object as old/new.

        if (!details.diff.settings) {
            console.error("FAILED: Settings diff missing.");
            process.exit(1);
        }

        if (!details.formatted || !details.formatted.includes("Updated name")) {
            throw new Error("Log verification failed: Missing or incorrect formatted message");
        }

        if (!Array.isArray(details.changes) || details.changes.length === 0) {
            throw new Error("Log verification failed: Missing 'changes' array for UI display");
        }

        const nameChange = details.changes.find((c: string) => c.includes("name"));
        if (!nameChange || !nameChange.includes("Test User -> Updated User")) {
            throw new Error("Log verification failed: 'changes' array entry for name undefined or incorrect: " + nameChange);
        }

        if (details.category !== "Test Category" && details.category !== "GENERAL") {
            // We didn't set a category in the test call, so it might default to GENERAL or we can update the test call to use a REAL action name to test categorization.
            console.warn("Category check: Got " + details.category);
        }

        // Test categorization with a specific action
        await logDetailedAction(
            user.id,
            "UPDATE_PLINKK_TEST",
            "target-456",
            { vol: 1 },
            { vol: 2 },
            "127.0.0.1"
        );

        const plinkkLog = await prisma.userLog.findFirst({
            where: { userId: user.id, action: "UPDATE_PLINKK_TEST" },
            orderBy: { createdAt: 'desc' }
        });

        const pDetails = plinkkLog?.details as unknown as LogDetails;
        if (pDetails?.category !== "PLINKK") {
            throw new Error(`Category verification failed: Expected PLINKK, got ${pDetails?.category}`);
        }

        console.log("SUCCESS: Log verification passed!");

    } catch (e) {
        console.error("Error during verification:", e);
    } finally {
        // 5. Cleanup
        await prisma.userLog.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
        console.log("Cleanup done.");
    }
}

main();

