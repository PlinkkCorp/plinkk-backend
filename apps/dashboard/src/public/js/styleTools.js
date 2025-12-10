/**
 * StyleTools - Module principal (rétro-compatible)
 * 
 * Re-exporte les fonctionnalités depuis leur nouvelle structure modulaire
 */

// Re-export des fonctions de thème
export {
    applyFirstTheme,
    setIconBasedOnTheme,
    loadThemeConfig,
    toggleTheme,
    applyTheme,
    createToggleThemeButton
} from './features/theme/index.js';

// Re-export des fonctions d'animation
export {
    setBackgroundStyles,
    applyAnimation,
    applyAnimationButton,
    applyDynamicStyles,
    addEmailStyles
} from './features/animations/index.js';

// Export par défaut pour compatibilité
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
