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
        const payload = await loadThemes((window.__PLINKK_IDENTIFIER__ || (location.pathname.split('/').filter(Boolean)[1] || '')).trim());
        if (payload && Array.isArray(payload.builtIns) && payload.builtIns.length) {
            // Copy built-ins into themes (they will be appended after injected)
            payload.builtIns.forEach(t => themes.push(t));
        }
        if (payload && Array.isArray(payload.theme) && payload.theme.length) {
            // community/mine themes appended after built-ins
            payload.theme.forEach(t => themes.push(t));
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
    if (identifier) {
        params.set('username', identifier);
    } else if (username) {
        params.set('username', username);
    }
    // Importer la config de la page (non-cachée côté serveur)
    const mod = await import(`/config.js?${params}`);
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
    // Expose parsedProfileData as a global
    try {
        window.profileData = parsedProfileData;
        window.__PLINKK_PROFILE_DATA__ = parsedProfileData;
    }
    catch (e) { }

    const article = document.getElementById("profile-article");
    if (!article) return;

    // Clear skeleton loading if present
    const skeleton = document.getElementById('skeleton-loading');
    if (skeleton) skeleton.remove();

    async function renderPlinkk(profileData) {
        // Clear existing content except for essential elements if needed
        article.innerHTML = '';

        // Rendu des sections selon l'ordre choisi (layoutOrder) si présent
        try {
            const DEFAULT_LAYOUT = ['profile', 'username', 'statusbar', 'labels', 'social', 'email', 'links'];
            let order = Array.isArray(profileData.layoutOrder) ? profileData.layoutOrder.slice() : DEFAULT_LAYOUT;
            const KNOWN = new Set(DEFAULT_LAYOUT);
            // Normaliser: garder seulement les connus puis ajouter les manquants dans l'ordre par défaut
            const filtered = order.filter(k => KNOWN.has(k));
            DEFAULT_LAYOUT.forEach(k => { if (!filtered.includes(k)) filtered.push(k); });
            const renderers = {
                profile: () => article.appendChild(createProfileContainer(profileData)),
                username: () => article.appendChild(createUserName(profileData)),
                statusbar: () => createStatusBar(profileData),
                labels: () => createLabelButtons(profileData),
                social: () => createIconList(profileData),
                email: () => article.appendChild(createEmailAndDescription(profileData)),
                links: () => {
                    const linkBoxes = createLinkBoxes(profileData);
                    if (linkBoxes && linkBoxes.length) {
                        linkBoxes.forEach((box) => article.appendChild(box));
                    }
                },
            };
            filtered.forEach(key => { try { renderers[key] && renderers[key](); } catch (e) { /* ignore */ } });
        } catch (e) {
            // Fallback: ordre historique
            article.appendChild(createProfileContainer(profileData));
            article.appendChild(createUserName(profileData));
            createStatusBar(profileData);
            createLabelButtons(profileData);
            createIconList(profileData);
            article.appendChild(createEmailAndDescription(profileData));
        }

        // Wait for themes
        try { await themesLoaded; } catch (_) { }

        // Theme handling
        try {
            if (injectedTheme && typeof injectedTheme === 'object') {
                const same = (a, b) => a && b && a.background === b.background && a.buttonBackground === b.buttonBackground && a.textColor === b.textColor;
                const existing = themes.findIndex(t => same(t, injectedTheme));
                if (existing === -1) {
                    themes.unshift(injectedTheme);
                    profileData.selectedThemeIndex = 0;
                } else {
                    profileData.selectedThemeIndex = existing;
                }
            }
        } catch (e) { }

        // Ensure valid index
        try {
            let idx = parseInt(profileData.selectedThemeIndex) || 0;
            if (themes.length > 0) {
                idx = ((idx % themes.length) + themes.length) % themes.length;
            }
            profileData.selectedThemeIndex = idx;
        } catch (e) { profileData.selectedThemeIndex = 0; }

        if (themes.length > 0) {
            createToggleThemeButton(themes[profileData.selectedThemeIndex % themes.length]);
        }

        document.title = profileData.userName ? `${profileData.userName} - Plinkk` : "Plinkk By Klaynight";

        // Final styles/animations
        if (animations && animations.length) {
            applyDynamicStyles(profileData, styleSheet, profileData.selectedAnimationBackgroundIndex % animations.length, !!profileData.EnableAnimationBackground, profileData.animationDurationBackground, !!profileData.canvaEnable, profileData.selectedCanvasIndex % canvaData.length);
            applyFirstTheme(themes[profileData.selectedThemeIndex % themes.length]);
            applyAnimation(animations[profileData.selectedAnimationIndex % animations.length], !!profileData.EnableAnimationArticle);
            applyAnimationButton(animations[profileData.selectedAnimationButtonIndex % animations.length], !!profileData.EnableAnimationButton, profileData.delayAnimationButton);
        }
    }

    // Initial render
    await renderPlinkk(parsedProfileData);

    // Live preview sync listener
    window.addEventListener('message', async (event) => {
        if (event.data && event.data.type === 'plinkk:sync-config') {
            console.log('[Plinkk] Syncing configuration...', event.data.config);
            const newConfig = event.data.config;
            window.profileData = newConfig;
            window.__PLINKK_PROFILE_DATA__ = newConfig;
            await renderPlinkk(newConfig);
        }
    });
});
