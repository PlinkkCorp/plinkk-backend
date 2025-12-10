import { el } from '../../core/domUtils.js';

const MAX_CHARACTERS = 50;

const STATUS_CLASS_MAP = {
    busy: 'status-busy',
    occupé: 'status-busy',
    work: 'status-busy',
    away: 'status-away',
    absent: 'status-away',
    afk: 'status-away',
    offline: 'status-offline',
    off: 'status-offline',
    déconnecté: 'status-offline',
    online: 'status-online',
    disponible: 'status-online',
    actif: 'status-online'
};

function getStatusClass(statusText) {
    const status = String(statusText || '').toLowerCase();
    
    for (const [keyword, className] of Object.entries(STATUS_CLASS_MAP)) {
        if (status.includes(keyword)) {
            return className;
        }
    }
    
    return 'status-online';
}

export function createStatusBar(profileData) {
    const profileContainer = document.querySelector('.profile-container');
    if (!profileContainer) {
        console.warn('Profile container not found for status bar');
        return;
    }
    
    const sb = profileData?.statusbar || {};
    const rawText = typeof sb.text === 'string' ? sb.text : '';
    const text = rawText.substring(0, MAX_CHARACTERS);
    
    if (!text.trim()) {
        return;
    }
    
    const statusBarContainer = el('div', {
        class: 'status-bar-container',
        style: { opacity: '0' }
    });
    
    const statusBarText = el('div', {
        class: 'statusBarText',
        text: text + (rawText.length > MAX_CHARACTERS ? '...' : '')
    });
    
    const circleStatusBar = el('div', {
        class: `circle-status-bar ${getStatusClass(sb.statusText)}`
    });
    
    statusBarContainer.appendChild(statusBarText);
    statusBarContainer.appendChild(circleStatusBar);
    profileContainer.appendChild(statusBarContainer);
    
    let isTextVisible = false;
    let hideTimeout;
    
    const showText = () => {
        clearTimeout(hideTimeout);
        statusBarText.classList.add('show');
        isTextVisible = true;
    };
    
    const hideText = () => {
        hideTimeout = setTimeout(() => {
            statusBarText.classList.remove('show');
            isTextVisible = false;
        }, 500);
    };
    
    statusBarContainer.addEventListener('mouseenter', showText);
    statusBarContainer.addEventListener('mouseleave', hideText);
    
    circleStatusBar.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isTextVisible) {
            statusBarText.classList.remove('show');
            isTextVisible = false;
        } else {
            showText();
        }
    });
    
    setTimeout(() => {
        statusBarContainer.style.opacity = '1';
    }, 800);
}

export default createStatusBar;
