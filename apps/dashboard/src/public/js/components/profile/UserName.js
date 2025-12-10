import { el } from '../../core/domUtils.js';
import { setSafeText } from '../../security.js';

const BADGE_SVGS = {
    verified: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" fill="#3B82F6" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7.75 12.75L10.25 15.25L16.25 8.75" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `,
    partner: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#A855F7" stroke="#A855F7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `
};

function createBadge(type, title) {
    const badge = el('div', {
        class: `badge ${type}-badge`,
        title: title,
        html: BADGE_SVGS[type]
    });
    return badge;
}

export function createUserName(profileData) {
    const userNameContainer = el('div', {
        class: 'username-container',
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            flexWrap: 'wrap'
        }
    });
    
    const userName = el('h1', { style: { margin: '0' } });
    setSafeText(userName, profileData.userName);
    userNameContainer.appendChild(userName);
    
    if (profileData.isVerified && profileData.showVerifiedBadge) {
        userNameContainer.appendChild(createBadge('verified', 'Compte vérifié'));
    }
    
    if (profileData.isPartner && profileData.showPartnerBadge) {
        userNameContainer.appendChild(createBadge('partner', 'Partenaire Plinkk'));
    }
    
    if (!profileData.userName?.trim()) {
        userNameContainer.style.display = 'none';
    }
    
    return userNameContainer;
}

export default createUserName;
