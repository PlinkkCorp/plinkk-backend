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
  if (!container) return;
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
  if (addBtn) addBtn.onclick = () => { colors.push('#ffffff'); renderBackground({ container, addBtn, colors, scheduleAutoSave }); scheduleAutoSave(); };
}

export function renderNeon({ container, addBtn, colors, neonEnableEl, scheduleAutoSave }) {
  if (!container) return;
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
  if (addBtn) addBtn.onclick = () => { colors.push('#7289DA'); renderNeon({ container, addBtn, colors, neonEnableEl, scheduleAutoSave }); scheduleAutoSave(); };
  const hasColors = Array.isArray(colors) && colors.length > 0;
  if (neonEnableEl) {
    if (!hasColors) neonEnableEl.checked = false;
    neonEnableEl.disabled = !hasColors;
    neonEnableEl.title = hasColors ? '' : 'Ajoutez au moins une couleur pour activer le néon';
    neonEnableEl.addEventListener('change', scheduleAutoSave);
  }
}

export function renderLabels({ container, addBtn, labels, scheduleAutoSave }) {
  if (!container) return;
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
  if (addBtn) addBtn.onclick = () => { labels.push({ data: 'Nouveau', color: '#FF6384', fontColor: '#FFFFFF' }); renderLabels({ container, addBtn, labels, scheduleAutoSave }); scheduleAutoSave(); };
}

export function renderSocial({ container, addBtn, socials, scheduleAutoSave }) {
  if (!container) return;
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
    { id: 'tiktok', name: 'TikTok', pattern: 'https://tiktok.com/@{handle}', iconSlug: 'tiktok' },
    { id: 'spotify', name: 'Spotify', pattern: 'https://open.spotify.com/user/{handle}', iconSlug: 'spotify' },
    { id: 'snapchat', name: 'Snapchat', pattern: 'https://snapchat.com/add/{handle}', iconSlug: 'snapchat' },
    { id: 'reddit', name: 'Reddit', pattern: 'https://reddit.com/user/{handle}', iconSlug: 'reddit' },
    { id: 'pinterest', name: 'Pinterest', pattern: 'https://pinterest.com/{handle}', iconSlug: 'pinterest' },
    { id: 'whatsapp', name: 'WhatsApp', pattern: 'https://wa.me/{handle}', iconSlug: 'whatsapp' },
    { id: 'telegram', name: 'Telegram', pattern: 'https://t.me/{handle}', iconSlug: 'telegram' },
    { id: 'threads', name: 'Threads', pattern: 'https://threads.net/@{handle}', iconSlug: 'threads' },
    { id: 'signal', name: 'Signal', pattern: 'https://signal.me/#p/{handle}', iconSlug: 'signal' },
    { id: 'messenger', name: 'Messenger', pattern: 'https://m.me/{handle}', iconSlug: 'messenger' },
    { id: 'mastodon', name: 'Mastodon', pattern: 'https://mastodon.social/@{handle}', iconSlug: 'mastodon' },
    { id: 'bluesky', name: 'Bluesky', pattern: 'https://bsky.app/profile/{handle}', iconSlug: 'bluesky' },
    { id: 'soundcloud', name: 'SoundCloud', pattern: 'https://soundcloud.com/{handle}', iconSlug: 'soundcloud' },
    { id: 'bandcamp', name: 'Bandcamp', pattern: 'https://{handle}.bandcamp.com', iconSlug: 'bandcamp' },
    { id: 'dribbble', name: 'Dribbble', pattern: 'https://dribbble.com/{handle}', iconSlug: 'dribbble' },
    { id: 'behance', name: 'Behance', pattern: 'https://behance.net/{handle}', iconSlug: 'behance' },
    { id: 'figma', name: 'Figma', pattern: 'https://figma.com/@{handle}', iconSlug: 'figma' },
    { id: 'gitlab', name: 'GitLab', pattern: 'https://gitlab.com/{handle}', iconSlug: 'gitlab' },
    { id: 'medium', name: 'Medium', pattern: 'https://medium.com/@{handle}', iconSlug: 'medium' },
    { id: 'substack', name: 'Substack', pattern: 'https://{handle}.substack.com', iconSlug: 'substack' },
    { id: 'patreon', name: 'Patreon', pattern: 'https://patreon.com/{handle}', iconSlug: 'patreon' },
    { id: 'ko-fi', name: 'Ko-fi', pattern: 'https://ko-fi.com/{handle}', iconSlug: 'ko-fi' },
    { id: 'buy-me-a-coffee', name: 'Buy Me a Coffee', pattern: 'https://buymeacoffee.com/{handle}', iconSlug: 'buy-me-a-coffee' },
    { id: 'paypal', name: 'PayPal', pattern: 'https://paypal.me/{handle}', iconSlug: 'paypal' },
    { id: 'venmo', name: 'Venmo', pattern: 'https://venmo.com/{handle}', iconSlug: 'venmo' },
    { id: 'kick', name: 'Kick', pattern: 'https://kick.com/{handle}', iconSlug: 'kick' },
    { id: 'vimeo', name: 'Vimeo', pattern: 'https://vimeo.com/{handle}', iconSlug: 'vimeo' },
    { id: 'tumblr', name: 'Tumblr', pattern: 'https://{handle}.tumblr.com', iconSlug: 'tumblr' },
    { id: 'slack', name: 'Slack', pattern: 'https://{handle}.slack.com', iconSlug: 'slack' },
    { id: 'notion', name: 'Notion', pattern: 'https://notion.so/{handle}', iconSlug: 'notion' },
    { id: 'trello', name: 'Trello', pattern: 'https://trello.com/{handle}', iconSlug: 'trello' },
    { id: 'steam', name: 'Steam', pattern: 'https://steamcommunity.com/id/{handle}', iconSlug: 'steam' },
    { id: 'onlyfans', name: 'OnlyFans', pattern: 'https://onlyfans.com/{handle}', iconSlug: 'onlyfans' },
    { id: 'etsy', name: 'Etsy', pattern: 'https://etsy.com/shop/{handle}', iconSlug: 'etsy' },
    { id: 'fiverr', name: 'Fiverr', pattern: 'https://fiverr.com/{handle}', iconSlug: 'fiverr' },
    { id: 'calendly', name: 'Calendly', pattern: 'https://calendly.com/{handle}', iconSlug: 'calendly' },
    { id: 'zoom', name: 'Zoom', pattern: 'https://zoom.us/j/{handle}', iconSlug: 'zoom' },
    { id: 'amazon', name: 'Amazon', pattern: 'https://amazon.com/shop/{handle}', iconSlug: 'amazon' },
    { id: 'goodreads', name: 'Goodreads', pattern: 'https://goodreads.com/{handle}', iconSlug: 'goodreads' },
    { id: 'letterboxd', name: 'Letterboxd', pattern: 'https://letterboxd.com/{handle}', iconSlug: 'letterboxd' },
    { id: 'strava', name: 'Strava', pattern: 'https://strava.com/athletes/{handle}', iconSlug: 'strava' },
    { id: 'unsplash', name: 'Unsplash', pattern: 'https://unsplash.com/@{handle}', iconSlug: 'unsplash' },
    { id: 'flickr', name: 'Flickr', pattern: 'https://flickr.com/photos/{handle}', iconSlug: 'flickr' },
    { id: 'vsco', name: 'VSCO', pattern: 'https://vsco.co/{handle}', iconSlug: 'vsco' },
    { id: 'artstation', name: 'ArtStation', pattern: 'https://artstation.com/{handle}', iconSlug: 'artstation' },
    { id: 'devto', name: 'DEV.to', pattern: 'https://dev.to/{handle}', iconSlug: 'dev-to' },
    { id: 'hashnode', name: 'Hashnode', pattern: 'https://hashnode.com/@{handle}', iconSlug: 'hashnode' },
    { id: 'stackoverflow', name: 'Stack Overflow', pattern: 'https://stackoverflow.com/users/{handle}', iconSlug: 'stack-overflow' },
    { id: 'producthunt', name: 'Product Hunt', pattern: 'https://producthunt.com/@{handle}', iconSlug: 'product-hunt' },
    { id: 'vrchat', name: 'VRChat', pattern: 'https://vrchat.com/home/user/{handle}', iconSlug: 'vrchat' },
    { id: 'line', name: 'LINE', pattern: 'https://line.me/ti/p/{handle}', iconSlug: 'line' },
  ];
  try { window.__SOCIAL_PLATFORM_LIST__ = SOCIAL_PLATFORMS; } catch (e) {}

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
      // Display row (same UI as links)
      const row = el('div', { class: 'flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900' });
      row.dataset.dragIndex = String(idx);

      const left = el('div', { class: 'flex items-center gap-3 min-w-0' });
      const grip = el('button', { type: 'button', class: 'h-8 w-8 inline-flex items-center justify-center rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 cursor-grab', title: 'Déplacer' });
      grip.appendChild(createGripSVG(16));

      const iconImg = el('img', { class: 'h-10 w-10 rounded bg-slate-800 border border-slate-700 object-cover' });
      if (s.icon) { iconImg.src = isUrlish(s.icon) ? s.icon : `https://s3.marvideo.fr/plinkk-image/icons/${s.icon}.svg`; }
      const textWrap = el('div', { class: 'min-w-0' });
      const title = el('div', { class: 'text-sm font-medium text-slate-200 truncate' }); title.textContent = s.name || s.title || (s.url || '').replace(/^https?:\/\//, '');
      const small = el('div', { class: 'text-xs text-slate-400 truncate' }); small.textContent = s.url || '';
      textWrap.append(title, small);

      left.append(grip, iconImg, textWrap);

      const actions = el('div', { class: 'flex items-center gap-2' });

      const editBtn = el('button', { type: 'button', class: 'px-3 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-200', title: 'Modifier' }); editBtn.textContent = 'Modifier';
      const dupBtn = el('button', { type: 'button', class: 'px-3 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-200', title: 'Dupliquer' }); dupBtn.textContent = 'Dupliquer';
      const rm = trashButton(() => { socials.splice(idx, 1); renderSocial({ container, addBtn, socials, scheduleAutoSave }); scheduleAutoSave(); });

      function openEditor() {
        const editor = el('div', { class: 'flex flex-col md:flex-row items-center gap-2 p-2 bg-slate-950 rounded border border-slate-800' });
        const gripBtn = el('button', { type: 'button', class: 'h-9 w-9 inline-flex items-center justify-center rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 ml-0 self-center shrink-0', title: 'Déplacer' }); gripBtn.style.cursor = 'grab'; gripBtn.appendChild(createGripSVG(18));
        const urlSourceSel = el('select', { class: 'h-10 px-2 rounded bg-slate-900 border border-slate-800 text-sm w-full md:w-40' }); ['custom'].forEach(v => urlSourceSel.appendChild(el('option', { value: v, text: 'Personnalisé' })));
        const urlWrap = el('div', { class: 'relative w-full md:w-1/3' });
        const url = el('input', { type: 'url', value: s.url || '', class: 'pl-3 pr-20 py-2 w-full rounded bg-slate-900 border border-slate-800' });
        const urlPickBtn = el('button', { type: 'button', text: 'Choisir', class: 'absolute right-1 top-1 h-8 px-2 text-xs rounded bg-slate-800 border border-slate-700 hover:bg-slate-700' });
        urlWrap.append(url, urlPickBtn);

        const iconWrap = el('div', { class: 'flex items-center gap-2 w-full md:w-1/3' });
        const iconPreview = el('img', { class: 'h-8 w-8 rounded bg-slate-800 border border-slate-700' });
        const sourceSel = el('select', { class: 'h-10 px-2 rounded bg-slate-900 border border-slate-800 text-sm' }, []);
        ['catalog','url','upload'].forEach(v => sourceSel.appendChild(el('option', { value: v, text: v === 'catalog' ? 'Librairie' : v === 'url' ? 'Lien' : 'Importer' })));
        const catalogWrap = el('div', { class: 'relative flex-1' });
        const iconName = el('input', { type: 'text', value: s.icon || '', class: 'pl-3 pr-20 py-2 w-full rounded bg-slate-900 border border-slate-800 cursor-pointer', placeholder: 'Cliquer pour choisir', readonly: 'true', tabindex: '0' });
        const pickBtn = el('button', { class: 'absolute right-1 top-1 h-8 px-2 text-xs rounded bg-slate-800 border border-slate-700 hover:bg-slate-700', text: 'Choisir', type: 'button' }); catalogWrap.append(iconName, pickBtn);
        const iconUrlWrap = el('div', { class: 'flex-1 hidden' }); const iconUrlInput = el('input', { type: 'url', class: 'px-3 py-2 w-full rounded bg-slate-900 border border-slate-800', placeholder: 'https://exemple.com/icone.svg' }); iconUrlWrap.append(iconUrlInput);
        const iconUploadWrap = el('div', { class: 'flex-1 hidden' }); const fileInput = el('input', { type: 'file', accept: 'image/*,image/svg+xml', class: 'block w-full text-sm text-slate-300 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700' }); iconUploadWrap.append(fileInput);
        const saveBtn = el('button', { type: 'button', class: 'px-3 py-1 rounded text-xs bg-emerald-700 text-white' }); saveBtn.textContent = 'Valider';
        const cancelBtn = el('button', { type: 'button', class: 'px-3 py-1 rounded text-xs bg-slate-800 text-slate-200' }); cancelBtn.textContent = 'Annuler';

        function setPreviewByValue(val) { if (isUrlish(val)) iconPreview.src = val; else iconPreview.src = `https://s3.marvideo.fr/plinkk-image/icons/${val}.svg`; }
        function updateFromCatalog() { s.icon = iconName.value; setPreviewByValue(s.icon); }
        function updateFromUrl() { s.icon = iconUrlInput.value; setPreviewByValue(s.icon); }
        function updateFromUpload(file) { if (!file) return; const reader = new FileReader(); reader.onload = () => { s.icon = String(reader.result || ''); setPreviewByValue(s.icon); }; reader.readAsDataURL(file); }
        function openPickerForIcon() { openIconModal((slug) => { iconName.value = slug; updateFromCatalog(); }); }

        const initialSource = s.icon ? (s.icon.startsWith('data:') ? 'upload' : (isUrlish(s.icon) ? 'url' : 'catalog')) : 'catalog';
        sourceSel.value = initialSource; if (initialSource === 'catalog') { catalogWrap.classList.remove('hidden'); iconName.value = s.icon || ''; }
        if (initialSource === 'url') { iconUrlWrap.classList.remove('hidden'); iconUrlInput.value = s.icon || ''; }
        if (initialSource === 'upload') { iconUploadWrap.classList.remove('hidden'); }
        setPreviewByValue(s.icon || iconName.value);

        pickBtn.addEventListener('click', openPickerForIcon);
        iconName.addEventListener('click', openPickerForIcon);
        iconName.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPickerForIcon(); } });
        iconUrlInput.addEventListener('input', updateFromUrl);
        fileInput.addEventListener('change', (e) => updateFromUpload(e.target.files?.[0]));
        sourceSel.addEventListener('change', () => { const v = sourceSel.value; catalogWrap.classList.toggle('hidden', v !== 'catalog'); iconUrlWrap.classList.toggle('hidden', v !== 'url'); iconUploadWrap.classList.toggle('hidden', v !== 'upload'); if (v === 'catalog') updateFromCatalog(); if (v === 'url') updateFromUrl(); });

        const { openPicker } = window.__DASH_PICKERS__;
        function openPlatformPicker() { openPicker({ title: 'Choisir une plateforme', type: 'platform', items: SOCIAL_PLATFORMS, onSelect: (i) => { const plat = SOCIAL_PLATFORMS[i]; if (!plat) return; window.__OPEN_PLATFORM_MODAL__(plat, ({ handle, country, path }) => { let final = ''; if (plat.id === 'apple-music') { const c = (country || 'fr').trim(); const p = (path || '').trim().replace(/^\/+/, ''); if (c && p) final = `https://music.apple.com/${c}/${p}`; } else if (plat.id === 'apple-podcasts') { const c = (country || 'fr').trim(); const p = (path || '').trim().replace(/^\/+/, ''); if (c && p) final = `https://podcasts.apple.com/${c}/${p}`; } else { const h = (handle || '').trim(); final = plat.pattern.replace('{handle}', h); } if (final) { url.value = final; s.url = final; } if (!s.icon || sourceSel.value === 'catalog') { iconName.value = plat.iconSlug; updateFromCatalog(); } scheduleAutoSave(); }); } }); }
        urlPickBtn.addEventListener('click', openPlatformPicker);
        url.addEventListener('input', () => { s.url = url.value; });

        editor.append(gripBtn, urlSourceSel, urlWrap, iconWrap, el('div', { class: 'flex items-center gap-2' }, []));
        const actionWrap = el('div', { class: 'flex items-center gap-2' }); actionWrap.append(saveBtn, cancelBtn);
        editor.append(actionWrap);

        row.replaceWith(editor);

        saveBtn.addEventListener('click', () => { s.url = url.value; s.icon = s.icon; renderSocial({ container, addBtn, socials, scheduleAutoSave }); scheduleAutoSave(); });
        cancelBtn.addEventListener('click', () => { renderSocial({ container, addBtn, socials, scheduleAutoSave }); });
      }

      editBtn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        try {
          if (window && window.__OPEN_SOCIAL_MODAL__) {
              const prefill = { text: s.name || s.title || '', url: s.url || '', icon: s.icon || '', description: s.description || '', categoryId: s.categoryId || null, newTab: !!s.newTab };
              window.__OPEN_SOCIAL_MODAL__(null, {
                prefill,
                onSave: (payload) => {
                    try { s.url = payload.url; s.icon = payload.icon; s.newTab = !!payload.newTab; } catch (e) {}
                    renderSocial({ container, addBtn, socials, scheduleAutoSave });
                    scheduleAutoSave();
                  }
              });
              return;
            }
        } catch (err) {}
        // fallback to inline editor
        openEditor();
      });
      dupBtn.addEventListener('click', () => { socials.splice(idx + 1, 0, JSON.parse(JSON.stringify(s))); renderSocial({ container, addBtn, socials, scheduleAutoSave }); scheduleAutoSave(); });

      actions.append(editBtn, dupBtn, rm);
      row.append(left, actions);
      try { enableDragHandle(grip, row, container, socials, () => renderSocial({ container, addBtn, socials, scheduleAutoSave }), scheduleAutoSave); } catch {}
      container.appendChild(row);
    });
  }
  if (addBtn) addBtn.onclick = () => { socials.push({ url: 'https://', icon: 'github' }); renderSocial({ container, addBtn, socials, scheduleAutoSave }); scheduleAutoSave(); };
}

export function renderCategories({ container, addBtn, categories, links, scheduleAutoSave, onUpdate }) {
  if (!container) return;
  container.innerHTML = '';
  
  const listContainer = container;

  const triggerUpdate = () => {
    scheduleAutoSave();
    if (onUpdate) onUpdate();
  };

  if (!Array.isArray(categories) || categories.length === 0) {
    listContainer.append(
      emptyState({
        title: 'Aucune catégorie',
        description: 'Créez des catégories pour organiser vos liens.',
        actionLabel: '+ Créer une catégorie',
        onAction: () => { 
            categories.push({ name: 'Nouvelle catégorie', order: categories.length }); 
            renderCategories({ container, addBtn, categories, links, scheduleAutoSave, onUpdate }); 
            triggerUpdate(); 
        },
      })
    );
  } else {
    categories.forEach((c, idx) => {
      const row = el('div', { class: 'group flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all' });
      row.dataset.dragIndex = String(idx);
      
      const gripBtn = el('button', { type: 'button', class: 'h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-grab active:cursor-grabbing', title: 'Déplacer', 'aria-label': 'Déplacer' });
      gripBtn.appendChild(createGripSVG(16));
      
      const contentWrap = el('div', { class: 'flex-1 flex flex-col gap-1' });
      const nameInput = el('input', { type: 'text', value: c.name || '', class: 'w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-200 placeholder-slate-600 p-0', placeholder: 'Nom de la catégorie' });
      nameInput.addEventListener('input', () => { c.name = nameInput.value; triggerUpdate(); });
      
      const count = links ? links.filter(l => l.categoryId === c.id || (c.name && l.categoryId === c.name)).length : 0;
      const countBadge = el('span', { class: 'text-xs text-slate-500', text: `${count} lien${count > 1 ? 's' : ''}` });
      
      contentWrap.append(nameInput, countBadge);

      const rm = trashButton(() => { categories.splice(idx, 1); renderCategories({ container, addBtn, categories, links, scheduleAutoSave, onUpdate }); triggerUpdate(); }, 'Supprimer la catégorie');
      
      row.append(gripBtn, contentWrap, rm);
      try { enableDragHandle(gripBtn, row, listContainer, categories, () => { renderCategories({ container, addBtn, categories, links, scheduleAutoSave, onUpdate }); triggerUpdate(); }, scheduleAutoSave); } catch {}
      listContainer.appendChild(row);
    });
  }

  if (addBtn) {
      addBtn.onclick = () => { 
        categories.push({ name: 'Nouvelle catégorie', order: categories.length }); 
        renderCategories({ container, addBtn, categories, links, scheduleAutoSave, onUpdate }); 
        triggerUpdate(); 
      };
  }
}

export function renderLinks({ container, addBtn, links, categories, scheduleAutoSave }) {
  if (!container) return;
  container.innerHTML = '';

  // Bind quick add controls if present in DOM
  const quickInput = document.getElementById('quickAddInput');
  const quickBtn = document.getElementById('quickAddBtn');
  const openAddModalBtn = document.getElementById('openAddModalBtn');

  // Helper to open modal (single init)
  const modal = document.getElementById('linkModal');
  const modalTitle = modal && document.getElementById('linkModalTitleInput');
  const modalUrl = modal && document.getElementById('linkModalUrlInput');
  let modalIcon = modal && document.getElementById('linkModalIconInput');
  const modalDesc = modal && document.getElementById('linkModalDescInput');
  const modalCat = modal && document.getElementById('linkModalCategory');
  const modalNewTab = modal && document.getElementById('linkModalNewTab');
  const modalSaveBtn = modal && document.getElementById('linkModalSave');
  const modalCancelBtn = modal && document.getElementById('linkModalCancel');
  const modalCloseBtn = modal && document.getElementById('linkModalClose');
  const modalSchemeBtn = modal && document.getElementById('linkModalSchemeBtn');
  const modalSchemeMenu = modal && document.getElementById('linkModalSchemeMenu');

  function fillCategorySelect() {
    if (!modalCat) return;
    modalCat.innerHTML = '';
    modalCat.append(el('option', { value: '', text: 'Aucune catégorie' }));
    (categories || []).forEach(c => modalCat.append(el('option', { value: c.id || c.name, text: c.name })));
  }

  let editingIndex = null;
  function openLinkModal(idx) {
    if (!modal) return;
    editingIndex = (typeof idx === 'number') ? idx : null;
    const l = (editingIndex !== null) ? links[editingIndex] : { url: '', text: '', icon: '', description: '', categoryId: null, newTab: false };
    fillCategorySelect();
    modalTitle.value = l.text || '';
    // store URL without scheme in the input (prefix shown in UI)
    try {
      const raw = l.url || '';
      modalUrl.value = String(raw).replace(/^https?:\/\//i, '') || '';
      // set scheme display based on existing url
      let scheme = 'https';
      if (/^http:/.test(String(raw))) scheme = 'http';
      try { if (modal) modal.dataset.urlScheme = scheme; } catch {}
      try { if (modalSchemeBtn) modalSchemeBtn.querySelector('#linkModalSchemeLabel').textContent = scheme + '://'; } catch {}
    } catch {
      modalUrl.value = l.url || '';
    }
    // Icon source handling
    const iconSourceEl = document.getElementById('linkModalIconSource');
    const iconInput = document.getElementById('linkModalIconInput');
    const iconUrlInput = document.getElementById('linkModalIconInputUrl');
    const iconPickerWrap = document.getElementById('linkModalIconPickerWrap');
    const iconUrlWrap = document.getElementById('linkModalIconUrlWrap');
    const iconUploadWrap = document.getElementById('linkModalIconUploadWrap');
    const iconUpload = document.getElementById('linkModalIconUpload');
    const pickBtn = document.getElementById('linkModalPickIconBtn');

    function showIconSource(src) {
      iconPickerWrap.classList.toggle('hidden', src !== 'catalog');
      iconUrlWrap.classList.toggle('hidden', src !== 'url');
      iconUploadWrap.classList.toggle('hidden', src !== 'upload');
    }

    // determine default source
    let src = 'catalog';
    if (l.icon) {
      if (String(l.icon).startsWith('data:')) src = 'upload';
      else if (/https?:\/\//.test(l.icon)) src = 'url';
      else src = 'catalog';
    }

    if (iconSourceEl) iconSourceEl.value = src;
    if (iconInput) iconInput.value = (src === 'catalog' && l.icon) ? l.icon : '';
    if (iconUrlInput) iconUrlInput.value = (src === 'url' && l.icon) ? l.icon : '';

    showIconSource(iconSourceEl ? iconSourceEl.value : src);

    // Bind picker/upload handlers
    if (iconSourceEl && !iconSourceEl._bound) {
      iconSourceEl.addEventListener('change', () => { showIconSource(iconSourceEl.value); });
      iconSourceEl._bound = true;
    }
    if (pickBtn && !pickBtn._bound) {
      pickBtn.addEventListener('click', () => {
        openIconModal((slug) => {
          const replaced = `https://s3.marvideo.fr/plinkk-image/icons/${slug}.svg`;
          if (iconInput) iconInput.value = replaced;
        });
      });
      pickBtn._bound = true;
    }
    if (iconUpload && !iconUpload._bound) {
      iconUpload.addEventListener('change', (e) => {
        const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => {
          // store in the URL input as data URL
          if (iconUrlInput) iconUrlInput.value = String(reader.result || '');
        }; reader.readAsDataURL(file);
      });
      iconUpload._bound = true;
    }

    // If modal opened in social mode, render presets (grid of platform cards) inside the modal
    try {
      const isSocialMode = modal && modal.dataset && modal.dataset.mode === 'social';
      if (isSocialMode && urlWrap) {
        let presetsWrap = document.getElementById('linkModalSocialPresets');
        if (!presetsWrap) {
          presetsWrap = el('div', { id: 'linkModalSocialPresets', class: 'mt-3 grid grid-cols-4 gap-2' });
          // place presets below URL input
          urlWrap.appendChild(presetsWrap);
        }
        if (!presetsWrap._bound) {
          const platforms = window.__SOCIAL_PLATFORM_LIST__ || [];
          presetsWrap.innerHTML = '';

          // header with title and optional "Voir tout"
          const hdr = el('div', { class: 'flex items-center justify-between w-full mb-2' });
          const title = el('div', { class: 'text-sm font-medium text-slate-200', text: 'Presets' });
          hdr.appendChild(title);
          if (platforms.length > 12) {
            const seeAll = el('button', { type: 'button', class: 'text-xs text-sky-400 hover:text-sky-300', text: 'Voir tout' });
            seeAll.addEventListener('click', () => {
              const { openPicker } = window.__DASH_PICKERS__ || {};
              if (!openPicker) return;
              openPicker({
                title: 'Toutes les plateformes',
                type: 'platform',
                items: platforms,
                renderCard: (item) => {
                  const card = document.createElement('button');
                  card.type = 'button';
                  card.className = 'p-3 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 text-left flex items-center gap-3';
                  const img = document.createElement('img');
                  img.src = `https://s3.marvideo.fr/plinkk-image/icons/${item.iconSlug}.svg`;
                  img.className = 'h-8 w-8 rounded bg-slate-800';
                  const col = document.createElement('div');
                  const title = document.createElement('div');
                  title.className = 'font-medium';
                  title.textContent = item.name;
                  const small = document.createElement('div');
                  small.className = 'text-xs text-slate-400';
                  small.textContent = item.pattern || item.id;
                  col.append(title, small);
                  card.append(img, col);
                  return card;
                },
                onSelect: (i) => {
                  const plat = platforms[i];
                  if (!plat) return;
                  try {
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
                      if (final) {
                        if (url) url.value = final;
                        try { modal.dataset.urlScheme = /^http:/.test(final) ? 'http' : 'https'; } catch {}
                        const iconSourceEl = document.getElementById('linkModalIconSource');
                        const iconInput = document.getElementById('linkModalIconInput');
                        if (iconSourceEl) iconSourceEl.value = 'catalog';
                        if (iconInput) iconInput.value = `https://s3.marvideo.fr/plinkk-image/icons/${plat.iconSlug}.svg`;
                      }
                    });
                  } catch (e) {}
                }
              });
            });
            hdr.appendChild(seeAll);
          }
          presetsWrap.appendChild(hdr);

          // grid of presets
          const grid = el('div', { class: 'grid grid-cols-6 gap-2 w-full' });
          platforms.slice(0, 24).forEach((plat) => {
            const btn = el('button', { type: 'button', class: 'flex flex-col items-center gap-1 p-2 rounded border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-center text-xs transition', title: plat.name });
            const img = el('img', { src: `https://s3.marvideo.fr/plinkk-image/icons/${plat.iconSlug}.svg`, class: 'h-7 w-7' });
            const label = el('div', { class: 'text-xs text-slate-300 truncate w-full', text: plat.name });
            btn.append(img, label);
            btn.addEventListener('click', () => {
              try {
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
                  if (final) {
                    if (url) url.value = final;
                    try { modal.dataset.urlScheme = /^http:/.test(final) ? 'http' : 'https'; } catch {}
                    const iconSourceEl = document.getElementById('linkModalIconSource');
                    const iconInput = document.getElementById('linkModalIconInput');
                    if (iconSourceEl) iconSourceEl.value = 'catalog';
                    if (iconInput) iconInput.value = `https://s3.marvideo.fr/plinkk-image/icons/${plat.iconSlug}.svg`;
                  }
                });
              } catch (e) {}
            });
            grid.appendChild(btn);
          });
          presetsWrap.appendChild(grid);
          presetsWrap._bound = true;
        }
      }
    } catch (e) {}

    modalIcon = document.getElementById('linkModalIconInput') || document.getElementById('linkModalIconInputUrl');
    modalDesc.value = l.description || '';
    modalCat.value = l.categoryId || '';
    modalNewTab.checked = !!l.newTab;
    // Persist editing index on modal element so the save handler (bound once) can read it
    try { if (editingIndex !== null) modal.dataset.editingIndex = String(editingIndex); else delete modal.dataset.editingIndex; } catch {}
    // If icon source is catalog, ensure the input is readonly (cannot edit the stored library link)
    try {
      if (iconSourceEl && iconSourceEl.value === 'catalog') {
        if (iconInput) iconInput.setAttribute('readonly', 'true');
      } else {
        if (iconInput) iconInput.removeAttribute('readonly');
      }
    } catch {}
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    try { modalTitle && modalTitle.focus(); } catch {}
  }

  function closeLinkModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    try { if (modal) delete modal.dataset.editingIndex; } catch {}
    editingIndex = null;
  }

  // Expose a helper to let other renderers reuse the link modal.
  // Usage: window.__OPEN_LINK_MODAL__(idxOrNull, { prefill: {...}, onSave: (payload)=>{} })
  try {
    window.__OPEN_LINK_MODAL__ = (idx, opts) => {
      try { if (modal) modal.dataset.mode = 'link'; } catch (e) {}
      openLinkModal(idx);
      if (!opts) return;
      try {
        const p = opts.prefill || {};
        if (p.text !== undefined) modalTitle.value = p.text;
        if (p.url !== undefined) {
          // remove scheme for input
          modalUrl.value = String(p.url || '').replace(/^https?:\/\//i, '');
          try { modal.dataset.urlScheme = p.url && /^http:/.test(p.url) ? 'http' : 'https'; } catch {}
          try { modalSchemeBtn && (modalSchemeBtn.querySelector('#linkModalSchemeLabel').textContent = (modal.dataset.urlScheme || 'https') + '://'); } catch {}
        }
        if (p.icon !== undefined) {
          const iconSourceEl = document.getElementById('linkModalIconSource');
          const iconInput = document.getElementById('linkModalIconInput');
          const iconUrlInput = document.getElementById('linkModalIconInputUrl');
          if (iconSourceEl) {
            let src = 'catalog';
            if (String(p.icon).startsWith('data:')) src = 'upload'; else if (/https?:\/\//.test(p.icon)) src = 'url';
            iconSourceEl.value = src;
            if (src === 'catalog') { if (iconInput) iconInput.value = p.icon; }
            if (src === 'url' || src === 'upload') { if (iconUrlInput) iconUrlInput.value = p.icon; }
            const iconPickerWrap = document.getElementById('linkModalIconPickerWrap');
            const iconUrlWrap = document.getElementById('linkModalIconUrlWrap');
            const iconUploadWrap = document.getElementById('linkModalIconUploadWrap');
            if (iconPickerWrap) iconPickerWrap.classList.toggle('hidden', iconSourceEl.value !== 'catalog');
            if (iconUrlWrap) iconUrlWrap.classList.toggle('hidden', iconSourceEl.value !== 'url');
            if (iconUploadWrap) iconUploadWrap.classList.toggle('hidden', iconSourceEl.value !== 'upload');
          }
        }
        if (p.description !== undefined) modalDesc.value = p.description || '';
        if (p.categoryId !== undefined && modalCat) modalCat.value = p.categoryId || '';
        if (p.newTab !== undefined && modalNewTab) modalNewTab.checked = !!p.newTab;
      } catch (e) {}
      if (opts.onSave && modal) modal._externalSaveHandler = opts.onSave;
    };
  } catch (e) {}
  // Separate social modal helper that reuses link modal DOM but marks mode and allows different save handling
  try {
    window.__OPEN_SOCIAL_MODAL__ = (idx, opts) => {
      try { if (modal) modal.dataset.mode = 'social'; } catch (e) {}
      openLinkModal(idx);
      if (!opts) return;
      try {
        const p = opts.prefill || {};
        if (p.text !== undefined) modalTitle.value = p.text;
        if (p.url !== undefined) modalUrl.value = String(p.url || '').replace(/^https?:\/\//i, '');
        if (p.icon !== undefined) {
          const iconSourceEl = document.getElementById('linkModalIconSource');
          const iconInput = document.getElementById('linkModalIconInput');
          const iconUrlInput = document.getElementById('linkModalIconInputUrl');
          if (iconSourceEl) {
            let src = 'catalog';
            if (String(p.icon).startsWith('data:')) src = 'upload'; else if (/https?:\/\//.test(p.icon)) src = 'url';
            iconSourceEl.value = src;
            if (src === 'catalog') { if (iconInput) iconInput.value = p.icon; }
            if (src === 'url' || src === 'upload') { if (iconUrlInput) iconUrlInput.value = p.icon; }
            const iconPickerWrap = document.getElementById('linkModalIconPickerWrap');
            const iconUrlWrap = document.getElementById('linkModalIconUrlWrap');
            const iconUploadWrap = document.getElementById('linkModalIconUploadWrap');
            if (iconPickerWrap) iconPickerWrap.classList.toggle('hidden', iconSourceEl.value !== 'catalog');
            if (iconUrlWrap) iconUrlWrap.classList.toggle('hidden', iconSourceEl.value !== 'url');
            if (iconUploadWrap) iconUploadWrap.classList.toggle('hidden', iconSourceEl.value !== 'upload');
          }
        }
        if (p.description !== undefined) modalDesc.value = p.description || '';
        if (p.categoryId !== undefined && modalCat) modalCat.value = p.categoryId || '';
        if (p.newTab !== undefined && modalNewTab) modalNewTab.checked = !!p.newTab;
      } catch (e) {}
      if (opts.onSave && modal) modal._externalSaveHandler = opts.onSave;
    };
  } catch (e) {}

  // When opening in social mode, adapt the modal DOM: hide category/newTab, change header, ensure platform button visible
  try {
    const originalAdjust = () => {};
    const adjustSocialModeUI = () => {
      if (!modal) return;
      const isSocial = modal.dataset && modal.dataset.mode === 'social';
      // header/title
      try {
        const header = modal.querySelector('h2') || modal.querySelector('.modal-title');
        if (header) header.textContent = isSocial ? 'Modifier le réseau social' : 'Modifier le lien';
      } catch (e) {}
      // hide title and description and category for social mode
      try {
        const titleEl = document.getElementById('linkModalTitleInput');
        if (titleEl && titleEl.parentElement) titleEl.parentElement.style.display = isSocial ? 'none' : '';
      } catch (e) {}
      try {
        const desc = document.getElementById('linkModalDescInput');
        if (desc && desc.parentElement) desc.parentElement.style.display = isSocial ? 'none' : '';
      } catch (e) {}
      try {
        const cat = document.getElementById('linkModalCategory');
        if (cat && cat.parentElement) cat.parentElement.style.display = isSocial ? 'none' : '';
      } catch (e) {}
      // show newTab checkbox wrapper for social mode
      try {
        const newTab = document.getElementById('linkModalNewTab');
        if (newTab && newTab.parentElement) newTab.parentElement.style.display = isSocial ? '' : '';
      } catch (e) {}
      // add presets button above URL for social mode
      try {
        const modalContent = document.querySelector('#linkModal .space-y-3');
        if (!modalContent) return;
        const urlLabel = modalContent.querySelector('label:has(#linkModalUrlInput)');
        if (!urlLabel) return;
        let presetsBtn = document.getElementById('linkModalPresetsBtn');
        if (isSocial) {
          if (!presetsBtn) {
            presetsBtn = el('button', { type: 'button', id: 'linkModalPresetsBtn', class: 'w-full px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium', text: 'Presets' });
            urlLabel.before(presetsBtn);
            presetsBtn.addEventListener('click', (ev) => {
              ev.preventDefault();
              // create a new modal for presets
              const modal = el('div', { class: 'fixed inset-0 z-50', id: 'presetsModal' });
              const backdrop = el('div', { class: 'absolute inset-0 bg-black/60 animate-fade-in' });
              const content = el('div', { class: 'relative mx-auto mt-16 w-[92vw] max-w-5xl rounded-lg border border-slate-800 bg-slate-900 shadow-xl animate-pop-in' });
              const header = el('div', { class: 'flex items-center justify-between px-4 py-3 border-b border-slate-800' });
              header.append(el('h3', { class: 'font-semibold', text: 'Choisir une plateforme' }));
              const closeBtn = el('button', { class: 'size-8 rounded bg-slate-800 hover:bg-slate-700', text: '✕' });
              closeBtn.addEventListener('click', () => modal.remove());
              header.append(closeBtn);
              content.append(header);
              const body = el('div', { class: 'p-4 space-y-3' });
              const searchInput = el('input', { type: 'text', placeholder: 'Rechercher une plateforme...', class: 'w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-200' });
              body.append(searchInput);
              const grid = el('div', { class: 'grid grid-cols-6 gap-2 w-full max-h-96 overflow-auto' });
              const platforms = window.__SOCIAL_PLATFORM_LIST__ || [];
              const platformBtns = [];
              platforms.slice(0, 24).forEach((plat) => {
                const btn = el('button', { type: 'button', class: 'flex flex-col items-center gap-1 p-2 rounded border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-center text-xs transition', title: plat.name, 'data-name': plat.name.toLowerCase() });
                const img = el('img', { src: `https://s3.marvideo.fr/plinkk-image/icons/${plat.iconSlug}.svg`, class: 'h-7 w-7' });
                const label = el('div', { class: 'text-xs text-slate-300 truncate w-full', text: plat.name });
                btn.append(img, label);
                btn.addEventListener('click', () => {
                  modal.remove();
                  try { window.__OPEN_PLATFORM_MODAL__(plat, ({ handle, country, path }) => {
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
                    if (final) {
                      const urlEl = document.getElementById('linkModalUrlInput');
                      if (urlEl) urlEl.value = final;
                      const iconSourceEl = document.getElementById('linkModalIconSource');
                      const iconInput = document.getElementById('linkModalIconInput');
                      if (iconSourceEl) iconSourceEl.value = 'catalog';
                      if (iconInput) iconInput.value = `https://s3.marvideo.fr/plinkk-image/icons/${plat.iconSlug}.svg`;
                    }
                  }); } catch (e) {}
                });
                grid.appendChild(btn);
                platformBtns.push(btn);
              });
              body.append(grid);
              content.append(body);
              modal.append(backdrop, content);
              document.body.append(modal);
              // close on backdrop click
              backdrop.addEventListener('click', () => modal.remove());
              // search functionality
              searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                platformBtns.forEach(btn => {
                  const name = btn.getAttribute('data-name');
                  if (name.includes(query)) {
                    btn.style.display = '';
                  } else {
                    btn.style.display = 'none';
                  }
                });
              });
              searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const firstVisible = platformBtns.find(btn => btn.style.display !== 'none');
                  if (firstVisible) firstVisible.click();
                }
              });
            });
          }
          presetsBtn.style.display = '';
        } else {
          if (presetsBtn) presetsBtn.style.display = 'none';
        }
      } catch (e) {}
      // add Enter key handling for inputs
      try {
        const inputs = modalContent.querySelectorAll('input:not([type="checkbox"]), select');
        const allFields = Array.from(modalContent.querySelectorAll('input:not([type="checkbox"]), select, textarea'));
        inputs.forEach((input, index) => {
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const currentIndex = allFields.indexOf(input);
              const nextField = allFields[currentIndex + 1];
              if (nextField) {
                nextField.focus();
              } else {
                // submit
                const saveBtn = document.getElementById('linkModalSave');
                if (saveBtn) saveBtn.click();
              }
            }
          });
        });
      } catch (e) {}
    };
    // observe modal dataset changes could be complex; call adjust when modal is opened/closed via existing handlers
    // patch openLinkModal and closeLinkModal points by wrapping existing functions: call adjust after openLinkModal sets modal visible
    const oldOpen = openLinkModal;
    openLinkModal = function(idx) { oldOpen(idx); try { adjustSocialModeUI(); } catch(e){} };
    const oldClose = closeLinkModal;
    closeLinkModal = function() { try { if (modal) { delete modal.dataset.mode; } } catch(e){}; try { adjustSocialModeUI(); } catch(e){}; oldClose(); };
  } catch (e) {}

  // Initialize modal buttons only once
  if (modal && !modal._initialized) {
    // scheme menu toggle and selection handlers
    if (modalSchemeBtn && modalSchemeMenu && !modalSchemeBtn._bound) {
      modalSchemeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        modalSchemeMenu.classList.toggle('hidden');
      });
      // choose scheme
      Array.from(modalSchemeMenu.querySelectorAll('button[data-scheme]')).forEach(b => {
        b.addEventListener('click', (ev) => {
          const s = ev.currentTarget.getAttribute('data-scheme');
          try { modal.dataset.urlScheme = s; } catch {}
          try { modalSchemeBtn.querySelector('#linkModalSchemeLabel').textContent = s + '://'; } catch {}
          modalSchemeMenu.classList.add('hidden');
          // focus url input
          try { modalUrl && modalUrl.focus(); } catch {}
        });
      });
      // close on outside click
      document.addEventListener('click', () => { try { modalSchemeMenu.classList.add('hidden'); } catch {} });
      modalSchemeBtn._bound = true;
    }
    // auto-detect scheme if user pastes 'http(s)://' in the URL input
    if (modalUrl && !modalUrl._schemeBound) {
      modalUrl.addEventListener('input', (e) => {
        try {
          const v = String(modalUrl.value || '');
          if (/^https?:\/\//i.test(v)) {
            // extract scheme and rest, set dataset, update label and remove scheme from input
            const match = v.match(/^(https?):\/\/(.*)$/i);
            if (match) {
              const s = match[1].toLowerCase();
              const rest = match[2] || '';
              try { modal.dataset.urlScheme = s; } catch {}
              try { modalSchemeBtn && (modalSchemeBtn.querySelector('#linkModalSchemeLabel').textContent = s + '://'); } catch {}
              // update input without the scheme
              if (modalUrl.value !== rest) modalUrl.value = rest;
            }
          }
        } catch (err) {}
      });
      modalUrl._schemeBound = true;
    }
    if (modalSaveBtn) modalSaveBtn.addEventListener('click', () => {
      // determine icon based on selected source
      const iconSourceEl = document.getElementById('linkModalIconSource');
      let iconValue = '';
      if (iconSourceEl) {
        if (iconSourceEl.value === 'catalog') iconValue = document.getElementById('linkModalIconInput')?.value.trim() || '';
        else if (iconSourceEl.value === 'url') iconValue = document.getElementById('linkModalIconInputUrl')?.value.trim() || '';
        else if (iconSourceEl.value === 'upload') iconValue = document.getElementById('linkModalIconInputUrl')?.value.trim() || '';
      } else {
        iconValue = (document.getElementById('linkModalIconInput') || document.getElementById('linkModalIconInputUrl'))?.value.trim() || '';
      }

      // reconstruct full url with selected scheme (default https)
      let rawUrl = (modalUrl.value || '').trim();
      rawUrl = rawUrl.replace(/^https?:\/\//i, '');
      let scheme = 'https';
      try { scheme = modal && modal.dataset && modal.dataset.urlScheme ? modal.dataset.urlScheme : 'https'; } catch { scheme = 'https'; }
      const fullUrl = rawUrl ? (scheme + '://' + rawUrl) : (scheme + '://');
      const payload = { text: modalTitle.value.trim(), url: fullUrl, icon: iconValue, description: modalDesc.value.trim() || '', categoryId: modalCat.value || null, newTab: !!modalNewTab.checked };

      // If an external save handler was provided (via window.__OPEN_LINK_MODAL__), call it instead
      try {
        if (modal && modal._externalSaveHandler) {
          try { modal._externalSaveHandler(payload); } catch (err) {}
          try { delete modal._externalSaveHandler; } catch (e) { modal._externalSaveHandler = null; }
          renderLinks({ container, addBtn, links, categories, scheduleAutoSave });
          scheduleAutoSave();
          closeLinkModal();
          return;
        }
      } catch (e) {}
      // read editing index from modal dataset (safe across re-renders)
      let mi = null;
      try { mi = modal && modal.dataset && modal.dataset.editingIndex ? parseInt(modal.dataset.editingIndex, 10) : null; } catch { mi = null; }
      if (mi !== null && !isNaN(mi)) {
        Object.assign(links[mi], payload);
      } else {
        links.push(payload);
      }
      renderLinks({ container, addBtn, links, categories, scheduleAutoSave });
      scheduleAutoSave();
      closeLinkModal();
    });
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', () => closeLinkModal());
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => closeLinkModal());
    try {
      const modalOverlay = modal.firstElementChild;
      if (modalOverlay && !modalOverlay._boundClose) {
        modalOverlay.addEventListener('click', () => closeLinkModal());
        modalOverlay._boundClose = true;
      }
      if (!modal._boundOuterClose) {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeLinkModal(); });
        modal._boundOuterClose = true;
      }
    } catch (e) {}
    // close on Escape
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) closeLinkModal(); });
    modal._initialized = true;
  }

  // Quick add handler
  if (quickBtn && quickInput) {
    quickBtn.onclick = () => {
      const v = String(quickInput.value || '').trim();
      if (!v) return;
      // Accept formats: "Titre | url" or just url
      let title = '';
      let url = '';
      if (v.includes('|')) {
        [title, url] = v.split('|').map(s => s.trim());
      } else if (/https?:\/\//.test(v)) {
        url = v;
      } else {
        // treat as title only
        title = v;
      }
      if (!url && title && /https?:\/\//.test(title)) { url = title; title = ''; }
      // normalize url: remove existing scheme and prefix https://
      const normalize = (s) => { if (!s) return ''; const t = String(s).trim().replace(/^https?:\/\//i, ''); return t; };
      const raw = normalize(url);
      const full = raw ? ('https://' + raw) : 'https://';
      const item = { text: title || raw || 'Nouveau', url: full, icon: '', description: '', categoryId: null, newTab: false };
      links.push(item);
      quickInput.value = '';
      renderLinks({ container, addBtn, links, categories, scheduleAutoSave });
      scheduleAutoSave();
    };
  }
  if (openAddModalBtn) {
    openAddModalBtn.onclick = () => openLinkModal(null);
  }

  // If no links, show an empty state (below quick add)
  if (!Array.isArray(links) || links.length === 0) {
    container.append(emptyState({ title: 'Aucun lien', description: 'Créez vos premiers boutons et liens.', actionLabel: '+ Ajouter un lien', onAction: () => openLinkModal(null) }));
    return;
  }

  links.forEach((l, idx) => {
    const row = el('div', { class: 'flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900' });
    row.dataset.dragIndex = String(idx);

    const left = el('div', { class: 'flex items-center gap-3 min-w-0' });
    const grip = el('button', { type: 'button', class: 'h-8 w-8 inline-flex items-center justify-center rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 cursor-grab', title: 'Déplacer' });
    grip.appendChild(createGripSVG(16));

    const iconImg = el('img', { class: 'h-10 w-10 rounded bg-slate-800 border border-slate-700 object-cover' });
    if (l.icon) iconImg.src = l.icon;
    const textWrap = el('div', { class: 'min-w-0' });
    const title = el('div', { class: 'text-sm font-medium text-slate-200 truncate' }); title.textContent = l.text || l.name || '';
    const small = el('div', { class: 'text-xs text-slate-400 truncate' }); small.textContent = l.url || '';
    textWrap.append(title, small);

    left.append(grip, iconImg, textWrap);

    const actions = el('div', { class: 'flex items-center gap-2' });

    // Toggle as accessible checkbox to avoid accidental form navigation
    const toggleWrap = el('div', { class: 'inline-flex items-center gap-2' });
    const toggleInput = el('input', { type: 'checkbox', 'aria-label': 'Activer / Désactiver' });
    if (l.enabled === false) toggleInput.checked = false; else toggleInput.checked = true;
    const toggleBtn = el('button', { type: 'button', class: (toggleInput.checked ? 'px-3 py-1 rounded text-xs bg-emerald-700 text-white' : 'px-3 py-1 rounded text-xs bg-slate-800 text-slate-400'), title: 'Activer / Désactiver' });
    toggleBtn.textContent = toggleInput.checked ? 'On' : 'Off';
    toggleInput.addEventListener('change', (e) => {
      e.stopPropagation();
      l.enabled = !!toggleInput.checked;
      toggleBtn.className = l.enabled ? 'px-3 py-1 rounded text-xs bg-emerald-700 text-white' : 'px-3 py-1 rounded text-xs bg-slate-800 text-slate-400';
      toggleBtn.textContent = l.enabled ? 'On' : 'Off';
      renderLinks({ container, addBtn, links, categories, scheduleAutoSave });
      scheduleAutoSave();
    });
    // allow clicking the visible button to toggle state (no navigation)
    toggleBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggleInput.checked = !toggleInput.checked; toggleInput.dispatchEvent(new Event('change')); });
    toggleWrap.append(toggleInput, toggleBtn);

    const editBtn = el('button', { type: 'button', class: 'px-3 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-200', title: 'Modifier' });
    editBtn.textContent = 'Modifier';
    editBtn.addEventListener('click', () => openLinkModal(idx));

    const dupBtn = el('button', { type: 'button', class: 'px-3 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-200', title: 'Dupliquer' });
    dupBtn.textContent = 'Dupliquer';
    dupBtn.addEventListener('click', () => { links.splice(idx + 1, 0, JSON.parse(JSON.stringify(l))); renderLinks({ container, addBtn, links, categories, scheduleAutoSave }); scheduleAutoSave(); });

    const rm = trashButton(() => { links.splice(idx, 1); renderLinks({ container, addBtn, links, categories, scheduleAutoSave }); scheduleAutoSave(); });

    // Do not render the On/Off toggle for now; keep actions compact
    actions.append(editBtn, dupBtn, rm);

    row.append(left, actions);
    try { enableDragHandle(grip, row, container, links, () => renderLinks({ container, addBtn, links, categories, scheduleAutoSave }), scheduleAutoSave); } catch {}

    container.appendChild(row);
  });

  if (addBtn) addBtn.onclick = () => openLinkModal(null);
}

// Agencement: réordonner les grandes sections de la page
export function renderLayout({ container, order, scheduleAutoSave }) {
  if (!container) return;
  container.innerHTML = '';
  
  const KNOWN = ['profile', 'username', 'labels', 'social', 'email', 'links'];
  
  if (!Array.isArray(order) || order.length === 0) {
    if (Array.isArray(order)) {
        order.splice(0, order.length, ...KNOWN);
    } else {
        order = [...KNOWN];
    }
  }

  const seen = new Set();
  const normalized = [];
  order.forEach(k => { if (KNOWN.includes(k) && !seen.has(k)) { seen.add(k); normalized.push(k); } });
  KNOWN.forEach(k => { if (!seen.has(k)) normalized.push(k); });
  
  if (Array.isArray(order)) {
      order.splice(0, order.length, ...normalized);
  }

  const LABELS = {
    profile: 'Photo & lien de profil',
    username: 'Nom affiché',
    labels: 'Labels (badges)',
    social: 'Icônes sociales',
    email: 'Email & Description',
    links: 'Boutons / Liens',
  };

  normalized.forEach((key, idx) => {
    const row = el('div', { class: 'flex items-center gap-3 w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-3 select-none hover:border-slate-700 transition-colors' });
    row.dataset.dragIndex = String(idx);
    
    const gripBtn = el('button', { type: 'button', class: 'h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 cursor-grab active:cursor-grabbing transition-colors', title: 'Déplacer', 'aria-label': 'Déplacer' });
    gripBtn.appendChild(createGripSVG(16));
    
    const label = el('div', { class: 'text-sm font-medium text-slate-200' });
    label.textContent = LABELS[key] || key;
    
    row.append(gripBtn, label);
    try { enableDragHandle(gripBtn, row, container, order, () => renderLayout({ container, order, scheduleAutoSave }), scheduleAutoSave); } catch {}
    container.appendChild(row);
  });
}
