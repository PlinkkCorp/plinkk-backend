import { el } from '../../core/domUtils.js';
import { isSafeUrl, disableDrag, disableContextMenuOnImage } from '../../security.js';

const DEFAULT_ICONS = {
    twitter: 'https://cdn.plinkk.fr/icons/twitter.svg',
    instagram: 'https://cdn.plinkk.fr/icons/instagram.svg',
    youtube: 'https://cdn.plinkk.fr/icons/youtube.svg',
    tiktok: 'https://cdn.plinkk.fr/icons/tiktok.svg',
    discord: 'https://cdn.plinkk.fr/icons/discord.svg',
    github: 'https://cdn.plinkk.fr/icons/github.svg',
    linkedin: 'https://cdn.plinkk.fr/icons/linkedin.svg',
    twitch: 'https://cdn.plinkk.fr/icons/twitch.svg',
    default: 'https://cdn.plinkk.fr/icons/link.svg'
};

function detectPlatform(url) {
    if (!url) return 'default';
    const lowerUrl = url.toLowerCase();
    
    for (const platform of Object.keys(DEFAULT_ICONS)) {
        if (platform !== 'default' && lowerUrl.includes(platform)) {
            return platform;
        }
    }
    
    return 'default';
}

export function createSocialIcon(iconData) {
    const url = iconData.link;
    const safe = isSafeUrl(url);
    
    const link = el('a', {
        href: safe ? url : '#',
        class: 'social-icon-link',
        target: safe ? '_blank' : undefined,
        rel: safe ? 'noopener noreferrer' : undefined,
        'aria-label': iconData.label || detectPlatform(url)
    });
    
    const platform = detectPlatform(url);
    const iconSrc = iconData.icon && isSafeUrl(iconData.icon) 
        ? iconData.icon 
        : DEFAULT_ICONS[platform];
    
    const icon = el('img', {
        src: iconSrc,
        alt: iconData.label || platform,
        class: 'social-icon',
        loading: 'lazy'
    });
    
    icon.onerror = function() {
        this.src = DEFAULT_ICONS.default;
    };
    
    disableDrag(icon);
    disableContextMenuOnImage(icon);
    link.appendChild(icon);
    
    return link;
}

export default createSocialIcon;
