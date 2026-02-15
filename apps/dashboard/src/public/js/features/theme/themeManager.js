import { setCSS } from '../../core/cssUtils.js';
import { isSafeColor } from '../../security.js';

const THEME_STORAGE_KEY = 'plinkk-theme-preference';

const DEFAULT_THEME = {
    background: '#1a1a2e',
    text: '#ffffff',
    accent: '#4ade80',
    secondary: '#2d2d44',
    border: '#3d3d5c'
};

let currentTheme = { ...DEFAULT_THEME };

export function applyTheme(theme = {}) {
    const safeTheme = {};

    for (const [key, value] of Object.entries(theme)) {
        if (isSafeColor(value)) {
            safeTheme[key] = value;
        } else if (DEFAULT_THEME[key]) {
            safeTheme[key] = DEFAULT_THEME[key];
        }
    }

    currentTheme = { ...DEFAULT_THEME, ...safeTheme };

    const root = document.documentElement;
    for (const [key, value] of Object.entries(currentTheme)) {
        root.style.setProperty(`--theme-${key}`, value);
    }

    const isDark = !theme.background || theme.background === '#1a1a2e'; // Default to dark if not specified or matches DARK_THEME
    if (isDark) {
        root.classList.add('dark-theme');
        root.classList.remove('light-theme');
    } else {
        root.classList.add('light-theme');
        root.classList.remove('dark-theme');
    }

    try {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(currentTheme));
    } catch (e) {
        console.warn('Could not save theme to localStorage');
    }
}

export function loadSavedTheme() {
    try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            applyTheme(parsed);
            return parsed;
        }
    } catch (e) {
        console.warn('Could not load saved theme');
    }
    return null;
}

export function getTheme() {
    return { ...currentTheme };
}

export function resetTheme() {
    applyTheme(DEFAULT_THEME);
}

export default {
    applyTheme,
    loadSavedTheme,
    getTheme,
    resetTheme,
    DEFAULT_THEME
};
