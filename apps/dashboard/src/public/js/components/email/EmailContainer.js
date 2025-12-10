import { el } from '../../core/domUtils.js';
import { isSafeUrl, setSafeText } from '../../security.js';
import { createCopyButton } from './CopyButton.js';
import { createCopyModal } from './CopyModal.js';
import { handleCopySpam } from '../../features/easterEggs/copySpam.js';

export function createEmailContainer(profileData, config = {}) {
    const email = profileData.email;
    if (!email?.trim()) return null;
    
    const container = el('div', { class: 'email-container' });
    
    const emailIcon = el('img', {
        src: '/public/images/icons/email.svg',
        alt: 'email',
        class: 'email-icon'
    });
    
    const emailText = el('span', { class: 'email-text' });
    setSafeText(emailText, email);
    
    const copyModal = createCopyModal();
    
    let copyCount = 0;
    const SPAM_THRESHOLD = 10;
    let resetTimeout;
    
    const copyBtn = createCopyButton(async () => {
        try {
            await navigator.clipboard.writeText(email);
            copyCount++;
            
            clearTimeout(resetTimeout);
            resetTimeout = setTimeout(() => {
                copyCount = 0;
            }, 5000);
            
            if (copyCount >= SPAM_THRESHOLD) {
                handleCopySpam();
                copyCount = 0;
            } else {
                copyModal.show();
            }
        } catch (err) {
            console.error('Failed to copy email:', err);
        }
    });
    
    container.appendChild(emailIcon);
    container.appendChild(emailText);
    container.appendChild(copyBtn);
    
    return container;
}

export default createEmailContainer;
