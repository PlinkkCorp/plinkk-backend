import { store as state } from './state.js';
import { uiUtils } from './ui-utils.js';

export class LinkManager {
    constructor() {
        this.plinkkId = window.__PLINKK_SELECTED_ID__;
        this.modal = null;
        this.modalTitleHeader = null;
        this.saveBtn = null;
        this.closeBtns = [];
        this.inputs = {};
        this.typeBtns = [];
        this.sections = {};

        this.currentEditingId = null;
        this.saveTimeout = null;
    }

    init() {
        console.log('[LinkManager] Initializing...');

        this.modal = document.getElementById('linkModal');
        this.modalTitleHeader = document.getElementById('linkModalTitleHeader');
        this.saveBtn = document.getElementById('linkModalSave');
        this.closeBtns = [
            document.getElementById('linkModalClose'),
            document.getElementById('linkModalCancel')
        ];

        console.log('[LinkManager] Modal:', !!this.modal, 'SaveBtn:', !!this.saveBtn);

        // Inputs
        this.inputs = {
            title: document.getElementById('linkModalTitleInput'),
            url: document.getElementById('linkModalUrlInput'),
            desc: document.getElementById('linkModalDescInput'),
            newTab: document.getElementById('linkModalNewTab'),
            ios: document.getElementById('linkModalIosUrl'),
            android: document.getElementById('linkModalAndroidUrl'),
            forceApp: document.getElementById('linkModalForceAppOpen'),
            clickLimit: document.getElementById('linkModalClickLimit'),
            category: document.getElementById('linkModalCategory'),
            formBtnText: document.getElementById('linkModalFormBtnText'),
            formSuccessMsg: document.getElementById('linkModalFormSuccessMsg'),
            typeSelect: document.getElementById('linkModalType'), // This was missing in query
            iconInput: document.getElementById('linkModalIconInput')
        };

        console.log('[LinkManager] Inputs found:', Object.keys(this.inputs).filter(k => !!this.inputs[k]));
        console.log('[LinkManager] MISSING:', Object.keys(this.inputs).filter(k => !this.inputs[k]));

        // Also ensure typeSelect is found if ID is different in some versions? No, expected linkModalType.

        this.typeBtns = document.querySelectorAll('[data-type-select]');
        console.log('[LinkManager] Type buttons:', this.typeBtns.length);

        // Sections to toggle
        this.sections = {
            url: document.getElementById('field-url'),
            icon: document.getElementById('field-icon'),
            formConfig: document.getElementById('field-form-config'),
            advanced: document.getElementById('advancedSettingsWrap'),
        };

        // Scheme Toggler
        this.schemeBtn = document.getElementById('linkModalSchemeBtn');
        this.schemeLabel = document.getElementById('linkModalSchemeLabel');
        this.currentScheme = 'https://';

        if (this.schemeBtn && this.schemeLabel) {
            this.schemeBtn.addEventListener('click', () => {
                this.currentScheme = this.currentScheme === 'https://' ? 'http://' : 'https://';
                this.schemeLabel.textContent = this.currentScheme;
            });
        }

        // URL Input Auto-Strip
        if (this.inputs.url) {
            this.inputs.url.addEventListener('input', (e) => {
                let val = e.target.value;
                if (val.startsWith('https://')) {
                    this.currentScheme = 'https://';
                    e.target.value = val.substring(8);
                    if (this.schemeLabel) this.schemeLabel.textContent = this.currentScheme;
                } else if (val.startsWith('http://')) {
                    this.currentScheme = 'http://';
                    e.target.value = val.substring(7);
                    if (this.schemeLabel) this.schemeLabel.textContent = this.currentScheme;
                }
            });
        }

        // Bind Sidebar Buttons
        const addLinkBtn = document.getElementById('addLink');
        if (addLinkBtn) addLinkBtn.addEventListener('click', () => this.openModal('LINK'));

        const addHeaderBtn = document.getElementById('addHeader');
        if (addHeaderBtn) addHeaderBtn.addEventListener('click', () => this.openModal('HEADER'));

        // Bind List Actions (Delegation)
        const linksList = document.getElementById('linksList');
        if (linksList) {
            linksList.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.edit-link-trigger');
                const deleteBtn = e.target.closest('.delete-link-trigger');

                if (editBtn) {
                    e.preventDefault();
                    this.handleEdit(editBtn.dataset.id);
                }
                if (deleteBtn) {
                    e.preventDefault();
                    this.handleDelete(deleteBtn.dataset.id);
                }
            });
        }

        // Modal Events
        this.closeBtns.forEach(b => {
            if (b) b.addEventListener('click', () => this.closeModal());
        });

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal || e.target.classList.contains('absolute')) {
                    this.closeModal();
                }
            });
        }

        // Type Selection
        if (this.typeBtns) {
            this.typeBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    console.log('[LinkManager] Type clicked:', btn.dataset.typeSelect);
                    const type = btn.dataset.typeSelect;
                    this.setModalType(type);
                });
            });
        }

        // Save
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => {
                console.log('[LinkManager] Save button clicked');
                this.saveLink();
            });
        }

        // Icon Picker logic
        const pickIconBtn = document.getElementById('linkModalPickIconBtn');
        if (pickIconBtn) {
            pickIconBtn.addEventListener('click', () => {
                if (window.openIconModal) window.openIconModal((icon) => {
                    if (this.inputs.iconInput) {
                        this.inputs.iconInput.value = icon;
                    }
                });
            });
        }
    }

    openModal(type = 'LINK', existingData = null) {
        console.log('[LinkManager] Opening modal', type, existingData);
        if (!this.modal) {
            console.error('[LinkManager] Modal element not found!');
            return;
        }

        this.currentEditingId = existingData ? existingData.id : null;
        this.modalTitleHeader.textContent = existingData ? 'Modifier l\'élément' : 'Ajouter un élément';

        this.resetForm();

        if (existingData) {
            this.populateForm(existingData);
        } else {
            this.setModalType(type);
            // Default scheme
            this.currentScheme = 'https://';
            if (this.schemeLabel) this.schemeLabel.textContent = 'https://';
        }

        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        this.inputs.title.focus();
    }

    closeModal() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');
        }
        this.currentEditingId = null;
    }

    setModalType(type) {
        console.log('[LinkManager] Setting modal type:', type);
        if (this.inputs.typeSelect) {
            this.inputs.typeSelect.value = type;
        } else {
            console.error('[LinkManager] Type select input not found');
        }


        this.typeBtns.forEach(btn => {
            if (btn.dataset.typeSelect === type) {
                btn.classList.add('bg-indigo-600', 'text-white');
                btn.classList.remove('text-slate-400', 'hover:bg-slate-800');
            } else {
                btn.classList.remove('bg-indigo-600', 'text-white');
                btn.classList.add('text-slate-400', 'hover:bg-slate-800');
            }
        });

        const s = this.sections;

        // Hide all first
        if (s.url) s.url.classList.add('hidden');
        if (s.icon) s.icon.classList.remove('hidden'); // Default show
        if (s.formConfig) s.formConfig.classList.add('hidden');
        if (s.advanced) s.advanced.classList.remove('hidden'); // Default show

        // Logic
        switch (type) {
            case 'HEADER':
                if (s.url) s.url.classList.add('hidden');
                if (s.advanced) s.advanced.classList.add('hidden');
                break;
            case 'FORM':
                if (s.url) s.url.classList.add('hidden');
                if (s.formConfig) s.formConfig.classList.remove('hidden');
                break;
            case 'EMBED':
            case 'MUSIC':
            case 'LINK':
            default:
                if (s.url) s.url.classList.remove('hidden');
                break;
        }
    }

    populateForm(data) {
        this.setModalType(data.type);

        const i = this.inputs;
        if (i.title) i.title.value = data.title || data.text || '';

        // Split URL scheme
        let url = data.url || '';
        if (url.startsWith('https://')) {
            this.currentScheme = 'https://';
            url = url.substring(8);
        } else if (url.startsWith('http://')) {
            this.currentScheme = 'http://';
            url = url.substring(7);
        } else {
            // Fallback or relative? Assume https if not present or handle as is?
            // User wants to change http/https. Assuming all links are absolute.
            this.currentScheme = 'https://';
        }

        if (this.schemeLabel) this.schemeLabel.textContent = this.currentScheme;

        if (i.url) i.url.value = url;
        if (i.desc) i.desc.value = data.description || '';
        if (i.iconInput) i.iconInput.value = data.icon || '';

        if (i.newTab) i.newTab.checked = data.url && !data.forceAppOpen;
        if (i.ios) i.ios.value = data.iosUrl || '';
        if (i.android) i.android.value = data.androidUrl || '';
        if (i.forceApp) i.forceApp.checked = !!data.forceAppOpen;

        if (data.formData) {
            if (i.formBtnText) i.formBtnText.value = data.formData.buttonText || '';
            if (i.formSuccessMsg) i.formSuccessMsg.value = data.formData.successMessage || '';
        }
    }

    resetForm() {
        this.currentEditingId = null;
        this.setModalType('LINK');

        const i = this.inputs;
        if (i.title) i.title.value = '';
        if (i.url) i.url.value = '';
        if (i.desc) i.desc.value = '';
        if (i.newTab) i.newTab.checked = false;
        if (i.ios) i.ios.value = '';
        if (i.android) i.android.value = '';
        if (i.forceApp) i.forceApp.checked = false;
        if (i.clickLimit) i.clickLimit.value = '';
        if (i.formBtnText) i.formBtnText.value = '';
        if (i.formSuccessMsg) i.formSuccessMsg.value = '';
        if (i.iconInput) i.iconInput.value = '';

        this.currentScheme = 'https://';
        if (this.schemeLabel) this.schemeLabel.textContent = this.currentScheme;
    }

    debouncedSave() {
        // console.log('[LinkManager] Debounced save triggered');
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveLink();
        }, 500);
    }

    async saveLink() {
        console.log('[LinkManager] Attempting to save...');
        const type = this.inputs.typeSelect ? this.inputs.typeSelect.value : 'LINK';
        const title = this.inputs.title ? this.inputs.title.value : '';

        console.log(`[LinkManager] Saving: Type=${type}, Title=${title}`);

        if (!title && type !== 'HEADER' && !this.inputs.url?.value) {
            console.warn('[LinkManager] Save aborted: Title and URL are empty (and not HEADER)');
            return;
        }

        const saveFn = window.__PLINKK_SAVE_LINKS__;
        if (!saveFn) {
            console.error('[LinkManager] CRITICAL: window.__PLINKK_SAVE_LINKS__ is undefined!');
            return;
        }

        const currentConfig = window.__PLINKK_GET_CONFIG__ ? window.__PLINKK_GET_CONFIG__() : null;
        let links = currentConfig && currentConfig.links ? [...currentConfig.links] : [];

        if (links.length === 0 && window.__INITIAL_STATE__?.links) {
            links = [...window.__INITIAL_STATE__.links];
        }

        // Construct full URL
        let finalUrl = this.inputs.url?.value || '';
        if (finalUrl && (type === 'LINK' || type === 'EMBED')) {
            finalUrl = this.currentScheme + finalUrl;
        }

        const data = {
            id: this.currentEditingId || ('new_' + Date.now()),
            type: type,
            text: title,
            title: title,
            url: finalUrl,
            description: this.inputs.desc?.value || '',
            icon: this.inputs.iconInput?.value || '',
            iosUrl: this.inputs.ios?.value || '',
            androidUrl: this.inputs.android?.value || '',
            forceAppOpen: this.inputs.forceApp?.checked || false,
            formData: type === 'FORM' ? {
                buttonText: this.inputs.formBtnText?.value || '',
                successMessage: this.inputs.formSuccessMsg?.value || ''
            } : null
        };
        // ... rest of saveLink ...

        if (this.currentEditingId) {
            const idx = links.findIndex(l => l.id === this.currentEditingId);
            if (idx !== -1) {
                links[idx] = { ...links[idx], ...data };
            }
        } else {
            const tempId = data.id;
            links.push(data);
            this.currentEditingId = tempId;
        }

        if (this.saveBtn) this.saveBtn.disabled = true;

        try {
            // Optimistic close
            this.closeModal();

            const result = await saveFn(links);

            if (result && result.links) {
                // Determine new ID if we were adding a link
                if (data.id.startsWith('new_')) {
                    const newLink = result.links.find(l => l.text === data.text && l.url === data.url);
                    if (newLink) this.currentEditingId = newLink.id;
                }

                // Update local config immediately
                if (window.__PLINKK_GET_CONFIG__) {
                    const cfg = window.__PLINKK_GET_CONFIG__();
                    if (cfg) cfg.links = result.links;
                }
                if (window.__INITIAL_STATE__) window.__INITIAL_STATE__.links = result.links;
                if (window.__PLINKK_SYNC_SIDEBAR__) window.__PLINKK_SYNC_SIDEBAR__();

                if (window.__INITIAL_STATE__) window.__INITIAL_STATE__.links = result.links;
                if (window.__PLINKK_SYNC_SIDEBAR__) window.__PLINKK_SYNC_SIDEBAR__();

                // Close modal (already done optimistically, but safe to keep or remove. 
                // Since we moved it up, we can remove it here or leave as redundant guard. 
                // Better to remove to avoid double toggle if logic changes.)
            }

            if (window.__PLINKK_RENDERER_RELOAD__) window.__PLINKK_RENDERER_RELOAD__();
        } catch (e) {
            console.error('Link save error:', e);
        } finally {
            if (this.saveBtn) this.saveBtn.disabled = false;
        }
    }

    async handleDelete(id) {
        if (!confirm('Voulez-vous vraiment supprimer cet élément ?')) return;

        const saveFn = window.__PLINKK_SAVE_LINKS__;
        if (!saveFn) return;

        const currentConfig = window.__PLINKK_GET_CONFIG__ ? window.__PLINKK_GET_CONFIG__() : null;
        let links = currentConfig?.links || window.__INITIAL_STATE__?.links || [];

        links = links.filter(l => l.id !== id);

        // Optimistic DOM removal
        const linksList = document.getElementById('linksList');
        if (linksList) {
            const el = linksList.querySelector(`[data-id="${id}"]`)?.closest('.link-item'); // Assuming structure
            // Actually the listener is on linksList, finding .delete-link-trigger's dataset. 
            // The item is likely the parent or we need to find the element by data-link-id if it exists.
            // Let's assume the render uses data-link-id on the item container or we can find it by button.
            // But we don't have the button reference here easily unless we passed it.
            // Let's try to query by attribute if possible. A safer bet is just simple removal if found.
            // Reviewing render logic in editor-core.js? No, sidebar items.
            // Let's try to find an element with data-id or similar.
            // In init we saw: const editBtn = e.target.closest('.edit-link-trigger');
            // Usually these are in a container.
            // For now, let's rely on standard ID selection if available, or just proceed with saveFn 
            // which usually triggers reload. user said "affiche le directe".
            // Let's try to find the element.
            const btn = linksList.querySelector(`.delete-link-trigger[data-id="${id}"]`);
            if (btn) {
                const item = btn.closest('li') || btn.closest('div');
                if (item) item.remove();
            }
        }

        try {
            if (window.__PLINKK_SHOW_SAVING__) window.__PLINKK_SHOW_SAVING__();
            await saveFn(links);
            if (window.__PLINKK_SHOW_SAVED__) window.__PLINKK_SHOW_SAVED__();
            if (window.__PLINKK_RENDERER_RELOAD__) window.__PLINKK_RENDERER_RELOAD__();
        } catch (e) {
            console.error(e);
            if (window.__PLINKK_SHOW_ERROR__) window.__PLINKK_SHOW_ERROR__();
        }
    }
}

export const linkManager = new LinkManager();
