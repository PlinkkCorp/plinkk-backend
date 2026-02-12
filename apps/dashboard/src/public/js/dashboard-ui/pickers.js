import { qs, el } from './utils.js';

/* --- MD5 Helper (Compact) --- */
const md5=function(d){var r = M(V(Y(X(d),8*d.length)));return r.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;m=md5_ii(m=md5_ii(m=md5_ii(m=md5_ii(m=md5_hh(m=md5_hh(m=md5_hh(m=md5_hh(m=md5_gg(m=md5_gg(m=md5_gg(m=md5_gg(m=md5_ff(m=md5_ff(m=md5_ff(m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,i,d[n+1],12,-389564586),f,r,i,d[n+2],17,606105819),f,r,i,d[n+3],22,-1044525330),f,r,i,d[n+4],7,-176418897),f,r,i,d[n+5],12,1200080426),f,r,i,d[n+6],17,-1473231341),f,r,i,d[n+7],22,-45705983),f,r,i,d[n+8],7,1770035416),f,r,i,d[n+9],12,-1958414417),f,r,i,d[n+10],17,-42063),f,r,i,d[n+11],22,-1990404162),f,r,i,d[n+12],7,1804112418),f,r,i,d[n+13],12,-40341101),f,r,i,d[n+14],17,-1502002290),f,r,i,d[n+15],22,1236535329),f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r,i,m,d[n+1],5,-165796510),r,i,m,d[n+6],9,-1069501632),r,i,m,d[n+11],14,643717713),r,i,m,d[n+0],20,-378558),r,i,m,d[n+5],5,-2015044628),r,i,m,d[n+10],9,-849768060),r,i,m,d[n+15],14,-1019803690),r,i,m,d[n+4],20,-16711735),r,i,m,d[n+9],5,-155497632),r,i,m,d[n+14],9,-153205933),r,i,m,d[n+3],14,-1094766093),r,i,m,d[n+8],20,1126891415),r,i,m,d[n+5],4,-378558),r,i,m,d[n+8],11,-2022574463),r,i,m,d[n+11],16,1839030562),r,i,m,d[n+14],23,-35309556),i=md5_ii(i=md5_ii(i=md5_ii(i=md5_ii(i=md5_hh(i=md5_hh(i=md5_hh(i=md5_hh(i=md5_gg(i=md5_gg(i=md5_gg(i=md5_gg(i=md5_ff(i=md5_ff(i=md5_ff(i=md5_ff(i,m,f,r,d[n+0],6,-198630844),m,f,r,d[n+7],10,1126891415),m,f,r,d[n+14],15,-1416354905),m,f,r,d[n+5],21,-57434055),m,f,r,d[n+12],6,1700485571),m,f,r,d[n+3],10,-1894986606),m,f,r,d[n+10],15,-1051523),m,f,r,d[n+1],21,-2054922799),m,f,r,d[n+8],6,1873313359),m,f,r,d[n+15],10,-30611744),m,f,r,d[n+6],15,-1560198380),m,f,r,d[n+13],21,1309151649),m,f,r,d[n+4],6,-145523070),m,f,r,d[n+11],10,-1120210379),m,f,r,d[n+2],15,718787259),m,f,r,d[n+9],21,-343485551),m=AddUnsigned(m,h),f=AddUnsigned(f,t),r=AddUnsigned(r,g),i=AddUnsigned(i,e)}return M(m)+M(f)+M(r)+M(i)}function md5_cmn(d,_,m,f,r,i){return AddUnsigned(BitRotateLeft(AddUnsigned(AddUnsigned(_,d),AddUnsigned(f,i)),m),r)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function BitRotateLeft(d,_){return d<<_|d>>>32-_}function AddUnsigned(lX,lY){var lX4,lY4,lX8,lY8,lResult;lX8=(lX&0x80000000);lY8=(lY&0x80000000);lX4=(lX&0x40000000);lY4=(lY&0x40000000);lResult=(lX&0x3FFFFFFF)+(lY&0x3FFFFFFF);if(lX4&lY4)return(lResult^0x80000000^lX8^lY8);if(lX4|lY4){if(lResult&0x40000000)return(lResult^0xC0000000^lX8^lY8);else return(lResult^0x40000000^lX8^lY8)}else return(lResult^lX8^lY8)}

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

// Expose a small helper to allow server-rendered upload buttons to trigger selection
try {
  if (typeof window !== 'undefined') {
    window.__DASH_PICKERS__ = window.__DASH_PICKERS__ || {};
    window.__DASH_PICKERS__.iconSelect = (v) => {
      try { if (iconSelectCallback) iconSelectCallback(v); } catch (e) {}
      try { closeIconModal(); } catch (e) {}
    };
  }
} catch (e) {}

function switchTab(tabName) {
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
    if (tabName === 'gravatar') updateGravatar();
}

function setupTabs() {
    document.querySelectorAll('.icon-tab-btn').forEach(btn => {
        btn.onclick = () => switchTab(btn.dataset.tab);
    });
}

function updateGravatar() {
    const emailInput = document.getElementById('email');
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    if (gravatarEmail) gravatarEmail.textContent = email || 'aucun email';
    
    if (email) {
        const hash = md5(email);
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

async function ensureUserUploads() {
    try {
        const res = await fetch('/api/me/uploads' + (currentTargetField ? `?field=${currentTargetField}` : ''));
        if (!res.ok) return [];
        const data = await res.json();
        return data.uploads || [];
    } catch (e) {
        return [];
    }
}

async function populateUploadsGrid(filter) {
    if (!uploadsGrid) return;
    uploadsGrid.innerHTML = '<div class="col-span-full py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3"><svg class="size-8 animate-spin text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="40"/></svg>Chargement...</div>';
    
    const uploads = await ensureUserUploads();
    uploadsGrid.innerHTML = '';
    
    if (!uploads.length) {
        uploadsGrid.innerHTML = '<div class="col-span-full text-center text-slate-500 py-8">Aucune image importée reçemment.</div>';
        return;
    }
    
    const term = (filter || '').toLowerCase();
    
    const filtered = uploads.filter(u => {
        return !term || (u.name && u.name.toLowerCase().includes(term));
    });
    
    if (!filtered.length && term) {
        uploadsGrid.innerHTML = '<div class="col-span-full text-center text-slate-500 py-8">Aucun résultat.</div>';
        return;
    }

    filtered.forEach(u => {
        const name = u.name ? u.name.replace(/\.[^/.]+$/, "") : 'Image';
        
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'p-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-violet-500/50 transition-all flex flex-col items-center justify-center gap-3 group relative';
        
        const img = document.createElement('img');
        img.src = u.url;
        img.alt = name;
        img.className = 'h-16 w-16 object-contain rounded-lg bg-slate-900/50';
        
        const span = document.createElement('span');
        span.className = 'text-xs text-slate-400 group-hover:text-white truncate max-w-full block text-center opacity-80 group-hover:opacity-100 transition-opacity px-2';
        span.textContent = name;
        
        btn.append(img, span);
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
             // Try to find the input relative to targetId
            if (!targetId) return;
            const cap = targetId.charAt(0).toUpperCase() + targetId.slice(1);
            const fileInput = document.getElementById(`upload${cap}`);
            if (fileInput) {
                fileInput.click();
                const urlInput = document.getElementById(targetId);
                if (urlInput) {
                    const onUpdate = () => {
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
  iconGrid.innerHTML = '<div class="col-span-full py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3"><svg class="size-8 animate-spin text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="40"/></svg>Chargement...</div>';
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
      const img = document.createElement('img');
      img.src = i.url || `https://s3.marvideo.fr/plinkk-image/icons/${i.slug}.svg`;
      img.alt = i.displayName;
      img.className = 'h-10 w-10 object-contain drop-shadow-sm';
      const label = document.createElement('div');
      label.className = 'text-xs text-slate-400 group-hover:text-white text-center truncate max-w-full';
      label.textContent = i.displayName;
      card.append(img, label);
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
