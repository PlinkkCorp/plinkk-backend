import { createToggleThemeButton, applyAnimation, applyAnimationButton, applyDynamicStyles, applyFirstTheme } from './styleTools.js';
import { createProfileContainer, createUserName, createStatusBar, createLabelButtons, createIconList, createEmailAndDescription, createLinkBoxes } from './tools.js';
import { initEasterEggs } from './easterEggs.js';
import { profileData } from './config/profileConfig.js';
import { themes } from './config/themeConfig.js';
// Étendre avec les thèmes approuvés (communauté)
(async () => {
    try {
        const res = await fetch('/api/themes/approved', { cache: 'no-store' });
        if (res.ok) {
            const extra = await res.json();
            if (Array.isArray(extra) && extra.length) {
                // Muter le tableau importé pour conserver les index existants
                extra.forEach(t => themes.push(t));
            }
        }
    } catch {}
})();
import { animations, styleSheet } from './config/animationConfig.js';
import { canvaData } from './config/canvaConfig.js';
document.addEventListener("DOMContentLoaded", function () {
    var _a, _b;
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
    // S'il existe un thème privé injecté, l'insérer en tête de liste et pointer selectedThemeIndex=0
    try {
        if (window.__PLINKK_PRIVATE_THEME__) {
            // Ne pas dupliquer si déjà présent
            if (!themes.length || JSON.stringify(themes[0]) !== JSON.stringify(window.__PLINKK_PRIVATE_THEME__)) {
                themes.unshift(window.__PLINKK_PRIVATE_THEME__);
            }
            try { profileData.selectedThemeIndex = 0; } catch (_) { }
        }
    }
    catch (_c) { }
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
