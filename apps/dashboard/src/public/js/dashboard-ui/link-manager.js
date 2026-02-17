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
        this.typeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = btn.dataset.typeSelect;
                this.setModalType(type);
            });
        });

        // Save
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveLink());
        }

        // Icon Picker logic (simplified)
        const pickIconBtn = document.getElementById('linkModalPickIconBtn');
        if (pickIconBtn) {
            pickIconBtn.addEventListener('click', () => {
                // Open global icon modal
                if (window.openIconModal) window.openIconModal((icon) => {
                    if (this.inputs.iconInput) {
                        this.inputs.iconInput.value = icon; // Store icon/url
                        // Trigger change?
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
        }

        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        this.inputs.title.focus();
    }

    closeModal() {
        if (!this.modal) return;
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
        this.currentEditingId = null;
    }

    setModalType(type) {
        if (this.inputs.typeSelect) this.inputs.typeSelect.value = type;

        // Toggle Visual Selection
        this.typeBtns.forEach(btn => {
            if (btn.dataset.typeSelect === type) {
                btn.dataset.active = 'true';
            } else {
                delete btn.dataset.active;
            }
        });

        // Toggle Fields
        const s = this.sections;
        if (type === 'LINK') {
            s.url.classList.remove('hidden');
            s.icon.classList.remove('hidden');
            s.formConfig.classList.add('hidden');
            s.advanced.classList.remove('hidden');
        } else if (type === 'HEADER') {
            s.url.classList.add('hidden');
            s.icon.classList.add('hidden');
            s.formConfig.classList.add('hidden');
            s.advanced.classList.add('hidden');
        } else if (type === 'EMBED') {
            s.url.classList.remove('hidden');
            s.icon.classList.add('hidden');
            s.formConfig.classList.add('hidden');
            s.advanced.classList.remove('hidden');
        } else if (type === 'FORM') {
            s.url.classList.add('hidden');
            s.icon.classList.remove('hidden');
            s.formConfig.classList.remove('hidden');
            s.advanced.classList.remove('hidden');
        }
    }

    populateForm(data) {
        this.setModalType(data.type);

        const i = this.inputs;
        if (i.title) i.title.value = data.title || data.text || '';
        if (i.url) i.url.value = data.url || '';
        if (i.desc) i.desc.value = data.description || '';
        if (i.iconInput) i.iconInput.value = data.icon || '';

        if (i.newTab) i.newTab.checked = data.url && !data.forceAppOpen; // assumption
        if (i.ios) i.ios.value = data.iosUrl || '';
        if (i.android) i.android.value = data.androidUrl || '';
        if (i.forceApp) i.forceApp.checked = !!data.forceAppOpen;

        if (data.formData) {
            if (i.formBtnText) i.formBtnText.value = data.formData.buttonText || '';
            if (i.formSuccessMsg) i.formSuccessMsg.value = data.formData.successMessage || '';
        }
    }

    resetForm() {
        // Clear all inputs
        Object.values(this.inputs).forEach(input => {
            if (!input) return;
            if (input.type === 'checkbox') input.checked = false;
            else if (input.tagName === 'SELECT') input.selectedIndex = 0;
            else input.value = '';
        });
    }

    async saveLink() {
        // Validate
        const type = this.inputs.typeSelect.value;
        const title = this.inputs.title.value;

        if (!title && type !== 'HEADER') {
            alert('Le titre est requis');
            return;
        }

        // Build Object
        const currentLinks = window.__INITIAL_STATE__?.links || []; // Assume updated via reload
        // Fallback: If we are adding, we append to a local array copy? 
        // Actually, handling IDs for new items is tricky without backend creation response.
        // But our new endpoint '/:id/config/links' replaces the whole list.
        // So we can simulate adding a new item with a temp ID or let backend handle it?
        // If we use 'put /links', we send the whole array.

        // BETTER STRATEGY: 
        // Since we now have 'PUT /:id/config/links', we should:
        // 1. Get current list from state or DOM.
        // 2. Modify it.
        // 3. Send it.

        // However, `editor-core` has `saveLinks(links)`. We can use that if exposed!
        // `window.__PLINKK_SAVE_LINKS__` is exposed in `editor-core.js`.

        const saveFn = window.__PLINKK_SAVE_LINKS__;
        if (!saveFn) {
            console.error('Save function not available');
            return;
        }

        // Fetch up-to-date links if possible (editor-core keeps `currentConfig`)
        const currentConfig = window.__PLINKK_GET_CONFIG__ ? window.__PLINKK_GET_CONFIG__() : null;
        let links = currentConfig && currentConfig.links ? [...currentConfig.links] : [];

        // Or fallback to initial state if config not loaded yet
        if (links.length === 0 && window.__INITIAL_STATE__?.links) {
            links = [...window.__INITIAL_STATE__.links];
        }

        const data = {
            id: this.currentEditingId || ('new_' + Date.now()),
            type: type,
            text: title,
            title: title, // unify
            url: this.inputs.url?.value || '',
            description: this.inputs.desc?.value || '',
            icon: this.inputs.iconInput?.value || '',
            iosUrl: this.inputs.ios?.value || '',
            androidUrl: this.inputs.android?.value || '',
            forceAppOpen: this.inputs.forceApp?.checked || false,
            formData: type === 'FORM' ? {
                buttonText: this.inputs.formBtnText?.value,
                successMessage: this.inputs.formSuccessMsg?.value
            } : null
            // Add other fields as needed
        };

        if (this.currentEditingId) {
            const idx = links.findIndex(l => l.id === this.currentEditingId);
            if (idx !== -1) {
                links[idx] = { ...links[idx], ...data };
            }
        } else {
            links.push(data);
        }

        this.saveBtn.textContent = 'Enregistrement...';
        this.saveBtn.disabled = true;

        try {
            await saveFn(links);
            window.location.reload(); // Reload to sync properly
        } catch (e) {
            console.error(e);
            alert('Erreur lors de la sauvegarde');
            this.saveBtn.textContent = 'Enregistrer';
            this.saveBtn.disabled = false;
        }
    }

    handleEdit(id) {
        const currentConfig = window.__PLINKK_GET_CONFIG__ ? window.__PLINKK_GET_CONFIG__() : null;
        const links = currentConfig?.links || window.__INITIAL_STATE__?.links || [];
        const link = links.find(l => l.id === id);

        if (link) {
            this.openModal(link.type, link);
        } else {
            console.error('Link not found', id);
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
            await saveFn(links);
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert('Erreur lors de la suppression');
        }
    }
}

export const linkManager = new LinkManager();
