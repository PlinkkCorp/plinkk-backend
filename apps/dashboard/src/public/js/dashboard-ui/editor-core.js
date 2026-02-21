/**
 * editor-core.js
 * Module principal de l'éditeur visuel direct Plinkk
 * 
 * Gère:
 * - Le rendu live de la page Plinkk dans l'éditeur
 * - L'édition directe inline (textes cliquables)
 * - Les popovers contextuels pour l'édition avancée
 * - Les interactions avec l'API de sauvegarde
 * - Les pickers de thème et canvas
 */

const plinkkId = window.__PLINKK_SELECTED_ID__ || '';
const userId = window.__PLINKK_USER_ID__ || '';

// État global
let currentConfig = null;
let inlineSaveTimeout = null;

// ===== UTILITAIRES =====

function qs(selector) {
    return document.querySelector(selector);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== API =====

async function saveConfig(endpoint, data) {
    if (window.__PLINKK_SHOW_SAVING__) window.__PLINKK_SHOW_SAVING__();

    try {
        const res = await fetch('/api/me/plinkks/' + encodeURIComponent(plinkkId) + '/config/' + endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error('Save failed');

        if (window.__PLINKK_SHOW_SAVED__) window.__PLINKK_SHOW_SAVED__();
        return await res.json();
    } catch (e) {
        if (window.__PLINKK_SHOW_ERROR__) window.__PLINKK_SHOW_ERROR__();
        return null;
    }
}

async function savePlinkk(data) { return saveConfig('plinkk', data); }

async function saveLinks(links) {
    const res = await saveConfig('links', { links: links });
    if (res && res.links) {
        if (currentConfig) currentConfig.links = res.links;
        if (window.__INITIAL_STATE__) window.__INITIAL_STATE__.links = res.links;
        if (window.__EDITOR_STORE__) window.__EDITOR_STORE__.set({ links: res.links });
        renderPlinkk(currentConfig); // Refresh preview
    }
    return res;
}

async function saveLayout(order) {
    const res = await saveConfig('plinkk', { layoutOrder: order });
    if (res && res.layoutOrder) {
        if (currentConfig) currentConfig.layoutOrder = res.layoutOrder;
        if (window.__INITIAL_STATE__) window.__INITIAL_STATE__.layoutOrder = res.layoutOrder;
        if (window.__EDITOR_STORE__) window.__EDITOR_STORE__.set({ layoutOrder: res.layoutOrder });
        renderPlinkk(currentConfig);
    }
    return res;
}

async function saveLabels(labels) {
    const res = await saveConfig('labels', { labels: labels });
    if (res && res.labels) {
        if (currentConfig) currentConfig.labels = res.labels;
        if (window.__INITIAL_STATE__) window.__INITIAL_STATE__.labels = res.labels;
        if (window.__EDITOR_STORE__) window.__EDITOR_STORE__.set({ labels: res.labels });
        renderPlinkk(currentConfig);
    }
    return res;
}

async function saveSocialIcons(socialIcon) {
    const res = await saveConfig('socialIcon', { socialIcon: socialIcon });
    if (res && res.socialIcon) {
        if (currentConfig) currentConfig.socialIcon = res.socialIcon;
        if (window.__INITIAL_STATE__) window.__INITIAL_STATE__.socialIcon = res.socialIcon;
        if (window.__EDITOR_STORE__) window.__EDITOR_STORE__.set({ socials: res.socialIcon }); // Note: state uses 'socials'
        renderPlinkk(currentConfig);
    }
    return res;
}

async function saveStatusBar(statusbar) {
    const res = await saveConfig('statusBar', { statusbar: statusbar });
    // Statusbar might need custom handling if it returns the object
    if (res && res.ok && statusbar && currentConfig) {
        // Optimistic update as backend might only return {ok:true}
        if (!currentConfig.statusbar) currentConfig.statusbar = {};
        Object.assign(currentConfig.statusbar, statusbar);
        if (window.__INITIAL_STATE__) {
            if (!window.__INITIAL_STATE__.statusbar) window.__INITIAL_STATE__.statusbar = {};
            Object.assign(window.__INITIAL_STATE__.statusbar, statusbar);
        }
        renderPlinkk(currentConfig);
    }
    return res;
}

// Exposer pour les handlers globaux
window.__PLINKK_SAVE_LINKS__ = saveLinks;
window.__PLINKK_SAVE_LABELS__ = saveLabels;
window.__PLINKK_SAVE_SOCIAL__ = saveSocialIcons;
window.__PLINKK_GET_CONFIG__ = () => currentConfig;

// ===== CHARGEMENT =====

async function loadPlinkkPage() {
    const plinkkRenderer = qs('#plinkkRenderer');
    if (!plinkkRenderer) return;

    if (!plinkkId) {
        plinkkRenderer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500">
                <svg class="w-16 h-16 mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <p class="text-xl font-semibold mb-2">Sélectionnez un Plinkk</p>
                <p class="text-sm opacity-70">pour commencer l'édition</p>
            </div>`;
        return;
    }

    try {
        const response = await fetch('/api/me/plinkks/' + encodeURIComponent(plinkkId) + '/config');
        if (!response.ok) throw new Error('Failed to load config');
        currentConfig = await response.json();
        renderPlinkk(currentConfig);
    } catch (error) {
        plinkkRenderer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500">
                <svg class="w-16 h-16 mb-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p class="text-xl font-semibold mb-2">Erreur de chargement</p>
                <button onclick="window.__PLINKK_RENDERER_RELOAD__()" class="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors">
                    Réessayer
                </button>
            </div>`;
    }
}

window.__PLINKK_RENDERER_RELOAD__ = loadPlinkkPage;

// ===== RENDU PRINCIPAL =====

function renderPlinkk(config) {
    const plinkkRenderer = qs('#plinkkRenderer');
    if (!plinkkRenderer) return;

    const plinkk = config || {};
    const categories = config.categories || [];
    const activeCategoryIds = new Set(categories.filter(c => c.isActive !== false).map(c => c.id));

    const links = (config.links || [])
        .filter(l => !l.categoryId || activeCategoryIds.has(l.categoryId))
        .sort((a, b) => (a.index || 0) - (b.index || 0));
    const labels = config.labels || [];
    const socialIcon = config.socialIcon || [];
    const statusbar = config.statusbar || null;

    // Extraction des styles
    const bgColor = plinkk?.backgroundColor || '#0c0c0c';
    const bgColor2 = plinkk?.backgroundColor2 || bgColor;
    const bgDeg = plinkk?.backgroundDegree || 135;
    const textColor = plinkk?.textColor || '#f8fafc';
    const btnBg = plinkk?.buttonBackground || 'rgba(255,255,255,0.09)';
    const btnText = plinkk?.buttonTextColor || '#f8fafc';
    const pfp = plinkk?.profileImage || (plinkk?.pfp ? '/public/uploads/' + plinkk.pfp : null);
    const name = plinkk?.userName || plinkk?.name || plinkk?.slug || '';
    const description = plinkk?.description || '';
    const email = plinkk?.email || '';

    // Canvas
    const canvaEnable = plinkk?.canvaEnable || false;
    const canvasIndexRaw = plinkk?.selectedCanvasIndex;
    let canvasFileName = null;
    if (canvaEnable && canvasIndexRaw !== undefined && canvasIndexRaw !== null) {
        const idx = parseInt(canvasIndexRaw);
        const canvaConfig = window.__PLINKK_CFG__?.canvaData || [];
        if (!isNaN(idx) && idx >= 0 && idx < canvaConfig.length) {
            canvasFileName = canvaConfig[idx].fileNames;
        }
    }

    // Background
    let bgStyle = '';
    if (!canvaEnable || !canvasFileName) {
        bgStyle = `background: radial-gradient(circle at 20% 20%, rgba(120,119,198,0.3) 0%, transparent 50%),
                   radial-gradient(circle at 80% 80%, rgba(255,119,198,0.3) 0%, transparent 50%),
                   radial-gradient(circle at 40% 40%, rgba(120,219,226,0.2) 0%, transparent 50%),
                   linear-gradient(${bgDeg}deg, ${bgColor} 0%, ${bgColor2} 100%);
                   background-attachment: fixed;`;
    } else {
        bgStyle = 'background: transparent;';
    }

    // Icône par défaut
    const DEFAULT_LINK_ICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>');

    // Render link
    function renderLink(link, index) {
        const isHidden = link.hidden ? ' opacity-50' : '';
        const linkId = link.id;

        // --- HEADER ---
        if (link.type === 'HEADER') {
            return `
            <div class="link-item${isHidden} link-item-header" data-link-id="${linkId}" data-index="${index}" draggable="true" style="background:transparent;border:none;box-shadow:none;display:block;">
                <h3 class="link-header editable-inline" data-field="text" data-type="link" data-id="${linkId}" style="color:${textColor};margin:16px 0 8px;text-align:center;width:100%;font-size:1.2rem;font-weight:700;">${escapeHtml(link.text || 'Titre')}</h3>
                <div class="link-actions" style="justify-content:center;">
                    <button class="action-btn edit-link-btn" data-id="${linkId}" title="Modifier">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="action-btn delete-link-btn" data-id="${linkId}" title="Supprimer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>`;
        }

        // --- EMBED ---
        if (link.type === 'EMBED' && link.embedData) {
            let embedHtml = '<div style="padding:20px;text-align:center;opacity:0.6;">Contenu intégré vide</div>';
            if (link.embedData.url) {
                let embedUrl = link.embedData.url;
                let isSpotify = false;
                let isYouTube = false;
                try {
                    const urlObj = new URL(embedUrl);
                    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
                        isYouTube = true;
                        let videoId = null;
                        if (urlObj.hostname.includes('youtu.be')) videoId = urlObj.pathname.slice(1);
                        else if (urlObj.pathname.includes('/watch')) videoId = urlObj.searchParams.get('v');
                        else if (urlObj.pathname.includes('/embed/')) videoId = urlObj.pathname.split('/embed/')[1];
                        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
                    }
                    if (urlObj.hostname.includes('spotify.com')) {
                        isSpotify = true;
                        if (!urlObj.pathname.includes('/embed')) embedUrl = `https://open.spotify.com/embed${urlObj.pathname}`;
                    }
                } catch (e) { }

                let style = 'width:100%;border:none;display:block;';
                if (isSpotify) style += 'height:152px;';
                else if (isYouTube) style += 'aspect-ratio:16/9;height:auto;';
                else style += 'height:300px;';

                embedHtml = `<iframe src="${embedUrl}" style="${style}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            }

            return `
            <div class="link-item${isHidden}" data-link-id="${linkId}" data-index="${index}" draggable="true" style="flex-direction:column;padding:0;overflow:hidden;">
                <div style="width:100%;position:relative;">
                    ${embedHtml}
                    <div style="position:absolute;inset:0;z-index:10;pointer-events:none;border:1px solid rgba(255,255,255,0.1);border-radius:inherit;"></div>
                </div>
                <div class="link-actions" style="width:100%;justify-content:flex-end;padding:8px;background:rgba(0,0,0,0.3);">
                    <div style="margin-right:auto;padding-left:8px;font-size:0.8rem;opacity:0.7;">${escapeHtml(link.text || 'Embed')}</div>
                    <button class="action-btn edit-link-btn" data-id="${linkId}" title="Modifier">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="action-btn toggle-link-btn" data-id="${linkId}" data-hidden="${link.hidden ? 'true' : 'false'}" title="${link.hidden ? 'Afficher' : 'Masquer'}">
                        ${link.hidden
                    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
                    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'}
                    </button>
                    <button class="action-btn delete-link-btn" data-id="${linkId}" title="Supprimer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>`;
        }

        // --- FORM ---
        if (link.type === 'FORM') {
            const linkIcon = link.icon || 'https://cdn.plinkk.fr/icons/mail.svg';

            return `
            <div class="link-item${isHidden}" data-link-id="${linkId}" data-index="${index}" draggable="true">
                <div class="link-content">
                    <img src="${linkIcon}" alt="" class="link-icon" onerror="this.style.opacity=0.5"/>
                    <span class="link-text">${escapeHtml(link.text || 'Contact')}</span>
                </div>
                <div class="link-actions">
                    <button class="action-btn edit-link-btn" data-id="${linkId}" title="Modifier">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="action-btn toggle-link-btn" data-id="${linkId}" data-hidden="${link.hidden ? 'true' : 'false'}" title="${link.hidden ? 'Afficher' : 'Masquer'}">
                        ${link.hidden
                    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
                    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'}
                    </button>
                    <button class="action-btn delete-link-btn" data-id="${linkId}" title="Supprimer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>`;
        }

        // --- STANDARD LINK (Default) ---
        const linkIcon = link.icon || DEFAULT_LINK_ICON;
        const linkText = link.text || link.name || link.url || 'Lien';


        return `
            <div class="link-item${isHidden}" data-link-id="${linkId}" data-index="${index}" draggable="true">
                <div class="link-content">
                    <img src="${linkIcon}" alt="" class="link-icon" onerror="this.style.opacity=0.5"/>
                    <span class="link-text editable-inline" data-field="text" data-type="link" data-id="${linkId}">${escapeHtml(linkText)}</span>
                </div>
                <p class="link-desc editable-inline editable-multiline" data-field="description" data-type="link" data-id="${linkId}">${escapeHtml(link.description || '')}</p>
                <div class="link-actions">
                    <button class="action-btn edit-link-btn" data-id="${linkId}" title="Modifier">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="action-btn toggle-link-btn" data-id="${linkId}" data-hidden="${link.hidden ? 'true' : 'false'}" title="${link.hidden ? 'Afficher' : 'Masquer'}">
                        ${link.hidden
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
                : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'}
                    </button>
                    <button class="action-btn delete-link-btn" data-id="${linkId}" title="Supprimer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>`;
    }

    // Render social
    function renderSocial(social, index) {
        return `
            <div class="social-item" data-index="${index}" draggable="true">
                <div class="social-icon-wrapper">
                    <img src="${social.icon || DEFAULT_LINK_ICON}" alt="" class="social-icon" onerror="this.style.opacity=0.3"/>
                </div>
                <div class="social-meta">
                    <span class="social-url editable-inline" data-field="url" data-type="social" data-index="${index}">${escapeHtml(social.url || '')}</span>
                    <span class="social-desc editable-inline editable-multiline" data-field="description" data-type="social" data-index="${index}">${escapeHtml(social.description || '')}</span>
                </div>
                <button class="social-edit-btn" data-index="${index}" title="Modifier">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="social-delete-btn" data-index="${index}" title="Supprimer">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>`;
    }

    // Render label
    function renderLabel(label, index) {
        const bgClr = label.color || 'rgba(124,58,237,0.3)';
        const fontClr = label.fontColor || '#ffffff';
        return `
            <span class="label-item" data-index="${index}" draggable="true" style="background:${bgClr};color:${fontClr};">
                <span class="label-text editable-inline" data-field="data" data-type="label" data-index="${index}">${escapeHtml(label.data || 'Label')}</span>
                <button class="label-edit-btn" data-index="${index}" title="Modifier">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button class="label-delete-btn" data-index="${index}" title="Supprimer">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <div class="label-desc editable-inline editable-multiline" data-field="description" data-type="label" data-index="${index}">${escapeHtml(label.description || '')}</div>
            </span>`;
    }

    // Construire le HTML
    const linksHTML = links.length > 0
        ? links.map((l, i) => renderLink(l, i)).join('')
        : '<div class="empty-hint">Aucun lien ajouté</div>';

    const socialsHTML = socialIcon.length > 0
        ? socialIcon.map((s, i) => renderSocial(s, i)).join('')
        : '';

    const labelsHTML = labels.length > 0
        ? labels.map((l, i) => renderLabel(l, i)).join('')
        : '';

    // Statusbar
    let statusbarHTML = '';
    if (statusbar && (statusbar.text || statusbar.statusText)) {
        const statusDot = statusbar.statusText === '🟢' ? '#22c55e'
            : statusbar.statusText === '🔴' ? '#ef4444'
                : statusbar.statusText === '🟡' ? '#eab308'
                    : '#64748b';
        statusbarHTML = `
            <div class="statusbar-wrapper" data-type="statusbar">
                <div class="statusbar-content" style="background:${statusbar.colorBg || '#1f2937'};">
                    <span class="statusbar-dot" style="background:${statusDot};"></span>
                    <span class="statusbar-text editable-inline" data-field="text" data-type="statusbar">${escapeHtml(statusbar.text || 'Disponible')}</span>
                </div>
                <button class="statusbar-edit-btn" title="Modifier">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/></svg>
                </button>
            </div>`;
    }

    // Initial du profil
    const initial = name.charAt(0).toUpperCase() || 'P';

    // Description & Email
    let descEmailHTML = '';
    if (email || description) {
        descEmailHTML = '<div class="desc-email-container" data-section="email" draggable="true">';
        if (email) {
            descEmailHTML += `
                <div class="email-row">
                    <span class="email-text editable-inline" data-field="email" data-type="plinkk">${escapeHtml(email)}</span>
                    <button class="copy-email-btn" title="Copier" onclick="navigator.clipboard.writeText('${email}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                </div>`;
        }
        if (description) {
            descEmailHTML += `<p class="description-text editable-inline editable-multiline" data-field="description" data-type="plinkk">${escapeHtml(description)}</p>`;
        }
        descEmailHTML += '</div>';
    }

    // Canvas HTML
    const canvasHTML = (canvaEnable && canvasFileName)
        ? '<div class="canvas-bg" id="canvasContainer"><canvas id="animatedCanvas"></canvas></div>'
        : '';

    // CSS du rendu
    const css = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        /* make it obvious that sections can be dragged */
        #plinkkRenderer [draggable] { cursor: grab; }
        #plinkkRenderer [draggable].dragging { cursor: grabbing; }
        #plinkkRenderer { 
            font-family: "Inter", "Satoshi", -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex; justify-content: center; align-items: flex-start;
            position: relative; min-height: 100%; color: ${textColor};
            overflow-y: auto; overflow-x: hidden;
            ${bgStyle}
        }
        
        .canvas-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .canvas-bg canvas { width: 100%; height: 100%; display: block; }
        
        .plinkk-article {
            position: relative; text-align: center;
            background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%);
            padding: 32px 24px; border-radius: 24px;
            backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid rgba(255,255,255,0.12);
            box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 24px 64px rgba(0,0,0,0.2);
            min-width: 320px; max-width: 420px; width: 90%;
            margin: 2em auto 6em auto; z-index: 10;
            animation: fadeInUp 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Profile */
        .profile-section { position: relative; margin-bottom: 16px; }
        .profile-pic-container {
            width: 160px; height: 160px; margin: 0 auto;
            position: relative; border-radius: 50%;
            filter: drop-shadow(0 8px 24px rgba(0,0,0,0.4));
        }
        .profile-pic {
            width: 100%; height: 100%; border-radius: 50%;
            object-fit: cover; border: 3px solid rgba(255,255,255,0.15);
        }
        .profile-initial {
            width: 100%; height: 100%; border-radius: 50%;
            background: linear-gradient(135deg, #7c3aed, #f59e0b);
            display: flex; align-items: center; justify-content: center;
            font-size: 3rem; font-weight: bold; color: white;
            border: 3px solid rgba(255,255,255,0.15);
        }
        .profile-upload-overlay {
            position: absolute; inset: 0; border-radius: 50%;
            background: rgba(0,0,0,0.6); display: flex;
            align-items: center; justify-content: center; gap: 8px;
            opacity: 0; transition: opacity 0.2s; cursor: pointer;
        }
        .profile-pic-container:hover .profile-upload-overlay { opacity: 1; }
        .profile-upload-overlay label, .profile-upload-overlay button {
            width: 40px; height: 40px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; border: none; transition: all 0.2s;
        }
        .profile-upload-overlay label { background: rgba(124,58,237,0.9); }
        .profile-upload-overlay label:hover { background: #7c3aed; transform: scale(1.1); }
        .profile-upload-overlay button { background: rgba(239,68,68,0.9); }
        .profile-upload-overlay button:hover { background: #ef4444; transform: scale(1.1); }
        .profile-upload-overlay svg { color: white; }
        
        /* Name */
        .profile-name {
            font-size: 1.75rem; font-weight: 700; margin: 12px 0 4px;
            background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 30%, #7c3aed 60%, #f59e0b 100%);
            background-size: 300% 300%; background-clip: text;
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            animation: gradientFlow 8s ease-in-out infinite;
        }
        @keyframes gradientFlow { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        
        /* Statusbar */
        .statusbar-wrapper { position: relative; display: inline-flex; margin: 8px 0; }
        .statusbar-content {
            padding: 6px 16px; border-radius: 20px; font-size: 0.75rem;
            display: inline-flex; align-items: center; gap: 6px;
            font-weight: 500; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .statusbar-dot { width: 8px; height: 8px; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.9); } }
        .statusbar-edit-btn {
            position: absolute; right: -28px; top: 50%; transform: translateY(-50%);
            width: 24px; height: 24px; border-radius: 50%;
            background: rgba(124,58,237,0.9); border: none;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: all 0.2s; cursor: pointer;
        }
        .statusbar-edit-btn svg { color: white; }
        .statusbar-wrapper:hover .statusbar-edit-btn { opacity: 1; }
        .statusbar-edit-btn:hover { background: #7c3aed; transform: translateY(-50%) scale(1.1); }
        
        /* Labels */
        .labels-section { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 12px 0; }
        .label-item {
            position: relative; display: inline-flex; align-items: center; gap: 4px;
            padding: 6px 32px 6px 12px; border-radius: 20px;
            font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
            letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .label-edit-btn, .label-delete-btn {
            position: absolute; top: 50%; transform: translateY(-50%);
            width: 18px; height: 18px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            border: none; cursor: pointer; opacity: 0; transition: all 0.2s;
        }
        .label-edit-btn { right: 20px; background: rgba(255,255,255,0.3); }
        .label-delete-btn { right: 2px; background: rgba(239,68,68,0.8); }
        .label-edit-btn svg, .label-delete-btn svg { color: white; }
        .label-item:hover .label-edit-btn, .label-item:hover .label-delete-btn { opacity: 1; }
        .label-edit-btn:hover { background: rgba(255,255,255,0.5); transform: translateY(-50%) scale(1.1); }
        .label-delete-btn:hover { background: #ef4444; transform: translateY(-50%) scale(1.1); }
        
        /* Socials */
        .socials-section { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin: 16px 0; }
        .social-item { position: relative; display: inline-flex; }
        .social-icon-wrapper {
            width: 44px; height: 44px; border-radius: 50%;
            background: rgba(255,255,255,0.08); display: flex;
            align-items: center; justify-content: center;
            border: 1px solid rgba(255,255,255,0.12);
            transition: all 0.2s;
        }
        .social-icon-wrapper:hover { background: rgba(255,255,255,0.15); transform: scale(1.05); }
        .social-icon { width: 22px; height: 22px; filter: brightness(0) invert(1); }
        .social-edit-btn, .social-delete-btn {
            position: absolute; width: 20px; height: 20px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            border: none; cursor: pointer; opacity: 0; transition: all 0.2s; z-index: 10;
        }
        .social-edit-btn { top: -6px; left: -6px; background: rgba(124,58,237,0.9); }
        .social-delete-btn { top: -6px; right: -6px; background: rgba(239,68,68,0.9); }
        .social-edit-btn svg, .social-delete-btn svg { color: white; }
        .social-item:hover .social-edit-btn, .social-item:hover .social-delete-btn { opacity: 1; }
        .social-edit-btn:hover { background: #7c3aed; transform: scale(1.15); }
        .social-delete-btn:hover { background: #ef4444; transform: scale(1.15); }
        
        /* Desc & Email */
        .desc-email-container {
            background: rgba(44, 47, 51, 0.8); border-radius: 12px;
            padding: 12px; margin: 16px 0; text-align: center;
        }
        .email-row { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .email-text { font-weight: 600; }
        .copy-email-btn {
            background: rgba(255,255,255,0.1); border: none; border-radius: 6px;
            padding: 6px; cursor: pointer; transition: all 0.2s; display: flex;
        }
        .copy-email-btn:hover { background: rgba(255,255,255,0.2); }
        .copy-email-btn svg { color: white; }
        .description-text { margin-top: 8px; font-size: 0.875rem; opacity: 0.9; font-weight: normal; }
        
        /* Links */
        .links-section { margin-top: 16px; }
        .link-item {
            display: flex; align-items: center; margin-top: 12px;
            background: linear-gradient(135deg, ${btnBg} 0%, rgba(255,255,255,0.04) 100%);
            border-radius: 16px; border: 1px solid rgba(255,255,255,0.12);
            backdrop-filter: blur(16px); overflow: hidden;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            transition: all 0.2s;
        }
        .link-item:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.25); }
        .link-content { display: flex; align-items: center; gap: 12px; padding: 14px 16px; flex: 1; }
        .link-icon { width: 24px; height: 24px; object-fit: contain; filter: brightness(0) invert(1); flex-shrink: 0; }
        .link-text { color: ${btnText}; font-weight: 500; }
        .link-actions { display: flex; gap: 4px; padding-right: 12px; opacity: 0; transition: opacity 0.2s; }
        .link-item:hover .link-actions { opacity: 1; }
        .action-btn {
            width: 30px; height: 30px; border-radius: 8px; border: none;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s;
        }
        .edit-link-btn { background: rgba(124,58,237,0.3); color: #a78bfa; }
        .edit-link-btn:hover { background: rgba(124,58,237,0.5); color: white; }
        .toggle-link-btn { background: rgba(251,191,36,0.2); color: #fbbf24; }
        .toggle-link-btn:hover { background: rgba(251,191,36,0.4); color: #fef08a; }
        .delete-link-btn { background: rgba(239,68,68,0.2); color: #ef4444; }
        .delete-link-btn:hover { background: rgba(239,68,68,0.4); color: #fca5a5; }
        .action-btn svg { stroke: currentColor; }
        
        /* Empty hint */
        .empty-hint { color: rgba(255,255,255,0.4); font-size: 0.875rem; padding: 16px; }
        
        /* Add buttons */
        .add-btn-inline {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 8px 14px; border-radius: 20px;
            background: rgba(124,58,237,0.15); border: 1px dashed rgba(124,58,237,0.5);
            color: rgba(255,255,255,0.7); font-size: 0.75rem;
            cursor: pointer; transition: all 0.2s; margin: 8px 4px;
        }
        .add-btn-inline:hover {
            background: rgba(124,58,237,0.3); border-color: #7c3aed; color: white;
        }
        .add-btn-inline svg { width: 14px; height: 14px; }
        
        /* Editable inline */
        .editable-inline { cursor: text; transition: all 0.2s; position: relative; }
        .editable-inline:hover { outline: 2px dashed rgba(124,58,237,0.5); outline-offset: 4px; border-radius: 4px; }
        .editable-inline.editing { outline: 2px solid rgba(124,58,237,0.8); outline-offset: 4px; background: rgba(124,58,237,0.1); border-radius: 4px; }
        .editable-input, .editable-textarea {
            background: transparent; border: none; outline: none;
            color: inherit; font: inherit; text-align: inherit;
            width: 100%; min-width: 50px;
        }
        .editable-textarea { min-height: 60px; resize: vertical; }

        /* Modern Plinkk UI Overrides */
        .plinkk-article {
            backdrop-filter: blur(40px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 
                0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                0 2px 4px -1px rgba(0, 0, 0, 0.06),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            background: rgba(20, 20, 25, 0.7);
        }

        .link-item {
            background: rgba(40, 40, 45, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .link-item:hover {
            transform: translateY(-2px);
            background: rgba(60, 60, 65, 0.7);
            border-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
        }

        .action-btn {
            opacity: 0.6;
            transition: all 0.2s;
        }
        .action-btn:hover {
            opacity: 1;
            transform: scale(1.1);
        }
        
        .add-btn-inline {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(4px);
        }
        .add-btn-inline:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
            color: white;
            transform: translateY(-1px);
        }
        
        /* Popover */
        .edit-popover {
            position: fixed; background: rgba(15,15,15,0.98);
            border: 1px solid rgba(255,255,255,0.15); border-radius: 16px;
            min-width: 300px; max-width: 380px; box-shadow: 0 16px 48px rgba(0,0,0,0.7);
            z-index: 1000; backdrop-filter: blur(24px); overflow: hidden;
        }
        .popover-header {
            padding: 12px 16px; background: rgba(124,58,237,0.15);
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex; align-items: center; justify-content: space-between;
        }
        .popover-title { font-size: 0.85rem; font-weight: 600; color: white; display: flex; align-items: center; gap: 8px; }
        .popover-close {
            background: rgba(255,255,255,0.1); border: none; border-radius: 6px;
            padding: 6px; cursor: pointer; display: flex; transition: all 0.2s;
        }
        .popover-close:hover { background: rgba(239,68,68,0.3); }
        .popover-close svg { color: rgba(255,255,255,0.6); }
        .popover-body { padding: 16px; }
        .popover-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .popover-label { font-size: 0.75rem; color: rgba(255,255,255,0.7); min-width: 90px; }
        .popover-input {
            flex: 1; background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15); border-radius: 8px;
            padding: 10px 12px; color: white; font-size: 0.8rem; outline: none;
        }
        .popover-input:focus { border-color: rgba(124,58,237,0.8); }
        .popover-color {
            width: 40px; height: 40px; border-radius: 10px;
            border: 2px solid rgba(255,255,255,0.2); cursor: pointer; padding: 0;
        }
        .popover-actions {
            display: flex; gap: 8px; margin-top: 16px; justify-content: space-between;
            padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);
        }
        .popover-btn {
            padding: 10px 18px; border-radius: 10px; font-size: 0.8rem;
            font-weight: 600; cursor: pointer; border: none; transition: all 0.2s;
            display: flex; align-items: center; gap: 6px;
        }
        .popover-btn.save { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; }
        .popover-btn.save:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(124,58,237,0.4); }
        .popover-btn.delete { background: rgba(239,68,68,0.15); color: #ef4444; }
        .popover-btn.delete:hover { background: rgba(239,68,68,0.25); }
    `;

    const DEFAULT_LAYOUT = ['profile','username','statusbar','labels','social','email','links'];
    let layout = Array.isArray(plinkk.layoutOrder) ? plinkk.layoutOrder.slice() : DEFAULT_LAYOUT.slice();
    const KNOWN = new Set(DEFAULT_LAYOUT);
    const seen = new Set();
    const normalized = [];
    layout.forEach(k => { if (KNOWN.has(k) && !seen.has(k)) { seen.add(k); normalized.push(k); } });
    DEFAULT_LAYOUT.forEach(k => { if (!seen.has(k)) normalized.push(k); });
    layout.splice(0, layout.length, ...normalized); // update reference if used elsewhere

    // prepare section snippets
    const profilePicHTML = `
        <div class="profile-section" data-section="profile" draggable="true">
            <div class="profile-pic-container">
                ${pfp
        ? `<img src="${pfp}" alt="${name}" class="profile-pic" onerror="this.outerHTML='<span class=profile-initial>${initial}</span>'"/>`
        : `<span class="profile-initial">${initial}</span>`}
                <div class="profile-upload-overlay">
                    <label title="Changer l'image">
                        <input type="file" id="pfpUploadInline" accept="image/*" style="display:none"/>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </label>
                    ${pfp ? `<button type="button" id="deletePfpInline" title="Supprimer"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>` : ''}
                </div>
            </div>
        </div>`;
    const profileNameHTML = `<h1 class="profile-name editable-inline" data-field="userName" data-type="plinkk" data-section="username" draggable="true">${escapeHtml(name)}</h1>`;
    const statusSectionHTML = statusbarHTML ? `<div data-section="statusbar" draggable="true">${statusbarHTML}</div>` : '';
    const labelsSectionHTML = `
        <div class="labels-section" data-section="labels" draggable="true">
            ${labelsHTML}
            <button class="add-btn-inline" id="addLabelInline">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Label
            </button>
        </div>`;
    const socialSectionHTML = `
        <div class="socials-section" data-section="social" draggable="true">
            ${socialsHTML}
            <button class="add-btn-inline" id="addSocialInline">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Social
            </button>
        </div>`;
    const linksSectionHTML = `
        <div class="links-section" data-section="links" draggable="true">
            ${linksHTML}
            <div style="text-align:center;margin-top:16px;">
                <button class="add-btn-inline" id="addLinkInline">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Lien
                </button>
            </div>
        </div>`;

    let html = `<style>${css}</style>${canvasHTML}<article class="plinkk-article">`;
    normalized.forEach((key) => {
        switch (key) {
            case 'profile': html += profilePicHTML; break;
            case 'username': html += profileNameHTML; break;
            case 'statusbar': html += statusSectionHTML; break;
            case 'labels': html += labelsSectionHTML; break;
            case 'social': html += socialSectionHTML; break;
            case 'email': html += descEmailHTML; break;
            case 'links': html += linksSectionHTML; break;
        }
    });
    html += '</article>';
    plinkkRenderer.innerHTML = html;

    // Attacher les handlers
    setupEventHandlers();

    // Initialiser le canvas si activé
    if (canvaEnable && canvasFileName) {
        initCanvas(canvasFileName);
    }
}

// ===== HANDLERS =====

function setupEventHandlers() {
    const plinkkRenderer = qs('#plinkkRenderer');
    if (!plinkkRenderer) return;

    // Édition inline
    setupInlineEditing();

    // Délégation d'événements
    plinkkRenderer.addEventListener('click', handleClick);

    // Enable drag & drop reordering for links, socials and labels
    function getDragAfterElement(container, y, selector = '[data-index]:not(.dragging)') {
        const draggableElements = [...container.querySelectorAll(selector)];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function enableReorder(containerSelector, arrayKey, saveFn) {
        const container = qs(containerSelector);
        if (!container) return;

        container.addEventListener('dragstart', (e) => {
            const item = e.target.closest('[draggable]');
            if (!item) return;
            e.dataTransfer.setData('text/plain', item.dataset.index || '');
            e.dataTransfer.effectAllowed = 'move';
            item.classList.add('dragging');
        });

        container.addEventListener('dragend', (e) => {
            const item = e.target.closest('[draggable]');
            if (item) item.classList.remove('dragging');
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const after = getDragAfterElement(container, e.clientY);
            const dragging = container.querySelector('.dragging');
            if (!dragging) return;
            if (!after) container.appendChild(dragging);
            else container.insertBefore(dragging, after);
        });

        container.addEventListener('drop', async (e) => {
            e.preventDefault();
            // Rebuild ordered array from DOM elements that have data-index
            const items = Array.from(container.querySelectorAll('[data-index]'));
            const newOrder = items.map(it => {
                const idx = parseInt(it.dataset.index);
                return (currentConfig[arrayKey] || [])[idx];
            }).filter(Boolean);
            if (newOrder.length) {
                await saveFn(newOrder);
                loadPlinkkPage();
            }
        });
    }

    enableReorder('.links-section', 'links', saveLinks);
    enableReorder('.socials-section', 'socialIcon', saveSocialIcons);
    enableReorder('.labels-section', 'labels', saveLabels);

    function enableReorderSections(containerSelector, saveFn) {
        const container = qs(containerSelector);
        if (!container) return;

        container.addEventListener('dragstart', (e) => {
            const item = e.target.closest('[draggable][data-section]');
            if (!item) return;
            e.dataTransfer.setData('text/plain', item.dataset.section || '');
            e.dataTransfer.effectAllowed = 'move';
            item.classList.add('dragging');
        });

        container.addEventListener('dragend', (e) => {
            const item = e.target.closest('[draggable][data-section]');
            if (item) item.classList.remove('dragging');
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const after = getDragAfterElement(container, e.clientY, '[data-section]:not(.dragging)');
            const dragging = container.querySelector('.dragging');
            if (!dragging) return;
            if (!after) container.appendChild(dragging);
            else container.insertBefore(dragging, after);
        });

        container.addEventListener('drop', async (e) => {
            e.preventDefault();
            const items = Array.from(container.querySelectorAll('[data-section]'));
            const newOrder = items.map(it => it.dataset.section).filter(Boolean);
            if (newOrder.length) {
                await saveFn(newOrder);
                loadPlinkkPage();
            }
        });
    }

    enableReorderSections('.plinkk-article', saveLayout);
}

function handleClick(e) {
    const target = e.target.closest('button');
    if (!target) return;

    // Ajouter un lien
    if (target.id === 'addLinkInline' || target.id === 'addLinkToolbar') {
        e.preventDefault();
        addNewLink();
    }

    // Ajouter un social
    if (target.id === 'addSocialInline' || target.id === 'addSocialToolbar') {
        e.preventDefault();
        openSocialPicker();
    }

    // Ajouter un label
    if (target.id === 'addLabelInline' || target.id === 'addLabelToolbar') {
        e.preventDefault();
        addNewLabel();
    }

    // Supprimer un lien
    if (target.classList.contains('delete-link-btn')) {
        e.preventDefault();
        const linkId = target.dataset.id;
        if (confirm('Supprimer ce lien ?')) {
            deleteLink(linkId);
        }
    }

    // Toggle visibilité lien
    if (target.classList.contains('toggle-link-btn')) {
        e.preventDefault();
        const linkId = target.dataset.id;
        const isHidden = target.dataset.hidden === 'true';
        toggleLink(linkId, !isHidden);
    }

    // Éditer un lien
    if (target.classList.contains('edit-link-btn')) {
        e.preventDefault();
        const linkId = target.dataset.id;
        openLinkPopover(linkId, target);
    }

    // Supprimer un social
    if (target.classList.contains('social-delete-btn')) {
        e.preventDefault();
        const index = parseInt(target.dataset.index);
        if (confirm('Supprimer ce réseau social ?')) {
            deleteSocial(index);
        }
    }

    // Éditer un social
    if (target.classList.contains('social-edit-btn')) {
        e.preventDefault();
        const index = parseInt(target.dataset.index);
        openSocialPopover(index, target);
    }

    // Supprimer un label
    if (target.classList.contains('label-delete-btn')) {
        e.preventDefault();
        const index = parseInt(target.dataset.index);
        if (confirm('Supprimer ce label ?')) {
            deleteLabel(index);
        }
    }

    // Éditer un label
    if (target.classList.contains('label-edit-btn')) {
        e.preventDefault();
        const index = parseInt(target.dataset.index);
        openLabelPopover(index, target);
    }

    // Éditer statusbar
    if (target.classList.contains('statusbar-edit-btn')) {
        e.preventDefault();
        openStatusPopover(target);
    }
}

// Édition inline
function setupInlineEditing() {
    const editables = document.querySelectorAll('#plinkkRenderer .editable-inline');

    editables.forEach(el => {
        el.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (el.classList.contains('editing')) return;

            const field = el.dataset.field;
            const type = el.dataset.type;
            const id = el.dataset.id;
            const index = el.dataset.index;
            const isMultiline = el.classList.contains('editable-multiline');
            const originalText = el.textContent;

            el.classList.add('editing');

            const input = isMultiline
                ? document.createElement('textarea')
                : document.createElement('input');

            input.className = isMultiline ? 'editable-textarea' : 'editable-input';
            input.value = originalText;
            if (!isMultiline) input.type = 'text';

            const computedStyle = window.getComputedStyle(el);
            input.style.fontSize = computedStyle.fontSize;
            input.style.fontWeight = computedStyle.fontWeight;
            input.style.color = computedStyle.color;
            input.style.textAlign = computedStyle.textAlign;

            el.textContent = '';
            el.appendChild(input);
            input.focus();
            input.select();

            let lastSavedValue = originalText;
            const performSave = async (newValue) => {
                if (newValue === lastSavedValue) return;
                lastSavedValue = newValue;

                try {
                    let res = null;
                    if (type === 'plinkk') {
                        res = await savePlinkk({ [field]: newValue });
                        if (res && res.ok && currentConfig) currentConfig[field] = newValue;
                    } else if (type === 'link' && id) {
                        const links = (currentConfig.links || []).map(l => {
                            if (l.id === id) l[field] = newValue;
                            return l;
                        });
                        res = await saveLinks(links);
                        if (res && res.links) currentConfig.links = res.links;
                    } else if (type === 'label' && index !== undefined) {
                        const labels = (currentConfig.labels || []).map((l, i) => {
                            if (i === parseInt(index)) l[field] = newValue;
                            return l;
                        });
                        res = await saveLabels(labels);
                        if (res && res.labels) currentConfig.labels = res.labels;
                    } else if (type === 'social' && index !== undefined) {
                        const socialIcon = (currentConfig.socialIcon || []).map((s, i) => {
                            if (i === parseInt(index)) s[field] = newValue;
                            return s;
                        });
                        res = await saveSocialIcons(socialIcon);
                        if (res && res.socialIcon) currentConfig.socialIcon = res.socialIcon;
                    } else if (type === 'statusbar') {
                        res = await saveStatusBar({ text: newValue });
                        if (res && res.ok && currentConfig.statusbar) currentConfig.statusbar.text = newValue;
                    }

                    // Sync to global initial state for sidebar modules
                    if (window.__INITIAL_STATE__ && currentConfig) {
                        Object.assign(window.__INITIAL_STATE__, currentConfig);
                    }
                    // Sync sidebar UI
                    if (window.__PLINKK_SYNC_SIDEBAR__) window.__PLINKK_SYNC_SIDEBAR__();

                } catch (err) {
                }
            };

            const save = async () => {
                if (inlineSaveTimeout) clearTimeout(inlineSaveTimeout);
                const newValue = input.value.trim();
                el.classList.remove('editing');
                el.textContent = newValue || originalText;
                await performSave(newValue);
            };

            input.addEventListener('blur', save);
            input.addEventListener('input', () => {
                if (inlineSaveTimeout) clearTimeout(inlineSaveTimeout);
                inlineSaveTimeout = setTimeout(() => {
                    performSave(input.value.trim());
                }, 1000);
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !isMultiline) {
                    e.preventDefault();
                    input.blur();
                }
                if (e.key === 'Escape') {
                    el.classList.remove('editing');
                    el.textContent = originalText;
                }
            });
        });
    });
}

// ===== ACTIONS =====

async function addNewLink() {
    const links = currentConfig.links || [];
    links.push({ text: 'Nouveau lien', url: 'https://example.com', icon: '' });
    await saveLinks(links);
    loadPlinkkPage();
}

async function deleteLink(linkId) {
    const links = (currentConfig.links || []).filter(l => l.id !== linkId);
    await saveLinks(links);
    loadPlinkkPage();
}

async function toggleLink(linkId, hidden) {
    const links = (currentConfig.links || []).map(l => {
        if (l.id === linkId) l.hidden = hidden;
        return l;
    });
    await saveLinks(links);
    loadPlinkkPage();
}

async function addNewLabel() {
    const labels = currentConfig.labels || [];
    labels.push({ data: 'Nouveau label', color: '#7c3aed', fontColor: '#ffffff' });
    await saveLabels(labels);
    loadPlinkkPage();
}

async function deleteLabel(index) {
    const labels = (currentConfig.labels || []).filter((_, i) => i !== index);
    await saveLabels(labels);
    loadPlinkkPage();
}

async function deleteSocial(index) {
    const socialIcon = (currentConfig.socialIcon || []).filter((_, i) => i !== index);
    await saveSocialIcons(socialIcon);
    loadPlinkkPage();
}

// ===== POPOVERS =====

function closeAllPopovers() {
    document.querySelectorAll('.edit-popover').forEach(p => p.remove());
}

function openLinkPopover(linkId, target) {
    closeAllPopovers();

    const link = currentConfig?.links?.find(l => l.id === linkId);
    if (!link) return;

    const rect = target.getBoundingClientRect();
    const popover = document.createElement('div');
    popover.className = 'edit-popover';
    popover.style.position = 'fixed';
    popover.style.top = Math.min(rect.bottom + 8, window.innerHeight - 300) + 'px';
    popover.style.left = Math.min(rect.left, window.innerWidth - 320) + 'px';

    popover.innerHTML = `
        <div class="popover-header">
            <span class="popover-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Modifier le lien
            </span>
            <button class="popover-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="popover-body">
            <div class="popover-row">
                <span class="popover-label">URL</span>
                <input type="url" class="popover-input" id="popoverLinkUrl" value="${link.url || ''}" placeholder="https://...">
            </div>
            <div class="popover-row">
                <span class="popover-label">Icône URL</span>
                <input type="url" class="popover-input" id="popoverLinkIcon" value="${link.icon || ''}" placeholder="URL de l'icône...">
            </div>
            <div class="popover-actions">
                <button class="popover-btn delete" id="popoverLinkDelete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Supprimer
                </button>
                <button class="popover-btn save" id="popoverLinkSave">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Enregistrer
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(popover);

    popover.querySelector('.popover-close').onclick = () => popover.remove();

    popover.querySelector('#popoverLinkSave').onclick = async () => {
        const url = popover.querySelector('#popoverLinkUrl').value;
        const icon = popover.querySelector('#popoverLinkIcon').value;

        const links = (currentConfig.links || []).map(l => {
            if (l.id === linkId) {
                l.url = url;
                l.icon = icon;
            }
            return l;
        });

        await saveLinks(links);
        popover.remove();
        loadPlinkkPage();
    };

    popover.querySelector('#popoverLinkDelete').onclick = async () => {
        if (confirm('Supprimer ce lien ?')) {
            await deleteLink(linkId);
            popover.remove();
        }
    };
}

function openLabelPopover(index, target) {
    closeAllPopovers();

    const label = currentConfig?.labels?.[index];
    if (!label) return;

    const rect = target.getBoundingClientRect();
    const popover = document.createElement('div');
    popover.className = 'edit-popover';
    popover.style.position = 'fixed';
    popover.style.top = Math.min(rect.bottom + 8, window.innerHeight - 280) + 'px';
    popover.style.left = Math.min(rect.left, window.innerWidth - 320) + 'px';

    popover.innerHTML = `
        <div class="popover-header">
            <span class="popover-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                Modifier le label
            </span>
            <button class="popover-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="popover-body">
            <div class="popover-row">
                <span class="popover-label">Couleur fond</span>
                <input type="color" class="popover-color" id="popoverLabelBg" value="${label.color?.startsWith('rgba') ? '#7c3aed' : (label.color || '#7c3aed')}">
            </div>
            <div class="popover-row">
                <span class="popover-label">Couleur texte</span>
                <input type="color" class="popover-color" id="popoverLabelFont" value="${label.fontColor || '#ffffff'}">
            </div>
            <div class="popover-actions">
                <button class="popover-btn delete" id="popoverLabelDelete">Supprimer</button>
                <button class="popover-btn save" id="popoverLabelSave">Enregistrer</button>
            </div>
        </div>
    `;

    document.body.appendChild(popover);

    popover.querySelector('.popover-close').onclick = () => popover.remove();

    popover.querySelector('#popoverLabelSave').onclick = async () => {
        const bgColor = popover.querySelector('#popoverLabelBg').value;
        const fontColor = popover.querySelector('#popoverLabelFont').value;

        const labels = (currentConfig.labels || []).map((l, i) => {
            if (i === index) {
                l.color = bgColor;
                l.fontColor = fontColor;
            }
            return l;
        });

        await saveLabels(labels);
        popover.remove();
        loadPlinkkPage();
    };

    popover.querySelector('#popoverLabelDelete').onclick = async () => {
        if (confirm('Supprimer ce label ?')) {
            await deleteLabel(index);
            popover.remove();
        }
    };
}

function openSocialPopover(index, target) {
    closeAllPopovers();

    const social = currentConfig?.socialIcon?.[index];
    if (!social) return;

    const rect = target.getBoundingClientRect();
    const popover = document.createElement('div');
    popover.className = 'edit-popover';
    popover.style.position = 'fixed';
    popover.style.top = Math.min(rect.bottom + 8, window.innerHeight - 280) + 'px';
    popover.style.left = Math.min(rect.left, window.innerWidth - 320) + 'px';

    popover.innerHTML = `
        <div class="popover-header">
            <span class="popover-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Modifier le réseau
            </span>
            <button class="popover-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="popover-body">
            <div class="popover-row">
                <span class="popover-label">URL</span>
                <input type="url" class="popover-input" id="popoverSocialUrl" value="${social.url || ''}" placeholder="https://...">
            </div>
            <div class="popover-row">
                <span class="popover-label">Icône URL</span>
                <input type="url" class="popover-input" id="popoverSocialIcon" value="${social.icon || ''}" placeholder="URL de l'icône...">
            </div>
            <div class="popover-actions">
                <button class="popover-btn delete" id="popoverSocialDelete">Supprimer</button>
                <button class="popover-btn save" id="popoverSocialSave">Enregistrer</button>
            </div>
        </div>
    `;

    document.body.appendChild(popover);

    popover.querySelector('.popover-close').onclick = () => popover.remove();

    popover.querySelector('#popoverSocialSave').onclick = async () => {
        const url = popover.querySelector('#popoverSocialUrl').value;
        const icon = popover.querySelector('#popoverSocialIcon').value;

        const socialIcon = (currentConfig.socialIcon || []).map((s, i) => {
            if (i === index) {
                s.url = url;
                s.icon = icon;
            }
            return s;
        });

        await saveSocialIcons(socialIcon);
        popover.remove();
        loadPlinkkPage();
    };

    popover.querySelector('#popoverSocialDelete').onclick = async () => {
        if (confirm('Supprimer ce réseau social ?')) {
            await deleteSocial(index);
            popover.remove();
        }
    };
}

function openStatusPopover(target) {
    closeAllPopovers();

    const statusbar = currentConfig?.statusbar || {};

    const rect = target.getBoundingClientRect();
    const popover = document.createElement('div');
    popover.className = 'edit-popover';
    popover.style.position = 'fixed';
    popover.style.top = Math.min(rect.bottom + 8, window.innerHeight - 280) + 'px';
    popover.style.left = Math.min(rect.left, window.innerWidth - 320) + 'px';

    popover.innerHTML = `
        <div class="popover-header">
            <span class="popover-title">Modifier le statut</span>
            <button class="popover-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="popover-body">
            <div class="popover-row">
                <span class="popover-label">Texte</span>
                <input type="text" class="popover-input" id="popoverStatusText" value="${statusbar.text || 'Disponible'}" placeholder="Votre statut...">
            </div>
            <div class="popover-row">
                <span class="popover-label">Indicateur</span>
                <select class="popover-input" id="popoverStatusIcon" style="cursor:pointer;">
                    <option value="🟢" ${statusbar.statusText === '🟢' ? 'selected' : ''}>🟢 Disponible</option>
                    <option value="🟡" ${statusbar.statusText === '🟡' ? 'selected' : ''}>🟡 Occupé</option>
                    <option value="🔴" ${statusbar.statusText === '🔴' ? 'selected' : ''}>🔴 Indisponible</option>
                </select>
            </div>
            <div class="popover-row">
                <span class="popover-label">Couleur fond</span>
                <input type="color" class="popover-color" id="popoverStatusBg" value="${statusbar.colorBg || '#1f2937'}">
            </div>
            <div class="popover-actions">
                <div></div>
                <button class="popover-btn save" id="popoverStatusSave">Enregistrer</button>
            </div>
        </div>
    `;

    document.body.appendChild(popover);

    popover.querySelector('.popover-close').onclick = () => popover.remove();

    popover.querySelector('#popoverStatusSave').onclick = async () => {
        const text = popover.querySelector('#popoverStatusText').value;
        const statusText = popover.querySelector('#popoverStatusIcon').value;
        const colorBg = popover.querySelector('#popoverStatusBg').value;

        await saveStatusBar({ text, statusText, colorBg });
        popover.remove();
        loadPlinkkPage();
    };
}

// Social picker (simplifié)
function openSocialPicker() {
    // Pour l'instant, ajoute un social vide
    const socialIcon = currentConfig.socialIcon || [];
    socialIcon.push({ url: 'https://', icon: '' });
    saveSocialIcons(socialIcon).then(() => loadPlinkkPage());
}

// ===== CANVAS =====

function initCanvas(canvasFileName) {
    const canvas = document.getElementById('animatedCanvas');
    if (!canvas) return;

    const container = document.getElementById('plinkkRenderer');
    const rect = container ? container.getBoundingClientRect() : { width: 800, height: 600 };
    canvas.width = rect.width || 800;
    canvas.height = rect.height || 600;

    // Load extensions declared in canvaConfig (e.g. SimplexNoise, animejs)
    const canvaConfig = window.__PLINKK_CFG__?.canvaData || [];
    const configItem = canvaConfig.find(c => c.fileNames === canvasFileName || c.fileName === canvasFileName);

    function loadScriptOnce(src) {
        return new Promise((resolve, reject) => {
            if (!src) return resolve();
            // ignore sentinel values
            if (src === 'none') return resolve();
            // already loaded?
            if (document.querySelector('script[src="' + src + '"]')) return resolve();
            const s = document.createElement('script');
            s.src = src;
            s.async = false;
            s.onload = () => resolve();
            s.onerror = (e) => reject(new Error('Failed to load ' + src));
            document.head.appendChild(s);
        });
    }

    async function loadExtensionsAndScript() {
        try {
            const exts = configItem?.extension;
            if (exts) {
                if (Array.isArray(exts)) {
                    // load sequentially to preserve order
                    for (const ext of exts) await loadScriptOnce(ext);
                } else if (typeof exts === 'string') {
                    // some entries use a comma-separated string
                    if (exts.includes(',')) {
                        for (const e of exts.split(',').map(x => x.trim())) await loadScriptOnce(e);
                    } else {
                        await loadScriptOnce(exts);
                    }
                }
            }

            const script = document.createElement('script');
            script.src = '/public/canvaAnimation/' + canvasFileName;
            script.onload = function () {
                try {
                    if (typeof runCanvasAnimation === 'function') {
                        runCanvasAnimation(canvas.getContext('2d'), canvas);
                    }
                } catch (e) {
                }
            };
            script.onerror = (e) => { };
            document.head.appendChild(script);
        } catch (err) {
            // fallback: still try to load the main script
            const script = document.createElement('script');
            script.src = '/public/canvaAnimation/' + canvasFileName;
            script.onload = function () {
                if (typeof runCanvasAnimation === 'function') {
                    runCanvasAnimation(canvas.getContext('2d'), canvas);
                }
            };
            document.head.appendChild(script);
        }
    }

    loadExtensionsAndScript();

    window.addEventListener('resize', function () {
        if (container) {
            const newRect = container.getBoundingClientRect();
            canvas.width = newRect.width || 800;
            canvas.height = newRect.height || 600;
        }
    });
}

// ===== TOOLBAR HANDLERS =====

document.addEventListener('DOMContentLoaded', function () {
    // Handlers toolbar
    const addLinkToolbar = qs('#addLinkToolbar');
    const addSocialToolbar = qs('#addSocialToolbar');
    const addLabelToolbar = qs('#addLabelToolbar');
    const togglePreviewToolbar = qs('#togglePreviewToolbar');
    const openThemeToolbar = qs('#openThemeToolbar');
    const openCanvasToolbar = qs('#openCanvasToolbar');

    if (addLinkToolbar) addLinkToolbar.addEventListener('click', addNewLink);
    if (addSocialToolbar) addSocialToolbar.addEventListener('click', openSocialPicker);
    if (addLabelToolbar) addLabelToolbar.addEventListener('click', addNewLabel);

    // Preview toggle
    function openPreview() {
        const container = qs('#previewContainer');
        const iframe = qs('#previewIframe');
        if (!container || !iframe) return;
        const base = window.__PLINKK_FRONTEND_URL__ || '';
        const path = window.__PLINKK_PREVIEW_PATH__ || ('/' + (window.__PLINKK_USER_ID__ || ''));
        iframe.src = base + path;
        container.classList.remove('hidden');
        // hide editor content
        const renderer = qs('#plinkkRenderer');
        if (renderer) renderer.style.display = 'none';
        // swap icon/text
        const icon = qs('#togglePreviewIcon');
        if (icon) { icon.innerHTML = '<path d="M3 12h18"/><path d="M3 6h18" opacity="0.25"/>'; }
    }

    function closePreview() {
        const container = qs('#previewContainer');
        const iframe = qs('#previewIframe');
        if (!container || !iframe) return;
        iframe.src = 'about:blank';
        container.classList.add('hidden');
        const renderer = qs('#plinkkRenderer');
        if (renderer) renderer.style.display = '';
    }

    if (togglePreviewToolbar) togglePreviewToolbar.addEventListener('click', () => {
        const container = qs('#previewContainer');
        if (container && !container.classList.contains('hidden')) {
            closePreview();
        } else {
            openPreview();
        }
    });

    const closePreviewBtn = qs('#closePreviewBtn');
    if (closePreviewBtn) closePreviewBtn.addEventListener('click', closePreview);

    function openPicker(kind) {
        const modal = qs('#pickerModal');
        const title = qs('#pickerTitle');
        const grid = qs('#pickerGrid');
        const close = qs('#pickerClose');
        const search = qs('#pickerSearch');
        const createBtn = qs('#pickerCreateBtn');
        if (!modal || !grid || !title) return;

        // Préparer
        grid.innerHTML = '';
        title.textContent = kind === 'theme' ? 'Choisir un thème' : 'Choisir un fond animé';
        if (createBtn) createBtn.classList.toggle('hidden', kind !== 'theme');
        modal.classList.remove('hidden');

        const items = kind === 'theme' ? (window.__PLINKK_CFG__?.themes || []) : (window.__PLINKK_CFG__?.canvaData || []);

        // Option "Aucun" pour canvas
        if (kind === 'canvas') {
            const noneBtn = document.createElement('button');
            noneBtn.className = 'p-3 rounded bg-slate-800 hover:bg-slate-700 text-left w-full flex items-center gap-3';
            noneBtn.innerHTML = '<div class="w-12 h-12 bg-slate-700 rounded"></div><div><div class="font-medium text-white">Aucun</div><div class="text-xs text-slate-400">Désactiver le fond animé</div></div>';
            noneBtn.addEventListener('click', async () => {
                await savePlinkk({ canvaEnable: 0 });
                modal.classList.add('hidden');
                loadPlinkkPage();
            });
            grid.appendChild(noneBtn);
        }

        function computePreviewStyle(item, kind) {
            // Themes: try backgroundColors, colors, primaryColor
            if (kind === 'theme') {
                const bg = item.backgroundColors || item.backgrounds || item.colors || item.colorsPreview;
                if (Array.isArray(bg) && bg.length >= 2) {
                    return `background: linear-gradient(135deg, ${bg[0]} 0%, ${bg[1]} 100%);`;
                }
                if (item.primaryColor) return `background: ${item.primaryColor};`;
                if (item.color) return `background: ${item.color};`;
                return 'background: linear-gradient(135deg,#7c3aed,#06b6d4);';
            }
            // Canvas: if thumbnail available use it, otherwise neutral
            if (kind === 'canvas') {
                if (item.thumbnail) return `background-image:url(${item.thumbnail});background-size:cover;background-position:center;`;
                return 'background: linear-gradient(135deg,#06b6d4,#0891b2); display:flex;align-items:center;justify-content:center;color:white;font-weight:700;';
            }
            return '';
        }

        items.forEach((it, i) => {
            const name = it.name || it.animationName || it.title || it.slug || (`Item ${i}`);
            const desc = it.description || it.animationName || '';
            const previewStyle = computePreviewStyle(it, kind);
            const card = document.createElement('button');
            card.className = 'p-3 rounded bg-slate-800 hover:bg-slate-700 text-left w-full flex items-center gap-3';
            const previewHtml = `<div class="picker-preview" style="${previewStyle}">${kind === 'canvas' ? `<div style=\"padding:6px;color:white;font-size:11px\">${escapeHtml(it.animationName || it.fileNames || '')}</div>` : ''}</div>`;
            card.innerHTML = `<div class="picker-card-content">${previewHtml}<div><div class="picker-card-title">${escapeHtml(name)}</div><div class="picker-card-desc">${escapeHtml(desc)}</div></div></div>`;
            card.addEventListener('click', async () => {
                if (kind === 'theme') {
                    await savePlinkk({ selectedThemeIndex: i });
                } else {
                    await savePlinkk({ canvaEnable: 1, selectedCanvasIndex: i });
                }
                modal.classList.add('hidden');
                loadPlinkkPage();
            });
            grid.appendChild(card);
        });

        if (close) close.onclick = () => modal.classList.add('hidden');
        if (search) {
            search.value = '';
            search.oninput = () => {
                const q = search.value.trim().toLowerCase();
                grid.querySelectorAll('button').forEach(b => {
                    b.style.display = q === '' ? 'flex' : (b.textContent.toLowerCase().includes(q) ? 'flex' : 'none');
                });
            };
        }
    }

    if (openThemeToolbar) openThemeToolbar.addEventListener('click', () => openPicker('theme'));
    if (openCanvasToolbar) openCanvasToolbar.addEventListener('click', () => openPicker('canvas'));

    // Fermer les popovers au clic extérieur
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.edit-popover') &&
            !e.target.closest('.edit-link-btn') &&
            !e.target.closest('.label-edit-btn') &&
            !e.target.closest('.social-edit-btn') &&
            !e.target.closest('.statusbar-edit-btn')) {
            closeAllPopovers();
        }
    });

    // Charger la page
    loadPlinkkPage();
});
