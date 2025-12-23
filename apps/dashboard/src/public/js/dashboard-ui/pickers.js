import { qs, el } from './utils.js';

const iconModal = qs('#iconModal');
const iconModalClose = qs('#iconModalClose');
const iconSearch = qs('#iconSearch');
const iconGrid = qs('#iconGrid');
let iconCatalog = [];
let iconSelectCallback = null;

async function ensureIconCatalog() {
  if (iconCatalog.length) return iconCatalog;
  const res = await fetch('/api/icons');
  if (!res.ok) throw new Error(await res.text());
  iconCatalog = await res.json();
  return iconCatalog;
}

export function openIconModal(onSelect) {
  iconSelectCallback = onSelect;
  iconModal.classList.remove('hidden');
  populateIconGrid(iconSearch.value || '');
}

export function closeIconModal() {
  iconModal.classList.add('hidden');
  iconSelectCallback = null;
}

export async function populateIconGrid(filterText) {
  await ensureIconCatalog();
  const term = (filterText || '').toLowerCase();
  iconGrid.innerHTML = '';
  iconCatalog
    .filter((i) => !term || i.displayName.toLowerCase().includes(term) || i.slug.includes(term))
    .forEach((i) => {
      const card = document.createElement('button');
      card.setAttribute('type', 'button');
      card.className = 'p-3 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 flex flex-col items-center gap-2';
      const img = document.createElement('img');
      img.src = `https://s3.marvideo.fr/plinkk-image/icons/${i.slug}.svg`;
      img.alt = i.displayName;
      img.className = 'h-10 w-10 object-contain';
      const label = document.createElement('div');
      label.className = 'text-xs text-slate-300 text-center';
      label.textContent = i.displayName;
      card.append(img, label);
      card.addEventListener('click', () => {
        if (iconSelectCallback) iconSelectCallback(i.slug);
        closeIconModal();
      });
      iconGrid.appendChild(card);
    });
}

iconModalClose?.addEventListener('click', closeIconModal);
const iconOverlay = iconModal?.firstElementChild;
iconOverlay?.addEventListener('click', closeIconModal);
iconModal?.addEventListener('click', (e) => { if (e.target === iconModal) closeIconModal(); });
iconSearch?.addEventListener('input', () => populateIconGrid(iconSearch.value));

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
  const img = document.createElement('img');
  const iconUrl = (item.icon || '') //.replace('{{username}}', `/${window.__PLINKK_USER_ID__}`);
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
    try { submitCb(payload); } catch {}
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
