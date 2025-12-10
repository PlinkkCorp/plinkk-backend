import { el } from '../../core/domUtils.js';
import { applyTheme, getTheme } from './themeManager.js';

const LIGHT_THEME = {
    background: '#ffffff',
    text: '#1a1a2e',
    accent: '#3b82f6',
    secondary: '#f3f4f6',
    border: '#e5e7eb'
};

const DARK_THEME = {
    background: '#1a1a2e',
    text: '#ffffff',
    accent: '#4ade80',
    secondary: '#2d2d44',
    border: '#3d3d5c'
};

export function createThemeToggle(container) {
    const toggle = el('button', {
        class: 'theme-toggle',
        'aria-label': 'Basculer le thème',
        html: `
            <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
                <path d="M12 2V4M12 20V22M2 12H4M20 12H22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: none;">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `
    });
    
    let isDark = true;
    
    const sunIcon = toggle.querySelector('.sun-icon');
    const moonIcon = toggle.querySelector('.moon-icon');
    
    toggle.addEventListener('click', () => {
        isDark = !isDark;
        
        if (isDark) {
            applyTheme(DARK_THEME);
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            applyTheme(LIGHT_THEME);
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    });
    
    if (container) {
        container.appendChild(toggle);
    }
    
    return toggle;
}

export default createThemeToggle;
