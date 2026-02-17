export class UIUtils {
    constructor() {
        this.LS_PREFIX = 'PLK_MASK:';
        this.plinkkId = window.__PLINKK_SELECTED_ID__ || 'default';
        this.userId = window.__PLINKK_USER_ID__ || 'self';
    }

    init() {
        this.initMaskableInputs();
        this.initDegreeDial();
        this.initUploads();
    }

    getKey(inputId) { return `${this.LS_PREFIX}${this.userId}:${this.plinkkId}:${inputId}`; }

    lsGet(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
    lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { } }
    lsDel(key) { try { localStorage.removeItem(key); } catch { } }

    initMaskableInputs() {
        const buttons = Array.from(document.querySelectorAll('.mask-toggle'));
        buttons.forEach(btn => {
            const targetId = btn.getAttribute('data-target');
            if (!targetId) return;
            const input = document.getElementById(targetId);
            if (!input) return;

            const key = this.getKey(targetId);
            const saved = this.lsGet(key);
            this.applyMaskedState(input, btn, saved);

            btn.addEventListener('click', () => {
                const currentlyMasked = btn.getAttribute('aria-pressed') === 'true';
                if (!currentlyMasked) {
                    const value = input.value ?? '';
                    this.lsSet(key, { masked: true, value });
                    this.applyMaskedState(input, btn, { masked: true, value });
                } else {
                    this.lsDel(key);
                    this.applyMaskedState(input, btn, { masked: false });
                }
                if (window.__DASH_TRIGGER_SAVE__) window.__DASH_TRIGGER_SAVE__();
            });
        });
        document.addEventListener('click', (e) => {
            const saveBtn = e.target.closest && e.target.closest('#saveBtn, #saveBtn--mobile, #saveBtn--fab');
            if (saveBtn) this.clearMaskedValues();
        }, true);
    }

    applyMaskedState(input, btn, saved) {
        if (!input || !btn) return;
        const isMasked = !!(saved && saved.masked);

        btn.setAttribute('title', 'Masquer / afficher le champ');
        btn.setAttribute('aria-pressed', isMasked ? 'true' : 'false');

        if (isMasked) {
            if (saved && typeof saved.value !== 'undefined') input.value = saved.value;
            input.dataset._originalValue = input.value ?? '';
            input.readOnly = true;
            input.disabled = true;
            input.classList.add('masked-field');
            btn.innerHTML = `<svg class="icon-eye-off" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a20.81 20.81 0 0 1 5.06-6.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.82 20.82 0 0 1-4.87 6.82M1 1l22 22"/></svg>`;
        } else {
            if (typeof input.dataset._originalValue !== 'undefined') {
                input.value = input.dataset._originalValue;
                delete input.dataset._originalValue;
            }
            input.readOnly = false;
            input.disabled = false;
            input.classList.remove('masked-field');
            btn.innerHTML = `<svg class="icon-eye" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        }
    }

    clearMaskedValues() {
        document.querySelectorAll('[data-maskable]').forEach(inp => {
            const key = this.getKey(inp.id);
            const saved = this.lsGet(key);
            const isMasked = (typeof inp.dataset._originalValue !== 'undefined') || inp.classList.contains('masked-field') || (saved && saved.masked);
            if (isMasked) inp.value = '';
        });
    }

    initDegreeDial() {
        const input = document.getElementById('degBackgroundColor');
        const dial = document.getElementById('degDial');
        const dot = dial ? dial.querySelector('.deg-dial-dot') : null;
        if (!input || !dial || !dot) return;

        const clampDeg = (n) => { n = Math.round(Number(n) || 0); n %= 360; if (n < 0) n += 360; return n; };
        const setAria = (val) => dial.setAttribute('aria-valuenow', String(val));
        const setDot = (val) => { dot.style.transform = `translate(-50%, -50%) rotate(${val - 90}deg) translate(26px, 0)`; };
        const syncFromInput = () => { const v = clampDeg(input.value); setDot(v); setAria(v); };
        const syncFromDeg = (val) => {
            const v = clampDeg(val);
            input.value = String(v);
            setDot(v);
            setAria(v);
            if (window.__DASH_TRIGGER_SAVE__) window.__DASH_TRIGGER_SAVE__();
        };

        setTimeout(syncFromInput, 0);
        input.addEventListener('input', () => syncFromInput());
        input.addEventListener('change', () => { if (window.__DASH_TRIGGER_SAVE__) window.__DASH_TRIGGER_SAVE__(); });

        const posToDeg = (clientX, clientY) => {
            const rect = dial.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = clientX - cx;
            const dy = clientY - cy;
            let angle = Math.atan2(dy, dx) * 180 / Math.PI;
            return Math.round((angle + 360 + 90) % 360);
        };

        let dragging = false;
        const onPointerMove = (e) => {
            if (!dragging) return;
            const pt = e.touches?.[0] || e;
            syncFromDeg(posToDeg(pt.clientX, pt.clientY));
            e.preventDefault();
        };
        const onPointerUp = () => {
            dragging = false;
            dial.classList.remove('is-dragging');
            window.removeEventListener('mousemove', onPointerMove);
            window.removeEventListener('mouseup', onPointerUp);
            window.removeEventListener('touchmove', onPointerMove);
            window.removeEventListener('touchend', onPointerUp);
        };
        const startDrag = (e) => {
            e.preventDefault();
            dragging = true;
            dial.classList.add('is-dragging');
            const pt = e.touches?.[0] || e;
            syncFromDeg(posToDeg(pt.clientX, pt.clientY));
            window.addEventListener('mousemove', onPointerMove, { passive: false });
            window.addEventListener('mouseup', onPointerUp);
            window.addEventListener('touchmove', onPointerMove, { passive: false });
            window.addEventListener('touchend', onPointerUp);
            dial.focus();
        };

        dial.addEventListener('mousedown', startDrag);
        dial.addEventListener('touchstart', startDrag, { passive: false });
    }

    initUploads() {
        document.querySelectorAll('.upload-btn[data-upload-for]').forEach(btn => {
            const targetId = btn.getAttribute('data-upload-for');
            const field = btn.getAttribute('data-field');
            const fileInput = document.getElementById('upload' + targetId.charAt(0).toUpperCase() + targetId.slice(1));
            const urlInput = document.getElementById(targetId);
            if (!fileInput || !urlInput) return;

            btn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', () => {
                const file = fileInput.files[0];
                if (!file) return;

                const originalHTML = btn.innerHTML;
                btn.disabled = true;
                btn.classList.add('opacity-60');
                btn.innerHTML = '<svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="15"/></svg>';

                const formData = new FormData();
                formData.append('file', file);

                const resetBtn = () => {
                    btn.disabled = false;
                    btn.classList.remove('opacity-60');
                    fileInput.value = '';
                };

                const showSuccess = () => {
                    btn.innerHTML = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
                    btn.classList.replace('bg-violet-600', 'bg-emerald-600');
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.classList.replace('bg-emerald-600', 'bg-violet-600');
                    }, 1500);
                };

                const showError = (err) => {
                    console.error('Upload error:', err);
                    btn.innerHTML = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
                    btn.classList.replace('bg-violet-600', 'bg-red-600');
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.classList.replace('bg-red-600', 'bg-violet-600');
                    }, 2000);
                };

                fetch('/api/me/upload?field=' + encodeURIComponent(field), { method: 'POST', body: formData })
                    .then(res => res.json())
                    .then(data => {
                        if (data.ok && data.url) {
                            urlInput.value = data.url;
                            urlInput.dispatchEvent(new Event('input', { bubbles: true }));
                            showSuccess();
                        } else showError(data.error);
                        resetBtn();
                    })
                    .catch(err => { showError(err); resetBtn(); });
            });
        });
    }
}

export const uiUtils = new UIUtils();
