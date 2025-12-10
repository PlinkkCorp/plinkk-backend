/**
 * Init - Point d'entrée principal de l'application Plinkk
 * Version refactorisée avec imports modulaires
 */

// Imports des features
import { createToggleThemeButton, applyAnimation, applyAnimationButton, applyDynamicStyles, applyFirstTheme } from './features/index.js';

// Imports des composants
import { 
    createProfileContainer, 
    createUserName, 
    createStatusBar, 
    createLabelButtons, 
    createIconList, 
    createEmailAndDescription, 
    createLinkBoxes 
} from './components/index.js';

// Imports existants
import { initEasterEggs } from './easterEggs.js';
import { loadThemes } from './themesStore.js';
import { animations, styleSheet } from '../config/animationConfig.js';
import { canvaData } from '../config/canvaConfig.js';

// Store des thèmes
export const themes = [];

// Chargement asynchrone des thèmes
export const themesLoaded = (async () => {
    try {
        const identifier = (window.__PLINKK_IDENTIFIER__ || (location.pathname.split('/').filter(Boolean)[1] || '')).trim();
        const payload = await loadThemes(identifier);
        
        if (payload?.builtIns?.length) {
            payload.builtIns.forEach(t => themes.push(t));
        }
        if (payload?.theme?.length) {
            payload.theme.forEach(t => themes.push(t));
        }
    } catch (e) {
        console.warn('Failed to load themes:', e);
    }
})();

/**
 * Layout par défaut
 */
const DEFAULT_LAYOUT = ['profile', 'username', 'labels', 'social', 'email', 'links'];

/**
 * Renderers pour chaque section du layout
 */
function getRenderers(profileData, article) {
    return {
        profile: () => article.appendChild(createProfileContainer(profileData)),
        username: () => article.appendChild(createUserName(profileData)),
        labels: () => createLabelButtons(profileData),
        social: () => createIconList(profileData),
        email: () => article.appendChild(createEmailAndDescription(profileData)),
        links: () => {
            const linkBoxes = createLinkBoxes(profileData);
            (linkBoxes || []).forEach(box => article.appendChild(box));
        },
    };
}

/**
 * Rend le layout selon l'ordre spécifié
 */
function renderLayout(profileData, article) {
    const renderers = getRenderers(profileData, article);
    
    let order = Array.isArray(profileData.layoutOrder) 
        ? profileData.layoutOrder.slice() 
        : DEFAULT_LAYOUT;
    
    const KNOWN = new Set(DEFAULT_LAYOUT);
    const filtered = order.filter(k => KNOWN.has(k));
    
    // Ajouter les éléments manquants
    DEFAULT_LAYOUT.forEach(k => {
        if (!filtered.includes(k)) filtered.push(k);
    });
    
    // Rendre chaque section
    filtered.forEach(key => {
        try {
            renderers[key]?.();
        } catch (e) {
            console.warn(`Failed to render ${key}:`, e);
        }
    });
}

/**
 * Gère l'injection de thème personnalisé
 */
function handleInjectedTheme(profileData, injectedTheme) {
    if (!injectedTheme || typeof injectedTheme !== 'object') return;
    
    const same = (a, b) => a && b && 
        a.background === b.background && 
        a.buttonBackground === b.buttonBackground && 
        a.textColor === b.textColor;
    
    const existing = themes.findIndex(t => same(t, injectedTheme));
    
    if (existing === -1) {
        themes.unshift(injectedTheme);
        profileData.selectedThemeIndex = 0;
    } else {
        profileData.selectedThemeIndex = existing;
    }
}

/**
 * Normalise l'index du thème sélectionné
 */
function normalizeThemeIndex(profileData) {
    let idx = Number(profileData.selectedThemeIndex);
    
    if (!Number.isFinite(idx) || isNaN(idx)) {
        idx = 0;
    }
    
    if (!themes.length) {
        idx = 0;
    } else {
        idx = ((Math.floor(idx) % themes.length) + themes.length) % themes.length;
    }
    
    profileData.selectedThemeIndex = idx;
}

/**
 * Crée le footer
 */
function createFooter(profileData) {
    const isPreview = new URLSearchParams(window.location.search).get('preview') === '1';
    if (isPreview) return;
    
    const themeIndex = profileData.selectedThemeIndex % themes.length;
    const theme = themes[themeIndex];
    
    const footer = document.createElement('footer');
    footer.innerHTML = `Design with ❤️ by <a href="http://plinkk.fr" target="_blank" rel="noopener noreferrer"><p style="color:${theme?.buttonTextColor || 'defaultColor'};display:inline;padding:2px 2px 2px 4px;border-radius:5px;background-color:${theme?.buttonBackground || 'defaultColor'};">PlinkkCorp©</p></a>`;
    footer.style.zIndex = '9999';
    
    document.body.appendChild(footer);
}

/**
 * Configure les listeners d'événements
 */
function setupEventListeners() {
    window.addEventListener('plinkk:theme-updated', (ev) => {
        try {
            const detail = ev?.detail;
            const idx = detail?.index ?? window.__PLINKK_INJECTED_THEME_INDEX__;
            const theme = typeof idx === 'number' 
                ? themes[idx % themes.length] 
                : window.__PLINKK_INJECTED_THEME__;
            
            if (theme) {
                createToggleThemeButton(theme);
                applyFirstTheme(theme);
            }
        } catch (e) {
            console.warn('Theme update event failed:', e);
        }
    });
}

/**
 * Point d'entrée principal
 */
document.addEventListener('DOMContentLoaded', async function() {
    // Récupération des données
    const identifier = (window.__PLINKK_IDENTIFIER__ || (location.pathname.split('/').filter(Boolean)[1] || '')).trim();
    const params = new URLSearchParams(location.search);
    if (identifier) params.set('username', identifier);
    
    // Chargement de la configuration
    let profileData, injectedTheme;
    try {
        const mod = await import(`/config.js?${params}`);
        profileData = mod.profileData;
        injectedTheme = mod.injectedTheme;
    } catch (e) {
        console.error('Failed to load config:', e);
        return;
    }
    
    // Parse si nécessaire
    if (typeof profileData === 'string') {
        try {
            profileData = JSON.parse(profileData);
        } catch (e) {
            console.error('Invalid JSON data:', e);
            return;
        }
    }
    
    // Validation
    if (!profileData || typeof profileData !== 'object') {
        console.error('profileData is not defined or is not an object.');
        return;
    }
    
    // Exposer les données globalement
    try {
        window.profileData = profileData;
        window.__PLINKK_PROFILE_DATA__ = profileData;
    } catch (e) { /* ignore */ }
    
    // Récupérer l'article
    const article = document.getElementById('profile-article');
    if (!article) {
        console.error("Element with id 'profile-article' not found.");
        return;
    }
    
    // Rendre le layout
    try {
        renderLayout(profileData, article);
    } catch (e) {
        // Fallback: rendu simple
        console.warn('Layout render failed, using fallback:', e);
        article.appendChild(createProfileContainer(profileData));
        article.appendChild(createUserName(profileData));
        createStatusBar(profileData);
        createLabelButtons(profileData);
        createIconList(profileData);
        article.appendChild(createEmailAndDescription(profileData));
    }
    
    // Attendre le chargement des thèmes
    try {
        await themesLoaded;
    } catch (_) { /* ignore */ }
    
    // Gérer le thème injecté
    try {
        handleInjectedTheme(profileData, injectedTheme);
    } catch (e) {
        console.warn('injectedTheme handling failed', e);
    }
    
    // Normaliser l'index du thème
    try {
        normalizeThemeIndex(profileData);
    } catch (e) {
        profileData.selectedThemeIndex = 0;
    }
    
    // Créer le bouton de thème
    if (themes.length) {
        createToggleThemeButton(themes[profileData.selectedThemeIndex % themes.length]);
    } else {
        console.warn('Themes array is empty or not defined.');
    }
    
    // Vérifier si les liens sont rendus
    try {
        const hasLinksRendered = !!document.querySelector('#profile-article .discord-box, #profile-article .button');
        if (!hasLinksRendered) {
            const linkBoxes = createLinkBoxes(profileData);
            linkBoxes?.forEach(box => article.appendChild(box));
        }
    } catch (_) { /* ignore */ }
    
    // Titre et favicon
    document.title = profileData.userName 
        ? `${profileData.userName} - Plinkk` 
        : 'Plinkk By Klaynight';
    
    if (profileData.iconUrl) {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = profileData.iconUrl;
        document.head.appendChild(link);
    }
    
    // Footer
    createFooter(profileData);
    
    // Easter eggs
    initEasterEggs();
    
    // Event listeners
    setupEventListeners();
    
    // Désactiver le néon par défaut
    try {
        profileData.neonEnable = 0;
    } catch (_) { /* ignore */ }
    
    // Appliquer les animations
    if (!animations?.length) {
        console.warn('Animations array is empty or not defined.');
    } else {
        applyDynamicStyles(
            profileData,
            styleSheet,
            profileData.selectedAnimationBackgroundIndex % animations.length,
            !!profileData.EnableAnimationBackground,
            profileData.animationDurationBackground,
            !!profileData.canvaEnable,
            profileData.selectedCanvasIndex % canvaData.length
        );
        
        applyFirstTheme(themes[profileData.selectedThemeIndex % themes.length]);
        applyAnimation(animations[profileData.selectedAnimationIndex % animations.length], !!profileData.EnableAnimationArticle);
        applyAnimationButton(animations[profileData.selectedAnimationButtonIndex % animations.length], !!profileData.EnableAnimationButton, profileData.delayAnimationButton);
    }
});
