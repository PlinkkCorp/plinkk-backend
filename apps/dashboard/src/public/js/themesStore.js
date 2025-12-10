export async function loadThemes(userId) {
    try {
        const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        const res = await fetch(`/themes.json${qs}`, { cache: 'no-store' });
        if (!res.ok) return { builtIns: [], theme: [] };
        const payload = await res.json();

        return payload;
    } catch (e) {
        return { builtIns: [], theme: [] };
    }
}

export default { loadThemes };
