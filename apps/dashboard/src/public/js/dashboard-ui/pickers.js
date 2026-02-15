import { qs, el, getIconClass } from './utils.js';

/* --- SHA256 Helper (Async) --- */
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const iconModal = qs('#iconModal');
const iconModalClose = qs('#iconModalClose');
const iconSearch = qs('#iconSearch');
const iconGrid = qs('#iconGrid');

const uploadSearch = qs('#uploadSearch');
const uploadsGrid = qs('#uploadsGrid');
const triggerUploadBtn = qs('#triggerUploadBtn');

const gravatarEmail = qs('#gravatarEmail');
const gravatarPreview = qs('#gravatarPreview');
const useGravatarBtn = qs('#useGravatarBtn');

let iconCatalog = [];
let iconSelectCallback = null;
let currentTargetField = null;
let userUploadsCache = null;

// Expose a small helper to allow server-rendered upload buttons to trigger selection
try {
  if (typeof window !== 'undefined') {
    window.__DASH_PICKERS__ = window.__DASH_PICKERS__ || {};
    window.__DASH_PICKERS__.iconSelect = (v) => {
      try { if (iconSelectCallback) iconSelectCallback(v); } catch (e) { }
      try { closeIconModal(); } catch (e) { }
    };
    window.__DASH_PICKERS__.refreshUploads = () => {
      userUploadsCache = null;
    };
  }
} catch (e) { }

async function switchTab(tabName) {
  document.querySelectorAll('.icon-tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabName) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  const t = document.getElementById(`tab-${tabName}`);
  if (t) t.classList.remove('hidden');

  if (tabName === 'uploads') populateUploadsGrid(uploadSearch ? uploadSearch.value : '');
  if (tabName === 'gravatar') await updateGravatar();
}

function setupTabs() {
  document.querySelectorAll('.icon-tab-btn').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });
}

async function updateGravatar() {
  const emailInput = document.getElementById('email');
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  if (gravatarEmail) gravatarEmail.textContent = email || 'aucun email';

  if (email) {
    const hash = await sha256(email);
    const url = `https://www.gravatar.com/avatar/${hash}?d=mp&s=400`;
    const img = document.createElement('img');
    img.src = url;
    img.className = 'w-full h-full object-cover';
    if (gravatarPreview) {
      gravatarPreview.innerHTML = '';
      gravatarPreview.appendChild(img);
    }

    if (useGravatarBtn) useGravatarBtn.onclick = () => {
      if (iconSelectCallback) iconSelectCallback(url);
      closeIconModal();
    };
  } else {
    if (gravatarPreview) gravatarPreview.innerHTML = '<div class="absolute inset-0 flex items-center justify-center bg-slate-900/10 text-slate-500 text-xs">?</div>';
  }
}

async function ensureUserUploads(force = false) {
  if (userUploadsCache && !force) return userUploadsCache;
  try {
    const res = await fetch('/api/me/uploads');
    if (!res.ok) return [];
    const data = await res.json();
    userUploadsCache = data.uploads || [];
    return userUploadsCache;
  } catch (e) {
    return [];
  }
}

async function populateUploadsGrid(filter) {
  if (!uploadsGrid) return;

  // Si on a déjà du cache, on vide la grille (mais on ne montre pas "Chargement")
  // Si on n'a PAS de cache, on montre des skeletons
  if (!userUploadsCache) {
    uploadsGrid.innerHTML = Array(12).fill(0).map(() => `
            <div class="p-4 rounded-2xl border border-slate-800 bg-slate-950/50 flex flex-col items-center justify-center gap-3 animate-pulse">
                <div class="size-16 rounded-xl bg-slate-800"></div>
                <div class="h-3 w-20 rounded bg-slate-800"></div>
            </div>
        `).join('');
  }

  const uploads = await ensureUserUploads();
  uploadsGrid.innerHTML = '';

  if (!uploads.length) {
    uploadsGrid.innerHTML = '<div class="col-span-full text-center text-slate-500 py-12 flex flex-col items-center gap-3"><svg class="size-12 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg><span>Aucune image importée.</span></div>';
    return;
  }

  const term = (filter || '').toLowerCase();

  const filtered = uploads.filter(u => {
    return !term || (u.name && u.name.toLowerCase().includes(term));
  });

  if (!filtered.length && term) {
    uploadsGrid.innerHTML = '<div class="col-span-full text-center text-slate-500 py-12">Aucun résultat pour "' + filter + '".</div>';
    return;
  }

  filtered.forEach(u => {
    const name = u.name ? u.name.replace(/\.[^/.]+$/, "") : 'Image';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'p-3 rounded-2xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5 transition-all flex flex-col items-center justify-center gap-3 group relative';

    const imgContainer = document.createElement('div');
    imgContainer.className = 'size-20 rounded-xl bg-slate-800/50 animate-pulse shrink-0 flex items-center justify-center overflow-hidden border border-slate-800/50';

    const img = document.createElement('img');
    img.src = u.url;
    img.alt = name;
    img.loading = 'lazy';
    img.className = 'h-full w-full object-contain opacity-0 transition-opacity duration-300';
    img.onload = () => {
      img.classList.remove('opacity-0');
      imgContainer.classList.remove('animate-pulse', 'bg-slate-800/50');
    };
    imgContainer.appendChild(img);

    const span = document.createElement('span');
    span.className = 'text-[11px] font-medium text-slate-400 group-hover:text-slate-200 truncate max-w-full block text-center transition-colors px-1';
    span.textContent = name;

    btn.append(imgContainer, span);
    btn.onclick = () => {
      if (iconSelectCallback) iconSelectCallback(u.url);
      closeIconModal();
    }

    uploadsGrid.appendChild(btn);
  });
}

async function ensureIconCatalog() {
  if (iconCatalog.length) return iconCatalog;
  const res = await fetch('/api/icons');
  if (!res.ok) throw new Error(await res.text());
  iconCatalog = await res.json();
  return iconCatalog;
}

export function openIconModal(onSelect, targetId) {
  iconSelectCallback = onSelect;
  currentTargetField = targetId || 'misc';
  if (iconModal) {
    iconModal.classList.remove('hidden');
    iconModal.classList.add('flex');
  }

  switchTab('library');
  populateIconGrid('');

  setupTabs();

  if (iconSearch) iconSearch.oninput = () => populateIconGrid(iconSearch.value);
  if (uploadSearch) uploadSearch.oninput = () => populateUploadsGrid(uploadSearch.value);

  if (triggerUploadBtn) {
    triggerUploadBtn.onclick = () => {
      if (!currentTargetField) return;

      // Map targetId to file input ID
      let inputId = `upload${currentTargetField.charAt(0).toUpperCase()}${currentTargetField.slice(1)}`;

      // Specific overrides
      if (currentTargetField === 'linkModalIconInput') inputId = 'linkModalIconUpload';
      if (currentTargetField === 'avatar') inputId = 'avatarInput';

      const fileInput = document.getElementById(inputId);
      if (fileInput) {
        fileInput.click();

        // When the corresponding text field is updated, we force refresh the uploads grid
        const urlInput = document.getElementById(currentTargetField);
        if (urlInput) {
          const onUpdate = () => {
            userUploadsCache = null; // Invalidate cache
            const t = document.getElementById('tab-uploads');
            if (t && !t.classList.contains('hidden')) {
              populateUploadsGrid();
            }
            urlInput.removeEventListener('input', onUpdate);
          };
          urlInput.addEventListener('input', onUpdate);
        }
      }
    };
  }
}

export function closeIconModal() {
  if (iconModal) {
    iconModal.classList.add('hidden');
    iconModal.classList.remove('flex');
  }
  iconSelectCallback = null;
}

export async function populateIconGrid(filterText) {
  if (!iconGrid) return;

  // Show skeletons while loading
  if (!iconCatalog.length) {
    iconGrid.innerHTML = Array(20).fill(0).map(() => `
      <div class="p-3 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center gap-3 animate-pulse">
        <div class="h-10 w-10 rounded-lg bg-slate-800"></div>
        <div class="h-3 w-16 rounded bg-slate-800"></div>
      </div>
    `).join('');
  }

  const catalog = await ensureIconCatalog();
  const term = (filterText || '').toLowerCase();
  iconGrid.innerHTML = '';
  const items = catalog.filter((i) => !term || i.displayName.toLowerCase().includes(term) || i.slug.includes(term));

  const groups = {};
  items.forEach(i => {
    const key = (i.displayName && String(i.displayName).charAt(0).toUpperCase()) || '#';
    (groups[key] = groups[key] || []).push(i);
  });

  Object.keys(groups).sort().forEach(letter => {
    const header = document.createElement('div');
    header.className = 'text-xs font-bold text-slate-500 uppercase tracking-wider col-span-full mt-4 mb-2 pl-1';
    header.textContent = letter;
    iconGrid.appendChild(header);

    groups[letter].forEach(i => {
      const card = document.createElement('button');
      card.setAttribute('type', 'button');
      card.className = 'p-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-violet-500/50 transition-all flex flex-col items-center justify-center gap-3';

      const imgContainer = document.createElement('div');
      imgContainer.className = 'h-10 w-10 rounded-lg bg-slate-800 animate-pulse shrink-0 flex items-center justify-center overflow-hidden';

      const img = document.createElement('img');
      img.src = i.url || `https://cdn.plinkk.fr/icons/${i.slug}.svg`;
      img.alt = i.displayName;
      img.className = 'h-full w-full object-contain opacity-0 transition-opacity duration-300' + getIconClass(img.src);
      img.onload = () => {
        img.classList.remove('opacity-0');
        imgContainer.classList.remove('animate-pulse', 'bg-slate-800');
      };
      imgContainer.appendChild(img);

      const label = document.createElement('div');
      label.className = 'text-xs text-slate-400 group-hover:text-white text-center truncate max-w-full';
      label.textContent = i.displayName;

      card.append(imgContainer, label);
      card.addEventListener('click', () => {
        if (iconSelectCallback) iconSelectCallback(i.url || i.slug);
        closeIconModal();
      });
      iconGrid.appendChild(card);
    });
  });
}

iconModalClose?.addEventListener('click', closeIconModal);
const iconOverlay = document.getElementById('iconModalOverlay');
if (iconOverlay) iconOverlay.addEventListener('click', closeIconModal);
// Overlay listener removed as covered by iconModalOverlay logic

const pickerModal = qs('#pickerModal');
const pickerClose = qs('#pickerClose');
const pickerTitle = qs('#pickerTitle');
const pickerSearch = qs('#pickerSearch');
const pickerGrid = qs('#pickerGrid');
let pickerData = [];
let pickerOnSelect = null;
let pickerType = '';
let pickerRenderCard = null;

export function openPicker({ title, type, items, renderCard, onSelect }) {
  pickerTitle.textContent = title;
  pickerType = type;
  pickerData = items;
  pickerOnSelect = onSelect;
  pickerRenderCard = renderCard || null;
  pickerSearch.value = '';
  const createBtn = document.getElementById('pickerCreateBtn');
  if (createBtn) createBtn.classList.toggle('hidden', type !== 'theme');
  pickerModal.classList.remove('hidden');
  renderPickerGrid('');
}

export function closePicker() {
  pickerModal.classList.add('hidden');
  pickerOnSelect = null;
  pickerType = '';
  pickerData = [];
}

export function pickerSelect(index) {
  try { pickerOnSelect && pickerOnSelect(index); }
  finally { closePicker(); }
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
  card.addEventListener('click', () => { pickerSelect(idx); });
  return card;
}

export function renderPickerGrid(query) {
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
const pickerOverlay = pickerModal?.firstElementChild;
pickerOverlay?.addEventListener('click', closePicker);
pickerModal?.addEventListener('click', (e) => { if (e.target === pickerModal) closePicker(); });
pickerSearch?.addEventListener('input', () => renderPickerGrid(pickerSearch.value));

export function renderBtnThemeCard(item, idx) {
  const card = document.createElement('button');
  card.setAttribute('type', 'button');
  card.className = 'p-3 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-left flex items-center gap-3';

  const imgContainer = document.createElement('div');
  imgContainer.className = 'h-8 w-8 rounded bg-slate-800 animate-pulse shrink-0 flex items-center justify-center overflow-hidden';

  const img = document.createElement('img');
  const iconUrl = (item.icon || '') //.replace('{{username}}', `/${window.__PLINKK_USER_ID__}`);
  img.src = iconUrl;
  img.alt = item.name || '';
  img.className = 'h-full w-full object-contain opacity-0 transition-opacity duration-300';

  img.onload = () => {
    img.classList.remove('opacity-0');
    imgContainer.classList.remove('animate-pulse');
  };
  img.onerror = () => {
    imgContainer.classList.remove('animate-pulse');
  };

  const col = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'font-medium';
  title.textContent = item.name || `Item ${idx}`;
  const small = document.createElement('div');
  small.className = 'text-xs text-slate-400';
  small.textContent = item.themeClass || '';
  col.append(title, small);
  imgContainer.appendChild(img);
  card.append(imgContainer, col);
  card.addEventListener('click', () => { if (pickerOnSelect) pickerOnSelect(idx); closePicker(); });
  return card;
}

let platformEntryModal = null;
export function ensurePlatformEntryModal() {
  if (platformEntryModal) return platformEntryModal;
  const wrapper = document.createElement('div');
  wrapper.id = 'platformEntryModal';
  wrapper.className = 'fixed inset-0 z-[70] hidden';
  const overlay = document.createElement('div');
  overlay.className = 'absolute inset-0 bg-black/60';
  const center = document.createElement('div');
  center.className = 'relative z-[1] mx-auto my-8 w-full max-w-lg p-4';
  const panel = document.createElement('div');
  panel.className = 'mx-4 rounded border border-slate-800 bg-slate-900 shadow-lg overflow-hidden';
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between px-4 py-2 border-b border-slate-800';
  const titleEl = document.createElement('div');
  titleEl.className = 'text-sm text-slate-300';
  titleEl.textContent = 'Détails de la plateforme';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'h-8 w-8 inline-flex items-center justify-center rounded bg-slate-800 border border-slate-700 hover:bg-slate-700';
  closeBtn.setAttribute('aria-label', 'Fermer');
  closeBtn.innerHTML = '<svg class="h-4 w-4 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  header.append(titleEl, closeBtn);
  const body = document.createElement('div');
  body.className = 'p-4 space-y-3';
  const info = document.createElement('div');
  info.className = 'text-xs text-slate-400';
  info.textContent = '';
  const fieldHandle = document.createElement('input');
  fieldHandle.type = 'text';
  fieldHandle.placeholder = 'Identifiant / handle';
  fieldHandle.className = 'w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm';
  const fieldCountry = document.createElement('input');
  fieldCountry.type = 'text';
  fieldCountry.placeholder = 'Code pays (ex: fr, us)';
  fieldCountry.className = 'w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm';
  const fieldPath = document.createElement('input');
  fieldPath.type = 'text';
  fieldPath.placeholder = 'Chemin / identifiant (ex: artist/12345-nom)';
  fieldPath.className = 'w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm';
  const actions = document.createElement('div');
  actions.className = 'flex justify-end gap-2';
  const btnCancel = document.createElement('button');
  btnCancel.type = 'button';
  btnCancel.className = 'h-9 px-3 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm';
  btnCancel.textContent = 'Annuler';
  const btnOk = document.createElement('button');
  btnOk.type = 'button';
  btnOk.className = 'h-9 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-sm text-white';
  btnOk.textContent = 'Valider';
  actions.append(btnCancel, btnOk);
  body.append(info, fieldHandle, fieldCountry, fieldPath, actions);
  panel.append(header, body);
  center.appendChild(panel);
  wrapper.append(overlay, center);
  document.body.appendChild(wrapper);

  let currentPlatform = null;
  let submitCb = null;

  function open(platform, cb) {
    currentPlatform = platform;
    submitCb = cb;
    titleEl.textContent = `Plateforme — ${platform?.name || ''}`;
    info.textContent = platform?.pattern || '';
    fieldHandle.value = '';
    fieldCountry.value = '';
    fieldPath.value = '';
    if (platform?.id === 'apple-music' || platform?.id === 'apple-podcasts') {
      fieldHandle.classList.add('hidden');
      fieldCountry.classList.remove('hidden');
      fieldPath.classList.remove('hidden');
    } else {
      fieldHandle.classList.remove('hidden');
      fieldCountry.classList.add('hidden');
      fieldPath.classList.add('hidden');
    }
    wrapper.classList.remove('hidden');
    fieldHandle.focus();
  }

  function close() {
    wrapper.classList.add('hidden');
    currentPlatform = null;
    submitCb = null;
  }

  btnCancel.addEventListener('click', () => close());
  overlay.addEventListener('click', () => close());
  closeBtn.addEventListener('click', () => close());
  btnOk.addEventListener('click', () => {
    if (!submitCb || !currentPlatform) { close(); return; }
    const payload = {
      handle: fieldHandle.value.trim(),
      country: fieldCountry.value.trim(),
      path: fieldPath.value.trim(),
    };
    try { submitCb(payload); } catch { }
    close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !wrapper.classList.contains('hidden')) close(); });

  platformEntryModal = { open, close };
  return platformEntryModal;
}

export function openPlatformEntryModal(platform, cb) {
  const m = ensurePlatformEntryModal();
  m.open(platform, cb);
}

export function getPickerContext() {
  return { pickerGrid, openPicker, closePicker };
}

