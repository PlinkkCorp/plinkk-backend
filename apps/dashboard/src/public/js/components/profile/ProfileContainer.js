import { el } from '../../core/domUtils.js';
import { isSafeUrl, isSafeColor, setSafeText, disableDrag, disableContextMenuOnImage } from '../../security.js';

function setupImageFallback(img, wrapper, userName) {
    img.onerror = function() {
        try {
            if (!this._triedFallback) {
                this._triedFallback = true;
                this.src = "/public/images/logo.png";
                return;
            }
        } catch (e) {}
        
        try {
            this.onerror = null;
            this.style.display = 'none';
            
            const span = document.createElement('span');
            span.className = 'profile-pic-initial';
            span.textContent = (userName || '').trim().charAt(0).toUpperCase() || '';
            
            if (wrapper && wrapper.contains(this)) {
                wrapper.removeChild(this);
                wrapper.appendChild(span);
            }
        } catch (e) {
            try { this.style.display = 'none'; } catch (e) {}
        }
    };
}

export function createProfileContainer(profileData) {
    const profileContainer = el('div', { class: 'profile-container' });
    
    const profileLink = el('a', {
        href: isSafeUrl(profileData.profileLink) ? profileData.profileLink : '#',
        target: isSafeUrl(profileData.profileLink) ? '_blank' : undefined,
        rel: isSafeUrl(profileData.profileLink) ? 'noopener noreferrer' : undefined,
        title: !isSafeUrl(profileData.profileLink) ? 'Lien non valide' : undefined,
        tabindex: '0'
    });
    
    const profilePicWrapper = el('div', { class: 'profile-pic-wrapper' });
    
    const profilePic = el('img', {
        src: isSafeUrl(profileData.profileImage) ? profileData.profileImage : '/public/images/logo.png',
        alt: 'Profile Picture',
        class: 'profile-pic',
        loading: 'lazy'
    });
    
    setupImageFallback(profilePic, profilePicWrapper, profileData.userName);
    disableDrag(profilePic);
    disableContextMenuOnImage(profilePic);
    
    profilePicWrapper.appendChild(profilePic);
    
    const profileLinkDiv = el('div', { class: 'profile-link' });
    const profileLinkSpan = el('span');
    
    const profileIcon = el('img', {
        src: isSafeUrl(profileData.profileIcon) ? profileData.profileIcon : '/public/images/icons/default-icon.svg',
        alt: 'globe',
        class: 'profile-icon',
        loading: 'lazy'
    });
    
    profileIcon.onerror = function() {
        try {
            if (!this._triedFallback) {
                this._triedFallback = true;
                this.src = "/public/images/icons/default-icon.svg";
                return;
            }
        } catch (e) {}
        try {
            this.onerror = null;
            this.style.display = 'none';
        } catch (e) {}
    };
    
    disableDrag(profileIcon);
    disableContextMenuOnImage(profileIcon);
    
    const profileSiteText = el('p');
    setSafeText(profileSiteText, profileData.profileSiteText);
    
    profileLinkSpan.appendChild(profileIcon);
    profileLinkSpan.appendChild(profileSiteText);
    profileLinkDiv.appendChild(profileLinkSpan);
    profileLink.appendChild(profilePicWrapper);
    profileLink.appendChild(profileLinkDiv);
    profileContainer.appendChild(profileLink);
    
    if (!profileData.profileSiteText?.trim()) {
        profileSiteText.style.display = 'none';
    }
    if (!profileData.profileImage?.trim()) {
        profilePic.style.display = 'none';
    }
    if (!profileData.profileIcon?.trim()) {
        profileIcon.style.display = 'none';
    }
    if (!profileData.profileLink?.trim()) {
        profileLink.style.display = 'none';
    }
    if (!profileData.profileHoverColor?.trim() || !isSafeColor(profileData.profileHoverColor)) {
        profileContainer.style.display = 'none';
    }
    
    return profileContainer;
}

export default createProfileContainer;
