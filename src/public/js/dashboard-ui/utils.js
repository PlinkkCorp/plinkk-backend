// Utils for Dashboard UI
export const qs = (s, r = document) => r.querySelector(s);
export const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

export function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v);
  }
  children.forEach((c) => e.appendChild(c));
  return e;
}

export function srOnly(text) {
  return el('span', { class: 'sr-only', text });
}

export function trashButton(onClick, title = 'Supprimer') {
  const btn = el('button', {
    class:
      'h-9 w-9 inline-flex items-center justify-center rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 ml-auto justify-self-end self-center shrink-0',
    title,
    type: 'button',
    'aria-label': title,
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
  path.setAttribute(
    'd',
    'M6 7h12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7M10 11v6m4-6v6'
  );

  svg.appendChild(path);
  btn.append(svg, srOnly(title));
  btn.addEventListener('click', onClick);
  return btn;
}

export function createGripSVG(size = 20) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  svg.style.display = 'block';
  svg.style.opacity = '0.9';
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('fill', 'currentColor');
  const r = 2;
  const coords = [4, 10, 16];
  coords.forEach((y) => {
    [6, 14].forEach((x) => {
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', String(x));
      c.setAttribute('cy', String(y));
      c.setAttribute('r', String(r));
      g.appendChild(c);
    });
  });
  svg.appendChild(g);
  return svg;
}

export function enableDragHandle(handleEl, rowEl, containerEl, itemsArray, renderFn, scheduleAutoSave = () => {}) {
  let pointerId = null;
  let ghost = null;
  let placeholder = null;
  let offsetX = 0;
  let offsetY = 0;

  function createPlaceholder(h) {
    const p = document.createElement('div');
    p.style.height = `${h}px`;
    p.style.background = 'rgba(255,255,255,0.02)';
    p.style.border = '1px dashed rgba(255,255,255,0.03)';
    p.style.borderRadius = '6px';
    p.style.margin = '4px 0';
    return p;
  }

  function onPointerDown(e) {
    if (pointerId !== null) return;
    e.preventDefault();
    const p = e.pointerId || 'mouse';
    pointerId = p;
    rowEl.setPointerCapture && rowEl.setPointerCapture(pointerId);
    const rect = rowEl.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    ghost = rowEl.cloneNode(true);
    ghost.style.position = 'fixed';
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.boxSizing = 'border-box';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.transform = 'translateZ(0) scale(1.02)';
    ghost.style.transition = 'transform 120ms ease, box-shadow 120ms ease';
    ghost.style.boxShadow = '0 8px 30px rgba(2,6,23,0.6)';
    ghost.style.opacity = '0.98';
    document.body.appendChild(ghost);

    const ph = createPlaceholder(rect.height);
    placeholder = ph;
    rowEl.parentNode.insertBefore(ph, rowEl);
    rowEl.style.display = 'none';

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  }

  function onPointerMove(e) {
    if (pointerId === null) return;
    e.preventDefault();
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    if (ghost) {
      ghost.style.left = `${x}px`;
      ghost.style.top = `${y}px`;
    }

  // Consider only elements that are draggable (have a data-drag-index) to compute insertion point
  const children = Array.from(containerEl.children).filter((c) => c !== ghost && c !== placeholder && c.dataset && c.dataset.dragIndex !== undefined && c.dataset.dragIndex !== null);
    let inserted = false;
    for (const child of children) {
      const r = child.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (e.clientY < mid) {
        if (containerEl.contains(placeholder)) containerEl.insertBefore(placeholder, child);
        else containerEl.insertBefore(placeholder, child);
        inserted = true;
        break;
      }
    }
    if (!inserted) containerEl.appendChild(placeholder);
  }

  function onPointerUp(e) {
    if (pointerId === null) return;
    try {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    } catch {}
    pointerId = null;

  // Use the same filtering as onPointerMove: only draggable rows matter for final index
  const all = Array.from(containerEl.children);
  const filtered = all.filter((c) => c !== rowEl && c.dataset && c.dataset.dragIndex !== undefined && c.dataset.dragIndex !== null);
  let insertAt = filtered.indexOf(placeholder);
    if (insertAt === -1) {
      insertAt = filtered.findIndex((c) => c.getBoundingClientRect().top > e.clientY);
      if (insertAt === -1) insertAt = filtered.length;
    }

    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
    if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    rowEl.style.display = '';

    const originalIdx = Number(rowEl.dataset.dragIndex || '-1');
    if (originalIdx >= 0 && originalIdx < itemsArray.length) {
      const item = itemsArray.splice(originalIdx, 1)[0];
      const finalIndex = Math.max(0, Math.min(insertAt, itemsArray.length));
      itemsArray.splice(finalIndex, 0, item);
      renderFn(itemsArray);
      scheduleAutoSave();
    }
  }

  handleEl.addEventListener('pointerdown', onPointerDown);
}

export function attachAutoSave(el, scheduleAutoSave) {
  if (!el) return;
  const tag = (el.tagName || '').toUpperCase();
  const type = (el.type || '').toLowerCase();
  const isChange = tag === 'SELECT' || type === 'checkbox' || type === 'color' || type === 'number';
  el.addEventListener(isChange ? 'change' : 'input', scheduleAutoSave);
}

export function isUrlish(v) {
  if (!v || typeof v !== 'string') return false;
  const s = v.trim();
  return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/') || s.startsWith('data:');
}

export function fillSelect(selectEl, items, getLabel) {
  if (!selectEl) return;
  const current = selectEl.value;
  selectEl.innerHTML = '';
  items.forEach((item, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = getLabel(item, idx);
    selectEl.appendChild(opt);
  });
  if (current !== '' && selectEl.querySelector(`option[value="${current}"]`)) {
    selectEl.value = current;
  }
}

export function vOrNull(v) { return v === '' ? null : v; }
export function numOrNull(v) { const n = Number(v); return isNaN(n) ? null : n; }
