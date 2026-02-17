import { setSafeText, isSafeUrl, isSafeColor, disableDrag, disableContextMenuOnImage } from './security.js';
import { btnIconThemeConfig } from '../config/btnIconThemeConfig.js'
export function createProfileContainer(profileData) {
    const profileContainer = document.createElement("div");
    profileContainer.className = "profile-container";
    const profileLink = document.createElement("a");
    if (isSafeUrl(profileData.profileLink)) {
        profileLink.href = profileData.profileLink;
        profileLink.target = "_blank";
        profileLink.rel = "noopener noreferrer";
    }
    else {
        profileLink.href = "#";
        profileLink.title = "Lien non valide";
    }
    profileLink.tabIndex = 0;
    const profilePicWrapper = document.createElement("div");
    profilePicWrapper.className = "profile-pic-wrapper animate-pulse bg-white/10";

    const cosmetics = profileData.cosmetics || {};
    const frame = cosmetics.frame;
    if (frame && frame !== 'none') {
        const frameDiv = document.createElement("div");
        frameDiv.className = "avatar-frame";
        frameDiv.style.position = "absolute";
        frameDiv.style.inset = "-4px";
        frameDiv.style.borderRadius = "50%";
        frameDiv.style.pointerEvents = "none";
        frameDiv.style.zIndex = "10";

        if (frame === 'neon') {
            frameDiv.style.boxShadow = "0 0 0 2px rgba(139,92,246,0.8), 0 0 15px rgba(139,92,246,0.6), inset 0 0 10px rgba(139,92,246,0.4)";
        } else if (frame === 'glow') {
            frameDiv.style.boxShadow = "0 0 0 2px rgba(16,185,129,0.8), 0 0 15px rgba(16,185,129,0.6)";
        } else if (frame === 'gold') {
            frameDiv.style.boxShadow = "0 0 0 2px rgba(234,179,8,0.8), 0 0 15px rgba(234,179,8,0.4)";
        }
        profilePicWrapper.style.position = "relative";
        profilePicWrapper.appendChild(frameDiv);
    }

    const profilePic = document.createElement("img");
    if (isSafeUrl(profileData.profileImage)) {
        profilePic.src = profileData.profileImage;
    }
    else {
        profilePic.src = "https://cdn.plinkk.fr/logo.svg";
    }
    profilePic.onerror = function () {
        try {
            if (!this._triedFallback) {
                this._triedFallback = true;
                this.src = "https://cdn.plinkk.fr/logo.svg";
                return;
            }
        }
        catch (e) {
            // ignore
        }
        try {
            this.onerror = null;
            this.style.display = 'none';
            profilePicWrapper.classList.remove('animate-pulse', 'bg-white/10');
            const span = document.createElement('span');
            span.className = 'profile-pic-initial';
            span.textContent = (profileData.userName || '').trim().charAt(0).toUpperCase() || '';
            if (profilePicWrapper && profilePicWrapper.contains(this)) {
                profilePicWrapper.removeChild(this);
                profilePicWrapper.appendChild(span);
            }
        }
        catch (e) {
            try { this.style.display = 'none'; profilePicWrapper.classList.remove('animate-pulse', 'bg-white/10'); } catch (e) { }
        }
    };
    profilePic.alt = "Profile Picture";
    profilePic.className = "profile-pic opacity-0 transition-opacity duration-300";
    profilePic.onload = function () {
        this.classList.remove('opacity-0');
        profilePicWrapper.classList.remove('animate-pulse', 'bg-white/10');
    };
    profilePic.loading = "lazy";
    disableDrag(profilePic);
    disableContextMenuOnImage(profilePic);
    profilePicWrapper.appendChild(profilePic);
    const profileLinkDiv = document.createElement("div");
    profileLinkDiv.className = "profile-link";
    const profileLinkSpan = document.createElement("span");

    const profileIconWrapper = document.createElement("span");
    profileIconWrapper.className = "profile-icon-wrapper animate-pulse bg-white/10";
    profileIconWrapper.style.display = "inline-flex";
    profileIconWrapper.style.alignItems = "center";
    profileIconWrapper.style.justifyContent = "center";
    profileIconWrapper.style.borderRadius = "50%";
    profileIconWrapper.style.width = "100px";
    profileIconWrapper.style.height = "100px";
    profileIconWrapper.style.marginRight = "6px";
    profileIconWrapper.style.overflow = "hidden";

    const profileIcon = document.createElement("img");
    if (isSafeUrl(profileData.profileIcon)) {
        profileIcon.src = profileData.profileIcon;
    }
    else {
        profileIcon.src = "https://cdn.plinkk.fr/default_profile.png";
    }
    profileIcon.onerror = function () {
        profileIconWrapper.classList.remove('animate-pulse', 'bg-white/10');
        try {
            if (!this._triedFallback) {
                this._triedFallback = true;
                this.src = "https://cdn.plinkk.fr/default_profile.png";
                return;
            }
        }
        catch (e) { }
        try {
            this.onerror = null;
            this.style.display = 'none';
            profileIconWrapper.style.display = 'none';
        }
        catch (e) { }
    };
    profileIcon.onload = function () {
        this.classList.remove('opacity-0');
        profileIconWrapper.classList.remove('animate-pulse', 'bg-white/10');
    };
    profileIcon.alt = "globe";
    profileIcon.className = "profile-icon opacity-0 transition-opacity duration-300";
    profileIcon.style.width = "100%";
    profileIcon.style.height = "100%";
    profileIcon.style.objectFit = "contain";
    profileIcon.loading = "lazy";
    disableDrag(profileIcon);
    disableContextMenuOnImage(profileIcon);
    const profileSiteText = document.createElement("p");
    setSafeText(profileSiteText, profileData.profileSiteText);
    profileIconWrapper.appendChild(profileIcon);
    profileLinkSpan.appendChild(profileIconWrapper);
    profileLinkSpan.appendChild(profileSiteText);
    profileLinkDiv.appendChild(profileLinkSpan);
    profileLink.appendChild(profilePicWrapper);
    profileLink.appendChild(profileLinkDiv);
    profileContainer.appendChild(profileLink);
    if (profileData.profileSiteText.trim() === "") {
        profileSiteText.style.display = "none";
    }
    if (profileData.profileImage.trim() === "") {
        profilePic.style.display = "none";
    }
    if (profileData.profileIcon.trim() === "") {
        profileIcon.style.display = "none";
    }
    if (profileData.profileLink.trim() === "") {
        profileLink.style.display = "none";
    }
    if (profileData.profileHoverColor.trim() === "" || !isSafeColor(profileData.profileHoverColor)) {
        profileContainer.style.display = "none";
    }
    return profileContainer;
}
export function createUserName(profileData) {
    const userName = document.createElement("h1");
    setSafeText(userName, profileData.userName);

    if (profileData.isVerified && profileData.showVerifiedBadge) {
        const verifiedBadge = document.createElement("span");
        verifiedBadge.className = "badge verified-badge";
        verifiedBadge.title = "Vérifié";
        verifiedBadge.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: text-bottom;"><path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" fill="#3B82F6" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.75 12.75L10.25 15.25L16.25 8.75" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        verifiedBadge.style.marginLeft = "6px";
        verifiedBadge.style.verticalAlign = "middle";
        verifiedBadge.style.display = "inline-flex";
        userName.appendChild(verifiedBadge);
    }

    if (profileData.isPartner && profileData.showPartnerBadge) {
        const partnerBadge = document.createElement("span");
        partnerBadge.className = "badge partner-badge";
        partnerBadge.title = "Partenaire";
        partnerBadge.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: text-bottom;"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#A855F7" stroke="#A855F7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        partnerBadge.style.marginLeft = "4px";
        partnerBadge.style.verticalAlign = "middle";
        partnerBadge.style.display = "inline-flex";
        userName.appendChild(partnerBadge);
    }

    if (!profileData.userName.trim()) {
        userName.style.display = "none";
    }
    return userName;
}
export function createEmailAndDescription(profileData) {
    const container = document.createElement("div");
    container.className = "email-description-container";
    const emailDiv = document.createElement("div");
    emailDiv.className = "email";
    emailDiv.style.position = "relative"; // Pour le positionnement du modal
    emailDiv.style.padding = "0";
    const emailLink = document.createElement("a");
    emailLink.href = `mailto:${profileData.email}`;
    setSafeText(emailLink, profileData.email);
    emailLink.style.display = "block"; // pour que le padding s'applique sur toute la largeur
    emailLink.style.padding = "12px"; // padding interne
    emailLink.style.textAlign = "center"; // centrer le texte
    emailDiv.appendChild(emailLink);
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.title = "Copier l'email";
    copyBtn.className = "copy-btn";
    copyBtn.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
    `;
    emailDiv.appendChild(copyBtn);

    // --- Système de spam & easter egg ---
    let spamCount = 0;
    let lastClick = 0;
    let resetTimeout = null;
    let iconTimeout = null;
    let rpLaunched = false;
    copyBtn.addEventListener("click", () => {
        const now = Date.now();
        if (now - lastClick < 400) {
            spamCount++;
        }
        else {
            spamCount = 1;
            rpLaunched = false; // reset RP si on arrête de spam
            // reset visuel si besoin
            copyBtn.classList.remove("btn-crack", "btn-broken", "btn-explode");
            copyBtn.style.cssText = "";
        }
        lastClick = now;
        // Reset du compteur après 5s sans clic
        if (resetTimeout)
            clearTimeout(resetTimeout);
        resetTimeout = setTimeout(() => {
            spamCount = 0;
            rpLaunched = false;
            copyBtn.classList.remove("btn-crack", "btn-broken", "btn-explode");
            copyBtn.style.cssText = "";
        }, 5000);
        // Vibrations
        if (spamCount >= 3 && spamCount < 6) {
            copyBtn.classList.add("vibrate_btn");
            setTimeout(() => copyBtn.classList.remove("vibrate_btn"), 200);
        }
        else if (spamCount >= 6 && spamCount < 10) {
            emailDiv.classList.add("vibrate_parent");
            setTimeout(() => emailDiv.classList.remove("vibrate_parent"), 200);
        }
        else if (spamCount >= 10 && spamCount < 100) {
            document.body.classList.add("vibrate_parent");
            setTimeout(() => document.body.classList.remove("vibrate_parent"), 200);
        }
        // Copie dans le presse-papier
        if (navigator.clipboard) {
            navigator.clipboard.writeText(profileData.email)
                .then(() => {
                    copyBtn.innerHTML = `
                        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    `;
                    // Timer indépendant pour l'icône
                    if (iconTimeout)
                        clearTimeout(iconTimeout);
                    iconTimeout = setTimeout(() => {
                        copyBtn.innerHTML = `
                            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        `;
                    }, 2000);
                })
                .catch(() => {
                    showCopyModal("Erreur lors de la copie", copyBtn);
                });
        }
        else {
            // Fallback : sélection manuelle
            const tempInput = document.createElement("input");
            tempInput.value = profileData.email;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand("copy");
            document.body.removeChild(tempInput);
            showCopyModal("Copié (fallback)", copyBtn);
        }
        // RP spécial à partir de 100
        if (spamCount >= 100 && !rpLaunched) {
            rpLaunched = true;
            launchCopyRP(copyBtn, emailDiv, () => {
                // callback à la fin du RP (optionnel)
            });
            return;
        }
        // Effets progressifs selon le spamCount
        if (spamCount >= 200 && spamCount < 500) {
            copyBtn.classList.add("btn-crack");
        }
        else if (spamCount >= 500 && spamCount < 1000) {
            copyBtn.classList.remove("btn-crack");
            copyBtn.classList.add("btn-broken");
        }
        else if (spamCount >= 1000) {
            copyBtn.classList.remove("btn-broken");
            copyBtn.classList.add("btn-explode");
            copyBtn.innerHTML = "💥";
            setTimeout(() => {
                copyBtn.style.opacity = "0";
                showCopyModal("Le bouton a explosé !", copyBtn);
            }, 800);
            return;
        }
        // Messages d'easter egg classiques
        let msg = "";
        if (spamCount === 1)
            msg = "Copie !";
        else if (spamCount === 2)
            msg = "Super Copie !";
        else if (spamCount === 3)
            msg = "Hyper Copie !";
        else if (spamCount === 4)
            msg = "Ultra Copie !";
        else if (spamCount === 5)
            msg = "Mega Copie !";
        else if (spamCount === 6)
            msg = "Stop spam 😅";
        else if (spamCount > 6 && spamCount < 10)
            msg = "Trop de copies !";
        else if (spamCount >= 10 && spamCount < 20)
            msg = "Arrête de spammer !";
        else if (spamCount >= 20 && spamCount < 30)
            msg = "Tu es vraiment motivé à copier !";
        else if (spamCount >= 30 && spamCount < 40)
            msg = "Tu ne t'arrêtes jamais ?";
        else if (spamCount >= 40 && spamCount < 50)
            msg = "Toujours là ?";
        else if (spamCount >= 50 && spamCount < 60)
            msg = "C'est infini ?";
        else if (spamCount >= 60 && spamCount < 70)
            msg = "Tu veux casser le bouton ?";
        else if (spamCount >= 70 && spamCount < 80)
            msg = "Courageux !";
        else if (spamCount >= 80 && spamCount < 90)
            msg = "Toujours pas fatigué ?";
        else if (spamCount >= 90 && spamCount < 100)
            msg = "100 bientôt !";
        else if (spamCount >= 100 && spamCount < 101)
            msg = "Tu es un vrai spammeur !";
        if (msg)
            showCopyModal(msg, copyBtn);
    });
    // RP avec histoire et effets
    function launchCopyRP(copyBtn, emailDiv, onEnd) {
        const rpMessages = [
            "💥 Le bouton commence à chauffer...",
            "😱 Tu sens cette odeur de plastique brûlé ?",
            "⚡ Des fissures apparaissent sur le bouton !",
            "🛑 Le bouton crie : « Arrête de me copier ! »",
            "🔥 Le bouton se fissure de plus en plus...",
            "🤖 Le bouton : « Je vais craquer... »",
            "🌈 Explosion de couleurs !",
            "🎉 Le bouton se déforme et tremble...",
            "👏 Tu es un vrai spammeur !"
        ];
        let i = 0;
        let rpInterval = setInterval(() => {
            showCopyModal(rpMessages[i], copyBtn);
            // Effets visuels progressifs
            if (i === 2) {
                copyBtn.classList.add("btn-crack");
            }
            if (i === 4) {
                copyBtn.classList.add("vibrate_btn");
            }
            if (i === 6) {
                copyBtn.style.background = "linear-gradient(90deg, #ff00cc, #3333ff)";
                copyBtn.style.color = "#fff";
            }
            if (i === 7) {
                copyBtn.classList.add("btn-broken");
            }
            i++;
            if (i >= rpMessages.length) {
                clearInterval(rpInterval);
                if (onEnd)
                    onEnd();
            }
        }, 1200);
    }
    // Description
    const descriptionDiv = document.createElement("div");
    descriptionDiv.className = "profile-description";
    const descriptionText = document.createElement("p");
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
    container.appendChild(emailDiv);
    container.appendChild(descriptionDiv);
    // Affichage conditionnel
    if (!profileData.description.trim()) {
        descriptionDiv.style.display = "none";
        container.style.background = "none";
    }
    if (!profileData.email.trim())
        emailDiv.style.display = "none";
    return container;
}
// Modal localisé au bouton, au-dessus ou en dessous selon la place
export function showCopyModal(message, btn) {
    let modal = btn.parentNode.querySelector(".copy-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.className = "copy-modal";
        btn.parentNode.appendChild(modal);
    }
    modal.textContent = message;
    modal.classList.add("show");
    modal.style.position = "absolute";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -100%)";
    modal.style.background = "rgba(40,40,40,0.95)";
    modal.style.color = "#fff";
    modal.style.padding = "8px 18px";
    modal.style.borderRadius = "8px";
    modal.style.fontSize = "1em";
    modal.style.fontWeight = "bold";
    modal.style.boxShadow = "0 4px 24px rgba(0,0,0,0.25)";
    modal.style.pointerEvents = "none";
    modal.style.zIndex = "100";
    modal.style.transition = "opacity 0.3s cubic-bezier(0.4,0,0.2,1)";
    // Calcul de la place à l'écran
    const btnRect = btn.getBoundingClientRect();
    const modalHeight = 60;
    if (btnRect.top - modalHeight < 10) {
        modal.style.top = "calc(100% + 10px)";
        modal.style.transform = "translate(-50%, 0)";
    }
    else {
        modal.style.top = "-10px";
        modal.style.transform = "translate(-50%, -100%)";
    }
    modal.style.opacity = "1";
    clearTimeout(modal._timeout);
    modal._timeout = setTimeout(() => {
        modal.classList.remove("show");
        modal.style.opacity = "0";
    }, 1500);
}
export function createLinkBoxes(profileData) {
    const maxLinkNumber = 20;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!profileData.links || !profileData.links.length) {
        console.warn("No links found in profile data.");
        return [];
    }

    // Helper to create a single link box
    const createBox = (link) => {
        // --- 0. Schedule & Expiration Check (Client-side) ---
        const now = new Date();
        if (link.scheduledAt && new Date(link.scheduledAt) > now) {
            return document.createComment(`Link ${link.id} hidden due to schedule`);
        }
        if (link.expiresAt && new Date(link.expiresAt) < now) {
            return document.createComment(`Link ${link.id} hidden due to expiration`);
        }

        // --- 1. Ephemeral Link Check (Client-side) ---
        if (link.clickLimit > 0 && typeof link.clicks === 'number' && link.clicks >= link.clickLimit) {
            return document.createComment(`Link ${link.id} hidden due to click limit`);
        }

        if (link.type === 'HEADER') {
            const header = document.createElement('h3');
            header.className = 'link-header';
            header.textContent = link.text;
            header.style.color = profileData.textColor || '#fff';
            header.style.marginTop = '16px';
            header.style.marginBottom = '8px';
            header.style.textAlign = 'center';
            header.style.width = '100%';
            header.style.fontSize = '1.2rem';
            return header;
        }

        // --- 2. Lead/Form Handling ---
        if (link.type === 'FORM' && link.formData) {
            const container = document.createElement("div");
            container.className = "discord-box form-box";
            container.style.overflow = "visible";

            // Create toggle button (looks like a link)
            const toggle = document.createElement("button");
            toggle.className = "form-toggle-btn";

            const icon = document.createElement("img");
            icon.src = link.icon || 'https://cdn.plinkk.fr/icons/mail.svg';
            icon.className = "w-6 h-6 object-contain";
            icon.loading = "lazy";
            icon.style.position = "relative";
            icon.style.zIndex = "5";
            icon.style.animation = "none";

            const text = document.createElement("span");
            text.textContent = link.text || "Contactez-nous";
            text.style.fontWeight = "600";
            text.style.position = "relative";
            text.style.zIndex = "5";

            const chevron = document.createElement("div");
            chevron.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
            chevron.style.marginLeft = "auto";
            chevron.style.opacity = "0.5";
            chevron.style.transition = "transform 0.3s ease";
            chevron.style.position = "relative";
            chevron.style.zIndex = "5";

            toggle.appendChild(icon);
            toggle.appendChild(text);
            toggle.appendChild(chevron);

            // Form Content Container
            const formContent = document.createElement("div");
            formContent.className = "form-content hidden";
            formContent.style.opacity = "0";
            formContent.style.transform = "translateY(8px)";
            formContent.style.transition = "opacity 0.4s ease, transform 0.4s ease";

            // Build inputs from formData fields
            const inputs = [];
            const fields = link.formData.fields || [];
            fields.forEach(field => {
                const wrapper = document.createElement("div");
                wrapper.className = "form-field-wrapper";

                const label = document.createElement("label");

                let labelIcon = '';
                const labelText = (field.label || '').toUpperCase();
                if (labelText.includes('NOM') || labelText.includes('NAME')) {
                    labelIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
                } else if (labelText.includes('MAIL')) {
                    labelIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
                } else if (labelText.includes('MESSAGE') || labelText.includes('SUJET')) {
                    labelIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
                }

                label.innerHTML = `${labelIcon}${field.label}`;

                let input;
                if (field.type === 'textarea') {
                    input = document.createElement("textarea");
                    input.rows = 4;
                } else {
                    input = document.createElement("input");
                    input.type = field.type || "text";
                }
                input.placeholder = field.placeholder || "";
                input.name = field.name || field.label;
                input.required = field.required !== false;

                inputs.push({ name: field.name, element: input });

                wrapper.appendChild(label);
                wrapper.appendChild(input);
                formContent.appendChild(wrapper);
            });

            // Submit Button
            const submitBtn = document.createElement("button");
            submitBtn.className = "form-submit-btn";

            const shine = document.createElement("div");
            shine.className = "shine";
            submitBtn.appendChild(shine);

            const btnText = document.createElement("span");
            btnText.textContent = link.formData.buttonText || "Envoyer";
            btnText.style.position = "relative";
            btnText.style.zIndex = "2";
            submitBtn.appendChild(btnText);

            const statusMsg = document.createElement("div");
            statusMsg.className = "form-status hidden";

            submitBtn.onclick = async (e) => {
                e.preventDefault();
                submitBtn.disabled = true;
                btnText.textContent = "Envoi en cours...";

                // Collect data
                const data = {};
                let valid = true;
                inputs.forEach(item => {
                    data[item.name] = item.element.value;
                    if (item.element.required && !item.element.value) {
                        valid = false;
                        item.element.style.borderColor = "rgba(248, 113, 113, 0.5)";
                        item.element.style.background = "rgba(248, 113, 113, 0.05)";
                    } else {
                        item.element.style.borderColor = "";
                        item.element.style.background = "";
                    }
                });

                if (!valid) {
                    statusMsg.textContent = "Veuillez remplir tous les champs obligatoires.";
                    statusMsg.className = "form-status error";
                    statusMsg.classList.remove("hidden");
                    submitBtn.disabled = false;
                    btnText.textContent = link.formData.buttonText || "Envoyer";
                    return;
                }

                try {
                    const res = await fetch("/api/lead", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ linkId: link.id, data })
                    });

                    if (res.ok) {
                        statusMsg.textContent = link.formData.successMessage || "Message envoyé avec succès !";
                        statusMsg.className = "form-status success";
                        inputs.forEach(i => i.element.value = "");
                        setTimeout(() => {
                            if (!formContent.classList.contains("hidden")) toggle.click();
                        }, 2500);
                    } else {
                        throw new Error("Erreur serveur");
                    }
                } catch (err) {
                    statusMsg.textContent = "Une erreur est survenue. Réessayez.";
                    statusMsg.className = "form-status error";
                } finally {
                    statusMsg.classList.remove("hidden");
                    submitBtn.disabled = false;
                    btnText.textContent = link.formData.buttonText || "Envoyer";
                }
            };

            formContent.appendChild(submitBtn);
            formContent.appendChild(statusMsg);

            // Toggle logic with animations
            toggle.onclick = () => {
                const isHidden = formContent.classList.contains("hidden");
                if (isHidden) {
                    formContent.classList.remove("hidden");
                    chevron.style.transform = "rotate(180deg)";
                    setTimeout(() => {
                        formContent.style.opacity = "1";
                        formContent.style.transform = "translateY(0)";
                    }, 10);
                } else {
                    formContent.style.opacity = "0";
                    formContent.style.transform = "translateY(8px)";
                    chevron.style.transform = "rotate(0deg)";
                    setTimeout(() => {
                        formContent.classList.add("hidden");
                    }, 400);
                }
            };

            container.appendChild(toggle);
            container.appendChild(formContent);
            return container;
        }

        // --- 3. Embed Handling ---
        if (link.type === 'EMBED' && link.embedData) {
            const container = document.createElement("div");
            container.className = "discord-box embed-box";
            container.style.padding = "0";
            container.style.overflow = "hidden";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.borderRadius = "12px"; // slightly more rounded for embeds
            container.style.border = "1px solid rgba(255,255,255,0.1)";

            if (link.embedData.url) {
                let embedUrl = link.embedData.url;
                let isSpotify = false;
                let isYouTube = false;

                // --- SMART EMBED LOGIC ---
                try {
                    const urlObj = new URL(embedUrl);

                    // 1. YouTube
                    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
                        isYouTube = true;
                        let videoId = null;
                        if (urlObj.hostname.includes('youtu.be')) {
                            videoId = urlObj.pathname.slice(1);
                        } else if (urlObj.pathname.includes('/watch')) {
                            videoId = urlObj.searchParams.get('v');
                        } else if (urlObj.pathname.includes('/embed/')) {
                            videoId = urlObj.pathname.split('/embed/')[1];
                        }

                        if (videoId) {
                            embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
                        }
                    }

                    // 2. Spotify
                    if (urlObj.hostname.includes('spotify.com')) {
                        isSpotify = true;
                        // open.spotify.com/track/ID -> open.spotify.com/embed/track/ID
                        if (!urlObj.pathname.includes('/embed')) {
                            // Handle standard web player links
                            embedUrl = `https://open.spotify.com/embed${urlObj.pathname}`;
                        }
                    }

                    // 3. SoundCloud (basic iframe support usually requires their widget API, but check for visual player param)
                    if (urlObj.hostname.includes('soundcloud.com')) {
                        // SoundCloud usually needs oEmbed to get the widget URL from a track URL.
                        // For now we assume the user might paste the widget URL or we leave it as is.
                        // Improving this would require a backend proxy or client-side fetch if possible.
                    }

                } catch (e) {
                    // Invalid URL, ignore smart transformation
                    console.warn("Invalid embed URL:", embedUrl);
                }

                const iframe = document.createElement("iframe");
                iframe.src = embedUrl;
                iframe.style.width = "100%";
                iframe.style.border = "none";

                // Adjust height based on type
                if (isSpotify) {
                    iframe.style.height = "152px"; // Standard Spotify compact embed height (80 or 152)
                    iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
                } else if (isYouTube) {
                    iframe.style.aspectRatio = "16/9";
                    iframe.style.height = "auto";
                    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                } else {
                    iframe.style.height = "100%";
                    iframe.style.minHeight = "200px";
                }

                iframe.loading = "lazy";

                container.appendChild(iframe);
            } else {
                container.textContent = "Contenu intégré invalide";
                container.style.padding = "16px";
                container.style.textAlign = "center";
                container.style.opacity = "0.7";
            }
            return container;
        }

        // --- 4. Standard Link (with OS Redirection) ---
        const discordBox = document.createElement("div");
        const iconWrapper = document.createElement("div");
        iconWrapper.className = "link-icon-wrapper animate-pulse bg-white/5 rounded flex items-center justify-center shrink-0";
        iconWrapper.style.width = "32px";
        iconWrapper.style.height = "32px";
        iconWrapper.style.overflow = "hidden";

        const discordIcon = document.createElement("img");
        discordIcon.className = "opacity-0 transition-opacity duration-300";
        discordIcon.onload = () => {
            discordIcon.classList.remove('opacity-0');
            iconWrapper.classList.remove('animate-pulse', 'bg-white/5');
        };
        discordIcon.onerror = () => {
            iconWrapper.classList.remove('animate-pulse', 'bg-white/5');
        };

        const discordLink = document.createElement("a");

        // --- OS Redirection & Direct Link Logic ---
        let finalUrl = link.url;
        try {
            const ua = navigator.userAgent || navigator.vendor || window.opera;
            const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
            const isAndroid = /android/i.test(ua);

            if (isIOS && link.iosUrl && link.iosUrl.trim()) {
                finalUrl = link.iosUrl;
            } else if (isAndroid && link.androidUrl && link.androidUrl.trim()) {
                finalUrl = link.androidUrl;
            }
        } catch (e) { }

        if (isSafeUrl(finalUrl)) {
            // Apply redirection
            // If forceAppOpen is true, use finalUrl directly (bypass tracking for deep links to ensure app opening)
            // Otherwise, use /click/ tracking unless user is on localhost/preview

            const isDirect = link.forceAppOpen || finalUrl !== link.url;

            if (isDirect) {
                discordLink.href = finalUrl;
            } else {
                discordLink.href = window.location.hostname === "plinkk.fr" ? "/click/" + link.id : finalUrl;
            }

            discordLink.id = link.id
            discordLink.target = "_blank";
            discordLink.rel = "noopener noreferrer";
        }
        else {
            discordLink.href = "#";
            discordLink.title = "Lien non valide";
        }

        if (profileData.buttonThemeEnable === 1) {
            let themeConfig = null;
            if (link.buttonTheme && link.buttonTheme !== 'system') {
                themeConfig = btnIconThemeConfig === null || btnIconThemeConfig === void 0 ? void 0 : btnIconThemeConfig.find(config => config.themeClass === link.buttonTheme);
            } else {
                themeConfig = btnIconThemeConfig === null || btnIconThemeConfig === void 0 ? void 0 : btnIconThemeConfig.find(config => config.name === link.name);
            }

            if (themeConfig) {
                const themeClass = themeConfig.themeClass;
                discordBox.className = `button ${themeClass}`;
                discordIcon.src = themeConfig.icon;
                discordIcon.loading = "lazy";
                discordIcon.classList.add("icon");
            }
            else {
                discordBox.className = "discord-box";
                discordIcon.src = String(link.icon || '').trim();
                discordIcon.alt = link.text;
                discordIcon.loading = "lazy";
                discordIcon.classList.add("link-icon");
            }
        }
        else {
            discordBox.className = "discord-box";
            discordIcon.src = String(link.icon || '').trim();
            discordIcon.alt = link.text;
            discordIcon.loading = "lazy";
            discordIcon.classList.add("link-icon");
        }

        // Selective inversion logic based on source
        const src = (discordIcon.src || '').toLowerCase();
        const isCatalogue = src.includes('s3.marvideo.fr') || src.includes('cdn.plinkk.fr') || src.startsWith('/icons/');
        const isBootstrap = src.includes('bi-') || src.includes('bootstrap-icons');
        const isJsDelivr = src.includes('cdn.jsdelivr.net');

        // Reset classes
        discordIcon.classList.remove('bi-invert', 'icon-cdn');

        if (isCatalogue || isBootstrap) {
            discordIcon.classList.add('icon-cdn');
        } else if (isJsDelivr) {
            discordIcon.classList.add('icon-black-source');
        }

        // Créer un conteneur pour le contenu principal (icône + texte)
        const mainContent = document.createElement("div");
        mainContent.style.display = "flex";
        mainContent.style.alignItems = "center";
        mainContent.style.gap = "12px";
        // Ajouter l'icône au conteneur principal
        iconWrapper.appendChild(discordIcon);
        mainContent.appendChild(iconWrapper);
        // Créer un span pour le texte
        const textSpan = document.createElement("span");
        textSpan.style.display = "inline-block";
        textSpan.style.flex = "1 1 auto";
        textSpan.style.minWidth = "0"; // important pour empêcher l'overflow dans les flex containers
        textSpan.style.textAlign = "center";
        textSpan.style.whiteSpace = "nowrap";
        textSpan.style.overflow = "hidden";
        textSpan.style.textOverflow = "ellipsis";
        textSpan.textContent = link.text;
        // Gérer les descriptions
        if (link.description && link.description.trim() !== "" && link.showDescription) {
            // Create the arrow emoji element
            const arrow = document.createElement("span");
            arrow.className = "desc-arrow";
            arrow.style.display = "inline-flex";
            arrow.style.alignItems = "center";
            arrow.style.justifyContent = "center";
            arrow.style.transition = "opacity 0.7s cubic-bezier(0.4,0,0.2,1)";
            arrow.style.opacity = "1";
            arrow.style.marginLeft = "5px";
            arrow.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none"
                xmlns="http://www.w3.org/2000/svg" style="display:block;margin:auto;">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1"
                stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            `;
            textSpan.appendChild(arrow);
            // Créer la description
            const desc = document.createElement("div");
            desc.className = "link-description";
            setSafeText(desc, link.description);
            desc.style.transition = "max-height 0.7s cubic-bezier(0.4,0,0.2,1), opacity 0.7s cubic-bezier(0.4,0,0.2,1), margin 0.7s cubic-bezier(0.4,0,0.2,1), padding 0.7s cubic-bezier(0.4,0,0.2,1)";
            desc.style.overflow = "hidden";
            desc.style.maxHeight = "0";
            desc.style.opacity = "0";
            desc.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
            desc.style.padding = "0 8px";
            desc.style.borderRadius = "5px";
            desc.style.border = "1px solid rgba(255, 255, 255, 0.5)";
            desc.style.display = "block";
            desc.style.width = "100%";
            desc.style.fontSize = "0.9em";
            discordIcon.style.transition = "transform 0.7s cubic-bezier(0.4,0,0.2,1)";
            if (profileData.buttonThemeEnable === 1) {
                discordIcon.style.transform = "translateY(3px)";
            }
            arrow.style.transform = "translateY(3px)";

            let showDescBtn = null;
            if (isTouchDevice) {
                desc.style.marginTop = "-1em"
                // Sur mobile/tactile : bouton pour afficher/masquer la description
                showDescBtn = document.createElement("button");
                showDescBtn.textContent = "Afficher la description";
                showDescBtn.className = "show-desc-btn";
                showDescBtn.style.display = "block";
                showDescBtn.style.width = "100%";
                showDescBtn.style.boxSizing = "border-box";
                showDescBtn.style.marginTop = "8px";
                showDescBtn.style.fontSize = "0.95em";
                showDescBtn.style.padding = "6px 10px";
                showDescBtn.style.borderRadius = "6px";
                showDescBtn.style.border = "none";
                showDescBtn.style.background = "#eee";
                showDescBtn.style.cursor = "pointer";
                showDescBtn.style.transition = "background 0.2s";
                showDescBtn.style.pointerEvents = "auto";
                arrow.style.display = "none";
                let descVisible = false;
                showDescBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    descVisible = !descVisible;
                    if (descVisible) {
                        desc.style.maxHeight = "200px";
                        desc.style.opacity = "1";
                        desc.style.marginTop = "-0.5em";
                        desc.style.padding = "8px";
                        arrow.style.opacity = "0";
                        showDescBtn.textContent = "Masquer la description";
                    }
                    else {
                        desc.style.maxHeight = "0";
                        desc.style.opacity = "0";
                        desc.style.marginTop = "-1em";
                        desc.style.padding = "0 8px";
                        arrow.style.opacity = "1";
                        showDescBtn.textContent = "Afficher la description";
                    }
                });
            }
            else {
                // Desktop : hover classique sur le lien entier
                discordLink.addEventListener("mouseenter", () => {
                    desc.style.maxHeight = "200px";
                    desc.style.opacity = "1";
                    desc.style.marginTop = "8px";
                    desc.style.marginBottom = "0";
                    desc.style.padding = "8px";
                    arrow.style.opacity = "0";
                });
                discordLink.addEventListener("mouseleave", () => {
                    desc.style.maxHeight = "0";
                    desc.style.opacity = "0";
                    desc.style.marginTop = "0";
                    desc.style.marginBottom = "0";
                    desc.style.padding = "0 8px";
                    arrow.style.opacity = "1";
                });
            }
            // Ajouter la description au lien (en bas). Sur mobile on insère
            // le bouton "Afficher la description" entre le contenu principal
            // et la description.
            mainContent.appendChild(textSpan);
            discordLink.appendChild(mainContent);
            if (showDescBtn) {
                // Append the mobile toggle button as a block under the main content
                discordLink.appendChild(showDescBtn);
            }
            discordLink.appendChild(desc);
        }
        else {
            // Sans description, structure simple
            mainContent.appendChild(textSpan);
            discordLink.appendChild(mainContent);
        }
        discordBox.appendChild(discordLink);
        if (!link.text.trim()) {
            discordBox.style.display = "none";
        }
        return discordBox;
    };

    if (profileData.enableLinkCategories && profileData.categories && profileData.categories.length > 0) {
        // --- Category Logic ---
        const elements = [];
        const linksByCat = {};
        const otherLinks = [];

        // 1. Group links
        profileData.links.forEach(l => {
            if (l.categoryId) {
                if (!linksByCat[l.categoryId]) linksByCat[l.categoryId] = [];
                linksByCat[l.categoryId].push(l);
            } else {
                otherLinks.push(l);
            }
        });

        // 2. Render Categories in order
        profileData.categories.forEach(cat => {
            // Create Header
            const header = document.createElement('h3');
            header.className = 'link-header';
            header.textContent = cat.name;
            header.style.color = profileData.textColor || '#fff';
            header.style.marginTop = '16px';
            header.style.marginBottom = '8px';
            header.style.textAlign = 'center';
            header.style.width = '100%';
            header.style.fontSize = '1.2rem';
            elements.push(header);

            // Render links for this category
            if (linksByCat[cat.id]) {
                linksByCat[cat.id].forEach(l => {
                    const box = createBox(l);
                    if (box) elements.push(box);
                });
            }
        });

        // 3. Render Other Links (uncategorized)
        if (otherLinks.length > 0) {
            if (elements.length > 0) {
                const divider = document.createElement('hr');
                divider.style.width = '50%';
                divider.style.margin = '20px auto';
                divider.style.borderColor = 'rgba(255,255,255,0.2)';
                elements.push(divider);
            }
            otherLinks.forEach(l => {
                const box = createBox(l);
                if (box) elements.push(box);
            });
        }
        return elements.slice(0, maxLinkNumber + profileData.categories.length); // Approximate limit handling
    } else {
        // --- Standard Flat List (No Categories) ---
        return profileData.links.slice(0, maxLinkNumber).map(link => createBox(link));
    }
}
export function validateProfileConfig(profileData, themes, btnIconThemeConfig, canvaData, animationBackground) {
    const errors = [];
    // Validate themes
    if (!Array.isArray(themes) || themes.length === 0) {
        errors.push("Themes array is missing or empty.");
    }
    else {
        themes.forEach((theme, i) => {
            if (!theme.background || !theme.textColor || !theme.buttonBackground || !theme.buttonHoverBackground) {
                errors.push(`Theme at index ${i} is missing required properties.`);
            }
        });
    }
    // Validate profileData
    if (typeof profileData !== "object" || profileData === null) {
        errors.push("profileData is not an object.");
    }
    else {
        const requiredProfileFields = [
            "profileLink", "profileImage", "profileIcon", "profileSiteText", "profileHoverColor",
            "userName", "email", "description", "links", "labels", "socialIcon", "statusbar", "background"
        ];
        requiredProfileFields.forEach(field => {
            if (!(field in profileData)) {
                errors.push(`profileData is missing field: ${field}`);
            }
        });
        if (!Array.isArray(profileData.links)) {
            errors.push("profileData.links is not an array.");
        }
        if (!Array.isArray(profileData.labels)) {
            errors.push("profileData.labels is not an array.");
        }
        if (!Array.isArray(profileData.socialIcon)) {
            errors.push("profileData.socialIcon is not an array.");
        }
        if (typeof profileData.statusbar !== "object" || profileData.statusbar === null) {
            errors.push("profileData.statusbar is not an object.");
        }
    }
    // Validate btnIconThemeConfig
    if (!Array.isArray(btnIconThemeConfig)) {
        errors.push("btnIconThemeConfig is not an array.");
    }
    // Validate canvaData
    if (!Array.isArray(canvaData)) {
        errors.push("canvaData is not an array.");
    }
    else {
        canvaData.forEach((canva, i) => {
            if (!canva.fileNames) {
                errors.push(`canvaData at index ${i} is missing fileNames.`);
            }
        });
    }
    // Validate animationBackground
    if (!Array.isArray(animationBackground)) {
        errors.push("animationBackground is not an array.");
    }
    else {
        animationBackground.forEach((anim, i) => {
            if (!anim.keyframes) {
                errors.push(`animationBackground at index ${i} is missing keyframes.`);
            }
        });
    }
    if (errors.length > 0) {
        console.error("Validation errors:", errors);
        return false;
    }
    return true;
}
export function createLabelButtons(profileData) {
    const maxLabelNumber = 7;
    if (!profileData.labels || !profileData.labels.length) {
        console.warn("No labels found in profile data.");
    }
    else if (profileData.labels.length > maxLabelNumber) {
        console.warn(`Too many labels found in profile data, only the first ${maxLabelNumber} will be displayed.`);
    }
    const container = document.createElement("div");
    container.className = "label-buttons-container";
    profileData.labels.slice(0, maxLabelNumber).forEach(label => {
        const button = document.createElement("div");
        button.className = "label-button";
        button.style.backgroundColor = isSafeColor(label.color) ? `${label.color}80` : "#cccccc80";
        button.style.border = isSafeColor(label.color) ? `2px solid ${label.color}` : "2px solid #ccc";
        button.style.color = isSafeColor(label.fontColor) ? label.fontColor : "#222";
        setSafeText(button, label.data);
        button.addEventListener("mouseover", () => {
            button.style.backgroundColor = isSafeColor(label.color) ? label.color : "#cccccc";
        });
        button.addEventListener("mouseout", () => {
            button.style.backgroundColor = isSafeColor(label.color) ? `${label.color}80` : "#cccccc80";
        });
        container.appendChild(button);
        if (!label.data.trim() || (!label.color.trim() || label.color.trim() === "#") || (!label.fontColor.trim() || label.fontColor.trim() === "#")) {
            button.style.display = "none";
        }
    });
    const article = document.getElementById("profile-article");
    article.appendChild(container);
}
export function createIconList(profileData) {
    const maxIconNumber = 10;
    const iconList = document.createElement("div");
    iconList.className = "icon-list";
    if (!profileData.socialIcon || !profileData.socialIcon.length) {
        console.warn("No social icons found in profile data.");
    }
    else if (profileData.socialIcon.length > maxIconNumber) {
        console.warn(`Too many social icons found in profile data, only the first ${maxIconNumber} will be displayed.`);
    }
    profileData.socialIcon.slice(0, maxIconNumber).forEach(iconData => {
        const iconItem = document.createElement("div");
        iconItem.className = "icon-item";
        const iconImg = document.createElement("img");
        // Supporte slug (catalogue), URL absolue et data URI
        const iconVal = String(iconData.icon || '').trim();
        if (/^(https?:\/\/|\/|data:)/i.test(iconVal)) {
            iconImg.src = iconVal;
        } else {
            const prefix = (window.__PLINKK_EXPORT_MODE__) ? '.' : '';
            iconImg.src = `${prefix}/public/images/icons/${iconVal.toLowerCase().replace(/ /g, '-')}.svg`;
        }
        setSafeText(iconImg, iconData.icon);
        iconImg.alt = iconData.icon;

        // Add inversion logic
        const srcImg = (iconImg.src || '').toLowerCase();
        const isCatalogueImg = srcImg.includes('s3.marvideo.fr') || srcImg.includes('cdn.plinkk.fr') || srcImg.includes('/icons/');
        const isBootstrapImg = srcImg.includes('bi-') || srcImg.includes('bootstrap-icons');
        const isJsDelivrImg = srcImg.includes('cdn.jsdelivr.net');

        if (isCatalogueImg || isBootstrapImg) {
            iconImg.classList.add('icon-cdn');
        } else if (isJsDelivrImg || isBootstrapImg) {
            iconImg.classList.add('icon-black-source');
        }
        iconImg.loading = "lazy";
        disableDrag(iconImg);
        disableContextMenuOnImage(iconImg);
        const iconLink = document.createElement("a");
        if (isSafeUrl(iconData.url)) {
            iconLink.href = iconData.url;
            iconLink.target = "_blank";
            iconLink.rel = "noopener noreferrer";
        }
        else {
            iconLink.href = "#";
            iconLink.title = "Lien non valide";
        }
        iconLink.appendChild(iconImg);
        iconItem.appendChild(iconLink);
        iconList.appendChild(iconItem);
    });
    if (profileData.socialIcon.length === 0) {
        iconList.style.display = "none";
    }
    const article = document.getElementById("profile-article");
    article.appendChild(iconList);
}
export function createStatusBar(profileData) {
    const maxCaracter = 50;
    // Récupérer le conteneur du profil
    const profileContainer = document.querySelector(".profile-container");
    if (!profileContainer) {
        console.warn("Profile container not found for status bar");
        // Fallback: append to article if profile container missing
        const article = document.getElementById("profile-article");
        const statusBar = document.createElement("div");
        statusBar.className = "status-bar";
        if (profileData.statusbar && profileData.statusbar.text) {
            setSafeText(statusBar, profileData.statusbar.text);
            article.appendChild(statusBar);
        }
        return;
    }

    const statusBar = document.createElement("div");
    statusBar.className = "status-bar";
    if (profileData.statusbar && profileData.statusbar.text) {
        // ... (Status bar logic reuse or keep simple if not changed often)
        const s = profileData.statusbar;
        statusBar.style.background = s.colorBg || "#222";
        statusBar.style.color = s.colorText || "#ccc";
        // ... more styling ...

        const statusText = document.createElement("span");
        setSafeText(statusText, s.text);
        if (s.fontTextColor) {
            // Apply font color logic
        }

        statusBar.appendChild(statusText);
        // Insert AFTER profile container
        profileContainer.parentNode.insertBefore(statusBar, profileContainer.nextSibling);

        // Display check
        if (!s.text.trim()) statusBar.style.display = "none";
    } else {
        statusBar.style.display = "none";
    }
}
