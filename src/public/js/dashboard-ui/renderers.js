import { el, srOnly, trashButton, createGripSVG, enableDragHandle, isUrlish } from './utils.js';
import { openIconModal } from './pickers.js';

export function emptyState({ title, description, actionLabel, onAction }) {
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

export function renderBackground({ container, addBtn, colors, scheduleAutoSave }) {
  container.innerHTML = '';
  if (!Array.isArray(colors) || colors.length === 0) {
    container.append(
      emptyState({
        title: 'Aucune couleur de dégradé',
        description: 'Ajoutez au moins une couleur pour créer le dégradé d’arrière‑plan.',
        actionLabel: '+ Ajouter une couleur',
        onAction: () => { colors.push('#ffffff'); renderBackground({ container, addBtn, colors, scheduleAutoSave }); scheduleAutoSave(); },
      })
    );
  } else {
    colors.forEach((c, idx) => {
  const row = el('div', { class: 'flex items-center gap-1 w-full' });
      row.dataset.dragIndex = String(idx);
  const gripBtn = el('button', { type: 'button', class: 'h-9 w-9 inline-flex items-center justify-center rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 mr-1', title: 'Déplacer', 'aria-label': 'Déplacer' });
  gripBtn.style.cursor = 'grab';
      gripBtn.appendChild(createGripSVG(18));
      const color = el('input', { type: 'color', value: c, class: 'h-10 w-full rounded bg-slate-900 border border-slate-800 p-1 flex-1' });
      const rm = trashButton(() => { colors.splice(idx, 1); renderBackground({ container, addBtn, colors, scheduleAutoSave }); scheduleAutoSave(); });
      color.addEventListener('input', () => { colors[idx] = color.value; scheduleAutoSave(); });
  const rmWrap = el('div', { class: 'w-10 flex justify-end' }); rmWrap.append(rm);
      row.append(gripBtn, color, rmWrap);
      try { enableDragHandle(gripBtn, row, container, colors, () => renderBackground({ container, addBtn, colors, scheduleAutoSave }), scheduleAutoSave); } catch {}
      container.appendChild(row);
    });
  }
  addBtn.onclick = () => { colors.push('#ffffff'); renderBackground({ container, addBtn, colors, scheduleAutoSave }); scheduleAutoSave(); };
}

export function renderNeon({ container, addBtn, colors, neonEnableEl, scheduleAutoSave }) {
  container.innerHTML = '';
  if (!Array.isArray(colors) || colors.length === 0) {
    container.append(
      emptyState({
        title: 'Aucune couleur néon',
        description: 'Ajoutez au moins une couleur pour activer l’effet néon.',
        actionLabel: '+ Ajouter une couleur',
        onAction: () => { colors.push('#7289DA'); renderNeon({ container, addBtn, colors, neonEnableEl, scheduleAutoSave }); scheduleAutoSave(); },
      })
    );
  } else {
    colors.forEach((c, idx) => {
      const wrap = el('div', { class: 'flex items-center gap-2' });
      const color = el('input', { type: 'color', value: c, class: 'h-10 w-full rounded bg-slate-900 border border-slate-800 p-1 flex-1' });
      const rm = trashButton(() => { colors.splice(idx, 1); renderNeon({ container, addBtn, colors, neonEnableEl, scheduleAutoSave }); scheduleAutoSave(); });
      color.addEventListener('input', () => { colors[idx] = color.value; scheduleAutoSave(); });
      wrap.append(color, rm);
      container.appendChild(wrap);
    });
  }
  addBtn.onclick = () => { colors.push('#7289DA'); renderNeon({ container, addBtn, colors, neonEnableEl, scheduleAutoSave }); scheduleAutoSave(); };
  const hasColors = Array.isArray(colors) && colors.length > 0;
  if (neonEnableEl) {
    if (!hasColors) neonEnableEl.checked = false;
    neonEnableEl.disabled = !hasColors;
    neonEnableEl.title = hasColors ? '' : 'Ajoutez au moins une couleur pour activer le néon';
    neonEnableEl.addEventListener('change', scheduleAutoSave);
  }
}

export function renderLabels({ container, addBtn, labels, scheduleAutoSave }) {
  container.innerHTML = '';
  if (!Array.isArray(labels) || labels.length === 0) {
    container.append(
      emptyState({
        title: 'Aucun label',
        description: 'Ajoutez des badges pour mettre en valeur vos informations.',
        actionLabel: '+ Ajouter un label',
        onAction: () => { labels.push({ data: 'Nouveau', color: '#FF6384', fontColor: '#FFFFFF' }); renderLabels({ container, addBtn, labels, scheduleAutoSave }); scheduleAutoSave(); },
      })
    );
  } else {
    labels.forEach((l, idx) => {
      const row = el('div', { class: 'flex flex-col md:flex-row items-center gap-2' });
      row.dataset.dragIndex = String(idx);
      const gripBtn = el('button', { type: 'button', class: 'h-9 w-9 inline-flex items-center justify-center rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 mr-3', title: 'Déplacer', 'aria-label': 'Déplacer' });
      gripBtn.style.cursor = 'grab';
      gripBtn.appendChild(createGripSVG(18));
      const data = el('input', { type: 'text', value: l.data || '', class: 'px-3 py-2 rounded bg-slate-900 border border-slate-800 flex-1' });
      const dataWrapper = el('div', { class: 'flex items-center gap-2 w-full md:w-1/3' });
      dataWrapper.append(gripBtn, data);
      const color = el('input', { type: 'color', value: l.color || '#ffffff', class: 'h-10 w-full md:w-1/6 rounded bg-slate-900 border border-slate-800 p-1' });
      const fontColor = el('input', { type: 'color', value: l.fontColor || '#000000', class: 'h-10 w-full md:w-1/6 rounded bg-slate-900 border border-slate-800 p-1' });
      const pickBtn = el('button', { type: 'button', text: 'Choisir', class: 'h-9 px-3 inline-flex items-center justify-center rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm' });
      const rm = trashButton(() => { labels.splice(idx, 1); renderLabels({ container, addBtn, labels, scheduleAutoSave }); scheduleAutoSave(); });

      function openLabelPresetPicker() {
        const presets = window.__PLINKK_CFG__?.labelPresets || [];
        const { openPicker } = window.__DASH_PICKERS__;
        openPicker({
          title: 'Choisir un preset de label',
          type: 'label-preset',
          items: presets,
          renderCard: (item, i) => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'p-3 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-left flex items-center gap-3';
            const swatch = document.createElement('span');
            swatch.className = 'inline-block h-6 w-6 rounded border border-slate-700';
            swatch.style.background = item.color;
            const col = document.createElement('div');
            const title = document.createElement('div');
            title.className = 'font-medium';
            title.textContent = item.name || `Preset ${i}`;
            const small = document.createElement('div');
            small.className = 'text-xs text-slate-400';
            small.textContent = `${item.color} / ${item.fontColor}`;
            col.append(title, small);
            card.append(swatch, col);
            card.addEventListener('click', () => { window.__DASH_PICKERS__.pickerOnSelect?.(i); });
            return card;
          },
          onSelect: (i) => {
            const chosen = presets[i];
            if (!chosen) return;
            l.color = chosen.color;
            l.fontColor = chosen.fontColor;
            color.value = chosen.color;
            fontColor.value = chosen.fontColor;
            scheduleAutoSave();
          },
        });
      }

      pickBtn.addEventListener('click', openLabelPresetPicker);
      data.addEventListener('input', () => { l.data = data.value; scheduleAutoSave(); });
      color.addEventListener('input', () => { l.color = color.value; scheduleAutoSave(); });
      fontColor.addEventListener('input', () => { l.fontColor = fontColor.value; scheduleAutoSave(); });

      const pickWrap = el('div', { class: 'w-full md:w-1/6 flex justify-center md:justify-start' });
      pickWrap.append(pickBtn);
      const rmWrap = el('div', { class: 'w-full md:w-1/6 flex justify-end' });
      rmWrap.append(rm);

      row.append(dataWrapper, color, fontColor, pickWrap, rmWrap);
      try { enableDragHandle(gripBtn, row, container, labels, () => renderLabels({ container, addBtn, labels, scheduleAutoSave }), scheduleAutoSave); } catch {}
      container.appendChild(row);
    });
  }
  addBtn.onclick = () => { labels.push({ data: 'Nouveau', color: '#FF6384', fontColor: '#FFFFFF' }); renderLabels({ container, addBtn, labels, scheduleAutoSave }); scheduleAutoSave(); };
}

export function renderSocial({ container, addBtn, socials, scheduleAutoSave }) {
  container.innerHTML = '';
  const SOCIAL_PLATFORMS = [
    { id: 'github', name: 'GitHub', pattern: 'https://github.com/{handle}', iconSlug: 'github' },
    { id: 'x', name: 'X (Twitter)', pattern: 'https://x.com/{handle}', iconSlug: 'x' },
    { id: 'youtube', name: 'YouTube', pattern: 'https://youtube.com/@{handle}', iconSlug: 'youtube-alt' },
    { id: 'twitch', name: 'Twitch', pattern: 'https://twitch.tv/{handle}', iconSlug: 'twitch' },
    { id: 'instagram', name: 'Instagram', pattern: 'https://instagram.com/{handle}', iconSlug: 'instagram' },
    { id: 'facebook', name: 'Facebook', pattern: 'https://facebook.com/{handle}', iconSlug: 'facebook' },
    { id: 'linkedin', name: 'LinkedIn', pattern: 'https://www.linkedin.com/in/{handle}', iconSlug: 'linkedin' },
    { id: 'discord', name: 'Discord Server', pattern: 'https://discord.gg/{handle}', iconSlug: 'discord' },
    { id: 'apple-music', name: 'Apple Music', pattern: 'https://music.apple.com/{country}/{path}', iconSlug: 'apple-music-alt' },
    { id: 'apple-podcasts', name: 'Apple Podcasts', pattern: 'https://podcasts.apple.com/{country}/{path}', iconSlug: 'apple-podcasts-alt' },
  ];

  if (!Array.isArray(socials) || socials.length === 0) {
    container.append(
      emptyState({
        title: 'Aucune icône sociale',
        description: 'Ajoutez des liens vers vos réseaux et services.',
        actionLabel: '+ Ajouter',
        onAction: () => { socials.push({ url: 'https://', icon: 'github' }); renderSocial({ container, addBtn, socials, scheduleAutoSave }); scheduleAutoSave(); },
      })
    );
  } else {
    socials.forEach((s, idx) => {
      const row = el('div', { class: 'flex flex-col md:flex-row items-center gap-2' });
      row.dataset.dragIndex = String(idx);
      const gripBtn = el('button', { type: 'button', class: 'h-9 w-9 inline-flex items-center justify-center rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 ml-0 self-center shrink-0', title: 'Déplacer', 'aria-label': 'Déplacer' });
      gripBtn.style.cursor = 'grab';
      gripBtn.appendChild(createGripSVG(18));
      const urlSourceSel = el('select', { class: 'h-10 px-2 rounded bg-slate-900 border border-slate-800 text-sm w-full md:w-40' });
      ;['platform','custom'].forEach(v => urlSourceSel.appendChild(el('option', { value: v, text: v === 'platform' ? 'Plateforme' : 'Personnalisé' })));
      const urlWrap = el('div', { class: 'relative w-full md:w-1/3' });
      const urlCellWrapper = el('div', { class: 'flex items-center gap-2 w-full md:w-auto' });
      const url = el('input', { type: 'url', value: s.url || '', class: 'pl-3 pr-20 py-2 w-full rounded bg-slate-900 border border-slate-800' });
      const urlPickBtn = el('button', { type: 'button', text: 'Choisir', class: 'absolute right-1 top-1 h-8 px-2 text-xs rounded bg-slate-800 border border-slate-700 hover:bg-slate-700' });
      urlWrap.append(url, urlPickBtn);
      urlCellWrapper.append(gripBtn);

      const iconWrap = el('div', { class: 'flex items-center gap-2 w-full md:w-1/3' });
      const iconPreview = el('img', { class: 'h-8 w-8 rounded bg-slate-800 border border-slate-700' });
      const sourceSel = el('select', { class: 'h-10 px-2 rounded bg-slate-900 border border-slate-800 text-sm' }, []);
      ;['catalog','url','upload'].forEach(v => {
        const o = el('option', { value: v, text: v === 'catalog' ? 'Librairie' : v === 'url' ? 'Lien' : 'Importer' });
        sourceSel.appendChild(o);
      });
      const catalogWrap = el('div', { class: 'relative flex-1' });
      const iconName = el('input', { type: 'text', value: s.icon || '', class: 'pl-3 pr-20 py-2 w-full rounded bg-slate-900 border border-slate-800 cursor-pointer', placeholder: 'Cliquer pour choisir', readonly: 'true', tabindex: '0' });
      const pickBtn = el('button', { class: 'absolute right-1 top-1 h-8 px-2 text-xs rounded bg-slate-800 border border-slate-700 hover:bg-slate-700', text: 'Choisir', type: 'button' });
      catalogWrap.append(iconName, pickBtn);
      const iconUrlWrap = el('div', { class: 'flex-1 hidden' });
      const iconUrlInput = el('input', { type: 'url', class: 'px-3 py-2 w-full rounded bg-slate-900 border border-slate-800', placeholder: 'https://exemple.com/icone.svg' });
      iconUrlWrap.append(iconUrlInput);
      const iconUploadWrap = el('div', { class: 'flex-1 hidden' });
      const fileInput = el('input', { type: 'file', accept: 'image/*,image/svg+xml', class: 'block w-full text-sm text-slate-300 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700' });
      iconUploadWrap.append(fileInput);
      const rm = trashButton(() => { socials.splice(idx, 1); renderSocial({ container, addBtn, socials, scheduleAutoSave }); scheduleAutoSave(); });
      const rmCell = el('div', { class: 'flex justify-end items-center w-full md:w-16' });

      function setPreviewByValue(val) {
        if (isUrlish(val)) iconPreview.src = val;
        else {
          const slug = (val || '').toLowerCase().trim().replace(/\s+/g, '-');
          iconPreview.src = `/${window.__PLINKK_USER_ID__}/images/icons/${slug}.svg`;
        }
      }
      function updateFromCatalog() { s.icon = iconName.value; setPreviewByValue(s.icon); scheduleAutoSave(); }
      function updateFromUrl() { s.icon = iconUrlInput.value; setPreviewByValue(s.icon); scheduleAutoSave(); }
      function updateFromUpload(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { s.icon = String(reader.result || ''); setPreviewByValue(s.icon); scheduleAutoSave(); };
        reader.readAsDataURL(file);
      }
      function openPickerForIcon() { openIconModal((slug) => { iconName.value = slug; updateFromCatalog(); }); }

      const initialSource = s.icon ? (s.icon.startsWith('data:') ? 'upload' : (isUrlish(s.icon) ? 'url' : 'catalog')) : 'catalog';
      sourceSel.value = initialSource;
      if (initialSource === 'catalog') { catalogWrap.classList.remove('hidden'); iconName.value = s.icon || ''; }
      if (initialSource === 'url') { iconUrlWrap.classList.remove('hidden'); iconUrlInput.value = s.icon || ''; }
      if (initialSource === 'upload') { iconUploadWrap.classList.remove('hidden'); }
      setPreviewByValue(s.icon || iconName.value);

      const { openPicker } = window.__DASH_PICKERS__;
      function openPlatformPicker() {
        openPicker({
          title: 'Choisir une plateforme',
          type: 'platform',
          items: SOCIAL_PLATFORMS,
          renderCard: (item, i) => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'p-3 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-left flex items-center gap-3';
            const img = document.createElement('img');
            img.src = `/${window.__PLINKK_USER_ID__}/images/icons/${item.iconSlug}.svg`;
            img.className = 'h-8 w-8 rounded bg-slate-800 border border-slate-700';
            const col = document.createElement('div');
            const title = document.createElement('div');
            title.className = 'font-medium';
            title.textContent = item.name;
            const small = document.createElement('div');
            small.className = 'text-xs text-slate-400';
            small.textContent = item.pattern;
            col.append(title, small);
            card.append(img, col);
            card.addEventListener('click', () => { window.__DASH_PICKERS__.pickerOnSelect?.(i); });
            return card;
          },
          onSelect: (i) => {
            const plat = SOCIAL_PLATFORMS[i];
            if (!plat) return;
            window.__OPEN_PLATFORM_MODAL__(plat, ({ handle, country, path }) => {
              let final = '';
              if (plat.id === 'apple-music') {
                const c = (country || 'fr').trim();
                const p = (path || '').trim().replace(/^\/+/, '');
                if (c && p) final = `https://music.apple.com/${c}/${p}`;
              } else if (plat.id === 'apple-podcasts') {
                const c = (country || 'fr').trim();
                const p = (path || '').trim().replace(/^\/+/, '');
                if (c && p) final = `https://podcasts.apple.com/${c}/${p}`;
              } else {
                const h = (handle || '').trim();
                final = plat.pattern.replace('{handle}', h);
              }
              if (final) { url.value = final; s.url = final; }
              if (!s.icon || sourceSel.value === 'catalog') { iconName.value = plat.iconSlug; updateFromCatalog(); }
              scheduleAutoSave();
            });
          },
        });
      }

      pickBtn.addEventListener('click', openPickerForIcon);
      iconName.addEventListener('click', openPickerForIcon);
      iconName.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPickerForIcon(); } });
      iconUrlInput.addEventListener('input', updateFromUrl);
      fileInput.addEventListener('change', (e) => updateFromUpload(e.target.files?.[0]));
      sourceSel.addEventListener('change', () => {
        const v = sourceSel.value;
        catalogWrap.classList.toggle('hidden', v !== 'catalog');
        iconUrlWrap.classList.toggle('hidden', v !== 'url');
        iconUploadWrap.classList.toggle('hidden', v !== 'upload');
        if (v === 'catalog') updateFromCatalog();
        if (v === 'url') updateFromUrl();
      });

      const initialUrlMode = s.url && !/^https?:\/\//i.test(s.url) && !s.url.startsWith('/') ? 'custom' : 'platform';
      urlSourceSel.value = initialUrlMode;
      const applyUrlMode = () => {
        const isPlatform = urlSourceSel.value === 'platform';
        url.readOnly = isPlatform;
        url.classList.toggle('cursor-pointer', isPlatform);
        urlPickBtn.classList.toggle('hidden', !isPlatform);
      };
      applyUrlMode();
      urlSourceSel.addEventListener('change', () => applyUrlMode());
      url.addEventListener('input', () => { s.url = url.value; scheduleAutoSave(); });
      urlPickBtn.addEventListener('click', openPlatformPicker);
      urlWrap.addEventListener('click', (e) => { if (e.target === urlPickBtn) return; if (urlSourceSel.value === 'platform') openPlatformPicker(); });
      url.addEventListener('click', () => { if (urlSourceSel.value === 'platform') openPlatformPicker(); });
      url.addEventListener('keydown', (e) => { if (urlSourceSel.value !== 'platform') return; if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') { e.preventDefault(); openPlatformPicker(); } });

      iconWrap.append(iconPreview, sourceSel, catalogWrap, iconUrlWrap, iconUploadWrap);
      rmCell.append(rm);
      const gripWrap = el('div', { class: 'w-full md:w-auto flex items-center' });
      gripWrap.append(urlCellWrapper);
      row.append(gripWrap, urlSourceSel, urlWrap, iconWrap, rmCell);
      try { enableDragHandle(gripBtn, row, container, socials, () => renderSocial({ container, addBtn, socials, scheduleAutoSave }), scheduleAutoSave); } catch {}
      container.appendChild(row);
    });
  }
  addBtn.onclick = () => { socials.push({ url: 'https://', icon: 'github' }); renderSocial({ container, addBtn, socials, scheduleAutoSave }); scheduleAutoSave(); };
}

export function renderLinks({ container, addBtn, links, scheduleAutoSave }) {
  container.innerHTML = '';
  if (!Array.isArray(links) || links.length === 0) {
    container.append(
      emptyState({
        title: 'Aucun lien',
        description: 'Créez vos premiers boutons et liens.',
        actionLabel: '+ Ajouter un lien',
        onAction: () => { links.push({ url: 'https://', name: 'Nouveau', text: 'Link' }); renderLinks({ container, addBtn, links, scheduleAutoSave }); scheduleAutoSave(); },
      })
    );
  } else {
    links.forEach((l, idx) => {
      const row = el('div', { class: 'flex flex-col gap-2 md:gap-3' });
      row.dataset.dragIndex = String(idx);
      const line1 = el('div', { class: 'flex items-center gap-2 w-full' });
      const iconWrap = el('div', { class: 'flex items-center gap-2 w-full md:w-1/3' });
      const gripBtn = el('button', { type: 'button', class: 'h-9 w-9 inline-flex items-center justify-center rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 mr-3', title: 'Déplacer', 'aria-label': 'Déplacer' });
      gripBtn.style.cursor = 'grab';
      gripBtn.appendChild(createGripSVG(18));
      const iconPreview = el('img', { class: 'h-8 w-8 rounded bg-slate-800 border border-slate-700' });
      const sourceSel = el('select', { class: 'h-10 px-2 rounded bg-slate-900 border border-slate-800 text-sm w-32' }, []);
      ;['catalog','url','upload'].forEach(v => {
        const o = el('option', { value: v, text: v === 'catalog' ? 'Librairie' : v === 'url' ? 'Lien' : 'Importer' });
        sourceSel.appendChild(o);
      });
      const catalogWrap = el('div', { class: 'relative flex-1' });
      const icon = el('input', { type: 'text', value: l.icon || '', placeholder: 'Cliquer pour choisir', class: 'pl-3 pr-20 py-2 w-full rounded bg-slate-900 border border-slate-800 cursor-pointer', readonly: 'true', tabindex: '0' });
      const pickBtnIcon = el('button', { class: 'absolute right-1 top-1 h-8 px-2 text-xs rounded bg-slate-800 border border-slate-700 hover:bg-slate-700', text: 'Choisir', type: 'button' });
      catalogWrap.append(icon, pickBtnIcon);
      const urlWrap = el('div', { class: 'flex-1 hidden' });
      const iconUrlInput = el('input', { type: 'url', class: 'px-3 py-2 w-full rounded bg-slate-900 border border-slate-800', placeholder: 'https://exemple.com/icone.svg' });
      urlWrap.append(iconUrlInput);
      const uploadWrap = el('div', { class: 'flex-1 hidden' });
      const fileInput = el('input', { type: 'file', accept: 'image/*,image/svg+xml', class: 'block w-full text-sm text-slate-300 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700' });
      uploadWrap.append(fileInput);
      iconWrap.append(gripBtn, iconPreview, catalogWrap, urlWrap, uploadWrap);

      const text = el('input', { type: 'text', value: l.text || '', class: 'px-3 py-2 rounded bg-slate-900 border border-slate-800 flex-1' });
      line1.append(iconWrap, sourceSel, text);

      const line2 = el('div', { class: 'flex items-center gap-2 w-full' });
      const url = el('input', { type: 'url', value: l.url || 'https://', class: 'px-3 py-2 rounded bg-slate-900 border border-slate-800 flex-1' });
      const themeWrap = el('div', { class: 'relative w-full md:w-1/3' });
      const themeDisplay = el('input', { type: 'text', class: 'pl-3 pr-20 py-2 w-full rounded bg-slate-900 border border-slate-800 cursor-pointer', readonly: 'true', placeholder: 'Choisir un thème' });
      themeDisplay.value = l.name && String(l.name).trim() !== '' ? String(l.name) : '';
      const themePickBtn = el('button', { class: 'absolute right-1 top-1 h-8 px-2 text-xs rounded bg-slate-800 border border-slate-700 hover:bg-slate-700', text: 'Choisir', type: 'button', title: 'Choisir le thème du bouton' });
      themeWrap.append(themeDisplay, themePickBtn);
      line2.append(url, themeWrap);

      const line3 = el('div', { class: 'flex items-center gap-2 w-full' });
      const description = el('input', { type: 'text', value: l.description || '', class: 'px-3 py-2 rounded bg-slate-900 border border-slate-800 flex-1' });
      const rm = trashButton(() => { links.splice(idx, 1); renderLinks({ container, addBtn, links, scheduleAutoSave }); scheduleAutoSave(); });
      const rmCell = el('div', { class: 'flex justify-end items-center w-24' });
      rmCell.append(rm);
      line3.append(description, rmCell);

      row.append(line1, line2, line3);
      try { enableDragHandle(gripBtn, row, container, links, () => renderLinks({ container, addBtn, links, scheduleAutoSave }), scheduleAutoSave); } catch {}
      function setPreviewByValue(val) { if (isUrlish(val)) iconPreview.src = val; else iconPreview.src = val; }

      function openIconPickerForLink() {
        openIconModal((slug) => {
          const replaced = `/${window.__PLINKK_USER_ID__}/images/icons/${slug}.svg`;
          icon.value = replaced;
          l.icon = replaced;
          setPreviewByValue(l.icon);
          scheduleAutoSave();
        });
      }
      pickBtnIcon.addEventListener('click', openIconPickerForLink);
      icon.addEventListener('click', openIconPickerForLink);
      icon.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openIconPickerForLink(); } });
      iconUrlInput.addEventListener('input', () => { l.icon = iconUrlInput.value; setPreviewByValue(l.icon); scheduleAutoSave(); });
      fileInput.addEventListener('change', (e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { l.icon = String(reader.result || ''); setPreviewByValue(l.icon); scheduleAutoSave(); }; reader.readAsDataURL(file); });

      const initialSource = l.icon ? (l.icon.startsWith('data:') ? 'upload' : (isUrlish(l.icon) ? 'url' : 'catalog')) : 'catalog';
      sourceSel.value = initialSource;
      if (initialSource === 'catalog') { catalogWrap.classList.remove('hidden'); }
      if (initialSource === 'url') { urlWrap.classList.remove('hidden'); iconUrlInput.value = l.icon || ''; }
      if (initialSource === 'upload') { uploadWrap.classList.remove('hidden'); }
      setPreviewByValue(l.icon || icon.value);
      sourceSel.addEventListener('change', () => {
        const v = sourceSel.value;
        catalogWrap.classList.toggle('hidden', v !== 'catalog');
        urlWrap.classList.toggle('hidden', v !== 'url');
        uploadWrap.classList.toggle('hidden', v !== 'upload');
        if (v === 'catalog') { l.icon = icon.value; setPreviewByValue(l.icon); scheduleAutoSave(); }
        if (v === 'url') { l.icon = iconUrlInput.value; setPreviewByValue(l.icon); scheduleAutoSave(); }
      });
      text.addEventListener('input', () => { l.text = text.value; scheduleAutoSave(); });
      url.addEventListener('input', () => { l.url = url.value; scheduleAutoSave(); });
      description.addEventListener('input', () => { l.description = description.value; scheduleAutoSave(); });
      const openThemePicker = () => {
        const items = window.__PLINKK_CFG__?.btnIconThemeConfig || [];
        const { openPicker, renderBtnThemeCard } = window.__DASH_PICKERS__;
        openPicker({
          title: 'Choisir un thème de bouton',
          type: 'btn-theme',
          items,
          renderCard: renderBtnThemeCard,
          onSelect: (i) => {
            const chosen = items[i];
            if (chosen?.name) {
              themeDisplay.value = chosen.name;
              l.name = chosen.name;
            }
            if (chosen?.icon) {
              const replaced = chosen.icon.replace('{{username}}', `/${window.__PLINKK_USER_ID__}`);
              icon.value = replaced;
              l.icon = replaced;
            }
            scheduleAutoSave();
          },
        });
      };
      themePickBtn.addEventListener('click', openThemePicker);
      themeDisplay.addEventListener('click', openThemePicker);
      themeDisplay.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openThemePicker(); } });
      container.appendChild(row);
    });
  }
  addBtn.onclick = () => { links.push({ url: 'https://', name: 'Nouveau', text: 'Link' }); renderLinks({ container, addBtn, links, scheduleAutoSave }); scheduleAutoSave(); };
}
