import { el } from '../../core/domUtils.js';

export function createCopyModal() {
    const modalOverlay = el('div', {
        class: 'copy-modal-overlay',
        style: {
            display: 'none',
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: '9999',
            justifyContent: 'center',
            alignItems: 'center'
        }
    });
    
    const modal = el('div', {
        class: 'copy-modal',
        style: {
            backgroundColor: 'var(--theme-background, #1a1a2e)',
            padding: '2rem',
            borderRadius: '12px',
            textAlign: 'center',
            maxWidth: '90%',
            animation: 'fadeIn 0.3s ease'
        },
        html: `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="var(--theme-accent, #4ade80)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p style="margin-top: 1rem; color: var(--theme-text, #ffffff);">Email copié !</p>
        `
    });
    
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    return {
        show: () => {
            modalOverlay.style.display = 'flex';
            setTimeout(() => {
                modalOverlay.style.display = 'none';
            }, 1500);
        },
        hide: () => {
            modalOverlay.style.display = 'none';
        }
    };
}

export default createCopyModal;
