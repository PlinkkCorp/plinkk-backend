// themesStore.js
// Load themes from the server (built-ins + community + mine) via /api/themes/list
// Exports a promise-based API so other modules can await the list.
export async function loadThemes(options = { userId: null }) {
    try {
        const qs = options.userId ? `?userId=${encodeURIComponent(options.userId)}` : '';
        const res = await fetch(`/api/themes/list${qs}`, { cache: 'no-store' });
        if (!res.ok) return { builtIns: [], themes: [] };
        const payload = await res.json();
        // payload: { builtIns: [...], themes: [...] }
        return payload;
    } catch (e) {
        return { builtIns: [], themes: [] };
    }
}

export default { loadThemes };
