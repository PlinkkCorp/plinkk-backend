import { qs, attachAutoSave, fillSelect, vOrNull, numOrNull } from './utils.js';
import { openIconModal, openPicker, renderPickerGrid, renderBtnThemeCard, closePicker, ensurePlatformEntryModal, pickerSelect } from './pickers.js';
import { renderBackground, renderNeon, renderLabels, renderSocial, renderLinks, renderLayout, renderCategories } from './renderers.js';
import { ensureCanvasPreviewModal, openCanvasInlinePreview, buildCanvasPreviewUrl, refreshSelectedCanvasPreview, renderCanvasCard } from './canvas.js';
import { setupStatusDropdown, updateStatusControlsDisabled, updateStatusPreview } from './status.js';

// Expose some picker helpers for renderers (simple bridge without global namespace pollution ideally)
  window.__DASH_PICKERS__ = { openPicker, renderPickerGrid, renderBtnThemeCard, pickerOnSelect: (i) => pickerSelect(i) };
window.__OPEN_PLATFORM_MODAL__ = (platform, cb) => ensurePlatformEntryModal().open(platform, cb);

(function () {
  const statusEl = qs('#status');
  const preview = qs('#preview');
  const saveBtn = qs('#saveBtn');
  const resetBtn = qs('#resetBtn');
  const refreshBtn = qs('#refreshPreview');

  const selectedCanvasPreviewFrame = qs('#selectedCanvasPreviewFrame');
  const selectedCanvasPreviewOverlay = qs('#selectedCanvasPreviewOverlay');
  const canvasPreviewEnable = qs('#canvasPreviewEnable');

  let autoSaveTimer = null;
  let previewTimer = null;
  let suspendAutoSave = false;
  let saving = false;
  let saveQueued = false;
  // Délais pour limiter le spam de requêtes et de rafraîchissements
  const AUTO_SAVE_DELAY = 1500; // délai avant PUT auto (1.5s)
  const PREVIEW_REFRESH_DELAY = 1000; // délai avant déclencher un refresh si aucune autre frappe (debounce)
  const PREVIEW_MIN_INTERVAL = 1000; // intervalle min entre 2 refresh effectifs (throttle)
  let lastPreviewAt = 0;
  let previewQueued = false;

  const f = {
    profileLink: qs('#profileLink'),
    profileSiteText: qs('#profileSiteText'),
    userName: qs('#userName'),
    email: qs('#email'),
    profileImage: qs('#profileImage'),
    profileIcon: qs('#profileIcon'),
    iconUrl: qs('#iconUrl'),
    description: qs('#description'),
    profileHoverColor: qs('#profileHoverColor'),
    degBackgroundColor: qs('#degBackgroundColor'),
    neonEnable: qs('#neonEnable'),
    buttonThemeEnable: qs('#buttonThemeEnable'),
    canvaEnable: qs('#canvaEnable'),
    showVerifiedBadge: qs('#showVerifiedBadge'),
    showPartnerBadge: qs('#showPartnerBadge'),
    // enableVCard: qs('#enableVCard'),
    publicPhone: qs('#publicPhone'),
    enableLinkCategories: qs('#enableLinkCategories'),
    categoriesContainer: qs('#categoriesContainer'),
    addCategory: qs('#addCategory'),
    categoriesDisabledMsg: qs('#categoriesDisabledMsg'),
    selectedThemeIndex: qs('#selectedThemeIndex'),
    selectedAnimationIndex: qs('#selectedAnimationIndex'),
    selectedAnimationButtonIndex: qs('#selectedAnimationButtonIndex'),
    selectedAnimationBackgroundIndex: qs('#selectedAnimationBackgroundIndex'),
    animationDurationBackground: qs('#animationDurationBackground'),
    delayAnimationButton: qs('#delayAnimationButton'),
    backgroundSize: qs('#backgroundSize'),
    selectedCanvasIndex: qs('#selectedCanvasIndex'),
    status_text: qs('#status_text'),
    status_fontTextColor: qs('#status_fontTextColor'),
    status_statusText: qs('#status_statusText'),
    statusPreviewChip: qs('#statusPreviewChip'),
    statusDropdown: qs('#statusDropdown'),
    statusDropdownBtn: qs('#statusDropdownBtn'),
    statusDropdownPanel: qs('#statusDropdownPanel'),
    backgroundList: qs('#backgroundList'),
    addBackgroundColor: qs('#addBackgroundColor'),
  invertBackgroundColors: qs('#invertBackgroundColors'),
    neonList: qs('#neonList'),
    addNeonColor: qs('#addNeonColor'),
    labelsList: qs('#labelsList'),
    addLabel: qs('#addLabel'),
    socialList: qs('#socialList'),
    addSocial: qs('#addSocial'),
    linksList: qs('#linksList'),
    addLink: qs('#addLink'),
    layoutList: qs('#layoutList'),
  };

  const setStatus = (text, kind = '') => {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.className = 'text-xs ' + (kind === 'error' ? 'text-red-400' : kind === 'success' ? 'text-emerald-400' : 'text-slate-400');
  };

  // Expose un déclencheur global pour l’autosave depuis le template (ex: lors d’un clic sur le bouton de masquage)
  window.__DASH_TRIGGER_SAVE__ = () => {
    try { scheduleAutoSave(); } catch {}
  };
  const schedulePreviewRefresh = () => {
    // Debounce: repousser si ça tape vite
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      const now = Date.now();
      const elapsed = now - lastPreviewAt;
      // Throttle: au plus 1 refresh/s
      if (elapsed >= PREVIEW_MIN_INTERVAL) {
        try { refreshPreview(); } catch {}
        lastPreviewAt = Date.now();
        previewQueued = false;
      } else if (!previewQueued) {
        previewQueued = true;
        setTimeout(() => {
          try { refreshPreview(); } catch {}
          lastPreviewAt = Date.now();
          previewQueued = false;
        }, PREVIEW_MIN_INTERVAL - elapsed);
      }
    }, PREVIEW_REFRESH_DELAY);
  };
  const scheduleAutoSave = () => {
    if (suspendAutoSave) return;
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    setStatus('Enregistrement...');
    autoSaveTimer = setTimeout(() => { saveNow(false); }, AUTO_SAVE_DELAY);
  };

  function getConfigEndpoint(section) {
    const pid = (window.__PLINKK_SELECTED_ID__ || '').trim();
    if (pid) return `/api/me/plinkks/${encodeURIComponent(pid)}/config`;
    return '/api/me/config';
  }
  const fetchConfig = () => fetch(getConfigEndpoint()).then(async (r) => { if (!r.ok) throw new Error(await r.text()); return r.json(); });
  const putConfig = (section, obj) => fetch(getConfigEndpoint() + `/${section}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }).then(async (r) => { if (!r.ok) throw new Error(await r.text()); return r.json(); });

  async function saveNow(manual) {
    if (autoSaveTimer) { clearTimeout(autoSaveTimer); autoSaveTimer = null; }
    if (saving) { saveQueued = true; return; }
    saving = true;
    const hash = location.hash.replace("#section-", "") !== "" ? location.hash.replace("#section-", "") : 'profile'
    let sectionsAPI = [];
    let sectionsAPIFunction = []
    switch (hash) {
      case "appearance":
        sectionsAPI = [ "plinkk", "neonColor" ]
        sectionsAPIFunction = [ collectPayloadPlinkk, collectPayloadNeonColor ]
        break;
      case "background":
        sectionsAPI = [ "background", "plinkk" ]
        sectionsAPIFunction = [ collectPayloadBackground, collectPayloadPlinkk ]
        break;

      case "links":
        sectionsAPI = [ "socialIcon", "links", "plinkk" ]
        sectionsAPIFunction = [ collectPayloadSocialIcon, collectPayloadLinks, collectPayloadPlinkk ]
        break;
      case "categories":
        sectionsAPI = [ "categories", "plinkk" ]
        sectionsAPIFunction = [ collectPayloadCategories, collectPayloadPlinkk ]
        break;
      case "animations":
        sectionsAPI = [ "plinkk" ]
        sectionsAPIFunction = [ collectPayloadPlinkk ]
        break;
      case "statusbar":
        sectionsAPI = [ "statusBar" ]
        sectionsAPIFunction = [ collectPayloadStatusBar ]
        break;
      case "layout":
        sectionsAPI = [ "layout" ]
        sectionsAPIFunction = [ collectPayloadLayout ]
        break;
      default:
        sectionsAPI = [ "plinkk" ]
        sectionsAPIFunction = [ collectPayloadPlinkk ]
        break;
    }
    setStatus('Enregistrement...');
    try {
      for (let i = 0; i < sectionsAPI.length; i++) {
        const section = sectionsAPI[i];
        const payloadFn = sectionsAPIFunction[i];
        const payload = typeof payloadFn === 'function' ? payloadFn() : payloadFn;
        const res = await putConfig(section, payload);
        
        if (section === 'categories' && res.categories && Array.isArray(res.categories)) {
            state.categories = res.categories;
            state.links.forEach(l => {
                const cat = state.categories.find(c => c.name === l.categoryId || c.id === l.categoryId);
                if (cat) {
                    l.categoryId = cat.id;
                }
            });
             renderCategories({ 
              container: f.categoriesContainer, 
              addBtn: f.addCategory, 
              categories: state.categories, 
              scheduleAutoSave,
              onUpdate: () => {
                renderLinks({ container: f.linksList, addBtn: f.addLink, links: state.links, categories: state.categories, scheduleAutoSave });
              }
            });
        }

        if (section === 'links' && res.links && Array.isArray(res.links)) {
          // Attempt to reconcile IDs for new links
          const dbLinks = res.links;
          const usedDbIds = new Set();
          
          // First pass: mark IDs that are already known
          state.links.forEach(l => {
            if (l.id && dbLinks.find(d => d.id === l.id)) {
              usedDbIds.add(l.id);
            }
          });

          // Second pass: assign IDs to new links
          state.links.forEach(l => {
            if (!l.id) {
              // Try to find a matching link in DB response that hasn't been matched yet
              const match = dbLinks.find(d => 
                !usedDbIds.has(d.id) && 
                d.url === l.url && 
                d.text === l.text &&
                d.name === l.name
              );
              if (match) {
                l.id = match.id;
                usedDbIds.add(match.id);
              }
            }
          });
        }
      }
      setStatus(manual ? 'Enregistré ✓' : 'Enregistré automatiquement ✓', 'success');
      schedulePreviewRefresh();
    } catch (e) {
      let msg = e?.message || '';
      try {
         const json = JSON.parse(msg);
         if (json.error) msg = json.error;
      } catch {}
      setStatus('Erreur: ' + msg, 'error');
    } finally {
      saving = false;
      if (saveQueued) { saveQueued = false; scheduleAutoSave(); }
    }
  }

  const state = { background: [], neonColors: [], labels: [], socialIcon: [], links: [], categories: [], layoutOrder: [] };

  async function ensureCfg(maxWaitMs = 3000) {
    const start = Date.now();
    while (!window.__PLINKK_CFG__) {
      if (Date.now() - start > maxWaitMs) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    return window.__PLINKK_CFG__ || { themes: [], animations: [], animationBackground: [], canvaData: [], btnIconThemeConfig: [] };
  }

  async function fillForm(cfg) {
    suspendAutoSave = true;
    f.profileLink.value = cfg.profileLink || '';
    f.profileSiteText.value = cfg.profileSiteText || '';
    f.userName.value = cfg.userName || '';
    f.email.value = cfg.email || '';
    f.profileImage.value = cfg.profileImage || '';
    f.profileIcon.value = cfg.profileIcon || '';
    f.iconUrl.value = cfg.iconUrl || '';
    f.description.value = cfg.description || '';
    f.profileHoverColor.value = cfg.profileHoverColor || '#7289DA';
    f.degBackgroundColor.value = cfg.degBackgroundColor ?? 45;

    try {
      f.degBackgroundColor.dispatchEvent(new Event('input', { bubbles: true }));
      f.degBackgroundColor.dispatchEvent(new Event('change', { bubbles: true }));
    } catch {}
    f.buttonThemeEnable.checked = (cfg.buttonThemeEnable ?? 1) === 1;
    f.canvaEnable.checked = (cfg.canvaEnable ?? 1) === 1;
    if (f.showVerifiedBadge) f.showVerifiedBadge.checked = (cfg.showVerifiedBadge ?? true);
    if (f.showPartnerBadge) f.showPartnerBadge.checked = (cfg.showPartnerBadge ?? true);
    // if (f.enableVCard) f.enableVCard.checked = (cfg.enableVCard ?? true);
    if (f.publicPhone) f.publicPhone.value = cfg.publicPhone || '';
    if (f.enableLinkCategories) f.enableLinkCategories.checked = (cfg.enableLinkCategories ?? false);
    
    f.categoriesHint = qs('#categoriesHint');
    
    if (f.enableLinkCategories) {
      if (f.enableLinkCategories.checked) {
        f.categoriesContainer.classList.remove('hidden');
        if (f.addCategory) f.addCategory.classList.remove('hidden');
        if (f.categoriesDisabledMsg) f.categoriesDisabledMsg.classList.add('hidden');
        if (f.categoriesHint) f.categoriesHint.classList.remove('hidden');
      } else {
        f.categoriesContainer.classList.add('hidden');
        if (f.addCategory) f.addCategory.classList.add('hidden');
        if (f.categoriesDisabledMsg) f.categoriesDisabledMsg.classList.remove('hidden');
        if (f.categoriesHint) f.categoriesHint.classList.add('hidden');
      }
    }

    const { themes = [], animations: anims = [], animationBackground: animBgs = [], canvaData: canvases = [] } = await ensureCfg();
    fillSelect(f.selectedThemeIndex, themes, (t, i) => (t?.name ? `${i} · ${t.name}` : `Thème ${i}`));
    fillSelect(f.selectedAnimationIndex, anims, (a, i) => (a?.name ? `${i} · ${a.name}` : `Anim ${i}`));
    fillSelect(f.selectedAnimationButtonIndex, anims, (a, i) => (a?.name ? `${i} · ${a.name}` : `Anim ${i}`));
    fillSelect(f.selectedAnimationBackgroundIndex, animBgs, (a, i) => (a?.name ? `${i} · ${a.name}` : `Anim BG ${i}`));
    fillSelect(f.selectedCanvasIndex, canvases, (c, i) => (c?.animationName ? `${i} · ${c.animationName}` : `Canvas ${i}`));

    f.selectedThemeIndex.value = String(cfg.selectedThemeIndex ?? 13);
    f.selectedAnimationIndex.value = String(cfg.selectedAnimationIndex ?? 0);
    f.selectedAnimationButtonIndex.value = String(cfg.selectedAnimationButtonIndex ?? 10);
    f.selectedAnimationBackgroundIndex.value = String(cfg.selectedAnimationBackgroundIndex ?? 10);
    f.animationDurationBackground.value = cfg.animationDurationBackground ?? 30;
    f.delayAnimationButton.value = cfg.delayAnimationButton ?? 0.1;
    f.backgroundSize.value = cfg.backgroundSize ?? 50;
    f.selectedCanvasIndex.value = String(cfg.selectedCanvasIndex ?? 16);

    const canvasLabelEl = qs('#selectedCanvasLabel');
    if (canvasLabelEl) {
      const idx = Number(f.selectedCanvasIndex.value || 0) || 0;
      const item = canvases[idx];
      canvasLabelEl.value = item?.animationName ? `#${idx} · ${item.animationName}` : `#${idx}`;
    }
    const canvasPickerBtn = qs('#openCanvasPicker');
    const setCanvasControlsState = (enabled) => {
      if (canvasPickerBtn) canvasPickerBtn.disabled = !enabled;
      if (canvasLabelEl) canvasLabelEl.disabled = !enabled;
    };
    setCanvasControlsState(f.canvaEnable.checked);
    if (canvasPreviewEnable) {
      canvasPreviewEnable.disabled = !f.canvaEnable.checked;
      if (!f.canvaEnable.checked) canvasPreviewEnable.checked = false;
    }
    refreshSelectedCanvasPreview({
      cfg: window.__PLINKK_CFG__ || {},
      canvaEnableEl: f.canvaEnable,
      selectedCanvasIndexEl: f.selectedCanvasIndex,
      selectedCanvasPreviewOverlay,
      selectedCanvasPreviewFrame,
      canvasPreviewEnable,
    });

    const sb = cfg.statusbar || {};
    f.status_text.value = sb.text || '';
    f.status_fontTextColor.value = sb.fontTextColor ?? 1;
    f.status_statusText.value = sb.statusText || 'busy';
    setupStatusDropdown({ elements: f, scheduleAutoSave });
    updateStatusPreview({ elements: f });
    setTimeout(() => updateStatusControlsDisabled({ elements: f }), 0);

    state.background = Array.isArray(cfg.background) ? [...cfg.background] : [];
    state.neonColors = Array.isArray(cfg.neonColors) ? [...cfg.neonColors] : [];
    state.labels = Array.isArray(cfg.labels) ? cfg.labels.map((x) => ({ ...x })) : [];
  state.socialIcon = Array.isArray(cfg.socialIcon) ? cfg.socialIcon.map((x) => ({ ...x })) : [];
  state.links = Array.isArray(cfg.links) ? cfg.links.map((x) => ({ ...x })) : [];
  state.categories = Array.isArray(cfg.categories) ? cfg.categories.map((x) => ({ ...x })) : [];
  const DEFAULT_LAYOUT = ['profile','username','social','email','links'];
  state.layoutOrder = Array.isArray(cfg.layoutOrder) ? [...cfg.layoutOrder].filter(x => x !== 'labels') : [...DEFAULT_LAYOUT];

    renderBackground({ container: f.backgroundList, addBtn: f.addBackgroundColor, colors: state.background, scheduleAutoSave });
    renderNeon({ container: f.neonList, addBtn: f.addNeonColor, colors: state.neonColors, neonEnableEl: f.neonEnable, scheduleAutoSave });
    // renderLabels({ container: f.labelsList, addBtn: f.addLabel, labels: state.labels, scheduleAutoSave });
    try { renderSocial({ container: f.socialList, addBtn: f.addSocial, socials: state.socialIcon, scheduleAutoSave }); } catch (e) { console.error('renderSocial error', e); setStatus('Erreur affichage socials', 'error'); }
    try { renderLinks({ container: f.linksList, addBtn: f.addLink, links: state.links, categories: state.categories, scheduleAutoSave }); } catch (e) { console.error('renderLinks initial error', e); setStatus('Erreur affichage liens', 'error'); }
    renderCategories({ 
      container: f.categoriesContainer, 
      addBtn: f.addCategory, 
      categories: state.categories, 
      links: state.links,
      scheduleAutoSave,
      onUpdate: () => {
        renderLinks({ container: f.linksList, addBtn: f.addLink, links: state.links, categories: state.categories, scheduleAutoSave });
      }
    });
  renderLayout({ container: f.layoutList, order: state.layoutOrder, scheduleAutoSave });

    if (f.invertBackgroundColors) {
      f.invertBackgroundColors.addEventListener('click', () => {
        state.background.reverse();
        renderBackground({ container: f.backgroundList, addBtn: f.addBackgroundColor, colors: state.background, scheduleAutoSave });
        scheduleAutoSave();
      });
    }

    const hasNeonColors = state.neonColors.length > 0;
    if (f.neonEnable) {
      f.neonEnable.checked = false;
      f.neonEnable.disabled = true;
      f.neonEnable.title = 'Néon temporairement désactivé';
    }
    suspendAutoSave = false;
  }

  function isMasked(el) {
    if (!el) return false;
    return !!(el.classList?.contains('masked-field') || (el.dataset && typeof el.dataset._originalValue !== 'undefined'));
  }

  function maskedOr(val, el) {
    return isMasked(el) ? null : val;
  }

  function collectPayloadPlinkk() {
    return {
      profileLink: vOrNull(f.profileLink.value),
      profileImage: vOrNull(f.profileImage.value),
      userName: vOrNull(f.userName.value),

      profileIcon: maskedOr(vOrNull(f.profileIcon.value), f.profileIcon),
      profileSiteText: maskedOr(vOrNull(f.profileSiteText.value), f.profileSiteText),
      affichageEmail: maskedOr(vOrNull(f.email.value), f.email),
      iconUrl: maskedOr(vOrNull(f.iconUrl.value), f.iconUrl),
      description: maskedOr(vOrNull(f.description.value), f.description),
      profileHoverColor: vOrNull(f.profileHoverColor.value),
      degBackgroundColor: numOrNull(f.degBackgroundColor.value),
      neonEnable: state.neonColors.length > 0 && f.neonEnable?.checked ? 1 : 0,
      buttonThemeEnable: f.buttonThemeEnable.checked ? 1 : 0,
      showVerifiedBadge: f.showVerifiedBadge ? f.showVerifiedBadge.checked : true,
      showPartnerBadge: f.showPartnerBadge ? f.showPartnerBadge.checked : true,
      enableVCard: false, // f.enableVCard ? f.enableVCard.checked : true,
      publicPhone: f.publicPhone ? vOrNull(f.publicPhone.value) : null,
      enableLinkCategories: f.enableLinkCategories ? f.enableLinkCategories.checked : false,
      backgroundSize: numOrNull(f.backgroundSize.value),
      selectedThemeIndex: numOrNull(f.selectedThemeIndex.value),
      selectedAnimationIndex: numOrNull(f.selectedAnimationIndex.value),
      selectedAnimationButtonIndex: numOrNull(f.selectedAnimationButtonIndex.value),
      selectedAnimationBackgroundIndex: numOrNull(f.selectedAnimationBackgroundIndex.value),
      animationDurationBackground: numOrNull(f.animationDurationBackground.value),
      delayAnimationButton: parseFloat(f.delayAnimationButton.value || '0'),
      canvaEnable: f.canvaEnable.checked ? 1 : 0,
      selectedCanvasIndex: numOrNull(f.selectedCanvasIndex.value),
    };
  }

  function collectPayloadBackground() {
    return {
      background: state.background,
    };
  }

  function collectPayloadLabels() {
    return {
      labels: state.labels,
    };
  }

  function collectPayloadSocialIcon() {
    return {
      socialIcon: state.socialIcon,
    };
  }

  function collectPayloadLinks() {
    return {
      links: state.links,
    };
  }

  function collectPayloadCategories() {
    return {
      categories: state.categories,
    };
  }

  function collectPayloadLayout() {
    return {
      layoutOrder: state.layoutOrder,
    };
  }

  function collectPayloadStatusBar() {
    const sbText = vOrNull(f.status_text.value);
    const statusbar = sbText === null ? null : { text: sbText, fontTextColor: numOrNull(f.status_fontTextColor.value), statusText: vOrNull(f.status_statusText.value) };
    return {
      statusbar,
    };
  }

  function collectPayloadNeonColor() {
    return {
      neonColors: state.neonColors,
    };
  }

  function refreshPreview() {
    if (!preview) return;
    const url = new URL(preview.src, window.location.origin);
    url.searchParams.set('t', Date.now().toString());
    preview.src = url.toString();
  }

  saveBtn?.addEventListener('click', async () => { saveNow(true); });
  resetBtn?.addEventListener('click', async () => {
    setStatus('Réinitialisation...');
    try { const cfg = await fetchConfig(); fillForm(cfg); setStatus('Données rechargées', 'success'); }
    catch (e) { setStatus('Erreur: ' + (e?.message || ''), 'error'); }
  });
  refreshBtn?.addEventListener('click', (e) => { e.preventDefault(); schedulePreviewRefresh(); });

  [
    f.profileLink, f.profileSiteText, f.userName, f.email,
    f.profileImage, f.profileIcon, f.iconUrl, f.description,
    f.profileHoverColor, f.degBackgroundColor,
    f.neonEnable, f.buttonThemeEnable, f.canvaEnable,
    f.showVerifiedBadge, f.showPartnerBadge, /* f.enableVCard, */ f.publicPhone, f.enableLinkCategories,
    f.selectedThemeIndex, f.selectedAnimationIndex,
    f.selectedAnimationButtonIndex, f.selectedAnimationBackgroundIndex,
    f.animationDurationBackground, f.delayAnimationButton, f.backgroundSize,
    f.selectedCanvasIndex,
    f.status_text, f.status_fontTextColor, f.status_statusText,
  ].forEach((el) => attachAutoSave(el, scheduleAutoSave));

    if (f.enableLinkCategories) {
    f.enableLinkCategories.addEventListener('change', () => {
      if (f.enableLinkCategories.checked) {
        f.categoriesContainer.classList.remove('hidden');
        if (f.addCategory) f.addCategory.classList.remove('hidden');
        if (f.categoriesDisabledMsg) f.categoriesDisabledMsg.classList.add('hidden');
        if (f.categoriesHint) f.categoriesHint.classList.remove('hidden');
        
        renderCategories({ 
            container: f.categoriesContainer, 
            addBtn: f.addCategory, 
            categories: state.categories, 
            links: state.links,
            scheduleAutoSave,
            onUpdate: () => {
                renderLinks({ container: f.linksList, addBtn: f.addLink, links: state.links, categories: state.categories, scheduleAutoSave });
            }
        });
      } else {
        f.categoriesContainer.classList.add('hidden');
        if (f.addCategory) f.addCategory.classList.add('hidden');
        if (f.categoriesDisabledMsg) f.categoriesDisabledMsg.classList.remove('hidden');
        if (f.categoriesHint) f.categoriesHint.classList.add('hidden');
      }
    });
  }

  if (f.status_statusText) f.status_statusText.addEventListener('change', () => updateStatusPreview({ elements: f }));
  f.status_text?.addEventListener('input', () => { updateStatusControlsDisabled({ elements: f }); scheduleAutoSave(); });

  if (f.canvaEnable) {
    f.canvaEnable.addEventListener('change', () => {
      const canvasLabelEl2 = qs('#selectedCanvasLabel');
      const canvasPickerBtn2 = qs('#openCanvasPicker');
      if (canvasPickerBtn2) canvasPickerBtn2.disabled = !f.canvaEnable.checked;
      if (canvasLabelEl2) canvasLabelEl2.disabled = !f.canvaEnable.checked;
      if (canvasPreviewEnable) {
        canvasPreviewEnable.disabled = !f.canvaEnable.checked;
        if (!f.canvaEnable.checked) canvasPreviewEnable.checked = false;
      }
      refreshSelectedCanvasPreview({
        cfg: window.__PLINKK_CFG__ || {},
        canvaEnableEl: f.canvaEnable,
        selectedCanvasIndexEl: f.selectedCanvasIndex,
        selectedCanvasPreviewOverlay,
        selectedCanvasPreviewFrame,
        canvasPreviewEnable,
      });
    });
  }
  if (canvasPreviewEnable) canvasPreviewEnable.addEventListener('change', () => {
    refreshSelectedCanvasPreview({
      cfg: window.__PLINKK_CFG__ || {},
      canvaEnableEl: f.canvaEnable,
      selectedCanvasIndexEl: f.selectedCanvasIndex,
      selectedCanvasPreviewOverlay,
      selectedCanvasPreviewFrame,
      canvasPreviewEnable,
    });
  });

  (async () => {
    const cfg = await ensureCfg();
    const themeBtn = qs('#openThemePicker');
    const canvasBtn = qs('#openCanvasPicker');
    const animArticleBtn = qs('#openAnimArticlePicker');
    const animButtonBtn = qs('#openAnimButtonPicker');
    const animBgBtn = qs('#openAnimBackgroundPicker');
    const canvasLabelEl = qs('#selectedCanvasLabel');
    if (themeBtn && f.selectedThemeIndex) {
      themeBtn.addEventListener('click', () => openPicker({
        title: 'Choisir un thème', type: 'theme', items: cfg.themes || [],
        renderCard: (theme, idx) => {
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'p-3 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-left space-y-2';
          const head = document.createElement('div'); head.className = 'flex items-center justify-between';
          const title = document.createElement('div'); title.className = 'font-medium truncate'; title.textContent = `#${idx} · ${theme?.name || 'Thème'}`;
          const meta = document.createElement('div'); meta.className = 'flex items-center gap-2';
          const creator = document.createElement('span'); creator.className = 'text-[10px] px-2 py-0.5 rounded border border-slate-700 text-slate-300';
          if (theme?.author && theme.author.userName) {
            creator.textContent = `par ${theme.author.userName}`;
          } else {
            creator.textContent = 'original';
          }
          const infoBtn = document.createElement('button'); infoBtn.type = 'button'; infoBtn.className = 'size-6 inline-flex items-center justify-center rounded bg-slate-800 border border-slate-700 hover:bg-slate-700'; infoBtn.title = 'Infos';
          infoBtn.innerHTML = '<svg class="h-3.5 w-3.5 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
          infoBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const d = document.createElement('div');
            d.className = 'z-[80] fixed inset-0';
            d.innerHTML = `
              <div class="absolute inset-0 bg-black/60"></div>
              <div class="relative z-[1] mx-auto mt-20 w-[92vw] max-w-md rounded-lg border border-slate-800 bg-slate-900 shadow-xl p-4 space-y-2">
                <div class="flex items-center justify-between">
                  <div class="font-medium">Détails du thème</div>
                  <button class="h-8 w-8 rounded bg-slate-800 hover:bg-slate-700" data-close>✕</button>
                </div>
                <div class="text-sm text-slate-300"><b>${theme?.name || ''}</b></div>
                ${theme?.description ? `<div class="text-xs text-slate-400">${theme.description}</div>` : ''}
                ${theme?.author && theme.author.id ? `<div class="text-xs">Créateur: <a class="text-indigo-400 hover:underline" href="${window.__PLINKK_FRONTEND_URL__}/${theme.author.id}" target="_blank">@${theme.author.userName || theme.author.id}</a></div>` : '<div class="text-xs text-slate-400">Créateur: original</div>'}
              </div>`;
            document.body.appendChild(d);
            const close = () => d.remove();
            d.addEventListener('click', (e) => { if (e.target === d.firstElementChild) close(); });
            d.querySelector('[data-close]')?.addEventListener('click', close);
          });
          meta.append(creator, infoBtn);
          head.append(title, meta);
          const previewBox = document.createElement('div'); previewBox.className = 'rounded p-3 border border-slate-800';
          previewBox.style.background = theme?.background || '#111827'; previewBox.style.color = theme?.textColor || '#e5e7eb';
          const btns = document.createElement('div'); btns.className = 'flex gap-2';
          const b1 = document.createElement('button'); b1.className = 'px-2 py-1 text-xs rounded'; b1.style.background = theme?.buttonBackground || '#4f46e5'; b1.style.color = theme?.buttonTextColor || '#111827'; b1.textContent = 'Bouton';
          const b2 = document.createElement('button'); b2.className = 'px-2 py-1 text-xs rounded'; b2.style.background = theme?.hoverColor || '#22c55e'; b2.style.color = theme?.textColor || '#111827'; b2.textContent = 'Hover';
          btns.append(b1, b2); previewBox.append(btns);
          card.append(head, previewBox);
          card.addEventListener('click', () => { window.__DASH_PICKERS__.pickerOnSelect?.(idx); closePicker(); });
          return card;
        },
        onSelect: (i) => { f.selectedThemeIndex.value = String(i); scheduleAutoSave(); },
      }));
    }

    function openCanvasPicker() {
      openPicker({
        title: 'Choisir un canvas', type: 'canvas', items: cfg.canvaData || [],
        renderCard: (item, idx) => renderCanvasCard(item, idx, (i) => { window.__DASH_PICKERS__.pickerOnSelect?.(i); }),
        onSelect: (i) => {
          f.selectedCanvasIndex.value = String(i);
          if (canvasLabelEl) {
            const item = (cfg.canvaData || [])[i];
            canvasLabelEl.value = item?.animationName ? `#${i} · ${item.animationName}` : `#${i}`;
          }
          refreshSelectedCanvasPreview({
            cfg: window.__PLINKK_CFG__ || {},
            canvaEnableEl: f.canvaEnable,
            selectedCanvasIndexEl: f.selectedCanvasIndex,
            selectedCanvasPreviewOverlay,
            selectedCanvasPreviewFrame,
            canvasPreviewEnable,
          });
          scheduleAutoSave();
        },
      });
    }
    if (canvasBtn && f.selectedCanvasIndex) canvasBtn.addEventListener('click', openCanvasPicker);
    if (canvasLabelEl) {
      canvasLabelEl.addEventListener('click', openCanvasPicker);
      canvasLabelEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCanvasPicker(); } });
    }
    f.selectedCanvasIndex?.addEventListener('change', () => refreshSelectedCanvasPreview({
      cfg: window.__PLINKK_CFG__ || {},
      canvaEnableEl: f.canvaEnable,
      selectedCanvasIndexEl: f.selectedCanvasIndex,
      selectedCanvasPreviewOverlay,
      selectedCanvasPreviewFrame,
      canvasPreviewEnable,
    }));

    function ensureAnimationLoops(animStr) {
      if (!animStr) return '';
      return /\binfinite\b/.test(animStr) ? animStr : `${animStr} infinite`;
    }

    function renderAnimCard(item, idx) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'p-3 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-left space-y-2';
      const head = document.createElement('div'); head.className = 'flex items-center justify-between';
      const title = document.createElement('div'); title.className = 'font-medium truncate'; title.textContent = `#${idx} · ${item?.name || 'Animation'}`;
      const small = document.createElement('div'); small.className = 'text-xs text-slate-400'; small.textContent = item?.keyframes || '';
      head.append(title, small);
      const previewBox = document.createElement('div');
      previewBox.className = 'rounded border border-slate-800 p-4 flex items-center justify-center';
      const dot = document.createElement('div');
      dot.className = 'h-6 w-6 rounded-full bg-indigo-400';
  dot.style.animation = ensureAnimationLoops(item?.keyframes || '');
      previewBox.append(dot);
      card.append(head, previewBox);
      card.addEventListener('click', () => { window.__DASH_PICKERS__.pickerOnSelect?.(idx); closePicker(); });
      return card;
    }

  function renderAnimBgCard(item, idx) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'p-3 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-left space-y-2';
      const head = document.createElement('div'); head.className = 'flex items-center justify-between';
      const title = document.createElement('div'); title.className = 'font-medium truncate'; title.textContent = `#${idx} · ${item?.name || 'Anim BG'}`;
      const small = document.createElement('div'); small.className = 'text-xs text-slate-400'; small.textContent = item?.keyframes || '';
      head.append(title, small);
      const preview = document.createElement('div');
      preview.className = 'rounded border border-slate-800 h-20';
      preview.style.backgroundImage = 'linear-gradient(45deg, #1f2937 0%, #0f172a 100%)';
      preview.style.backgroundSize = '200% 200%';
  preview.style.animation = ensureAnimationLoops(item?.keyframes || '');
      card.append(head, preview);
      card.addEventListener('click', () => { window.__DASH_PICKERS__.pickerOnSelect?.(idx); closePicker(); });
      return card;
    }

    const cfgReady = window.__PLINKK_CFG__ || await ensureCfg();
    const anims = cfgReady.animations || [];
    const animBgs = cfgReady.animationBackground || [];

    function setAnimLabel(inputEl, items, idx) {
      if (!inputEl) return;
      idx = Number(idx || 0) || 0;
      const it = items[idx];
      inputEl.value = it?.name ? `#${idx} · ${it.name}` : `#${idx}`;
    }

    const animArticleLabel = qs('#selectedAnimationLabel');
    const animButtonLabel = qs('#selectedAnimationButtonLabel');
    const animBgLabel = qs('#selectedAnimationBackgroundLabel');

    setAnimLabel(animArticleLabel, anims, f.selectedAnimationIndex?.value);
    setAnimLabel(animButtonLabel, anims, f.selectedAnimationButtonIndex?.value);
    setAnimLabel(animBgLabel, animBgs, f.selectedAnimationBackgroundIndex?.value);

    if (animArticleBtn && f.selectedAnimationIndex) {
      animArticleBtn.addEventListener('click', () => openPicker({
        title: "Choisir l'animation d'article", type: 'anim', items: anims,
        renderCard: (it, i) => renderAnimCard(it, i),
        onSelect: (i) => {
          f.selectedAnimationIndex.value = String(i);
          setAnimLabel(animArticleLabel, anims, i);
          scheduleAutoSave();
        },
      }));
      animArticleLabel?.addEventListener('click', () => animArticleBtn.click());
      animArticleLabel?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); animArticleBtn.click(); } });
    }
    if (animButtonBtn && f.selectedAnimationButtonIndex) {
      animButtonBtn.addEventListener('click', () => openPicker({
        title: "Choisir l'animation de bouton", type: 'anim', items: anims,
        renderCard: (it, i) => renderAnimCard(it, i),
        onSelect: (i) => {
          f.selectedAnimationButtonIndex.value = String(i);
          setAnimLabel(animButtonLabel, anims, i);
          scheduleAutoSave();
        },
      }));
      animButtonLabel?.addEventListener('click', () => animButtonBtn.click());
      animButtonLabel?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); animButtonBtn.click(); } });
    }
    if (animBgBtn && f.selectedAnimationBackgroundIndex) {
      animBgBtn.addEventListener('click', () => openPicker({
        title: "Choisir l'animation d'arrière‑plan", type: 'anim-bg', items: animBgs,
        renderCard: (it, i) => renderAnimBgCard(it, i),
        onSelect: (i) => {
          f.selectedAnimationBackgroundIndex.value = String(i);
          setAnimLabel(animBgLabel, animBgs, i);
          scheduleAutoSave();
        },
      }));
      animBgLabel?.addEventListener('click', () => animBgBtn.click());
      animBgLabel?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); animBgBtn.click(); } });
    }
  })();

  setStatus('Chargement...');
  fetchConfig().then((cfg) => { fillForm(cfg); setStatus('Prêt — sauvegarde auto activée', 'success'); }).catch((e) => { setStatus('Impossible de charger: ' + (e?.message || ''), 'error'); });
})();
