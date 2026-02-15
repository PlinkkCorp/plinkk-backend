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

export function enableDragHandle(handleEl, rowEl, containerEl, itemsArray, renderFn, scheduleAutoSave = () => { }) {
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
    if (handleEl) {
      handleEl.removeEventListener('pointermove', onPointerMove);
      handleEl.removeEventListener('pointerup', onPointerUp);
      handleEl.removeEventListener('pointercancel', onPointerUp);
    }
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
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    e.stopPropagation();

    dragging = true;
    startRect = rowEl.getBoundingClientRect();
    offsetX = e.clientX - startRect.left;
    offsetY = e.clientY - startRect.top;
    prevUserSelect = document.body.style.userSelect || '';
    document.body.style.userSelect = 'none';

    handleEl.setPointerCapture(e.pointerId);
    handleEl.addEventListener('pointermove', onPointerMove);
    handleEl.addEventListener('pointerup', onPointerUp);
    handleEl.addEventListener('pointercancel', onPointerUp);

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

    // ghost height/2 for center
    const ghostMidY = y + startRect.height / 2;

    const rows = Array.from(containerEl.children).filter((c) => c !== ghost && c !== placeholder && isDraggableRow(c));
    let newIndex = rows.length;

    // We can rely on visual position of rows (except rowEl which is hidden)
    // If we skip rowEl (mid=0), newIndex might start higher?
    // Let's stick to simple geometry: find the first row whose CENTER is below ghost center.
    // That means we are ABOVE that row.
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      // If element is hidden (our rowEl), r.height is 0. mid is 0.
      // 0 is usually < ghostMidY (unless dragging at very top).
      // So condition (ghostMidY < 0) matches only if dragged VERY high?
      // Actually usually ghostMidY is positive.
      // So (ghostMidY < 0) is False.
      // So we skip it. This is correct behavior (treat it as "above" us).
      // If we skip it, we continue to check next row.
      const mid = r.top + r.height / 2;
      if (r.height > 0 && ghostMidY < mid) {
        newIndex = i;
        break;
      }
    }

    // Logic check: if rows contains [A, B, C]. A is hidden.
    // i=0 (A): height=0. skip.
    // i=1 (B): valid mid.
    // If ghost < mid(B) -> newIndex = 1.
    // Insert before B.
    // placeholder is inserted before B.
    // Layout: [Placeholder, B, C]. 
    // Wait. A is hidden.
    // DOM: [Placeholder, A(hidden), B, C]. (If inserted before A?)
    // If we call InsertBefore(Placeholder, rows[1]=B).
    // DOM: [A(hidden), Placeholder, B, C].
    // Visually: Placeholder, B, C.
    // Correct.

    const currentIndex = Array.from(containerEl.children).indexOf(placeholder);
    const desiredEl = rows[newIndex];
    if (desiredEl && containerEl.contains(desiredEl)) {
      if (currentIndex > -1 && placeholder !== desiredEl) {
        containerEl.insertBefore(placeholder, desiredEl);
      }
    } else {
      containerEl.appendChild(placeholder);
    }
    targetIndex = newIndex;
  }

  function onPointerUp(e) {
    if (!dragging) return;
    e.preventDefault();

    // release capture implicit
    // handleEl.releasePointerCapture(e.pointerId);

    let desiredIndex = Math.max(0, Math.min(targetIndex, itemsArray.length));
    const originalIdx = Number(rowEl.dataset.dragIndex || '-1');

    cleanup();

    if (originalIdx >= 0 && originalIdx < itemsArray.length) {
      // Adjustment logic:
      // If we moved item DOWN (original < desired), we shifted subsequent items UP.
      // The desiredIndex (from rows) assumes strictly "insert at this index in the condensed list".
      // Example: [A, B, C]. Move A to after B.
      // rows=[A, B, C]. A hidden.
      // ghost below B.
      // i=0(A) skip. i=1(B) skip. i=2(C). ghost < mid(C).
      // newIndex = 2.
      // targetIndex = 2.
      // desiredIndex = 2.
      // Remove A (0). List [B, C].
      // Insert at 2? [B, C, A].
      // Wait. A was at 0. B at 1. C at 2.
      // If we insert at 2, we get [B, C, A].
      // This means A moved after C.
      // But we were between B and C!
      // If we are between B and C, ghost < mid(C) is TRUE.
      // So newIndex = 2.
      // So insert at 2.
      // [B, C] -> insert at 2 -> [B, C, A].
      // This puts A AFTER C.
      // ERROR.
      // If strictly before C, it should be index 1 in [B, C].
      // In [B, C], B is 0, C is 1.
      // So we want index 1.
      // But newIndex was 2 (index in [A, B, C]).
      // So if original (0) < target (2), we must subtract 1?
      // 2 - 1 = 1.
      // Insert at 1 -> [B, A, C].
      // Correct!

      if (desiredIndex > originalIdx) {
        desiredIndex -= 1;
      }

      if (desiredIndex !== originalIdx) {
        const item = itemsArray.splice(originalIdx, 1)[0];
        itemsArray.splice(desiredIndex, 0, item);
        renderFn(itemsArray);
        scheduleAutoSave();
      } else {
        renderFn(itemsArray);
      }
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

export function getIconClass(src) {
  if (!src) return '';
  const s = src.toLowerCase();
  const isCatalogue = s.includes('s3.marvideo.fr') || s.includes('cdn.plinkk.fr') || s.includes('/icons/');
  const isBootstrap = s.includes('bi-') || s.includes('bootstrap-icons');
  const isJsDelivr = s.includes('cdn.jsdelivr.net');

  if (isCatalogue || isBootstrap) return ' icon-cdn';
  if (isJsDelivr) return ' icon-black-source';
  return '';
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
