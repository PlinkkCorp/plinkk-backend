/* Dashboard UI (form-based) for Plinkk */
(function () {
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  const statusEl = qs('#status');
  const preview = qs('#preview');
  const saveBtn = qs('#saveBtn');
  const resetBtn = qs('#resetBtn');
  const refreshBtn = qs('#refreshPreview');
  // Autosave state
  let autoSaveTimer = null;
  let suspendAutoSave = false;
  let saving = false;
  let saveQueued = false;
  const AUTO_SAVE_DELAY = 800; // ms

  // Fields (base profile)
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
  // anciens boutons de sélection supprimés au profit de <select>

    // statusbar
    status_text: qs('#status_text'),
    status_colorText: qs('#status_colorText'),
    status_fontTextColor: qs('#status_fontTextColor'),
    status_statusText: qs('#status_statusText'),
  statusPreviewChip: qs('#statusPreviewChip'),
  statusDropdown: qs('#statusDropdown'),
  statusDropdownBtn: qs('#statusDropdownBtn'),
  statusDropdownPanel: qs('#statusDropdownPanel'),

    // lists containers
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

  const fetchConfig = () => fetch('/api/me/config').then(async r => { if(!r.ok) throw new Error(await r.text()); return r.json(); });
  const putConfig = (obj) => fetch('/api/me/config', { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(obj) }).then(async r => { if(!r.ok) throw new Error(await r.text()); return r.json(); });
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

  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else e.setAttribute(k, v);
    }
    children.forEach(c => e.appendChild(c));
    return e;
  }

  function attachAutoSave(el) {
    if (!el) return;
    const tag = (el.tagName || '').toUpperCase();
    const type = (el.type || '').toLowerCase();
    const isChange = tag === 'SELECT' || type === 'checkbox' || type === 'color' || type === 'number';
    el.addEventListener(isChange ? 'change' : 'input', scheduleAutoSave);
  }

  // Small helpers
  function srOnly(text) {
    return el('span', { class: 'sr-only', text });
  }

  function trashButton(onClick, title = 'Supprimer') {
    const btn = el('button', {
      class: 'h-9 w-9 inline-flex items-center justify-center rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 ml-auto justify-self-end self-center shrink-0',
      title,
      type: 'button',
      'aria-label': title
    });

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.5');
    svg.setAttribute('class', 'block h-5 w-5 text-slate-200');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    // Trash (outline)
    path.setAttribute('d', 'M6 7h12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7M10 11v6m4-6v6');

    svg.appendChild(path);
    btn.append(svg, srOnly(title));
    btn.addEventListener('click', onClick);
    return btn;
  }

  function emptyState({ title, description, actionLabel, onAction }) {
    const box = el('div', { class: 'rounded border border-dashed border-slate-700 bg-slate-900/40 p-4 text-center text-sm text-slate-300' });
    if (title) box.append(el('div', { class: 'font-medium mb-1', text: title }));
    if (description) box.append(el('div', { class: 'text-xs text-slate-400 mb-3', text: description }));
    if (actionLabel && onAction) {
  const btn = el('button', { class: 'h-10 inline-flex items-center gap-2 px-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm', text: actionLabel, type: 'button' });
      btn.addEventListener('click', onAction);
      box.append(btn);
    }
    return box;
  }

  // Renderers for dynamic lists
  function renderBackground(colors) {
    f.backgroundList.innerHTML = '';
    if (!Array.isArray(colors) || colors.length === 0) {
      f.backgroundList.append(
        emptyState({
          title: 'Aucune couleur de dégradé',
          description: 'Ajoutez au moins une couleur pour créer le dégradé d’arrière‑plan.',
          actionLabel: '+ Ajouter une couleur',
          onAction: () => { colors.push('#ffffff'); renderBackground(colors); scheduleAutoSave(); }
        })
      );
    } else {
      colors.forEach((c, idx) => {
        const wrap = el('div', { class: 'flex items-center gap-2' });
        const color = el('input', { type: 'color', value: c, class: 'h-10 w-full rounded bg-slate-900 border border-slate-800 p-1 flex-1' });
        const rm = trashButton(() => { colors.splice(idx, 1); renderBackground(colors); scheduleAutoSave(); });
        color.addEventListener('input', () => { colors[idx] = color.value; scheduleAutoSave(); });
        wrap.append(color, rm);
        f.backgroundList.appendChild(wrap);
      });
    }
    f.addBackgroundColor.onclick = () => {
      colors.push('#ffffff');
      renderBackground(colors);
      scheduleAutoSave();
    };
  }

  function renderNeon(colors) {
    f.neonList.innerHTML = '';
    if (!Array.isArray(colors) || colors.length === 0) {
      f.neonList.append(
        emptyState({
          title: 'Aucune couleur néon',
          description: 'Ajoutez au moins une couleur pour activer l’effet néon.',
          actionLabel: '+ Ajouter une couleur',
          onAction: () => { colors.push('#7289DA'); renderNeon(colors); scheduleAutoSave(); }
        })
      );
    } else {
      colors.forEach((c, idx) => {
        const wrap = el('div', { class: 'flex items-center gap-2' });
        const color = el('input', { type: 'color', value: c, class: 'h-10 w-full rounded bg-slate-900 border border-slate-800 p-1 flex-1' });
        const rm = trashButton(() => { colors.splice(idx,1); renderNeon(colors); scheduleAutoSave(); });
        color.addEventListener('input', () => { colors[idx] = color.value; scheduleAutoSave(); });
        wrap.append(color, rm);
        f.neonList.appendChild(wrap);
      });
    }
    f.addNeonColor.onclick = () => { colors.push('#7289DA'); renderNeon(colors); scheduleAutoSave(); };

    // Auto‑disable neon effect when no colors present
    const hasColors = Array.isArray(colors) && colors.length > 0;
    if (!hasColors && f.neonEnable) {
      f.neonEnable.checked = false;
    }
    if (f.neonEnable) {
      f.neonEnable.disabled = !hasColors;
      f.neonEnable.title = hasColors ? '' : 'Ajoutez au moins une couleur pour activer le néon';
      f.neonEnable.addEventListener('change', scheduleAutoSave);
    }
  }

  function renderLabels(labels) {
    f.labelsList.innerHTML = '';
    if (!Array.isArray(labels) || labels.length === 0) {
      f.labelsList.append(
        emptyState({
          title: 'Aucun label',
          description: 'Ajoutez des badges pour mettre en valeur vos informations.',
          actionLabel: '+ Ajouter un label',
          onAction: () => { labels.push({ data: 'Nouveau', color: '#FF6384', fontColor: '#FFFFFF' }); renderLabels(labels); scheduleAutoSave(); }
        })
      );
    } else {
      labels.forEach((l, idx) => {
  const row = el('div', { class: 'grid grid-cols-1 md:grid-cols-5 gap-2 items-center' });
        const data = el('input', { type: 'text', value: l.data || '', class: 'px-3 py-2 rounded bg-slate-900 border border-slate-800 md:col-span-2' });
        const color = el('input', { type: 'color', value: l.color || '#ffffff', class: 'h-10 w-full rounded bg-slate-900 border border-slate-800 p-1' });
        const fontColor = el('input', { type: 'color', value: l.fontColor || '#000000', class: 'h-10 w-full rounded bg-slate-900 border border-slate-800 p-1' });
        const rm = trashButton(() => { labels.splice(idx,1); renderLabels(labels); scheduleAutoSave(); });
        data.addEventListener('input', () => { l.data = data.value; scheduleAutoSave(); });
        color.addEventListener('input', () => { l.color = color.value; scheduleAutoSave(); });
        fontColor.addEventListener('input', () => { l.fontColor = fontColor.value; scheduleAutoSave(); });
        row.append(data, color, fontColor, rm);
        f.labelsList.appendChild(row);
      });
    }
    f.addLabel.onclick = () => { labels.push({ data: 'Nouveau', color: '#FF6384', fontColor: '#FFFFFF' }); renderLabels(labels); scheduleAutoSave(); };
  }

  // Social icon modal state
  const iconModal = qs('#iconModal');
  const iconModalClose = qs('#iconModalClose');
  const iconSearch = qs('#iconSearch');
  const iconGrid = qs('#iconGrid');
  let iconCatalog = [];
  let iconSelectCallback = null; // (slug) => void

  async function ensureIconCatalog() {
    if (iconCatalog.length) return iconCatalog;
    const res = await fetch('/api/icons');
    if (!res.ok) throw new Error(await res.text());
    iconCatalog = await res.json();
    return iconCatalog;
  }

  function openIconModal(onSelect) {
    iconSelectCallback = onSelect;
    iconModal.classList.remove('hidden');
    populateIconGrid(iconSearch.value || '');
  }

  function closeIconModal() {
    iconModal.classList.add('hidden');
    iconSelectCallback = null;
  }

  async function populateIconGrid(filterText) {
    await ensureIconCatalog();
    const term = (filterText || '').toLowerCase();
    iconGrid.innerHTML = '';
    iconCatalog
      .filter(i => !term || i.displayName.toLowerCase().includes(term) || i.slug.includes(term))
      .forEach(i => {
        const card = document.createElement('button');
        card.setAttribute('type', 'button');
        card.className = 'p-3 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 flex flex-col items-center gap-2';
        const img = document.createElement('img');
        img.src = `/${window.__PLINKK_USER_ID__}/images/icons/${i.slug}.svg`;
        img.alt = i.displayName;
        img.className = 'h-10 w-10 object-contain';
        const label = document.createElement('div');
        label.className = 'text-xs text-slate-300 text-center';
        label.textContent = i.displayName;
        card.append(img, label);
        card.addEventListener('click', () => {
          if (iconSelectCallback) iconSelectCallback(i.slug);
          closeIconModal();
          scheduleAutoSave();
        });
        iconGrid.appendChild(card);
      });
  }

  iconModalClose?.addEventListener('click', closeIconModal);
  // Fermer en cliquant à l'extérieur (overlay)
  const iconOverlay = iconModal?.firstElementChild; // <div class="absolute inset-0 bg-black/60">
  iconOverlay?.addEventListener('click', closeIconModal);
  // Garde-fou si on clique directement sur le conteneur
  iconModal?.addEventListener('click', (e) => { if (e.target === iconModal) closeIconModal(); });
  iconSearch?.addEventListener('input', () => populateIconGrid(iconSearch.value));

  // Generic picker modal (conservé pour : thèmes de boutons & sélection d'icônes sociales étendue)
  const pickerModal = qs('#pickerModal');
  const pickerClose = qs('#pickerClose');
  const pickerTitle = qs('#pickerTitle');
  const pickerSearch = qs('#pickerSearch');
  const pickerGrid = qs('#pickerGrid');
  let pickerData = [];
  let pickerOnSelect = null; // (index|value) => void
  let pickerType = '';
  let pickerRenderCard = null; // optional custom renderer

  function openPicker({ title, type, items, renderCard, onSelect }) {
    pickerTitle.textContent = title;
    pickerType = type;
    pickerData = items;
    pickerOnSelect = onSelect;
    pickerRenderCard = renderCard || null;
    pickerSearch.value = '';
    pickerModal.classList.remove('hidden');
    renderPickerGrid('');
  }

  function closePicker() {
    pickerModal.classList.add('hidden');
    pickerOnSelect = null;
    pickerType = '';
    pickerData = [];
  }

  function defaultRenderCard(item, idx) {
    const card = document.createElement('button');
    card.setAttribute('type', 'button');
    card.className = 'p-3 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-left';
    const title = document.createElement('div');
    title.className = 'font-medium mb-1';
    title.textContent = item?.name || `Item ${idx}`;
    const small = document.createElement('div');
    small.className = 'text-xs text-slate-400';
    if (pickerType === 'theme') small.textContent = `Index ${idx}`;
    if (pickerType === 'canvas') small.textContent = item?.animationName ? `${item.animationName} (index ${idx})` : `Index ${idx}`;
    if (pickerType === 'anim') small.textContent = item?.name ? `${item.name} (index ${idx})` : `Index ${idx}`;
    card.append(title, small);
    card.addEventListener('click', () => { if (pickerOnSelect) pickerOnSelect(idx); closePicker(); });
    return card;
  }

  function renderPickerGrid(query) {
    const term = (query || '').toLowerCase();
    pickerGrid.innerHTML = '';
    pickerData.forEach((item, idx) => {
      const label = (item?.name || item?.animationName || '').toLowerCase();
      if (term && !label.includes(term) && !String(idx).includes(term)) return;
      const card = pickerRenderCard ? pickerRenderCard(item, idx) : defaultRenderCard(item, idx);
      pickerGrid.appendChild(card);
    });
  }

  pickerClose?.addEventListener('click', closePicker);
  // Fermer en cliquant à l'extérieur (overlay)
  const pickerOverlay = pickerModal?.firstElementChild; // <div class="absolute inset-0 bg-black/60">
  pickerOverlay?.addEventListener('click', closePicker);
  // Garde-fou si on clique directement sur le conteneur
  pickerModal?.addEventListener('click', (e) => { if (e.target === pickerModal) closePicker(); });
  pickerSearch?.addEventListener('input', () => renderPickerGrid(pickerSearch.value));

  // Les boutons de picker pour thèmes/animations/canvas sont remplacés par des <select>

  // Helper renderer for button themes with icon preview
  function renderBtnThemeCard(item, idx) {
    const card = document.createElement('button');
    card.setAttribute('type', 'button');
    card.className = 'p-3 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-left flex items-center gap-3';
    const img = document.createElement('img');
    const iconUrl = (item.icon || '').replace('{{username}}', `/${window.__PLINKK_USER_ID__}`);
    img.src = iconUrl;
    img.alt = item.name || '';
    img.className = 'h-8 w-8 object-contain rounded bg-slate-800 border border-slate-700';
    const col = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'font-medium';
    title.textContent = item.name || `Item ${idx}`;
    const small = document.createElement('div');
    small.className = 'text-xs text-slate-400';
    small.textContent = item.themeClass || '';
    col.append(title, small);
    card.append(img, col);
    card.addEventListener('click', () => { if (pickerOnSelect) pickerOnSelect(idx); closePicker(); });
    return card;
  }

  // Peuplement des <select> ergonomiques
  function fillSelect(selectEl, items, getLabel) {
    if (!selectEl) return;
    const current = selectEl.value;
    selectEl.innerHTML = '';
    items.forEach((item, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = getLabel(item, idx);
      selectEl.appendChild(opt);
    });
    // Restaurer la valeur si possible
    if (current !== '' && selectEl.querySelector(`option[value="${current}"]`)) {
      selectEl.value = current;
    }
  }

  async function ensureCfg(maxWaitMs = 3000) {
    const start = Date.now();
    while (!window.__PLINKK_CFG__) {
      if (Date.now() - start > maxWaitMs) break;
      await new Promise(r => setTimeout(r, 50));
    }
    return window.__PLINKK_CFG__ || { themes: [], animations: [], animationBackground: [], canvaData: [], btnIconThemeConfig: [] };
  }

  function renderSocial(socials) {
    f.socialList.innerHTML = '';
    if (!Array.isArray(socials) || socials.length === 0) {
      f.socialList.append(
        emptyState({
          title: 'Aucune icône sociale',
          description: 'Ajoutez des liens vers vos réseaux et services.',
          actionLabel: '+ Ajouter',
          onAction: () => { socials.push({ url: 'https://', icon: 'github' }); renderSocial(socials); }
        })
      );
    } else {
      socials.forEach((s, idx) => {
        const row = el('div', { class: 'grid grid-cols-1 md:grid-cols-5 gap-2 items-center' });
        const url = el('input', { type: 'url', value: s.url || '', class: 'px-3 py-2 rounded bg-slate-900 border border-slate-800 md:col-span-2' });

        // Zone icône avec input en lecture seule et bouton intégré
        const iconWrap = el('div', { class: 'flex items-center gap-2 md:col-span-2' });
        const iconPreview = el('img', { class: 'h-8 w-8 rounded bg-slate-800 border border-slate-700' });

        const inputWrap = el('div', { class: 'relative flex-1' });
        const iconName = el('input', {
          type: 'text',
          value: s.icon || '',
          class: 'pl-3 pr-20 py-2 w-full rounded bg-slate-900 border border-slate-800 cursor-pointer',
          placeholder: 'Cliquer pour choisir',
          readonly: 'true',
          tabindex: '0'
        });
        const pickBtn = el('button', {
          class: 'absolute right-1 top-1 h-8 px-2 text-xs rounded bg-slate-800 border border-slate-700 hover:bg-slate-700',
          text: 'Choisir',
          type: 'button'
        });

  const rm = trashButton(() => { socials.splice(idx,1); renderSocial(socials); scheduleAutoSave(); });
        const rmCell = el('div', { class: 'flex justify-end items-center md:col-span-1' });

        function updatePreview() {
          const slug = (iconName.value || '').toLowerCase().trim().replace(/\s+/g,'-');
          iconPreview.src = `/${window.__PLINKK_USER_ID__}/images/icons/${slug}.svg`;
          s.icon = iconName.value;
          scheduleAutoSave();
        }

        function openPickerForIcon() {
          openIconModal((slug) => {
            iconName.value = slug;
            updatePreview();
          });
        }

        pickBtn.addEventListener('click', openPickerForIcon);
        iconName.addEventListener('click', openPickerForIcon);
        iconName.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPickerForIcon(); }
        });

        updatePreview();
  url.addEventListener('input', () => { s.url = url.value; scheduleAutoSave(); });

        inputWrap.append(iconName, pickBtn);
        iconWrap.append(iconPreview, inputWrap);
        rmCell.append(rm);
        row.append(url, iconWrap, rmCell);
        f.socialList.appendChild(row);
      });
    }
    f.addSocial.onclick = () => { socials.push({ url: 'https://', icon: 'github' }); renderSocial(socials); scheduleAutoSave(); };
  }

  function renderLinks(links) {
    f.linksList.innerHTML = '';
    if (!Array.isArray(links) || links.length === 0) {
      f.linksList.append(
        emptyState({
          title: 'Aucun lien',
          description: 'Créez vos premiers boutons et liens.',
          actionLabel: '+ Ajouter un lien',
          onAction: () => { links.push({ url: 'https://', name: 'Nouveau', text: 'Link' }); renderLinks(links); }
        })
      );
    } else {
      links.forEach((l, idx) => {
  const row = el('div', { class: 'grid grid-cols-1 gap-2 md:gap-3' });
        // Ligne 1: icône (readonly + bouton intégré) + texte + choisir thème
        const line1 = el('div', { class: 'grid grid-cols-1 md:grid-cols-6 gap-2 items-center' });
        const iconWrap = el('div', { class: 'md:col-span-3 relative' });
        const icon = el('input', { type: 'text', value: l.icon || '', placeholder: 'Cliquer pour choisir', class: 'pl-3 pr-20 py-2 w-full rounded bg-slate-900 border border-slate-800 cursor-pointer' , readonly: 'true', tabindex: '0'});
        const pickBtnIcon = el('button', { class: 'absolute right-1 top-1 h-8 px-2 text-xs rounded bg-slate-800 border border-slate-700 hover:bg-slate-700', text: 'Choisir', type: 'button' });
        iconWrap.append(icon, pickBtnIcon);
        const text = el('input', { type: 'text', value: l.text || '', class: 'px-3 py-2 rounded bg-slate-900 border border-slate-800 md:col-span-2' });
        const pickBtnTheme = el('button', { class: 'h-10 px-3 text-sm rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 md:justify-self-end', text: 'Choisir', type: 'button' });
        line1.append(iconWrap, text, pickBtnTheme);

        // Ligne 2: url + name + description + supprimer
  const line2 = el('div', { class: 'grid grid-cols-1 md:grid-cols-7 gap-2 items-center' });
        const url = el('input', { type: 'url', value: l.url || 'https://', class: 'px-3 py-2 rounded bg-slate-900 border border-slate-800 md:col-span-3' });
        const name = el('input', { type: 'text', value: l.name || '', class: 'px-3 py-2 rounded bg-slate-900 border border-slate-800 md:col-span-2' });
        const description = el('input', { type: 'text', value: l.description || '', class: 'px-3 py-2 rounded bg-slate-900 border border-slate-800' });
  const rm = trashButton(() => { links.splice(idx,1); renderLinks(links); scheduleAutoSave(); });
  const rmCell = el('div', { class: 'flex justify-end items-center' });
        rmCell.append(rm);
        line2.append(url, name, description, rmCell);

        row.append(line1, line2);
        function openIconPickerForLink() {
          openIconModal((slug) => {
            const replaced = `/${window.__PLINKK_USER_ID__}/images/icons/${slug}.svg`;
            icon.value = replaced;
            l.icon = replaced;
          });
        }
        pickBtnIcon.addEventListener('click', openIconPickerForLink);
        icon.addEventListener('click', openIconPickerForLink);
        icon.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openIconPickerForLink(); } });
        text.addEventListener('input', () => { l.text = text.value; scheduleAutoSave(); });
        url.addEventListener('input', () => { l.url = url.value; scheduleAutoSave(); });
        name.addEventListener('input', () => { l.name = name.value; scheduleAutoSave(); });
        description.addEventListener('input', () => { l.description = description.value; scheduleAutoSave(); });
        pickBtnTheme.addEventListener('click', () => {
          const items = (window.__PLINKK_CFG__?.btnIconThemeConfig) || [];
          openPicker({
            title: 'Choisir un thème de bouton',
            type: 'btn-theme',
            items,
            renderCard: renderBtnThemeCard,
            onSelect: (i) => {
              const chosen = items[i];
              if (chosen?.name) {
                name.value = chosen.name;
                l.name = chosen.name; // mapping par name côté rendu public
              }
              if (chosen?.icon) {
                const replaced = chosen.icon.replace('{{username}}', `/${window.__PLINKK_USER_ID__}`);
                icon.value = replaced;
                l.icon = replaced;
              }
              scheduleAutoSave();
            }
          });
        });
        f.linksList.appendChild(row);
      });
    }
    f.addLink.onclick = () => { links.push({ url: 'https://', name: 'Nouveau', text: 'Link' }); renderLinks(links); scheduleAutoSave(); };
  }

  // State
  const state = {
    background: [],
    neonColors: [],
    labels: [],
    socialIcon: [],
    links: [],
  };

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
    // neonEnable sera ajusté après rendu des couleurs
  f.buttonThemeEnable.checked = (cfg.buttonThemeEnable ?? 1) === 1;
  f.canvaEnable.checked = (cfg.canvaEnable ?? 1) === 1;

  // Alimente les listes déroulantes avec les données globales
  const { themes = [], animations: anims = [], animationBackground: animBgs = [], canvaData: canvases = [] } = await ensureCfg();

  fillSelect(f.selectedThemeIndex, themes, (t, i) => t?.name ? `${i} · ${t.name}` : `Thème ${i}`);
  fillSelect(f.selectedAnimationIndex, anims, (a, i) => a?.name ? `${i} · ${a.name}` : `Anim ${i}`);
  fillSelect(f.selectedAnimationButtonIndex, anims, (a, i) => a?.name ? `${i} · ${a.name}` : `Anim ${i}`);
  fillSelect(f.selectedAnimationBackgroundIndex, animBgs, (a, i) => a?.name ? `${i} · ${a.name}` : `Anim BG ${i}`);
  fillSelect(f.selectedCanvasIndex, canvases, (c, i) => c?.animationName ? `${i} · ${c.animationName}` : `Canvas ${i}`);

  f.selectedThemeIndex.value = String(cfg.selectedThemeIndex ?? 13);
  f.selectedAnimationIndex.value = String(cfg.selectedAnimationIndex ?? 0);
  f.selectedAnimationButtonIndex.value = String(cfg.selectedAnimationButtonIndex ?? 10);
  f.selectedAnimationBackgroundIndex.value = String(cfg.selectedAnimationBackgroundIndex ?? 10);
    f.animationDurationBackground.value = cfg.animationDurationBackground ?? 30;
    f.delayAnimationButton.value = cfg.delayAnimationButton ?? 0.1;
    f.backgroundSize.value = cfg.backgroundSize ?? 50;
  f.selectedCanvasIndex.value = String(cfg.selectedCanvasIndex ?? 16);
  // Mettre à jour le label lisible du canvas s'il existe
  const canvasLabelEl = qs('#selectedCanvasLabel');
  if (canvasLabelEl) {
    const idx = Number(f.selectedCanvasIndex.value || 0) || 0;
    const item = canvases[idx];
    canvasLabelEl.value = item?.animationName ? `#${idx} · ${item.animationName}` : `#${idx}`;
  }
  // Désactiver les contrôles Canvas si non activé
  const canvasPickerBtn = qs('#openCanvasPicker');
  const setCanvasControlsState = (enabled) => {
    if (canvasPickerBtn) canvasPickerBtn.disabled = !enabled;
    if (canvasLabelEl) canvasLabelEl.disabled = !enabled;
  };
  setCanvasControlsState(f.canvaEnable.checked);

  const sb = cfg.statusbar || {};
  f.status_text.value = sb.text || '';
  f.status_colorText.value = sb.colorText || '#cccccc';
  f.status_fontTextColor.value = sb.fontTextColor ?? 1;
  f.status_statusText.value = sb.statusText || 'busy';
  applyStatusDropdownFromValue();
  updateStatusPreview();

    state.background = Array.isArray(cfg.background) ? [...cfg.background] : [];
    state.neonColors = Array.isArray(cfg.neonColors) ? [...cfg.neonColors] : [];
    state.labels = Array.isArray(cfg.labels) ? cfg.labels.map(x => ({...x})) : [];
    state.socialIcon = Array.isArray(cfg.socialIcon) ? cfg.socialIcon.map(x => ({...x})) : [];
    state.links = Array.isArray(cfg.links) ? cfg.links.map(x => ({...x})) : [];

    renderBackground(state.background);
    renderNeon(state.neonColors);
    renderLabels(state.labels);
    renderSocial(state.socialIcon);
    renderLinks(state.links);

    // Ajustement initial du toggle néon selon présence de couleurs
    const hasNeonColors = state.neonColors.length > 0;
    if (f.neonEnable) {
      f.neonEnable.checked = hasNeonColors && (cfg.neonEnable ?? 1) === 1;
      f.neonEnable.disabled = !hasNeonColors;
      f.neonEnable.title = hasNeonColors ? '' : 'Ajoutez au moins une couleur pour activer le néon';
    }
    suspendAutoSave = false;
  }

  function collectPayload() {
    const payload = {
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
      neonEnable: (state.neonColors.length > 0 && f.neonEnable?.checked) ? 1 : 0,
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
      statusbar: {
        text: vOrNull(f.status_text.value),
        colorText: vOrNull(f.status_colorText.value),
        fontTextColor: numOrNull(f.status_fontTextColor.value),
        statusText: vOrNull(f.status_statusText.value),
      },
    };
    return payload;
  }

  function vOrNull(v) { return v === '' ? null : v; }
  function numOrNull(v) { const n = Number(v); return isNaN(n) ? null : n; }

  function refreshPreview() {
    if (!preview) return;
    const url = new URL(preview.src, window.location.origin);
    url.searchParams.set('t', Date.now().toString());
    preview.src = url.toString();
  }

  // Events
  saveBtn?.addEventListener('click', async () => { saveNow(true); });

  resetBtn?.addEventListener('click', async () => {
    setStatus('Réinitialisation...');
    try {
      const cfg = await fetchConfig();
      fillForm(cfg);
      setStatus('Données rechargées', 'success');
    } catch (e) {
      setStatus('Erreur: ' + (e?.message || ''), 'error');
    }
  });

  refreshBtn?.addEventListener('click', refreshPreview);

  // Brancher autosave sur tous les champs simples
  [
    f.profileLink, f.profileSiteText, f.userName, f.email,
    f.profileImage, f.profileIcon, f.iconUrl, f.description,
    f.profileHoverColor, f.degBackgroundColor,
  f.neonEnable, f.buttonThemeEnable, f.canvaEnable,
    f.selectedThemeIndex, f.selectedAnimationIndex,
    f.selectedAnimationButtonIndex, f.selectedAnimationBackgroundIndex,
    f.animationDurationBackground, f.delayAnimationButton, f.backgroundSize,
    f.selectedCanvasIndex,
    f.status_text, f.status_colorText,
    f.status_fontTextColor, f.status_statusText
  ].forEach(attachAutoSave);

  // Prévisualisation du statut (chip)
  function updateStatusPreview() {
    const chip = f.statusPreviewChip;
    if (!chip) return;
    const status = (f.status_statusText?.value || 'offline');
    const map = {
      online: 'border-emerald-700/50 bg-emerald-800/50 text-emerald-50',
      busy: 'border-rose-700/50 bg-rose-800/50 text-rose-50',
      away: 'border-amber-700/50 bg-amber-800/50 text-amber-50',
      offline: 'border-slate-700/50 bg-slate-800/50 text-slate-200'
    };
    chip.className = 'inline-flex items-center gap-1 px-2 py-1 rounded text-xs ' + (map[status] || map.offline);
    const label = { online: 'En ligne', busy: 'Occupé', away: 'Absent', offline: 'Hors‑ligne' }[status] || 'Hors‑ligne';
    chip.textContent = '● ' + label;
  }
  if (f.status_statusText) {
    f.status_statusText.addEventListener('change', () => { updateStatusPreview(); });
  }

  function setStatusButtonVisual(val) {
    if (!f.statusDropdownBtn) return;
    const dot = f.statusDropdownBtn.querySelector('span.inline-block.size-2');
    const label = f.statusDropdownBtn.querySelector('.status-current-label');
    const colorMap = { online: 'bg-emerald-400', busy: 'bg-rose-400', away: 'bg-amber-400', offline: 'bg-slate-400' };
    const textMap = { online: 'En ligne', busy: 'Occupé', away: 'Absent', offline: 'Hors‑ligne' };
    if (dot) {
      dot.className = 'inline-block size-2 rounded-full ' + (colorMap[val] || colorMap.offline);
    }
    if (label) {
      label.textContent = textMap[val] || textMap.offline;
    }
  }

  function applyStatusDropdownFromValue() {
    const val = (f.status_statusText?.value || 'offline');
    setStatusButtonVisual(val);
  }

  // Gestion du menu déroulant de statut
  if (f.statusDropdown && f.statusDropdownBtn && f.statusDropdownPanel) {
    const open = () => { f.statusDropdownPanel.classList.remove('hidden'); f.statusDropdownBtn.setAttribute('aria-expanded','true'); };
    const close = () => { f.statusDropdownPanel.classList.add('hidden'); f.statusDropdownBtn.setAttribute('aria-expanded','false'); };
    f.statusDropdownBtn.addEventListener('click', (e) => { e.stopPropagation(); if (f.statusDropdownPanel.classList.contains('hidden')) open(); else close(); });
    document.addEventListener('click', () => close());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    f.statusDropdownPanel.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-value]');
      if (!btn) return;
      const val = btn.getAttribute('data-value');
      if (!val) return;
      if (f.status_statusText) f.status_statusText.value = val;
      applyStatusDropdownFromValue();
      updateStatusPreview();
      scheduleAutoSave();
      close();
    });
  }
  // Canvas enable toggle: also toggle UI state
  if (f.canvaEnable) {
    f.canvaEnable.addEventListener('change', () => {
      const canvasLabelEl2 = qs('#selectedCanvasLabel');
      const canvasPickerBtn2 = qs('#openCanvasPicker');
      if (canvasPickerBtn2) canvasPickerBtn2.disabled = !f.canvaEnable.checked;
      if (canvasLabelEl2) canvasLabelEl2.disabled = !f.canvaEnable.checked;
    });
  }

  // Picker helpers for Theme and Canvas with preview cards
  function renderThemeCard(theme, idx) {
    const card = document.createElement('button');
    card.setAttribute('type', 'button');
    card.className = 'p-3 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-left space-y-2';
    const head = document.createElement('div');
    head.className = 'flex items-center justify-between';
    const title = document.createElement('div');
    title.className = 'font-medium';
    title.textContent = `#${idx} · ${theme?.name || 'Thème'}`;
    const badge = document.createElement('span');
    badge.className = 'text-[10px] px-2 py-0.5 rounded border border-slate-700 text-slate-300';
    badge.textContent = theme?.darkTheme ? 'Sombre' : 'Clair';
    head.append(title, badge);
    const previewBox = document.createElement('div');
    previewBox.className = 'rounded p-3 border border-slate-800';
    previewBox.style.background = theme?.background || '#111827';
    previewBox.style.color = theme?.textColor || '#e5e7eb';
    const btns = document.createElement('div');
    btns.className = 'flex gap-2';
    const b1 = document.createElement('button');
    b1.className = 'px-2 py-1 text-xs rounded';
    b1.style.background = theme?.buttonBackground || '#4f46e5';
    b1.style.color = theme?.buttonTextColor || '#111827';
    b1.textContent = 'Bouton';
    const b2 = document.createElement('button');
    b2.className = 'px-2 py-1 text-xs rounded';
    b2.style.background = theme?.hoverColor || '#22c55e';
    b2.style.color = theme?.textColor || '#111827';
    b2.textContent = 'Hover';
    btns.append(b1, b2);
    previewBox.append(btns);
    card.append(head, previewBox);
    card.addEventListener('click', () => { if (pickerOnSelect) pickerOnSelect(idx); closePicker(); });
    return card;
  }

  function renderCanvasCard(item, idx) {
    const card = document.createElement('button');
    card.setAttribute('type', 'button');
    card.className = 'p-3 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-left';
    const title = document.createElement('div');
    title.className = 'font-medium mb-1';
    title.textContent = `#${idx} · ${item?.animationName || 'Canvas'}`;
    const small = document.createElement('div');
    small.className = 'text-xs text-slate-400';
    small.textContent = item?.fileNames ? String(item.fileNames) : '';
    card.append(title, small);
    card.addEventListener('click', () => { if (pickerOnSelect) pickerOnSelect(idx); closePicker(); });
    return card;
  }

  // Brancher les boutons Choisir (thème/canvas) si présents
  (async () => {
    const cfg = await ensureCfg();
    const themeBtn = qs('#openThemePicker');
    const canvasBtn = qs('#openCanvasPicker');
    const canvasLabelEl = qs('#selectedCanvasLabel');
    if (themeBtn && f.selectedThemeIndex) {
      themeBtn.addEventListener('click', () => openPicker({
        title: 'Choisir un thème',
        type: 'theme',
        items: cfg.themes || [],
        renderCard: renderThemeCard,
        onSelect: (i) => { f.selectedThemeIndex.value = String(i); scheduleAutoSave(); }
      }));
    }

    function openCanvasPicker() {
      openPicker({
        title: 'Choisir un canvas',
        type: 'canvas',
        items: (cfg.canvaData || []),
        renderCard: renderCanvasCard,
        onSelect: (i) => {
          f.selectedCanvasIndex.value = String(i);
          if (canvasLabelEl) {
            const item = (cfg.canvaData || [])[i];
            canvasLabelEl.value = item?.animationName ? `#${i} · ${item.animationName}` : `#${i}`;
          }
          scheduleAutoSave();
        }
      });
    }

    if (canvasBtn && f.selectedCanvasIndex) {
      canvasBtn.addEventListener('click', openCanvasPicker);
    }
    if (canvasLabelEl) {
      canvasLabelEl.addEventListener('click', openCanvasPicker);
      canvasLabelEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCanvasPicker(); } });
    }
  })();

  // Init
  setStatus('Chargement...');
  fetchConfig()
    .then(cfg => { fillForm(cfg); setStatus('Prêt — sauvegarde auto activée', 'success'); })
    .catch(e => { setStatus('Impossible de charger: ' + (e?.message || ''), 'error'); });
})();
