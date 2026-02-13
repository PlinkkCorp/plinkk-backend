type Change<T> = {
    old: T | undefined;
    new: T | undefined;
};

type ObjectDiff = Record<string, Change<any>>;

type ArrayDiff<T> = {
    added: T[];
    removed: T[];
    updated: {
        id: string;
        changes: ObjectDiff;
    }[];
    reordered: boolean;
};

function isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key) || !isEqual(a[key], b[key])) return false;
    }

    return true;
}

/**
 * Calculates the difference between two objects.
 * Returns a map of field names to { old, new } values.
 */
export function calculateObjectDiff<T extends Record<string, any>>(
    oldObj: T,
    newObj: T,
    ignoredFields: string[] = []
): ObjectDiff {
    const diff: ObjectDiff = {};
    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

    for (const key of allKeys) {
        if (ignoredFields.includes(key)) continue;

        const oldValue = oldObj ? oldObj[key] : undefined;
        const newValue = newObj ? newObj[key] : undefined;

        // Custom equality check for Dates
        if (oldValue instanceof Date && newValue instanceof Date) {
            if (oldValue.getTime() === newValue.getTime()) continue;
        } else if (oldValue instanceof Date && typeof newValue === 'string') {
            // Try to compare date strings if one is a string (e.g. from JSON payload)
            if (oldValue.toISOString() === newValue) continue;
            if (new Date(newValue).getTime() === oldValue.getTime()) continue;
        }

        if (!isEqual(oldValue, newValue)) {
            diff[key] = {
                old: oldValue,
                new: newValue,
            };
        }
    }

    return diff;
}

/**
 * Calculates the difference between two arrays of objects.
 * Assumes objects have a unique identifier (default "id").
 */
export function calculateArrayDiff<T extends Record<string, any>>(
    oldArr: T[],
    newArr: T[],
    idKey: string = "id",
    ignoredFields: string[] = []
): ArrayDiff<T> {
    const oldMap = new Map(oldArr.map((item) => [item[idKey], item]));
    const newMap = new Map(newArr.map((item) => [item[idKey], item]));

    const added: T[] = [];
    const removed: T[] = [];
    const updated: { id: string; changes: ObjectDiff }[] = [];

    // Identify added and updated items
    for (const newItem of newArr) {
        const id = newItem[idKey];
        const oldItem = oldMap.get(id);

        if (!oldItem) {
            added.push(newItem);
        } else {
            const changes = calculateObjectDiff(oldItem, newItem, ignoredFields);
            if (Object.keys(changes).length > 0) {
                updated.push({ id, changes });
            }
        }
    }

    // Identify removed items
    for (const oldItem of oldArr) {
        const id = oldItem[idKey];
        if (!newMap.has(id)) {
            removed.push(oldItem);
        }
    }

    // Check for reordering
    // We only check reordering if the set of IDs is roughly the same (ignoring adds/removes for simplicity, 
    // or checks if the sequence of common IDs changed).
    // A simple check: get IDs of items present in both. matching request?
    const oldCommonIds = oldArr.map(x => x[idKey]).filter(id => newMap.has(id));
    const newCommonIds = newArr.map(x => x[idKey]).filter(id => oldMap.has(id));

    const reordered = !isEqual(oldCommonIds, newCommonIds);

    return {
        added,
        removed,
        updated,
        reordered,
    };
}
