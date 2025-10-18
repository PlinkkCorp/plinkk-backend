// themeConfig.js (stub)
// The authoritative list of built-in themes now lives on the server side
// (src/server/builtInThemes.ts) and the client must fetch it via the
// `/api/themes/list` API. Keep a minimal export here to avoid breaking any
// direct imports that might remain in older code.
export const themes = [];

try {
    if (typeof window !== 'undefined') {
        // legacy updater: attempts to forward update requests to the current
        // injected theme index stored on window. This is best-effort and may
        // be removed later.
        window.__PLINKK_UPDATE_INJECTED_THEME__ = function (newTheme) {
            try {
                const idx = window.__PLINKK_INJECTED_THEME_INDEX__;
                if (typeof idx === 'number' && idx >= 0 && idx < themes.length) {
                    themes[idx] = Object.assign({}, themes[idx], newTheme);
                    window.__PLINKK_INJECTED_THEME__ = themes[idx];
                    try { const ev = new CustomEvent('plinkk:theme-updated', { detail: { index: idx, theme: themes[idx] } }); window.dispatchEvent(ev); } catch (e) {}
                    return themes[idx];
                }
                return null;
            } catch (e) { return null; }
        };
    }
} catch (e) {}

