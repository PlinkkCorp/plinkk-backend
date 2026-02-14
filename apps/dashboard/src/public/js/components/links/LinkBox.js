import { el } from '../../core/domUtils.js';
import { isSafeUrl, isSafeColor, setSafeText, disableDrag, disableContextMenuOnImage } from '../../security.js';

export function createLinkBox(linkData, config = {}) {
    const linkUrl = linkData.link;
    const linkSafe = isSafeUrl(linkUrl);
    
    const linkBox = el('a', {
        href: linkSafe ? linkUrl : '#',
        class: 'link-box',
        target: linkSafe ? '_blank' : undefined,
        rel: linkSafe ? 'noopener noreferrer' : undefined,
        'aria-label': linkData.text || 'Link'
    });
    
    if (!linkSafe && linkUrl) {
        linkBox.title = 'Lien non sécurisé';
        linkBox.style.opacity = '0.5';
    }
    
    if (linkData.icon) {
        const icon = el('img', {
            src: isSafeUrl(linkData.icon) ? linkData.icon : 'https://cdn.plinkk.fr/icons/link.svg',
            alt: '',
            class: 'link-icon',
            loading: 'lazy'
        });
        
        icon.onerror = function() {
            this.src = 'https://cdn.plinkk.fr/icons/link.svg';
        };
        
        disableDrag(icon);
        disableContextMenuOnImage(icon);
        linkBox.appendChild(icon);
    }
    
    const textSpan = el('span', { class: 'link-text' });
    setSafeText(textSpan, linkData.text || linkUrl || 'Link');
    linkBox.appendChild(textSpan);
    
    if (config.hoverColor && isSafeColor(config.hoverColor)) {
        linkBox.addEventListener('mouseenter', () => {
            linkBox.style.backgroundColor = config.hoverColor;
        });
        linkBox.addEventListener('mouseleave', () => {
            linkBox.style.backgroundColor = '';
        });
    }
    
    return linkBox;
}

export default createLinkBox;
