import { store as state } from './state.js';
import { uiUtils } from './ui-utils.js';

export class LinkManager {
    constructor() {
        this.plinkkId = window.__PLINKK_SELECTED_ID__;
        this.modal = document.getElementById('linkModal');
        this.modalTitleHeader = document.getElementById('linkModalTitleHeader');
        this.saveBtn = document.getElementById('linkModalSave');
        this.closeBtns = [
            document.getElementById('linkModalClose'),
            document.getElementById('linkModalCancel')
        ];

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
            typeSelect: document.getElementById('linkModalType'),
            iconInput: document.getElementById('linkModalIconInput')
        };

        this.typeBtns = document.querySelectorAll('[data-type-select]');
        this.currentEditingId = null;
        this.saveTimeout = null;

        // Sections to toggle
        this.sections = {
            url: document.getElementById('field-url'),
            icon: document.getElementById('field-icon'),
            formConfig: document.getElementById('field-form-config'),
            advanced: document.getElementById('advancedSettingsWrap'),
        };
    }

    init() {
        console.log('Link Manager Initializing...');

        // Scheme Toggler
        this.schemeBtn = document.getElementById('linkModalSchemeBtn');
        this.schemeLabel = document.getElementById('linkModalSchemeLabel');
        this.currentScheme = 'https://';

        if (this.schemeBtn && this.schemeLabel) {
            this.schemeBtn.addEventListener('click', () => {
                this.currentScheme = this.currentScheme === 'https://' ? 'http://' : 'https://';
                this.schemeLabel.textContent = this.currentScheme;
                this.debouncedSave();
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
                this.debouncedSave();
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

            // Auto-save on input (handled individually for URL now, but keep for others)
            this.modal.addEventListener('input', (e) => {
                if (e.target !== this.inputs.url) this.debouncedSave();
            });
            this.modal.addEventListener('change', () => this.debouncedSave());
        }

        // Type Selection
        this.typeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = btn.dataset.typeSelect;
                this.setModalType(type);
                this.debouncedSave();
            });
        });

        // Save
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveLink());
        }

        // Icon Picker logic
        const pickIconBtn = document.getElementById('linkModalPickIconBtn');
        if (pickIconBtn) {
            pickIconBtn.addEventListener('click', () => {
                if (window.openIconModal) window.openIconModal((icon) => {
                    if (this.inputs.iconInput) {
                        this.inputs.iconInput.value = icon;
                        this.debouncedSave();
                    }
                });
            });
        }
    }

    openModal(type = 'LINK', existingData = null) {
        if (!this.modal) return;

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

    // ... closeModal and setModalType seem fine ...

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

    // ... resetForm and debouncedSave ...

    async saveLink() {
        const type = this.inputs.typeSelect.value;
        const title = this.inputs.title.value;

        if (!title && type !== 'HEADER') return;

        const saveFn = window.__PLINKK_SAVE_LINKS__;
        if (!saveFn) return;

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
