import { getCookie, setCookie } from './cookies.js';
import { canvaData } from '../config/canvaConfig.js';
// profileData est fourni par init.js via import dynamique de profileConfig.js
// On y accède indirectement quand nécessaire (il est importé dans init.js)
// `themes` is exported/populated by src/public/js/init.js at runtime. We avoid
// a static import to prevent circular imports and allow themes to come from
// the DB via the server API.
import { themes } from './init.js';
import { animationBackground } from '../config/animationConfig.js';

// Helper safe getter for profileData to avoid ReferenceError when imports
// are circular. init.js exposes the parsed config on window.__PLINKK_PROFILE_DATA__.
function getProfileData() {
    try {
        if (typeof profileData !== 'undefined') return profileData;
    }
    catch (e) { }
    try {
        if (typeof window !== 'undefined' && window.__PLINKK_PROFILE_DATA__) return window.__PLINKK_PROFILE_DATA__;
    }
    catch (e) { }
    return undefined;
}
export function applyFirstTheme(theme) {
    const darkThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = getCookie("theme");
    console.log("Dark theme media quary:", darkThemeMediaQuery.matches);
    if (savedTheme) {
        if (savedTheme === "dark") {
            loadThemeConfig(theme.darkTheme ? theme : theme.opposite);
            document.body.classList.add("dark-theme");
        }
        else {
            loadThemeConfig(theme.darkTheme ? theme.opposite : theme);
        }
    }
    else {
        if (darkThemeMediaQuery.matches) {
            if (theme.darkTheme) {
                loadThemeConfig(theme);
            }
            else {
                loadThemeConfig(theme.opposite);
                document.body.classList.add("dark-theme");
            }
        }
        else {
            if (theme.darkTheme) {
                loadThemeConfig(theme.opposite);
                document.body.classList.add("dark-theme");
            }
            else {
                loadThemeConfig(theme);
            }
        }
    }
}
export function setIconBasedOnTheme(theme) {
    const iconElement = document.getElementById("theme-icon");
    if (document.body.classList.contains("dark-theme") || theme.darkTheme) {
        iconElement.name = "moon-outline";
    }
    else {
        iconElement.name = "sunny-outline";
    }
}
export function loadThemeConfig(theme) {
    applyTheme(theme);
    setIconBasedOnTheme(theme);
}
export function toggleTheme(theme) {
    const currentTheme = document.body.classList.contains("dark-theme") ? theme : theme.opposite;
    document.body.classList.toggle("dark-theme");
    applyTheme(currentTheme);
    setIconBasedOnTheme(currentTheme);
    setCookie("theme", document.body.classList.contains("dark-theme") ? "dark" : "light", 365);
}
export function createToggleThemeButton(theme) {
    const button = document.createElement("button");
    button.className = "theme-toggle-button";
    const icon = document.createElement("ion-icon");
    icon.id = "theme-icon";
    icon.name = theme.darkTheme ? "moon-outline" : "sunny-outline";
    button.appendChild(icon);
    button.addEventListener("click", () => toggleTheme(theme));
    const article = document.getElementById("profile-article");
    article === null || article === void 0 ? void 0 : article.appendChild(button);
    if (!theme) {
        button.style.display = "none";
    }
}
export function applyTheme(theme) {
    const article = document.getElementById("profile-article");
    article.style.background = theme.background;
    article.style.color = theme.textColor;
    document.querySelectorAll(".discord-box").forEach((box) => {
        if (box.classList.contains("form-box") || box.classList.contains("embed-box")) return;
        const htmlBox = box;
        htmlBox.style.backgroundColor = theme.buttonBackground;
        htmlBox.style.color = theme.buttonTextColor;
    });
    document.querySelectorAll(".discord-box").forEach((box) => {
        if (box.classList.contains("form-box") || box.classList.contains("embed-box")) return;
        const htmlBox = box;
        htmlBox.addEventListener("mouseover", () => {
            htmlBox.style.backgroundColor = theme.buttonHoverBackground;
            htmlBox.style.boxShadow = "0 0 50px " + theme.buttonHoverBackground;
        });
        htmlBox.addEventListener("mouseout", () => {
            htmlBox.style.backgroundColor = theme.buttonBackground;
            htmlBox.style.boxShadow = "none";
        });
    });
    const _profile = getProfileData() || {};
    if ((_profile.buttonThemeEnable) !== 1) {
        document.querySelectorAll("a").forEach((link) => {
            const htmlLink = link;
            htmlLink.style.color = theme.textColor;
        });
        document.querySelectorAll("a:hover").forEach((link) => {
            const htmlLink = link;
            htmlLink.style.color = theme.linkHoverColor;
        });
    }
    const emailDiv = document.querySelector(".email");
    const emailHover = document.querySelector(".email a");
    if (emailDiv) {
        emailDiv.style.backgroundColor = theme.buttonBackground;
        emailDiv.style.color = theme.buttonTextColor;
    }
    if (emailHover) {
        emailHover.addEventListener("mouseover", () => {
            if (emailDiv) {
                emailDiv.style.backgroundColor = theme.buttonHoverBackground;
                emailDiv.style.boxShadow = `0 0 10px ${theme.buttonHoverBackground}`;
                emailHover.style.color = theme.buttonTextColor;
            }
        });
        emailHover.addEventListener("mouseout", () => {
            if (emailDiv) {
                emailDiv.style.backgroundColor = theme.buttonBackground;
                emailDiv.style.boxShadow = `0 0 10px ${theme.buttonBackground}`;
                emailHover.style.color = theme.textColor;
            }
        });
    }
    const themeToggle = document.querySelector(".theme-toggle-button");
    if (themeToggle) {
        themeToggle.style.backgroundColor = theme.buttonBackground;
        themeToggle.style.color = theme.textColor;
        themeToggle.tabIndex = 1;
        themeToggle.addEventListener("mouseover", () => {
            themeToggle.style.backgroundColor = theme.buttonHoverBackground;
            themeToggle.style.boxShadow = `0 0 10px ${theme.buttonHoverBackground}`;
        });
        themeToggle.addEventListener("mouseout", () => {
            themeToggle.style.backgroundColor = theme.buttonBackground;
            themeToggle.style.boxShadow = `0 0 10px ${theme.buttonBackground}`;
        });
    }
    // Apply the new property articleHoverBoxShadow
    const styleSheet = document.styleSheets[0];
    // Vérifications de sécurité pour éviter les valeurs invalides
    if (theme.articleHoverBoxShadow && theme.articleHoverBoxShadow.trim() !== '') {
        try {
            styleSheet.insertRule(`
                article:hover {
                    box-shadow: ${theme.articleHoverBoxShadow};
                }
            `, styleSheet.cssRules.length);
        }
        catch (e) {
            console.warn('Invalid articleHoverBoxShadow value:', theme.articleHoverBoxShadow, e);
        }
    }
    // Apply scrollbar styles avec vérifications
    try {
        styleSheet.insertRule(`
            ::-webkit-scrollbar {
                width: 12px;
            }
        `, styleSheet.cssRules.length);
    }
    catch (e) {
        console.warn('Error adding scrollbar rule:', e);
    }
    if (theme.background && theme.background.trim() !== '') {
        try {
            styleSheet.insertRule(`
                ::-webkit-scrollbar-track {
                    background: ${theme.background};
                    border-radius: 10px;
                    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.3);
                }
            `, styleSheet.cssRules.length);
        }
        catch (e) {
            console.warn('Invalid background value for scrollbar track:', theme.background, e);
        }
    }
    if (theme.buttonBackground && theme.buttonHoverBackground &&
        theme.buttonBackground.trim() !== '' && theme.buttonHoverBackground.trim() !== '' &&
        theme.background && theme.background.trim() !== '') {
        try {
            styleSheet.insertRule(`
                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(45deg, ${theme.buttonBackground}, ${theme.buttonHoverBackground});
                    border-radius: 10px;
                    border: 3px solid ${theme.background};
                    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
                }
            `, styleSheet.cssRules.length);
        }
        catch (e) {
            console.warn('Invalid button colors for scrollbar thumb:', theme.buttonBackground, theme.buttonHoverBackground, e);
        }
    }
    if (theme.buttonHoverBackground && theme.buttonBackground &&
        theme.buttonHoverBackground.trim() !== '' && theme.buttonBackground.trim() !== '') {
        try {
            // Use a separate rule specifically for webkit. Some browsers might reject it if combined.
            styleSheet.insertRule(`
                ::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(45deg, ${theme.buttonHoverBackground}, ${theme.buttonBackground}) !important;
                }
            `, styleSheet.cssRules.length);
        }
        catch (e) {
            // Silicon-style fail: if the browser doesn't like webkit-scrollbar, we just move on.
        }
    }
    const easterEggsBtn = document.querySelector(".easter-egg-gear-btn");
    const easterEggsModal = document.querySelector(".easter-egg-modal");
    if (easterEggsBtn) {
        easterEggsBtn.style.backgroundColor = theme.buttonBackground;
        easterEggsBtn.style.color = theme.textColor;
        easterEggsBtn.addEventListener("mouseover", () => {
            if (easterEggsBtn) {
                easterEggsBtn.style.backgroundColor = theme.buttonHoverBackground;
                easterEggsBtn.style.boxShadow = `0 0 10px ${theme.buttonHoverBackground}`;
            }
        });
        easterEggsBtn.addEventListener("mouseout", () => {
            if (easterEggsBtn) {
                easterEggsBtn.style.backgroundColor = theme.buttonBackground;
                easterEggsBtn.style.boxShadow = `0 0 10px ${theme.buttonBackground}`;
            }
        });
    }
    else {
        console.log("Easter eggs button not found - will be created when Easter eggs are unlocked.");
    }
    if (easterEggsModal) {
        easterEggsModal.style.background = theme.background;
        easterEggsModal.style.color = theme.textColor;
        easterEggsModal.style.border = `2px solid ${theme.buttonHoverBackground}`;
        easterEggsModal.style.boxShadow = `0 0 30px ${theme.buttonHoverBackground}`;
        easterEggsModal.style.borderRadius = "12px";
        easterEggsModal.style.padding = "24px";
        easterEggsModal.style.transition = "background 0.3s, color 0.3s, box-shadow 0.3s";
    }
    else {
        console.log("Easter eggs modal not found - will be created when needed.");
    }
    // Appliquer le style à tous les boutons .show-desc-btn
    const boutonsAffichageDescription = document.querySelectorAll(".show-desc-btn");
    boutonsAffichageDescription.forEach((bouton) => {
        const htmlBouton = bouton;
        htmlBouton.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
        htmlBouton.style.color = theme.textColor;
        htmlBouton.addEventListener("mouseover", () => {
            htmlBouton.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
            htmlBouton.style.boxShadow = `0 0 10px ${theme.buttonHoverBackground}`;
        });
        htmlBouton.addEventListener("mouseout", () => {
            htmlBouton.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
            htmlBouton.style.boxShadow = `0 0 10px ${theme.buttonBackground}`;
        });
    });

    const _p = getProfileData() || {};
    if (_p.fontFamily) {
        document.body.style.fontFamily = `"${_p.fontFamily}", sans-serif`;
        const articleElement = document.getElementById("profile-article");
        if (articleElement) articleElement.style.fontFamily = `"${_p.fontFamily}", sans-serif`;
    }

    if (_p.buttonStyle) {
        let radius = '16px'; // default
        if (_p.buttonStyle === 'pill') radius = '9999px';
        if (_p.buttonStyle === 'sharp') radius = '0px';
        if (_p.buttonStyle === 'rounded') radius = '16px';

        const styleSheetObj = document.styleSheets[document.styleSheets.length - 1] || document.styleSheets[0];
        try {
            styleSheetObj.insertRule(`
            .discord-box, .label-button, .email, .profile-description, .theme-toggle-button {
                border-radius: ${radius} !important;
            }
        `, styleSheetObj.cssRules.length);
            styleSheetObj.insertRule(`
            .discord-box::after {
                border-radius: ${radius} !important;
            }
        `, styleSheetObj.cssRules.length);
        } catch (e) {
            console.warn('Error applying button rounding rule:', e);
        }
    }

    const h1 = document.querySelector("h1");
    if (h1) {
        if (!theme.darkTheme) {
            h1.style.color = "black";
            h1.style.webkitTextFillColor = "black";
            h1.style.background = "none";
            h1.style.textShadow = "none";
        } else {
            h1.style.color = "";
            h1.style.webkitTextFillColor = "";
            h1.style.background = "";
            h1.style.textShadow = "";
        }
    }

    document.querySelectorAll(".label-button").forEach((label) => {
        const htmlLabel = label;
        if (!theme.darkTheme) {
            htmlLabel.style.color = "black";
        } else {
            htmlLabel.style.color = theme.textColor;
        }
    });
}
export function setBackgroundStyles(profileData) {
    const _p = profileData || getProfileData() || {};

    const cosmetics = _p.cosmetics || {};
    const data = cosmetics.data || {};
    const effect = data.effect;

    const colors = Array.isArray(_p.background) ? _p.background.filter(Boolean) : null;
    const deg = (Number.isFinite(_p.degBackgroundColor) ? _p.degBackgroundColor : 45) || 45;

    if (colors) {
        if (colors.length === 0) {
            document.body.style.background = '';
        } else if (colors.length === 1) {
            document.body.style.background = colors[0];
        } else {
            document.body.style.background = `linear-gradient(${deg}deg, ${colors.join(", ")})`;
        }
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
    } else if (typeof _p.background === 'string' && _p.background.trim() !== '') {
        document.body.style.background = `url(${_p.background})`;
        document.body.style.backgroundSize = `${_p.backgroundSize || 100}%`;
    } else {
        document.body.style.background = '';
    }

    if (effect && effect !== 'none') {
        const existingEffect = document.getElementById('cosmetic-effect-overlay');
        if (existingEffect) existingEffect.remove();

        const effectDiv = document.createElement('div');
        effectDiv.id = 'cosmetic-effect-overlay';
        effectDiv.style.position = 'fixed';
        effectDiv.style.inset = '0';
        effectDiv.style.pointerEvents = 'none';
        effectDiv.style.zIndex = '-1'; // Behind content

        if (effect === 'sparkles') {
            effectDiv.style.backgroundImage = `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0L12 8L20 10L12 12L10 20L8 12L0 10L8 8L10 0Z' fill='rgba(255,255,255,0.1)'/%3E%3C/svg%3E")`;
        } else if (effect === 'noise') {
            effectDiv.style.backgroundImage = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;
        }
        document.body.appendChild(effectDiv);
    }
}
export function applyAnimation(animation, animationEnabled) {
    const article = document.getElementById("profile-article");
    if (animationEnabled) {
        article.style.animation = animation.keyframes;
    }
}
export function applyAnimationButton(animation, animationButtonEnabled, delayAnimationButton) {
    const articleChildren = document.querySelectorAll("#profile-article > *:not(.easter-egg-modal)");
    if (animationButtonEnabled) {
        articleChildren.forEach((child, index) => {
            const htmlChild = child;
            htmlChild.style.animationDelay = `${(index + 1) * delayAnimationButton}s`;
            htmlChild.style.animation = `${animation.keyframes} ${animation.duration || delayAnimationButton * index}s`;
            htmlChild.style.animationFillMode = "backwards";
        });
    }
}
export function applyDynamicStyles(profileData, styleSheet, selectedAnimationBackgroundIndex, EnableAnimationBackground, animationDurationBackground, useCanvas, selectedCanvasIndex) {
    if (useCanvas) {
        const canvas = document.createElement("canvas");
        canvas.id = "backgroundCanvas";
        document.body.appendChild(canvas);
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.id = "container";
        try {
            if (canvaData[selectedCanvasIndex].fileNames === 'matrix-effect/app.js') {
                console.log("Loading Matrix Effect animation...");
                const loadScript = (src) => {
                    return new Promise((resolve, reject) => {
                        console.log("Loading script:", src);
                        const script = document.createElement("script");
                        script.src = src;
                        script.onload = () => {
                            console.log("Script loaded successfully:", src);
                            resolve();
                        };
                        script.onerror = (error) => {
                            console.error("Script failed to load:", src, error);
                            reject(error);
                        };
                        document.body.appendChild(script);
                    });
                };
                loadScript('/canvaAnimation/matrix-effect/effect.js')
                    .then(() => {
                        console.log("Effect.js loaded, checking window.Effect:", typeof window.Effect);
                        return loadScript('/canvaAnimation/matrix-effect/symbol.js');
                    })
                    .then(() => {
                        console.log("Symbol.js loaded, checking window.Symbol:", typeof window.Symbol);
                        return loadScript('/canvaAnimation/matrix-effect/app.js');
                    })
                    .then(() => {
                        console.log("App.js loaded, checking runCanvasAnimation:", typeof runCanvasAnimation);
                        if (typeof runCanvasAnimation === "function") {
                            runCanvasAnimation(ctx, canvas);
                        }
                        else {
                            console.error("runCanvasAnimation is not a function");
                            setBackgroundStyles(profileData);
                        }
                    })
                    .catch((error) => {
                        console.error("Error loading Matrix effect scripts:", error);
                        setBackgroundStyles(profileData);
                    });
            }
            else {
                const script = document.createElement("script");
                script.src = `/canvaAnimation/${canvaData[selectedCanvasIndex].fileNames}`;
                document.body.appendChild(script);
                script.onload = () => {
                    if (typeof runCanvasAnimation === "function") {
                        runCanvasAnimation(ctx, canvas);
                    }
                    else {
                        console.error("runCanvasAnimation is not a function");
                        setBackgroundStyles(profileData);
                    }
                };
            }
        }
        catch (error) {
            console.error("Error loading canvas animation:", error);
            setBackgroundStyles(profileData);
        }
    }
    else {
        setBackgroundStyles(profileData);
    }
    if (EnableAnimationBackground && !useCanvas && !Array.isArray(profileData.background)) {
        document.body.style.animation = `${animationBackground[selectedAnimationBackgroundIndex].keyframes} ${animationDurationBackground}s`;
    }
    else {
        document.body.style.animation = "none";
    }
    const _p_neon = getProfileData() || {};
    if ((_p_neon.neonEnable) === 0) {
        try {
            styleSheet.insertRule(`
                .profile-pic-wrapper::before,
                .profile-pic-wrapper::after {
                    display: none;
                }
            `, styleSheet.cssRules.length);
        }
        catch (e) {
            console.warn('Error adding neon disable rule:', e);
        }
    }
    else {
        if (_p_neon.neonColors && Array.isArray(_p_neon.neonColors) && _p_neon.neonColors.length > 0) {
            const neonGradient = _p_neon.neonColors.filter(color => color && color.trim() !== '').join(", ");
            if (neonGradient) {
                try {
                    styleSheet.insertRule(`
                        .profile-pic-wrapper::after, .profile-pic-wrapper::before {
                            background: linear-gradient(45deg, ${neonGradient});
                        }
                    `, styleSheet.cssRules.length);
                }
                catch (e) {
                    console.warn('Invalid neon colors:', _p_neon.neonColors, e);
                }
            }
        }
    }
}
export function addEmailStyles() {
    const styleSheet = document.styleSheets[0];
    // Vérifier que le thème existe et a les propriétés nécessaires
    const _p = getProfileData() || {};
    const currentTheme = themes[(_p.selectedThemeIndex || 0) % themes.length];
    const borderColor = (currentTheme === null || currentTheme === void 0 ? void 0 : currentTheme.buttonHoverBackground) || '#2C2F33';
    try {
        styleSheet.insertRule(`
            .email {
                width: 100%;
                border: 2px solid ${borderColor};
                border-radius: 10px;
                background-color: #2C2F33;
                color: white;
                font-size: 1em;
                font-weight: bold;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
                transition: background-color 0.3s ease, box-shadow 0.3s ease;
            }
        `, styleSheet.cssRules.length);
    }
    catch (e) {
        console.warn('Error adding email styles:', e);
    }
    try {
        styleSheet.insertRule(`
            .email a {
                display: block;
                padding: 10px;
                text-align: center;
                text-decoration: none;
                color: white;
                border-radius: 10px;
            }
        `, styleSheet.cssRules.length);
    }
    catch (e) {
        console.warn('Error adding email link styles:', e);
    }
}
export default {
    applyFirstTheme,
    setIconBasedOnTheme,
    loadThemeConfig,
    toggleTheme,
    createToggleThemeButton,
    applyTheme,
    setBackgroundStyles,
    applyAnimation,
    applyAnimationButton,
    applyDynamicStyles,
    addEmailStyles,
};
