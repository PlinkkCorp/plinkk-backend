import { qs } from './utils.js';

let canvasPreviewModal = null;
let canvasPreviewFrame = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function renderCanvasInto(container, item) {
  if (!container || !item) return;
  // Reset container
  container.innerHTML = '';
  container.style.position = 'relative';
  container.style.background = '#0b1220';
  container.style.overflow = 'hidden';
  // Maintain aspect ratio via parent style already set
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  // Resize to client size
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  try {
    // Load external libs first (if any)
    const ext = item?.extension;
    if (Array.isArray(ext)) {
      for (const e of ext) await loadScript(e);
    } else if (typeof ext === 'string' && ext && ext !== 'none') {
      await loadScript(ext);
    }
    // Special-case matrix which depends on two extra local files
    if (item?.fileNames === 'matrix-effect/app.js') {
      await loadScript('/public/canvaAnimation/matrix-effect/effect.js');
      await loadScript('/public/canvaAnimation/matrix-effect/symbol.js');
    }
    // Load the animation file itself
    await loadScript(`/public/canvaAnimation/${item?.fileNames}`);
    if (typeof window.runCanvasAnimation === 'function') {
      window.runCanvasAnimation(ctx, canvas);
    } else {
      console.error('runCanvasAnimation not found');
    }
  } catch (err) {
    console.error('Inline canvas preview error', err);
  }
}

export function ensureCanvasPreviewModal() {
  if (canvasPreviewModal && canvasPreviewFrame) return canvasPreviewModal;
  const wrapper = document.createElement('div');
  wrapper.id = 'canvasPreviewModal';
  wrapper.className = 'fixed inset-0 z-[60] hidden';
  const overlay = document.createElement('div');
  overlay.className = 'absolute inset-0 bg-black/60';
  const center = document.createElement('div');
  center.className = 'relative z-[1] mx-auto my-8 w-full max-w-5xl p-0';
  const panel = document.createElement('div');
  panel.className = 'mx-4 rounded border border-slate-800 bg-slate-900 shadow-lg overflow-hidden';
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between px-4 py-2 border-b border-slate-800';
  const titleEl = document.createElement('div');
  titleEl.className = 'text-sm text-slate-300';
  titleEl.textContent = 'Aperçu du canvas';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'h-8 w-8 inline-flex items-center justify-center rounded bg-slate-800 border border-slate-700 hover:bg-slate-700';
  closeBtn.setAttribute('aria-label', 'Fermer');
  closeBtn.innerHTML = '<svg class="h-4 w-4 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  header.append(titleEl, closeBtn);
  const body = document.createElement('div');
  body.className = 'w-full';
  const aspect = document.createElement('div');
  aspect.className = 'aspect-video w-full';
  const iframe = document.createElement('iframe');
  iframe.className = 'w-full h-full block';
  iframe.src = 'about:blank';
  aspect.appendChild(iframe);
  body.appendChild(aspect);
  panel.append(header, body);
  center.appendChild(panel);
  wrapper.append(overlay, center);
  document.body.appendChild(wrapper);

  canvasPreviewModal = wrapper;
  canvasPreviewFrame = iframe;
  const close = () => {
    if (!canvasPreviewModal) return;
    canvasPreviewModal.classList.add('hidden');
    if (canvasPreviewFrame) canvasPreviewFrame.src = 'about:blank';
  };
  overlay.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && canvasPreviewModal && !canvasPreviewModal.classList.contains('hidden')) close();
  });
  return canvasPreviewModal;
}

export function openCanvasInlinePreview(url) {
  const modal = ensureCanvasPreviewModal();
  if (!modal || !canvasPreviewFrame) return;
  canvasPreviewFrame.src = url;
  modal.classList.remove('hidden');
}

export function buildCanvasPreviewUrl(item) {
  const base = '/public/html/canva-preview.html';
  const file = item?.fileNames || '';
  const params = new URLSearchParams();
  params.set('file', file);
  const ext = item?.extension;
  if (Array.isArray(ext)) ext.forEach((e) => params.append('ext', e));
  else if (typeof ext === 'string' && ext && ext !== 'none') params.append('ext', ext);
  return `${base}?${params.toString()}`;
}

export function refreshSelectedCanvasPreview({ cfg, canvaEnableEl, selectedCanvasIndexEl, selectedCanvasPreviewOverlay, selectedCanvasPreviewFrame, canvasPreviewEnable }) {
  const canvases = cfg.canvaData || [];
  const idx = Math.max(0, Math.min(Number(selectedCanvasIndexEl?.value || 0), canvases.length - 1));
  const item = canvases[idx];
  const enabled = !!canvaEnableEl?.checked;
  if (selectedCanvasPreviewOverlay) selectedCanvasPreviewOverlay.classList.toggle('hidden', enabled);
  if (!selectedCanvasPreviewFrame || !item) return;
  const previewOn = !!canvasPreviewEnable?.checked;
  if (!enabled || !previewOn) {
    // Clear any previous inline/iframe preview
    if (selectedCanvasPreviewFrame.tagName === 'IFRAME') {
      selectedCanvasPreviewFrame.src = 'about:blank';
    } else {
      selectedCanvasPreviewFrame.innerHTML = '';
    }
    return;
  }
  // If target is an iframe, keep using the simpler URL-based preview
  if (selectedCanvasPreviewFrame.tagName === 'IFRAME') {
    selectedCanvasPreviewFrame.src = buildCanvasPreviewUrl(item);
  } else {
    // Inline render inside the div container
    renderCanvasInto(selectedCanvasPreviewFrame, item);
  }
}

export function renderCanvasCard(item, idx, onSelect) {
  const card = document.createElement('button');
  card.setAttribute('type', 'button');
  card.className = 'p-3 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-left';
  const title = document.createElement('div');
  title.className = 'font-medium';
  title.textContent = `#${idx} · ${item?.animationName || 'Canvas'}`;
  const small = document.createElement('div');
  small.className = 'text-xs text-slate-400';
  small.textContent = item?.fileNames ? String(item.fileNames) : '';
  const actions = document.createElement('div');
  actions.className = 'mt-2 flex items-center gap-2';
  const previewBtn = document.createElement('button');
  previewBtn.type = 'button';
  previewBtn.className = 'h-8 px-3 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm';
  previewBtn.textContent = 'Aperçu';
  previewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const url = buildCanvasPreviewUrl(item);
    openCanvasInlinePreview(url);
  });
  actions.appendChild(previewBtn);
  card.append(title, small, actions);
  card.addEventListener('click', () => { onSelect?.(idx); });
  return card;
}
