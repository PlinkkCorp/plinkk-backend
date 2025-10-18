export function setupStatusDropdown({ elements, scheduleAutoSave }) {
  const { statusDropdown, statusDropdownBtn, statusDropdownPanel, status_statusText } = elements;
  function setStatusButtonVisual(val) {
    if (!statusDropdownBtn) return;
    const dot = statusDropdownBtn.querySelector('span.inline-block.size-2');
    const label = statusDropdownBtn.querySelector('.status-current-label');
    const colorMap = { online: 'bg-emerald-400', busy: 'bg-rose-400', away: 'bg-amber-400', offline: 'bg-slate-400' };
    const textMap = { online: 'En ligne', busy: 'Occupé', away: 'Absent', offline: 'Hors‑ligne' };
    if (dot) dot.className = 'inline-block size-2 rounded-full ' + (colorMap[val] || colorMap.offline);
    if (label) label.textContent = textMap[val] || textMap.offline;
  }
  function applyStatusDropdownFromValue() {
    const val = (status_statusText?.value || 'offline');
    setStatusButtonVisual(val);
  }
  if (statusDropdown && statusDropdownBtn && statusDropdownPanel) {
    const open = () => { statusDropdownPanel.classList.remove('hidden'); statusDropdownBtn.setAttribute('aria-expanded', 'true'); };
    const close = () => { statusDropdownPanel.classList.add('hidden'); statusDropdownBtn.setAttribute('aria-expanded', 'false'); };
    statusDropdownBtn.addEventListener('click', (e) => { e.stopPropagation(); if (statusDropdownPanel.classList.contains('hidden')) open(); else close(); });
    document.addEventListener('click', () => close());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    statusDropdownPanel.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-value]');
      if (!btn) return;
      const val = btn.getAttribute('data-value');
      if (!val) return;
      if (status_statusText) status_statusText.value = val;
      applyStatusDropdownFromValue();
      updateStatusPreview(elements);
      scheduleAutoSave();
      close();
    });
    applyStatusDropdownFromValue();
  }
}

export function updateStatusControlsDisabled({ elements }) {
  const { status_text, statusDropdownBtn, statusDropdownPanel, statusPreviewChip, status_fontTextColor } = elements;
  const hasText = !!(status_text?.value || '').trim();
  if (statusDropdownBtn) {
    statusDropdownBtn.disabled = !hasText;
    statusDropdownBtn.classList.toggle('opacity-50', !hasText);
    statusDropdownBtn.classList.toggle('cursor-not-allowed', !hasText);
  }
  if (statusDropdownPanel && !hasText) {
    statusDropdownPanel.classList.add('hidden');
    statusDropdownBtn?.setAttribute('aria-expanded', 'false');
  }
  if (statusPreviewChip) statusPreviewChip.classList.toggle('opacity-50', !hasText);
  if (status_fontTextColor) {
    status_fontTextColor.disabled = !hasText;
    status_fontTextColor.classList.toggle('opacity-50', !hasText);
    status_fontTextColor.classList.toggle('cursor-not-allowed', !hasText);
  }
}

export function updateStatusPreview({ elements }) {
  const { statusPreviewChip, status_statusText } = elements;
  const chip = statusPreviewChip;
  if (!chip) return;
  const status = (status_statusText?.value || 'offline');
  const map = {
    online: 'border-emerald-700/50 bg-emerald-800/50 text-emerald-50',
    busy: 'border-rose-700/50 bg-rose-800/50 text-rose-50',
    away: 'border-amber-700/50 bg-amber-800/50 text-amber-50',
    offline: 'border-slate-700/50 bg-slate-800/50 text-slate-200',
  };
  chip.className = 'inline-flex items-center gap-1 px-2 py-1 rounded text-xs ' + (map[status] || map.offline);
  const label = { online: 'En ligne', busy: 'Occupé', away: 'Absent', offline: 'Hors‑ligne' }[status] || 'Hors‑ligne';
  chip.textContent = '● ' + label;
}
