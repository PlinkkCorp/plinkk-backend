export function setCSSVar(name, value) {
    document.documentElement.style.setProperty(`--${name}`, value);
}

export function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

export function setCSSVars(vars) {
    for (const [name, value] of Object.entries(vars)) {
        if (value != null && value !== '') {
            setCSSVar(name, value);
        }
    }
}

export function safeInsertRule(sheet, rule) {
    try {
        sheet.insertRule(rule, sheet.cssRules.length);
        return true;
    } catch (e) {
        console.warn('Erreur insertion règle CSS:', e.message);
        return false;
    }
}

export function createStyleSheet(id) {
    let existing = document.getElementById(id);
    if (existing) {
        return existing.sheet;
    }
    
    const style = document.createElement('style');
    style.id = id;
    document.head.appendChild(style);
    return style.sheet;
}

export function clearStyleSheet(sheet) {
    while (sheet.cssRules.length > 0) {
        sheet.deleteRule(0);
    }
}

export function applyThemeVariables(theme) {
    if (!theme) return;
    
    setCSSVars({
        'theme-background': theme.background,
        'theme-text-color': theme.textColor,
        'theme-btn-bg': theme.buttonBackground,
        'theme-btn-hover-bg': theme.buttonHoverBackground,
        'theme-btn-text-color': theme.buttonTextColor,
        'theme-link-hover-color': theme.linkHoverColor,
        'theme-article-shadow': theme.articleHoverBoxShadow,
    });
}

export function generateScrollbarCSS(theme) {
    if (!theme?.background || !theme?.buttonBackground) return '';
    
    return `
        ::-webkit-scrollbar { width: 12px; }
        ::-webkit-scrollbar-track {
            background: ${theme.background};
            border-radius: 10px;
            box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.3);
        }
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, ${theme.buttonBackground}, ${theme.buttonHoverBackground});
            border-radius: 10px;
            border: 3px solid ${theme.background};
            box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
        }
        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(45deg, ${theme.buttonHoverBackground}, ${theme.buttonBackground});
        }
    `;
}

export default {
    setCSSVar,
    getCSSVar,
    setCSSVars,
    safeInsertRule,
    createStyleSheet,
    clearStyleSheet,
    applyThemeVariables,
    generateScrollbarCSS
};
