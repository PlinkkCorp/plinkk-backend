import { store as state } from './state.js';
import { historyManager } from './history-manager.js';
import { uiUtils } from './ui-utils.js';
import { linkManager } from './link-manager.js';
import { settingsManager } from './settings-manager.js';
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

    // Ctrl+S / Cmd+S Handler – simply update the status text without hiding it automatically
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const statusEl = document.getElementById('status');
        if (statusEl) {
          statusEl.textContent = 'Sauvegardé !';
          statusEl.classList.remove('opacity-0');
          // leave it visible until another status update occurs
        }
      }
    });

    const initialState = window.__INITIAL_STATE__ || {};
    if (!initialState.plinkkId && this.plinkkId) {
      initialState.plinkkId = this.plinkkId;
    }

    state.init(initialState);
    historyManager.init();
    uiUtils.init();
    linkManager.init();
    settingsManager.init();
    historyManager.loadHistory();

    window.initSortable = () => {
      const linksList = document.getElementById('linksList');
      if (linksList && window.Sortable) {
        if (linksList._sortable) linksList._sortable.destroy();
        linksList._sortable = new Sortable(linksList, {
          handle: '.cursor-move',
          animation: 150,
          ghostClass: 'bg-slate-800/20',
          group: 'nested-links',
          onEnd: () => linkManager.saveNewOrder()
        });

        // Initialize nested sortables for each header group
        linksList.querySelectorAll('.nested-links').forEach(el => {
          if (el._sortable) el._sortable.destroy();
          el._sortable = new Sortable(el, {
            group: 'nested-links',
            animation: 150,
            ghostClass: 'bg-slate-800/20',
            fallbackOnBody: true,
            swapThreshold: 0.65,
            onEnd: () => linkManager.saveNewOrder()
          });
        });
      }
    };

    this.onTabChange = (targetId) => {
      if (targetId === '#section-links') {
        setTimeout(() => {
          if (window.initSortable) window.initSortable();
        }, 100);
      }
      if (targetId === '#section-layout') {
        // the layout panel may have been populated before the element existed,
        // also ensure drag handles are attached again
        setTimeout(() => {
          const layoutContainer = qs('#layoutList');
          const cfg = (window.__PLINKK_GET_CONFIG__ && window.__PLINKK_GET_CONFIG__()) || {};
          const currentOrder = state.get().layoutOrder || ['profile', 'username', 'labels', 'social', 'email', 'links'];
          const opts = { container: layoutContainer, order: currentOrder, scheduleAutoSave: () => {/* nothing */ }, cfg };
          // provide a layout-specific autosave function if available
          const layoutSave = () => {
            state.set({ layoutOrder: currentOrder });
            if (window.__PLINKK_SAVE_LAYOUT__) {
              window.__PLINKK_SAVE_LAYOUT__(currentOrder);
            }
          };
          opts.scheduleAutoSave = layoutSave;
          if (typeof renderLayout === 'function') {
            renderLayout(opts);
          } else {
            console.warn('renderLayout not defined when activating layout tab, dynamic import');
            import('./renderers.js').then(m => {
              if (m.renderLayout) {
                m.renderLayout(opts);
              }
            }).catch(e => console.error('Failed to import renderers.js', e));
          }
        }, 50);
      }
    }
    // after setting up onTabChange, call other initialization helpers
    this.initTabs();
    this.initStatusLogic();
    this.initLabelsLogic();
    this.initBackgroundTypeToggles();
    this.initCanvasSelection();
    this.initAnimationModals();
    this.initSocials();
    this.initGeneralPickers();
    this.initThemePicker();

    // Initial check
    if (window.initSortable) window.initSortable();

    window.__PLINKK_SYNC_LAYOUT__ = () => {
      const layoutContainer = document.querySelector('#layoutList');
      if (!layoutContainer) return;

      const cfg = (window.__PLINKK_GET_CONFIG__ && window.__PLINKK_GET_CONFIG__()) || {};
      const currentOrder = state.get().layoutOrder || ['profile', 'username', 'labels', 'social', 'email', 'links'];
      const opts = {
        container: layoutContainer,
        order: currentOrder,
        scheduleAutoSave: () => {
          state.set({ layoutOrder: currentOrder });
          if (window.__PLINKK_SAVE_LAYOUT__) window.__PLINKK_SAVE_LAYOUT__(currentOrder);
        },
        cfg
      };

      if (typeof renderLayout === 'function') {
        renderLayout(opts);
      } else {
        import('./renderers.js').then(m => {
          if (m.renderLayout) m.renderLayout(opts);
        }).catch(e => console.error('Failed to dynamic import renderers for sync', e));
      }
    };
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
    if (targetId === '#section-statusbar') {
      const modal = document.getElementById('statusModal');
      if (modal) modal.classList.remove('hidden');
      return;
    }

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

    const initialType = document.getElementById('backgroundType')?.value || 'color';

    btns.forEach(btn => {
      const btnType = btn.dataset.bgType;
      if (btnType === initialType) {
        btn.classList.add('bg-white', 'shadow', 'text-slate-900');
        btn.classList.remove('text-slate-400', 'hover:bg-white/[0.12]', 'hover:text-white');
      }

      btn.addEventListener('click', () => {
        const type = btn.dataset.bgType;

        const hiddenInput = document.getElementById('backgroundType');
        if (hiddenInput) {
          hiddenInput.value = type;
          hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

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

    // Show initial options
    options.forEach(opt => {
      if (opt.id === `bg-options-${initialType}`) {
        opt.classList.remove('hidden');
      } else {
        opt.classList.add('hidden');
      }
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
      if (window.__PLINKK_SHOW_ERROR__) window.__PLINKK_SHOW_ERROR__();
    }
  }

  debouncedSaveSetting(key, value) {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.saveSetting(key, value), 1000);
  }

  async initThemePicker() {
    const themeBtn = document.getElementById('openThemePicker');
    if (!themeBtn) return;

    let themes = [];
    let builtIns = [];
    let community = [];

    const updateLabel = () => {
      const idx = parseInt(document.getElementById('selectedThemeIndex')?.value || 0);
      const allThemes = [...builtIns, ...community];
      const selected = allThemes[idx] || allThemes[0];

      const nameEl = document.getElementById('selectedThemeName');
      if (nameEl) nameEl.textContent = selected?.name || 'Thème par défaut';

      const previewContent = document.getElementById('themePreviewContent');
      if (previewContent && selected) {
        previewContent.style.background = selected.background || '#1e293b';
        previewContent.innerHTML = `
          <div class="flex flex-col h-full p-1 gap-1">
            <div class="h-1 w-full rounded-full" style="background: ${selected.buttonBackground || '#8b5cf6'}"></div>
            <div class="h-1 w-2/3 rounded-full opacity-50" style="background: ${selected.textColor || 'white'}"></div>
          </div>
        `;
      }
    };

    try {
      const res = await fetch('/api/themes/list');
      if (res.ok) {
        const data = await res.json();
        builtIns = data.builtIns || [];
        community = data.theme || [];
        themes = [...builtIns, ...community];
        updateLabel();
      }
    } catch (e) {
      console.error('Failed to fetch themes', e);
    }

    const renderThemeCard = (item, idx) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'group p-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-violet-500/50 transition-all text-left flex flex-col gap-2';

      const preview = document.createElement('div');
      preview.className = 'h-16 w-full rounded-lg border border-slate-800 overflow-hidden relative shadow-inner';
      preview.style.background = item.background || '#1e293b';

      const mockHeader = document.createElement('div');
      mockHeader.className = 'absolute inset-x-2 top-2 h-2 rounded-full opacity-40';
      mockHeader.style.background = item.buttonBackground || '#8b5cf6';

      const mockButton = document.createElement('div');
      mockButton.className = 'absolute inset-x-4 top-6 h-4 rounded-md shadow-sm';
      mockButton.style.background = item.buttonBackground || '#8b5cf6';

      preview.append(mockHeader, mockButton);

      const info = document.createElement('div');
      info.className = 'space-y-0.5';
      const name = document.createElement('div');
      name.className = 'text-xs font-semibold text-slate-200 truncate';
      name.textContent = item.name;
      const status = document.createElement('div');
      status.className = 'text-[10px] text-slate-500';
      status.textContent = item.source === 'mine' ? 'Mon thème' : (item.author ? `par ${item.author.userName}` : 'Officiel');

      info.append(name, status);
      card.append(preview, info);

      card.onclick = () => {
        const hiddenInput = document.getElementById('selectedThemeIndex');
        if (hiddenInput) {
          hiddenInput.value = idx;
          hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        updateLabel();
        this.saveSetting('selectedThemeIndex', idx);
        window.__DASH_PICKERS__.closePicker();
      };

      return card;
    };

    themeBtn.onclick = () => {
      const { openPicker } = window.__DASH_PICKERS__ || {};
      if (openPicker) {
        openPicker({
          title: 'Séléction du thème',
          type: 'theme',
          items: themes,
          renderCard: (item, idx) => renderThemeCard(item, idx)
        });
      }
    };
  }
}

// Instantiate and Init
const dashboard = new DashboardUI();
document.addEventListener('DOMContentLoaded', () => dashboard.init());

// Export for debugging
window.DashboardUI = dashboard;
