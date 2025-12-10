/**
 * Tools - Module principal (rétro-compatible)
 * 
 * Ce fichier re-exporte tous les composants depuis leur nouvelle structure modulaire.
 * Il permet de maintenir la compatibilité avec le code existant qui importe depuis tools.js
 * 
 * STRUCTURE MODULAIRE:
 * - /core/          : Utilitaires DOM, CSS, Events
 * - /components/    : Composants UI (profile, email, links)
 * - /features/      : Fonctionnalités (thèmes, animations, easter eggs)
 */

// Re-export des composants profile
export { createProfileContainer } from './components/profile/ProfileContainer.js';
export { createUserName } from './components/profile/UserName.js';
export { createStatusBar } from './components/profile/StatusBar.js';

// Re-export des composants email
export { createEmailAndDescription } from './components/email/EmailContainer.js';
export { showCopyModal } from './components/email/CopyModal.js';

// Re-export des composants links
export { createLinkBoxes } from './components/links/LinkBox.js';
export { createLabelButtons } from './components/links/LabelButton.js';
export { createIconList } from './components/links/SocialIcon.js';

// Re-export des utilitaires de sécurité
export { setSafeText, isSafeUrl, isSafeColor, disableDrag, disableContextMenuOnImage } from './security.js';

/**
 * Validation de la configuration du profil
 * @param {Object} profileData - Données du profil
 * @param {Array} themes - Thèmes disponibles
 * @param {Array} btnIconThemeConfig - Configuration des icônes de boutons
 * @param {Array} canvaData - Données des canvas
 * @param {Array} animationBackground - Animations de fond
 * @returns {boolean}
 */
export function validateProfileConfig(profileData, themes, btnIconThemeConfig, canvaData, animationBackground) {
    const errors = [];
    
    // Validate themes
    if (!Array.isArray(themes) || themes.length === 0) {
        errors.push('Themes array is missing or empty.');
    } else {
        themes.forEach((theme, i) => {
            if (!theme.background || !theme.textColor || !theme.buttonBackground || !theme.buttonHoverBackground) {
                errors.push(`Theme at index ${i} is missing required properties.`);
            }
        });
    }
    
    // Validate profileData
    if (typeof profileData !== 'object' || profileData === null) {
        errors.push('profileData is not an object.');
    } else {
        const requiredProfileFields = [
            'profileLink', 'profileImage', 'profileIcon', 'profileSiteText', 'profileHoverColor',
            'userName', 'email', 'description', 'links', 'labels', 'socialIcon', 'statusbar', 'background'
        ];
        
        requiredProfileFields.forEach(field => {
            if (!(field in profileData)) {
                errors.push(`profileData is missing field: ${field}`);
            }
        });
        
        if (!Array.isArray(profileData.links)) {
            errors.push('profileData.links is not an array.');
        }
        if (!Array.isArray(profileData.labels)) {
            errors.push('profileData.labels is not an array.');
        }
        if (!Array.isArray(profileData.socialIcon)) {
            errors.push('profileData.socialIcon is not an array.');
        }
        if (typeof profileData.statusbar !== 'object' || profileData.statusbar === null) {
            errors.push('profileData.statusbar is not an object.');
        }
    }
    
    // Validate btnIconThemeConfig
    if (!Array.isArray(btnIconThemeConfig)) {
        errors.push('btnIconThemeConfig is not an array.');
    }
    
    // Validate canvaData
    if (!Array.isArray(canvaData)) {
        errors.push('canvaData is not an array.');
    } else {
        canvaData.forEach((canva, i) => {
            if (!canva.fileNames) {
                errors.push(`canvaData at index ${i} is missing fileNames.`);
            }
        });
    }
    
    // Validate animationBackground
    if (!Array.isArray(animationBackground)) {
        errors.push('animationBackground is not an array.');
    } else {
        animationBackground.forEach((anim, i) => {
            if (!anim.keyframes) {
                errors.push(`animationBackground at index ${i} is missing keyframes.`);
            }
        });
    }
    
    if (errors.length > 0) {
        console.error('Validation errors:', errors);
        return false;
    }
    
    return true;
}

// Export par défaut pour compatibilité
export default {
    createProfileContainer,
    createUserName,
    createEmailAndDescription,
    showCopyModal,
    createLinkBoxes,
    validateProfileConfig,
    createLabelButtons,
    createIconList,
    createStatusBar
};
