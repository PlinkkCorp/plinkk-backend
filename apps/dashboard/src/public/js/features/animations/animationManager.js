/**
 * AnimationManager
 * Gestion des animations
 */
import { qs, qsa } from '../../core/domUtils.js';
import { safeInsertRule, createStyleSheet } from '../../core/cssUtils.js';
import { canvaData } from '../../../config/canvaConfig.js';
import { animationBackground } from '../../../config/animationConfig.js';

/**
 * Récupère les données du profil
 * @returns {Object}
 */
function getProfileData() {
    try {
        if (typeof profileData !== 'undefined') return profileData;
    } catch (e) { /* ignore */ }
    
    try {
        if (window?.__PLINKK_PROFILE_DATA__) return window.__PLINKK_PROFILE_DATA__;
    } catch (e) { /* ignore */ }
    
    return {};
}

/**
 * Définit les styles de fond
 * @param {Object} profileData 
 */
export function setBackgroundStyles(profileData) {
    const _p = profileData || getProfileData();
    const colors = Array.isArray(_p.background) ? _p.background.filter(Boolean) : null;
    const deg = (Number.isFinite(_p.degBackgroundColor) ? _p.degBackgroundColor : 45) || 45;
    
    if (colors) {
        if (colors.length === 0) {
            document.body.style.background = '';
        } else if (colors.length === 1) {
            document.body.style.background = colors[0];
        } else {
            document.body.style.background = `linear-gradient(${deg}deg, ${colors.join(', ')})`;
        }
        document.body.style.backgroundSize = 'cover';
    } else if (typeof _p.background === 'string' && _p.background.trim()) {
        document.body.style.background = `url(${_p.background})`;
        document.body.style.backgroundSize = `${_p.backgroundSize || 100}%`;
    } else {
        document.body.style.background = '';
    }
}

/**
 * Applique l'animation à l'article
 * @param {Object} animation 
 * @param {boolean} animationEnabled 
 */
export function applyAnimation(animation, animationEnabled) {
    const article = qs('#profile-article');
    if (!article) return;
    
    if (animationEnabled && animation?.keyframes) {
        article.style.animation = animation.keyframes;
    } else {
        article.style.animation = '';
    }
}

/**
 * Applique l'animation aux boutons
 * @param {Object} animation 
 * @param {boolean} animationButtonEnabled 
 * @param {number} delayAnimationButton 
 */
export function applyAnimationButton(animation, animationButtonEnabled, delayAnimationButton) {
    const articleChildren = qsa('#profile-article > *:not(.easter-egg-modal)');
    
    if (!animationButtonEnabled || !animation?.keyframes) {
        articleChildren.forEach(child => {
            child.style.animation = '';
            child.style.animationDelay = '';
        });
        return;
    }
    
    articleChildren.forEach((child, index) => {
        child.style.animationDelay = `${(index + 1) * delayAnimationButton}s`;
        child.style.animation = `${animation.keyframes} ${animation.duration || delayAnimationButton * index}s`;
        child.style.animationFillMode = 'backwards';
    });
}

/**
 * Charge un script externe
 * @param {string} src 
 * @returns {Promise}
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = (error) => reject(error);
        document.body.appendChild(script);
    });
}

/**
 * Initialise l'animation canvas Matrix
 * @param {CanvasRenderingContext2D} ctx 
 * @param {HTMLCanvasElement} canvas 
 */
async function initMatrixEffect(ctx, canvas) {
    try {
        await loadScript('/canvaAnimation/matrix-effect/effect.js');
        await loadScript('/canvaAnimation/matrix-effect/symbol.js');
        await loadScript('/canvaAnimation/matrix-effect/app.js');
        
        if (typeof runCanvasAnimation === 'function') {
            runCanvasAnimation(ctx, canvas);
        } else {
            console.error('runCanvasAnimation is not a function');
            return false;
        }
    } catch (error) {
        console.error('Error loading Matrix effect scripts:', error);
        return false;
    }
    return true;
}

/**
 * Initialise une animation canvas générique
 * @param {CanvasRenderingContext2D} ctx 
 * @param {HTMLCanvasElement} canvas 
 * @param {string} fileName 
 */
async function initCanvasAnimation(ctx, canvas, fileName) {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = `/canvaAnimation/${fileName}`;
        script.onload = () => {
            if (typeof runCanvasAnimation === 'function') {
                runCanvasAnimation(ctx, canvas);
                resolve(true);
            } else {
                console.error('runCanvasAnimation is not a function');
                resolve(false);
            }
        };
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

/**
 * Applique les styles dynamiques
 */
export function applyDynamicStyles(
    profileData,
    styleSheet,
    selectedAnimationBackgroundIndex,
    EnableAnimationBackground,
    animationDurationBackground,
    useCanvas,
    selectedCanvasIndex
) {
    const _p = profileData || getProfileData();
    const sheet = styleSheet || document.styleSheets[0];
    
    if (useCanvas) {
        // Créer le canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'backgroundCanvas';
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.id = 'container';
        
        const canvasConfig = canvaData[selectedCanvasIndex];
        
        if (canvasConfig?.fileNames === 'matrix-effect/app.js') {
            initMatrixEffect(ctx, canvas).then(success => {
                if (!success) setBackgroundStyles(_p);
            });
        } else if (canvasConfig?.fileNames) {
            initCanvasAnimation(ctx, canvas, canvasConfig.fileNames).then(success => {
                if (!success) setBackgroundStyles(_p);
            });
        } else {
            setBackgroundStyles(_p);
        }
    } else {
        setBackgroundStyles(_p);
    }
    
    // Animation de fond
    if (EnableAnimationBackground && !useCanvas && !Array.isArray(_p.background)) {
        const anim = animationBackground[selectedAnimationBackgroundIndex];
        if (anim?.keyframes) {
            document.body.style.animation = `${anim.keyframes} ${animationDurationBackground}s`;
        }
    } else {
        document.body.style.animation = 'none';
    }
    
    // Règles néon
    if (_p.neonEnable === 0) {
        safeInsertRule(sheet, `
            .profile-pic-wrapper::before,
            .profile-pic-wrapper::after {
                display: none;
            }
        `);
    } else if (_p.neonColors?.length > 0) {
        const neonGradient = _p.neonColors.filter(c => c?.trim()).join(', ');
        if (neonGradient) {
            safeInsertRule(sheet, `
                .profile-pic-wrapper::after,
                .profile-pic-wrapper::before {
                    background: linear-gradient(45deg, ${neonGradient});
                }
            `);
        }
    }
}

/**
 * Ajoute les styles email
 * @param {Object} themes 
 */
export function addEmailStyles(themes) {
    const _p = getProfileData();
    const sheet = document.styleSheets[0];
    const currentTheme = themes?.[(_p.selectedThemeIndex || 0) % themes.length];
    const borderColor = currentTheme?.buttonHoverBackground || '#2C2F33';
    
    safeInsertRule(sheet, `
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
    `);
    
    safeInsertRule(sheet, `
        .email a {
            display: block;
            padding: 10px;
            text-align: center;
            text-decoration: none;
            color: white;
            border-radius: 10px;
        }
    `);
}

export default {
    setBackgroundStyles,
    applyAnimation,
    applyAnimationButton,
    applyDynamicStyles,
    addEmailStyles
};
