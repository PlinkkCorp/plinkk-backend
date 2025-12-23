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
        src: 'https://s3.marvideo.fr/plinkk-image/icons/email.svg',
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

export function createEmailAndDescription(profileData, config = {}) {
    const container = el('div', { class: 'email-description-container' });
    
    // Email section
    const emailDiv = el('div', { class: 'profile-email' });
    const email = profileData.email;
    
    if (email?.trim()) {
        const emailIcon = el('img', {
            src: 'https://s3.marvideo.fr/plinkk-image/icons/email.svg',
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
        
        emailDiv.appendChild(emailIcon);
        emailDiv.appendChild(emailText);
        emailDiv.appendChild(copyBtn);
    } else {
        emailDiv.style.display = 'none';
    }
    
    // Description section
    const descriptionDiv = el('div', { class: 'profile-description' });
    const descriptionText = el('p');
    
    if (profileData.description?.trim()) {
        // Escape HTML then convert newlines to <br> for line breaks
        const escapedDescription = profileData.description
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br>');
        descriptionText.innerHTML = escapedDescription;
        descriptionDiv.appendChild(descriptionText);
    } else {
        descriptionDiv.style.display = 'none';
        container.style.background = 'none';
    }
    
    container.appendChild(emailDiv);
    container.appendChild(descriptionDiv);
    
    return container;
}

export default createEmailContainer;
