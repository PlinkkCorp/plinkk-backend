import { qs, attachAutoSave, fillSelect, vOrNull, numOrNull } from './utils.js';
import { openIconModal, openPicker, renderPickerGrid, renderBtnThemeCard, closePicker, ensurePlatformEntryModal, pickerSelect } from './pickers.js';
import { renderBackground, renderNeon, renderLabels, renderSocial, renderLinks } from './renderers.js';
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
  let suspendAutoSave = false;
  let saving = false;
  let saveQueued = false;
  const AUTO_SAVE_DELAY = 800;

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
    neonList: qs('#neonList'),
    addNeonColor: qs('#addNeonColor'),
    labelsList: qs('#labelsList'),
    addLabel: qs('#addLabel'),
    socialList: qs('#socialList'),
    addSocial: qs('#addSocial'),
    linksList: qs('#linksList'),
    addLink: qs('#addLink'),
  };

  const setStatus = (text, kind = '') => {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.className = 'text-xs ' + (kind === 'error' ? 'text-red-400' : kind === 'success' ? 'text-emerald-400' : 'text-slate-400');
  };
  const scheduleAutoSave = () => {
    if (suspendAutoSave) return;
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    setStatus('Enregistrement...');
    autoSaveTimer = setTimeout(() => { saveNow(false); }, AUTO_SAVE_DELAY);
  };

  const fetchConfig = () => fetch('/api/me/config').then(async (r) => { if (!r.ok) throw new Error(await r.text()); return r.json(); });
  const putConfig = (obj) => fetch('/api/me/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }).then(async (r) => { if (!r.ok) throw new Error(await r.text()); return r.json(); });

  async function saveNow(manual) {
    if (autoSaveTimer) { clearTimeout(autoSaveTimer); autoSaveTimer = null; }
    if (saving) { saveQueued = true; return; }
    saving = true;
    const payload = collectPayload();
    setStatus('Enregistrement...');
    try {
      await putConfig(payload);
      setStatus(manual ? 'Enregistré ✓' : 'Enregistré automatiquement ✓', 'success');
      refreshPreview();
    } catch (e) {
      setStatus('Erreur: ' + (e?.message || ''), 'error');
    } finally {
      saving = false;
      if (saveQueued) { saveQueued = false; scheduleAutoSave(); }
    }
  }

  const state = { background: [], neonColors: [], labels: [], socialIcon: [], links: [] };

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
    f.buttonThemeEnable.checked = (cfg.buttonThemeEnable ?? 1) === 1;
    f.canvaEnable.checked = (cfg.canvaEnable ?? 1) === 1;

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

    renderBackground({ container: f.backgroundList, addBtn: f.addBackgroundColor, colors: state.background, scheduleAutoSave });
    renderNeon({ container: f.neonList, addBtn: f.addNeonColor, colors: state.neonColors, neonEnableEl: f.neonEnable, scheduleAutoSave });
    renderLabels({ container: f.labelsList, addBtn: f.addLabel, labels: state.labels, scheduleAutoSave });
    renderSocial({ container: f.socialList, addBtn: f.addSocial, socials: state.socialIcon, scheduleAutoSave });
    renderLinks({ container: f.linksList, addBtn: f.addLink, links: state.links, scheduleAutoSave });

    const hasNeonColors = state.neonColors.length > 0;
    if (f.neonEnable) {
      // Forcer désactivation visuelle du néon pour l'instant
      f.neonEnable.checked = false;
      f.neonEnable.disabled = true;
      f.neonEnable.title = 'Néon temporairement désactivé';
    }
    suspendAutoSave = false;
  }

  function collectPayload() {
    const sbText = vOrNull(f.status_text.value);
    const statusbar = sbText === null ? null : { text: sbText, fontTextColor: numOrNull(f.status_fontTextColor.value), statusText: vOrNull(f.status_statusText.value) };
    return {
      profileLink: vOrNull(f.profileLink.value),
      profileSiteText: vOrNull(f.profileSiteText.value),
      userName: vOrNull(f.userName.value),
      email: vOrNull(f.email.value),
      profileImage: vOrNull(f.profileImage.value),
      profileIcon: vOrNull(f.profileIcon.value),
      iconUrl: vOrNull(f.iconUrl.value),
      description: vOrNull(f.description.value),
      profileHoverColor: vOrNull(f.profileHoverColor.value),
      degBackgroundColor: numOrNull(f.degBackgroundColor.value),
      neonEnable: state.neonColors.length > 0 && f.neonEnable?.checked ? 1 : 0,
      buttonThemeEnable: f.buttonThemeEnable.checked ? 1 : 0,
      canvaEnable: f.canvaEnable.checked ? 1 : 0,
      selectedThemeIndex: numOrNull(f.selectedThemeIndex.value),
      selectedAnimationIndex: numOrNull(f.selectedAnimationIndex.value),
      selectedAnimationButtonIndex: numOrNull(f.selectedAnimationButtonIndex.value),
      selectedAnimationBackgroundIndex: numOrNull(f.selectedAnimationBackgroundIndex.value),
      animationDurationBackground: numOrNull(f.animationDurationBackground.value),
      delayAnimationButton: parseFloat(f.delayAnimationButton.value || '0'),
      backgroundSize: numOrNull(f.backgroundSize.value),
      selectedCanvasIndex: numOrNull(f.selectedCanvasIndex.value),
      background: state.background,
      neonColors: state.neonColors,
      labels: state.labels,
      socialIcon: state.socialIcon,
      links: state.links,
      statusbar,
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
  refreshBtn?.addEventListener('click', refreshPreview);

  [
    f.profileLink, f.profileSiteText, f.userName, f.email,
    f.profileImage, f.profileIcon, f.iconUrl, f.description,
    f.profileHoverColor, f.degBackgroundColor,
    f.neonEnable, f.buttonThemeEnable, f.canvaEnable,
    f.selectedThemeIndex, f.selectedAnimationIndex,
    f.selectedAnimationButtonIndex, f.selectedAnimationBackgroundIndex,
    f.animationDurationBackground, f.delayAnimationButton, f.backgroundSize,
    f.selectedCanvasIndex,
    f.status_text, f.status_fontTextColor, f.status_statusText,
  ].forEach((el) => attachAutoSave(el, scheduleAutoSave));

  [
    f.profileImage, f.profileIcon, f.iconUrl, f.description,
    f.userName, f.profileSiteText, f.profileLink,
    f.selectedThemeIndex, f.selectedAnimationIndex,
    f.selectedAnimationButtonIndex, f.selectedAnimationBackgroundIndex,
    f.animationDurationBackground, f.delayAnimationButton,
    f.profileHoverColor, f.backgroundSize,
    f.canvaEnable, f.selectedCanvasIndex,
  ].forEach((el) => {
    if (!el) return;
    const tag = (el.tagName || '').toUpperCase();
    const type = (el.type || '').toLowerCase();
    const evt = tag === 'SELECT' || type === 'checkbox' || type === 'color' || type === 'number' ? 'change' : 'input';
    el.addEventListener(evt, () => refreshPreview());
  });

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
          // Creator tag
          const creator = document.createElement('span'); creator.className = 'text-[10px] px-2 py-0.5 rounded border border-slate-700 text-slate-300';
          if (theme?.author && theme.author.userName) {
            creator.textContent = `par ${theme.author.userName}`;
          } else {
            creator.textContent = 'original';
          }
          // Info button
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
                ${theme?.author && theme.author.id ? `<div class="text-xs">Créateur: <a class="text-indigo-400 hover:underline" href="/${theme.author.id}" target="_blank">@${theme.author.userName || theme.author.id}</a></div>` : '<div class="text-xs text-slate-400">Créateur: original</div>'}
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
  })();

  setStatus('Chargement...');
  fetchConfig().then((cfg) => { fillForm(cfg); setStatus('Prêt — sauvegarde auto activée', 'success'); }).catch((e) => { setStatus('Impossible de charger: ' + (e?.message || ''), 'error'); });
})();
