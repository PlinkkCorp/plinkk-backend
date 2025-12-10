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
  let dragging = false;
  let ghost = null;
  let placeholder = null;
  let startRect = null;
  let startIndex = -1;
  let targetIndex = -1;
  let offsetX = 0;
  let offsetY = 0;
  let prevUserSelect = '';

  const isDraggableRow = (el) => !!(el && el.dataset && el.dataset.dragIndex !== undefined && el.dataset.dragIndex !== null);

  function createPlaceholder(height) {
    const p = document.createElement('div');
    p.style.height = `${height}px`;
    p.style.border = '1px dashed rgba(148,163,184,0.35)';
    p.style.borderRadius = '8px';
    p.style.margin = '6px 0';
    p.style.background = 'rgba(30,41,59,0.25)';
    p.setAttribute('aria-hidden', 'true');
    return p;
  }

  function cleanup() {
    dragging = false;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
    ghost = null;
    if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    placeholder = null;
    if (rowEl) rowEl.style.display = '';
    if (prevUserSelect !== '') {
      document.body.style.userSelect = prevUserSelect;
    }
  }

  function onPointerDown(e) {
    if (dragging) return;
    e.preventDefault();
    e.stopPropagation();

    dragging = true;
    startRect = rowEl.getBoundingClientRect();
    offsetX = e.clientX - startRect.left;
    offsetY = e.clientY - startRect.top;
    prevUserSelect = document.body.style.userSelect || '';
    document.body.style.userSelect = 'none';

    ghost = rowEl.cloneNode(true);
    ghost.style.position = 'fixed';
    ghost.style.left = `${startRect.left}px`;
    ghost.style.top = `${startRect.top}px`;
    ghost.style.width = `${startRect.width}px`;
    ghost.style.boxSizing = 'border-box';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.transform = 'translateZ(0)';
    ghost.style.willChange = 'transform, top, left';
    ghost.style.boxShadow = '0 8px 30px rgba(2,6,23,0.55)';
    ghost.style.opacity = '0.98';
    ghost.style.border = '1px solid rgba(99,102,241,0.45)';
    ghost.style.background = 'rgba(15,23,42,0.96)';
    document.body.appendChild(ghost);

    placeholder = createPlaceholder(startRect.height);
    const parent = rowEl.parentNode;
    parent.insertBefore(placeholder, rowEl);
    rowEl.style.display = 'none';

    startIndex = Number(rowEl.dataset.dragIndex || '-1');
    targetIndex = startIndex;

    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp, { passive: false });
    document.addEventListener('pointercancel', onPointerUp, { passive: false });
  }

  function onPointerMove(e) {
    if (!dragging) return;
    e.preventDefault();
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    if (ghost) {
      ghost.style.left = `${x}px`;
      ghost.style.top = `${y}px`;
    }

    const rows = Array.from(containerEl.children).filter((c) => c !== ghost && c !== placeholder && isDraggableRow(c));
    const ghostMidY = y + startRect.height / 2;
    let newIndex = rows.length; 
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (ghostMidY < mid) { newIndex = i; break; }
    }
    const currentIndex = Array.from(containerEl.children).indexOf(placeholder);
    const desiredEl = rows[newIndex];
    if (desiredEl && containerEl.contains(desiredEl)) {
      if (currentIndex > -1) containerEl.insertBefore(placeholder, desiredEl);
    } else {
      containerEl.appendChild(placeholder);
    }
    targetIndex = newIndex;
  }

  function onPointerUp(e) {
    if (!dragging) return;
    e.preventDefault();
    let desiredIndex = Math.max(0, Math.min(targetIndex, itemsArray.length));
    const originalIdx = Number(rowEl.dataset.dragIndex || '-1');

    cleanup();

    if (originalIdx >= 0 && originalIdx < itemsArray.length && desiredIndex !== originalIdx) {
      const item = itemsArray.splice(originalIdx, 1)[0];
      if (originalIdx < desiredIndex) desiredIndex -= 1;
      const finalIndex = Math.max(0, Math.min(desiredIndex, itemsArray.length));
      itemsArray.splice(finalIndex, 0, item);
      renderFn(itemsArray);
      scheduleAutoSave();
    } else {
      renderFn(itemsArray);
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
