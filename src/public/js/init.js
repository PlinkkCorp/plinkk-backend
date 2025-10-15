import { createToggleThemeButton, applyAnimation, applyAnimationButton, applyDynamicStyles, applyFirstTheme } from './styleTools.js';
import { createProfileContainer, createUserName, createStatusBar, createLabelButtons, createIconList, createEmailAndDescription, createLinkBoxes } from './tools.js';
import { initEasterEggs } from './easterEggs.js';
// profileData/injectedTheme seront importés dynamiquement par page
import { loadThemes } from './themesStore.js';
// We'll load built-ins + community themes from the server. We first handle
// injectedTheme (exported by profileConfig) then append the built-ins/themes
// returned by the API so indices remain stable.
// Start with an empty themes array; it will be populated below.
export const themes = [];
// Start loading themes immediately and expose a promise to await completion.
export const themesLoaded = (async () => {
    try {
        const payload = await loadThemes();
        if (payload && Array.isArray(payload.builtIns) && payload.builtIns.length) {
            // Copy built-ins into themes (they will be appended after injected)
            payload.builtIns.forEach(t => themes.push(t));
        }
        if (payload && Array.isArray(payload.themes) && payload.themes.length) {
            // community/mine themes appended after built-ins
            payload.themes.forEach(t => themes.push(t));
        }
    } catch (e) {
        // ignore
    }
})();
import { animations, styleSheet } from '../config/animationConfig.js';
import { canvaData } from '../config/canvaConfig.js';
document.addEventListener("DOMContentLoaded", async function () {
    var _a, _b;
    // Résoudre username/slug depuis les globals fournis par la vue
    const username = (window.__PLINKK_USERNAME__ || (location.pathname.split('/').filter(Boolean)[0] || '')).trim();
    const identifier = (window.__PLINKK_IDENTIFIER__ || (location.pathname.split('/').filter(Boolean)[1] || '')).trim();
    const params = new URLSearchParams(location.search);
    if (identifier) params.set('slug', identifier);
    // Importer la config de la page (non-cachée côté serveur)
    const mod = await import(`/${encodeURIComponent(identifier)}/config.js`);
    const profileData = mod.profileData;
    const injectedTheme = mod.injectedTheme;
    let parsedProfileData = profileData;
    if (typeof profileData === 'string') {
        try {
            parsedProfileData = JSON.parse(profileData);
        }
        catch (e) {
            console.error("Invalid JSON data:", e);
            return;
        }
    }
    // validateProfileConfig(parsedProfileData); // Uncomment if you have a validation function
    if (!parsedProfileData || typeof parsedProfileData !== 'object') {
        console.error("profileData is not defined or is not an object.");
        return;
    }
    // Expose parsedProfileData as a global to support modules that access
    // profileData indirectly (e.g. styleTools.js) and to avoid issues from
    // circular imports. Use a namespaced property to avoid collisions.
    try {
        window.profileData = parsedProfileData;
        window.__PLINKK_PROFILE_DATA__ = parsedProfileData;
    }
    catch (e) {
        // ignore if window is not writable for some reason
    }
    const article = document.getElementById("profile-article");
    if (!article) {
        console.error("Element with id 'profile-article' not found.");
        return;
    }
    article.appendChild(createProfileContainer(profileData));
    article.appendChild(createUserName(profileData));
    createStatusBar(profileData);
    createLabelButtons(profileData);
    createIconList(profileData);
    article.appendChild(createEmailAndDescription(profileData));
    // Wait for themes to be loaded (built-ins + community). This ensures
    // selectedThemeIndex refers to the final ordering and that applyFirstTheme
    // receives a real theme object.
    try {
        await themesLoaded;
    } catch (_) { }

    // If the server exported an injectedTheme in profileConfig.js, insert it
    // into the themes array (avoid duplicates) and update selectedThemeIndex if needed.
    try {
        if (injectedTheme && typeof injectedTheme === 'object') {
            // Avoid duplicates by shallow compare
            const same = (a, b) => a && b && a.background === b.background && a.buttonBackground === b.buttonBackground && a.textColor === b.textColor;
            const existing = themes.findIndex(t => same(t, injectedTheme));
            if (existing === -1) {
                // Place injected theme at the start so it has priority
                themes.unshift(injectedTheme);
                // If user previously selected a theme by index and it was >=0,
                // leave it as-is; injectedTheme becomes index 0.
                profileData.selectedThemeIndex = 0;
            } else {
                profileData.selectedThemeIndex = existing;
            }
        }
    } catch (e) { console.warn('injectedTheme handling failed', e); }

    // Ensure selectedThemeIndex is a valid integer and within the available range
    try {
        let idx = Number(profileData.selectedThemeIndex);
        if (!Number.isFinite(idx) || isNaN(idx)) idx = 0;
        if (!Array.isArray(themes) || themes.length === 0) {
            idx = 0;
        } else {
            // Normalize to [0 .. themes.length-1]
            idx = ((Math.floor(idx) % themes.length) + themes.length) % themes.length;
        }
        profileData.selectedThemeIndex = idx;
    } catch (e) {
        profileData.selectedThemeIndex = 0;
    }
    if (!themes || !themes.length) {
        console.warn("Themes array is empty or not defined.");
    }
    else {
        createToggleThemeButton(themes[profileData.selectedThemeIndex % themes.length]);
    }
    const linkBoxes = createLinkBoxes(profileData);
    if (!linkBoxes || !linkBoxes.length) {
        console.warn("No link boxes created.");
    }
    else {
        linkBoxes.forEach((box) => article.appendChild(box));
    }
    document.title = profileData.userName ? `${profileData.userName} - Linktree` : "Plinkk By Klaynight";
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = profileData.iconUrl;
    if (!profileData.iconUrl) {
        console.warn("Icon URL is not defined.");
    }
    document.head.appendChild(link);
    // N'ajoute pas le footer en mode aperçu (?preview=1)
    const isPreview = new URLSearchParams(window.location.search).get('preview') === '1';
    if (!isPreview) {
        const footer = document.createElement("footer");
        const themeIndex = profileData.selectedThemeIndex % themes.length;
        footer.innerHTML = `Design with ❤️ by <a href="http://plinkk.fr" target="_blank" rel="noopener noreferrer"><p style="color:${((_a = themes[themeIndex]) === null || _a === void 0 ? void 0 : _a.buttonTextColor) || 'defaultColor'};display:inline;padding:2px 2px 2px 4px;border-radius:5px;background-color:${((_b = themes[themeIndex]) === null || _b === void 0 ? void 0 : _b.buttonBackground) || 'defaultColor'};">PlinkkCorp©</p></a>`;
        footer.style.zIndex = "9999";
        document.body.appendChild(footer);
    }
    initEasterEggs();

    // Réagir aux modifications externes du thème injecté (console / bookmarklet)
    try {
        window.addEventListener('plinkk:theme-updated', (ev) => {
            try {
                const detail = ev && ev.detail ? ev.detail : null;
                const idx = detail && typeof detail.index === 'number' ? detail.index : window.__PLINKK_INJECTED_THEME_INDEX__;
                const theme = (typeof idx === 'number') ? themes[idx % themes.length] : (window.__PLINKK_INJECTED_THEME__ || null);
                if (theme) {
                    // Recréation du bouton si nécessaire
                    try { createToggleThemeButton(theme); } catch (e) { }
                    try { applyFirstTheme(theme); } catch (e) { }
                }
            } catch (e) { }
        });
    } catch (e) { }
    // Désactiver le néon globalement (override temporaire)
    try { profileData.neonEnable = 0; } catch(_) {}
    if (!animations || !animations.length) {
        console.warn("Animations array is empty or not defined.");
    }
    else {
        applyDynamicStyles(profileData, styleSheet, profileData.selectedAnimationBackgroundIndex % animations.length, !!profileData.EnableAnimationBackground, profileData.animationDurationBackground, !!profileData.canvaEnable, profileData.selectedCanvasIndex % canvaData.length);
        applyFirstTheme(themes[profileData.selectedThemeIndex % themes.length]);
        applyAnimation(animations[profileData.selectedAnimationIndex % animations.length], !!profileData.EnableAnimationArticle);
        applyAnimationButton(animations[profileData.selectedAnimationButtonIndex % animations.length], !!profileData.EnableAnimationButton, profileData.delayAnimationButton);
    }
});
