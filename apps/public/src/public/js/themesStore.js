// Load themes from the server (built-ins + community + mine) via /api/themes/list
// Exports a promise-based API so other modules can await the list.
export async function loadThemes(userId) {
    try {
        const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        const res = await fetch(`/themes.json${qs}`, { cache: 'no-store' });
        if (!res.ok) return { builtIns: [], theme: [] };
        const payload = await res.json();
        // payload: { builtIns: [...], theme: [...] }
        return payload;
    } catch (e) {
        return { builtIns: [], theme: [] };
    }
}

export default { loadThemes };
