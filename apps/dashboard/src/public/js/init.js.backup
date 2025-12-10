import { createToggleThemeButton, applyAnimation, applyAnimationButton, applyDynamicStyles, applyFirstTheme } from './styleTools.js';
import { createProfileContainer, createUserName, createStatusBar, createLabelButtons, createIconList, createEmailAndDescription, createLinkBoxes } from './tools.js';
import { initEasterEggs } from './easterEggs.js';
import { loadThemes } from './themesStore.js';

export const themes = [];
export const themesLoaded = (async () => {
    try {
        const payload = await loadThemes((window.__PLINKK_IDENTIFIER__ || (location.pathname.split('/').filter(Boolean)[1] || '')).trim());
        if (payload && Array.isArray(payload.builtIns) && payload.builtIns.length) {
            payload.builtIns.forEach(t => themes.push(t));
        }
        if (payload && Array.isArray(payload.theme) && payload.theme.length) {
            payload.theme.forEach(t => themes.push(t));
        }
    } catch (e) {/* ignore */}
})();
import { animations, styleSheet } from '../config/animationConfig.js';
import { canvaData } from '../config/canvaConfig.js';

document.addEventListener("DOMContentLoaded", async function () {
    var _a, _b;
    const username = (window.__PLINKK_USERNAME__ || (location.pathname.split('/').filter(Boolean)[0] || '')).trim();
    const identifier = (window.__PLINKK_IDENTIFIER__ || (location.pathname.split('/').filter(Boolean)[1] || '')).trim();
    const params = new URLSearchParams(location.search);
    if (identifier) params.set('username', identifier);
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
    // validateProfileConfig(parsedProfileData); // Decommenter pour désactiver la validation
    if (!parsedProfileData || typeof parsedProfileData !== 'object') {
        console.error("profileData is not defined or is not an object.");
        return;
    }

    try {
        window.profileData = parsedProfileData;
        window.__PLINKK_PROFILE_DATA__ = parsedProfileData;
    }
    catch (e) { /* ignore */ }
    const article = document.getElementById("profile-article");
    if (!article) {
        console.error("Element with id 'profile-article' not found.");
        return;
    }

    try {
        const DEFAULT_LAYOUT = ['profile','username','labels','social','email','links'];
        let order = Array.isArray(profileData.layoutOrder) ? profileData.layoutOrder.slice() : DEFAULT_LAYOUT;
        const KNOWN = new Set(DEFAULT_LAYOUT);
        const filtered = order.filter(k => KNOWN.has(k));
        DEFAULT_LAYOUT.forEach(k => { if (!filtered.includes(k)) filtered.push(k); });
        const renderers = {
            profile: () => article.appendChild(createProfileContainer(profileData)),
            username: () => article.appendChild(createUserName(profileData)),
            labels: () => createLabelButtons(profileData),
            social: () => createIconList(profileData),
            email: () => article.appendChild(createEmailAndDescription(profileData)),
            links: () => {
                const linkBoxes = createLinkBoxes(profileData);
                (linkBoxes || []).forEach((box) => article.appendChild(box));
            },
        };
        filtered.forEach(key => { try { renderers[key] && renderers[key](); } catch (e) { /* ignore */ } });
    } catch (e) {
        article.appendChild(createProfileContainer(profileData));
        article.appendChild(createUserName(profileData));
        createStatusBar(profileData);
        createLabelButtons(profileData);
        createIconList(profileData);
        article.appendChild(createEmailAndDescription(profileData));
    }

    try {
        await themesLoaded;
    } catch (_) { }


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
    } catch (e) { console.warn('injectedTheme handling failed', e); }

    try {
        let idx = Number(profileData.selectedThemeIndex);
        if (!Number.isFinite(idx) || isNaN(idx)) idx = 0;
        if (!Array.isArray(themes) || themes.length === 0) {
            idx = 0;
        } else {
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
    try {
        const hasLinksRendered = !!document.querySelector('#profile-article .discord-box, #profile-article .button');
        if (!hasLinksRendered) {
            const linkBoxes = createLinkBoxes(profileData);
            if (!linkBoxes || !linkBoxes.length) {
                console.warn("No link boxes created.");
            } else {
                linkBoxes.forEach((box) => article.appendChild(box));
            }
        }
    } catch (_) { }
    document.title = profileData.userName ? `${profileData.userName} - Plinkk` : "Plinkk By Klaynight";
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = profileData.iconUrl;
    if (!profileData.iconUrl) {
        console.warn("Icon URL is not defined.");
    }
    document.head.appendChild(link);
    const isPreview = new URLSearchParams(window.location.search).get('preview') === '1';
    if (!isPreview) {
        const footer = document.createElement("footer");
        const themeIndex = profileData.selectedThemeIndex % themes.length;
        footer.innerHTML = `Design with ❤️ by <a href="http://plinkk.fr" target="_blank" rel="noopener noreferrer"><p style="color:${((_a = themes[themeIndex]) === null || _a === void 0 ? void 0 : _a.buttonTextColor) || 'defaultColor'};display:inline;padding:2px 2px 2px 4px;border-radius:5px;background-color:${((_b = themes[themeIndex]) === null || _b === void 0 ? void 0 : _b.buttonBackground) || 'defaultColor'};">PlinkkCorp©</p></a>`;
        footer.style.zIndex = "9999";
        document.body.appendChild(footer);
    }
    initEasterEggs();

    try {
        window.addEventListener('plinkk:theme-updated', (ev) => {
            try {
                const detail = ev && ev.detail ? ev.detail : null;
                const idx = detail && typeof detail.index === 'number' ? detail.index : window.__PLINKK_INJECTED_THEME_INDEX__;
                const theme = (typeof idx === 'number') ? themes[idx % themes.length] : (window.__PLINKK_INJECTED_THEME__ || null);
                if (theme) {
                    try { createToggleThemeButton(theme); } catch (e) { }
                    try { applyFirstTheme(theme); } catch (e) { }
                }
            } catch (e) { }
        });
    } catch (e) { }
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
