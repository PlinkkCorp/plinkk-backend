import { store as state } from './state.js';
import { historyManager } from './history-manager.js';
import { uiUtils } from './ui-utils.js';
import { linkManager } from './link-manager.js';
import { settingsManager } from './settings-manager.js';
import { categoryManager } from './category-manager.js';
import { renderSocial } from './renderers.js';
import { animations, animationBackground } from '../../config/animationConfig.js';
import { canvaData } from '../../config/canvaConfig.js';

class DashboardUI {
  constructor() {
    this.tabs = document.querySelectorAll('.tab-btn');
    this.sections = document.querySelectorAll('[id^="section-"]');
    this.plinkkId = window.__PLINKK_SELECTED_ID__;
    this.saveTimeout = null;
  }

  init() {
    console.log('Dashboard UI Initializing...');

    // Ctrl+S / Cmd+S Handler
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Show saved feedback
        const statusEl = document.getElementById('status');
        if (statusEl) {
          statusEl.textContent = 'Sauvegardé !';
          statusEl.classList.remove('opacity-0');
          setTimeout(() => {
            statusEl.classList.add('opacity-0');
          }, 2000);
        }
        // Optional: Trigger a save if there's a pending state,
        // but since we auto-save on input, this is mostly for UX reassurance.
      }
    });

    // Initialize Sub-Modules
    const initialState = window.__INITIAL_STATE__ || {};
    // Ensure we pass plinkkId if present in state or fallback
    if (!initialState.plinkkId && this.plinkkId) {
      initialState.plinkkId = this.plinkkId;
    }

    state.init(initialState);
    historyManager.init();
    uiUtils.init();
    linkManager.init();
    settingsManager.init();
    categoryManager.init();

    this.initTabs();
    this.initStatusLogic();
    this.initLabelsLogic();
    this.initBackgroundTypeToggles();
    this.initCanvasSelection();
    this.initAnimationModals();
    this.initSocials();
    this.initGeneralPickers();

    if (window.initSortable) {
      this.onTabChange = (targetId) => {
        if (targetId === '#section-links') {
          setTimeout(() => window.initSortable(), 100);
        }
        if (targetId === '#section-history') {
          historyManager.loadHistory();
        }
      };
    }
  }

  initTabs() {
    const handleTabClick = (e) => {
      const btn = e.currentTarget;
      const target = btn.dataset.target;
      this.switchTab(target);
    };

    this.tabs.forEach(btn => btn.addEventListener('click', handleTabClick));

    const hash = location.hash;
    if (hash && document.querySelector(hash)) {
      this.switchTab(hash);
    } else {
      this.switchTab('#section-profile');
    }

    window.addEventListener('popstate', () => {
      if (location.hash) this.switchTab(location.hash);
    });
  }

  switchTab(targetId) {
    this.sections.forEach(s => {
      s.classList.toggle('hidden', `#${s.id}` !== targetId);
    });
    this.tabs.forEach(b => {
      b.setAttribute('aria-selected', b.dataset.target === targetId ? 'true' : 'false');
    });

    if (this.onTabChange) this.onTabChange(targetId);

    if (history.replaceState) {
      history.replaceState(null, '', targetId);
    } else {
      location.hash = targetId;
    }
  }
  initGeneralPickers() {
    const buttons = document.querySelectorAll('.picker-btn[data-picker-for]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-picker-for');
        const input = document.getElementById(targetId);
        if (!input) return;

        const { openIconModal } = window.__DASH_PICKERS__ || {};
        if (openIconModal) {
          openIconModal((url) => {
            input.value = url;
            // Update button visual if it's an emoji picker (e.g. status)
            if (targetId === 'status_emoji') {
              btn.innerText = url;
            }
            // Trigger input event to notify settingsManager and other listeners
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }, targetId);
        }
      });
    });
  }


  initStatusLogic() {
    const showStatus = document.getElementById('showStatus');
    const statusFields = document.getElementById('statusFields');
    const clearStatus = document.getElementById('clearStatus');
    const statusText = document.getElementById('status_text');
    const statusEmoji = document.getElementById('status_emoji');

    if (showStatus) {
      showStatus.addEventListener('change', (e) => {
        if (e.target.checked) {
          statusFields.classList.remove('opacity-50', 'pointer-events-none');
        } else {
          statusFields.classList.add('opacity-50', 'pointer-events-none');
        }
        this.saveSetting('statusVisible', e.target.checked);
      });
    }

    if (clearStatus) {
      clearStatus.addEventListener('click', () => {
        if (statusText) statusText.value = '';
        if (statusEmoji) statusEmoji.value = '👋';
        const btn = document.querySelector('[data-picker-for="status_emoji"]');
        if (btn) btn.innerText = '👋';

        this.saveSetting('statusText', '');
        this.saveSetting('statusEmoji', '👋');
      });
    }

    if (statusText) {
      statusText.addEventListener('input', () => this.debouncedSaveSetting('statusText', statusText.value));
    }

    if (statusEmoji) {
      statusEmoji.addEventListener('input', () => this.debouncedSaveSetting('statusEmoji', statusEmoji.value));
      const observer = new MutationObserver(() => {
        this.debouncedSaveSetting('statusEmoji', statusEmoji.value);
      });
      observer.observe(statusEmoji, { attributes: true, attributeFilter: ['value'] });
    }
  }

  async initAnimationModals() {
    const profileBtn = document.getElementById('openProfileAnimPicker');
    const buttonBtn = document.getElementById('openButtonAnimPicker');
    const backgroundBtn = document.getElementById('openBackgroundAnimPicker');

    const anims = animations || [];
    const bgAnims = animationBackground || [];

    const updateLabel = (fieldId, list) => {
      const val = parseInt(document.getElementById(fieldId)?.value || 0);
      const displayId = fieldId === 'selectedAnimationIndex' ? 'profileAnimName' :
        fieldId === 'selectedAnimationButtonIndex' ? 'buttonAnimName' : 'backgroundAnimName';
      const displayEl = document.getElementById(displayId);
      if (displayEl) displayEl.textContent = list[val]?.name || 'Aucune';
    };

    // Update labels immediately
    updateLabel('selectedAnimationIndex', anims);
    updateLabel('selectedAnimationButtonIndex', anims);
    updateLabel('selectedAnimationBackgroundIndex', bgAnims);

    if (!profileBtn && !buttonBtn && !backgroundBtn) return;

    const { openPicker } = window.__DASH_PICKERS__ || {};
    if (!openPicker) {
      console.warn('Picker context not found. Modal buttons will not work.');
      return;
    }

    const renderAnimationCard = (item, idx, fieldId) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'group p-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-violet-500/50 transition-all text-left flex flex-col items-center gap-3';

      const previewContainer = document.createElement('div');
      previewContainer.className = 'size-12 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700/50 group-hover:border-violet-500/30 transition-colors';

      const preview = document.createElement('div');
      const isBg = fieldId === 'selectedAnimationBackgroundIndex';
      preview.className = isBg ? 'w-full h-full' : 'size-3 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]';

      if (isBg) {
        preview.style.background = 'linear-gradient(45deg, #8b5cf6, #ec4899, #8b5cf6)';
        preview.style.backgroundSize = '200% 200%';
      }

      // Use the animation name specifically for preview, with fixed duration and infinite loop
      // The config 'name' matches the @keyframes name
      const animName = item.name || item.animationName;
      preview.style.animation = `${animName} 2s infinite ease-in-out`;

      previewContainer.appendChild(preview);

      const info = document.createElement('div');
      info.className = 'w-full text-center';
      const name = document.createElement('div');
      name.className = 'text-xs font-medium text-slate-200 truncate';
      name.textContent = item.name;
      info.appendChild(name);

      card.append(previewContainer, info);
      card.onclick = () => {
        const hiddenInput = document.getElementById(fieldId);
        if (hiddenInput) {
          hiddenInput.value = idx;
          hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        updateLabel(fieldId, list);

        this.saveSetting(fieldId, idx);
        window.__DASH_PICKERS__.closePicker();
      };

      return card;
    };

    if (profileBtn) {
      profileBtn.onclick = () => openPicker({
        title: 'Animation du Profil',
        type: 'anim',
        items: anims,
        renderCard: (item, idx) => renderAnimationCard(item, idx, 'selectedAnimationIndex')
      });
    }

    if (buttonBtn) {
      buttonBtn.onclick = () => openPicker({
        title: 'Animation des Boutons',
        type: 'anim',
        items: anims,
        renderCard: (item, idx) => renderAnimationCard(item, idx, 'selectedAnimationButtonIndex')
      });
    }

    if (backgroundBtn) {
      backgroundBtn.onclick = () => openPicker({
        title: 'Animation du Fond',
        type: 'anim',
        items: bgAnims,
        renderCard: (item, idx) => renderAnimationCard(item, idx, 'selectedAnimationBackgroundIndex')
      });
    }
  }

  initSocials() {
    const list = document.getElementById('socialIconsList');
    const addBtn = document.getElementById('addSocialIcon');
    if (!list) return;

    const plinkk = window.__INITIAL_STATE__ || {};
    const socials = plinkk.socialIcons || [];

    const scheduleSave = () => {
      if (window.__PLINKK_SAVE_SOCIAL__) {
        window.__PLINKK_SAVE_SOCIAL__(socials);
      }
    };

    renderSocial({
      container: list,
      addBtn: addBtn,
      socials: socials,
      scheduleAutoSave: scheduleSave
    });
  }

  initLabelsLogic() {
  }

  initBackgroundTypeToggles() {
    const btns = document.querySelectorAll('.bg-type-btn');
    const options = document.querySelectorAll('.bg-options');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.bgType;

        btns.forEach(b => {
          if (b === btn) {
            b.classList.add('bg-white', 'shadow', 'text-slate-900');
            b.classList.remove('text-slate-400', 'hover:bg-white/[0.12]', 'hover:text-white');
          } else {
            b.classList.remove('bg-white', 'shadow', 'text-slate-900');
            b.classList.add('text-slate-400', 'hover:bg-white/[0.12]', 'hover:text-white');
          }
        });

        options.forEach(opt => {
          if (opt.id === `bg-options-${type}`) {
            opt.classList.remove('hidden');
          } else {
            opt.classList.add('hidden');
          }
        });
      });
    });
  }

  async initCanvasSelection() {
    const list = document.getElementById('canvas-list');
    if (!list) return;

    try {
      const canvases = canvaData || [];
      const currentIdx = parseInt(document.getElementById('selectedCanvasIndex')?.value || 0);

      list.innerHTML = canvases.map((c, i) => `
        <button type="button" data-canvas-index="${i}" 
          class="canvas-item group relative flex items-center gap-3 p-3 rounded-xl border ${i === currentIdx ? 'border-violet-500 bg-violet-900/10' : 'border-slate-800 bg-slate-950'} hover:border-slate-700 transition-all text-left">
          <div class="size-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-violet-400 transition-colors">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </div>
          <div>
            <div class="text-sm font-medium ${i === currentIdx ? 'text-violet-400' : 'text-slate-200'}">${c.animationName}</div>
            ${c.author ? `<div class="text-[10px] text-slate-500">par ${c.author}</div>` : ''}
          </div>
          ${i === currentIdx ? `
            <div class="ml-auto">
              <div class="size-2 rounded-full bg-violet-500 shadow-lg shadow-violet-500/50"></div>
            </div>
          ` : ''}
        </button>
      `).join('');

      list.querySelectorAll('[data-canvas-index]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.canvasIndex);
          const hiddenInput = document.getElementById('selectedCanvasIndex');
          if (hiddenInput) hiddenInput.value = idx;

          list.querySelectorAll('.canvas-item').forEach(item => {
            const itemIdx = parseInt(item.dataset.canvasIndex);
            if (itemIdx === idx) {
              item.classList.add('border-violet-500', 'bg-violet-900/10');
              item.classList.remove('border-slate-800', 'bg-slate-950');
            } else {
              item.classList.remove('border-violet-500', 'bg-violet-900/10');
              item.classList.add('border-slate-800', 'bg-slate-950');
            }
          });

          this.saveSetting('selectedCanvasIndex', idx);
        });
      });
    } catch (e) {
      console.error('Failed to init canvas selection:', e);
    }
  }

  async saveSetting(key, value) {
    try {
      if (window.__PLINKK_SHOW_SAVING__) window.__PLINKK_SHOW_SAVING__();
      const res = await fetch(`/api/me/plinkks/${this.plinkkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
      if (res.ok && window.__PLINKK_SHOW_SAVED__) window.__PLINKK_SHOW_SAVED__();
      if (window.__PLINKK_RENDERER_RELOAD__) window.__PLINKK_RENDERER_RELOAD__();
      else if (window.refreshPreview) window.refreshPreview();
    } catch (e) {
      console.error('Save failed', e);
      if (window.__PLINKK_SHOW_ERROR__) window.__PLINKK_SHOW_ERROR__();
    }
  }

  debouncedSaveSetting(key, value) {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.saveSetting(key, value), 1000);
  }
}

// Instantiate and Init
const dashboard = new DashboardUI();
document.addEventListener('DOMContentLoaded', () => dashboard.init());

// Export for debugging
window.DashboardUI = dashboard;
