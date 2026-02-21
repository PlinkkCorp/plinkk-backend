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
        this.themeContainer = null;

        this.currentEditingId = null;
        this.isSaving = false;
        this.saveTimeout = null;
    }

    updateCategoryDropdown() {
        const sel = document.getElementById('linkModalCategory');
        if (!sel) return;

        // Clear
        sel.innerHTML = '';

        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Aucune catégorie';
        sel.appendChild(opt);

        const cfg = (window.__PLINKK_GET_CONFIG__ && window.__PLINKK_GET_CONFIG__()) || window.__INITIAL_STATE__ || {};
        const cats = cfg.categories || [];

        if (Array.isArray(cats)) {
            cats.forEach(c => {
                const o = document.createElement('option');
                o.value = c.id || c.name || '';
                o.textContent = c.name || c.title || c.text || 'Sans nom';
                sel.appendChild(o);
            });
        }
    }

    init() {

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
            formBtnText: document.getElementById('linkModalFormBtnText'),
            formSuccessMsg: document.getElementById('linkModalFormSuccessMsg'),
            typeSelect: document.getElementById('linkModalType'), // This was missing in query
            category: document.getElementById('linkModalCategory'),
            iconInput: document.getElementById('linkModalIconInput'),
            iconSource: document.getElementById('linkModalIconSource'),
            iconInputUrl: document.getElementById('linkModalIconInputUrl'),
            iconUpload: document.getElementById('linkModalIconUpload')
        };


        // Also ensure typeSelect is found if ID is different in some versions? No, expected linkModalType.

        this.typeBtns = document.querySelectorAll('[data-type-select]');

        // Sections to toggle
        this.sections = {
            url: document.getElementById('field-url'),
            icon: document.getElementById('field-icon'),
            formConfig: document.getElementById('field-form-config'),
            advanced: document.getElementById('advancedSettingsWrap'),
            iconPickerWrap: document.getElementById('linkModalIconPickerWrap'),
            iconUrlWrap: document.getElementById('linkModalIconUrlWrap'),
            iconUploadWrap: document.getElementById('linkModalIconUploadWrap'),
        };

        this.themeContainer = document.getElementById('buttonThemeContainer');
        this.inputs.theme = document.getElementById('linkModalTheme');

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
                    const type = btn.dataset.typeSelect;
                    this.setModalType(type);
                });
            });
        }

        if (this.inputs.iconSource) {
            this.inputs.iconSource.addEventListener('change', () => {
                this.updateIconSourceUI(this.inputs.iconSource.value);
            });
        }

        // Icon Upload
        if (this.inputs.iconUpload) {
            this.inputs.iconUpload.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const originalText = this.inputs.iconInput?.value || '';
                if (this.inputs.iconInput) this.inputs.iconInput.value = 'Chargement...';

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const res = await fetch('/api/me/upload?field=iconUrl', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();

                    if (data.ok && data.url) {
                        if (this.inputs.iconInputUrl) this.inputs.iconInputUrl.value = data.url;
                        // We also update iconInput for consistency or if switching back to catalog
                        if (this.inputs.iconInput) this.inputs.iconInput.value = data.url;
                        this.inputs.iconSource.value = 'url';
                        this.updateIconSourceUI('url');
                    } else {
                        if (this.inputs.iconInput) this.inputs.iconInput.value = originalText;
                    }
                } catch (err) {
                    console.error('[LinkManager] Upload failed:', err);
                    if (this.inputs.iconInput) this.inputs.iconInput.value = originalText;
                }
            });
        }

        // Save
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => {
                this.saveLink();
            });
        }

        // Icon Picker logic
        const pickIconBtn = document.getElementById('linkModalPickIconBtn');
        if (pickIconBtn) {
            pickIconBtn.onclick = () => {
                const openIconModal = window.openIconModal || window.__DASH_PICKERS__?.openIconModal;
                if (openIconModal) openIconModal((icon) => {
                    if (this.inputs.iconInput) {
                        this.inputs.iconInput.value = icon;
                        this.inputs.iconInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }, 'linkModalIconInput');
            };
        }

        // Initial Render
        const initialLinks = window.__INITIAL_STATE__?.links || [];
        this.renderLinksList(initialLinks);

        // Exposed Sync
        window.__PLINKK_SYNC_SIDEBAR__ = () => {
            // Also re-render list if categories changed to update badges
            const currentLinks = window.__PLINKK_GET_CONFIG__?.()?.links || window.__INITIAL_STATE__?.links || [];
            this.renderLinksList(currentLinks);
        };

        this.initThemePicker();
    }

    async initThemePicker() {
        if (!this.themeContainer) return;

        try {
            // Import dynamically since it's a module
            const { btnIconThemeConfig } = await import('../../config/btnIconThemeConfig.js');
            if (!btnIconThemeConfig) return;

            // Clear and add "System" default
            this.themeContainer.innerHTML = `
                <button type="button" data-theme-value="system" 
                    class="theme-card group relative flex flex-col items-center gap-2 p-2 rounded-lg border border-slate-800 bg-slate-800/30 hover:bg-slate-800 transition-all ring-2 ring-transparent data-[active=true]:ring-violet-500 data-[active=true]:bg-violet-500/10">
                    <div class="w-full h-8 rounded bg-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-medium">Auto</div>
                    <span class="text-[10px] font-medium text-slate-300">System</span>
                </button>
            `;

            btnIconThemeConfig.forEach(theme => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.dataset.themeValue = theme.themeClass;
                btn.className = 'theme-card group relative flex flex-col items-center gap-2 p-2 rounded-lg border border-slate-800 bg-slate-800/30 hover:bg-slate-800 transition-all ring-2 ring-transparent data-[active=true]:ring-violet-500 data-[active=true]:bg-violet-500/10';

                btn.innerHTML = `
                    <div class="button-preview ${theme.themeClass} h-8 !py-0 !px-2 !text-[10px] !rounded pointer-events-none">
                        ${theme.icon ? `<img src="${theme.icon}" class="preview-icon !mr-1 !w-3 !h-3">` : ''}
                        ${theme.name}
                    </div>
                `;

                btn.onclick = () => this.setButtonTheme(theme.themeClass);
                this.themeContainer.appendChild(btn);
            });

            // Set default click for system
            const systemBtn = this.themeContainer.querySelector('[data-theme-value="system"]');
            if (systemBtn) systemBtn.onclick = () => this.setButtonTheme('system');

        } catch (err) {
            console.error('[LinkManager] Failed to init theme picker:', err);
        }
    }

    setButtonTheme(themeClass) {
        if (this.inputs.theme) {
            this.inputs.theme.value = themeClass;
        }

        // Update UI
        if (this.themeContainer) {
            this.themeContainer.querySelectorAll('[data-theme-value]').forEach(btn => {
                btn.dataset.active = (btn.dataset.themeValue === themeClass).toString();
            });
        }
    }

    updateIconSourceUI(source) {
        const s = this.sections;
        if (!s.iconPickerWrap || !s.iconUrlWrap || !s.iconUploadWrap) return;

        s.iconPickerWrap.classList.toggle('hidden', source !== 'catalog');
        s.iconUrlWrap.classList.toggle('hidden', source !== 'url');
        s.iconUploadWrap.classList.toggle('hidden', source !== 'upload');

        if (source === 'catalog' && this.inputs.iconInput) {
            this.inputs.iconInput.setAttribute('readonly', 'true');
        } else if (this.inputs.iconInput) {
            this.inputs.iconInput.removeAttribute('readonly');
        }
    }

    openModal(type = 'LINK', existingData = null) {
        if (!this.modal) {
            return;
        }

        this.resetForm();

        this.currentEditingId = existingData ? existingData.id : null;
        this.modalTitleHeader.textContent = existingData ? 'Modifier l\'élément' : 'Ajouter un élément';

        this.updateCategoryDropdown();

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
        if (this.inputs.typeSelect) {
            this.inputs.typeSelect.value = type;
        } else {
            console.error('[LinkManager] Type select input not found');
        }


        this.typeBtns.forEach(btn => {
            if (btn.dataset.typeSelect === type) {
                btn.classList.add('bg-emerald-600', 'text-white');
                btn.classList.remove('text-slate-400', 'hover:bg-slate-800');
            } else {
                btn.classList.remove('bg-emerald-600', 'text-white');
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
                if (!this.currentEditingId && this.inputs.iconInput && !this.inputs.iconInput.value) {
                    this.inputs.iconInput.value = 'https://cdn.plinkk.fr/icons/mail.svg';
                }
                break;
            case 'EMBED':
                if (s.url) s.url.classList.remove('hidden');
                if (!this.currentEditingId && this.inputs.iconInput && !this.inputs.iconInput.value) {
                    this.inputs.iconInput.value = 'https://cdn.plinkk.fr/icons/embed.png';
                }
                break;
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

        let icon = data.icon || '';
        let source = 'catalog';

        if (icon) {
            if (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:')) {
                source = 'url';
                if (i.iconInputUrl) i.iconInputUrl.value = icon;
            } else {
                source = 'catalog';
                if (i.iconInput) i.iconInput.value = icon;
            }
        } else {
            if (i.iconInput) i.iconInput.value = '';
            if (i.iconInputUrl) i.iconInputUrl.value = '';
        }

        if (i.iconSource) i.iconSource.value = source;
        this.updateIconSourceUI(source);

        if (i.newTab) i.newTab.checked = data.url && !data.forceAppOpen;
        if (i.ios) i.ios.value = data.iosUrl || '';
        if (i.android) i.android.value = data.androidUrl || '';
        if (i.forceApp) i.forceApp.checked = !!data.forceAppOpen;

        this.setButtonTheme(data.buttonTheme || 'system');

        // Category
        if (i.category) i.category.value = data.categoryId || '';

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
        if (i.iconInputUrl) i.iconInputUrl.value = '';
        if (i.iconSource) {
            i.iconSource.value = 'catalog';
            this.updateIconSourceUI('catalog');
        }

        this.setButtonTheme('system');

        this.currentScheme = 'https://';
        if (this.schemeLabel) this.schemeLabel.textContent = this.currentScheme;
    }

    debouncedSave() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveLink();
        }, 500);
    }

    async saveLink() {
        if (this.isSaving) return;

        const title = this.inputs.title?.value;
        const type = this.inputs.typeSelect?.value;

        if (!title && type !== 'HEADER' && !this.inputs.url?.value) {
            return;
        }

        const saveFn = window.__PLINKK_SAVE_LINKS__;
        if (!saveFn) {
            return;
        }

        this.isSaving = true;
        const editingId = this.currentEditingId;

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

        let finalIcon = '';
        const iconSource = this.inputs.iconSource?.value;
        if (iconSource === 'url') {
            finalIcon = this.inputs.iconInputUrl?.value || '';
        } else {
            finalIcon = this.inputs.iconInput?.value || '';
        }

        const data = {
            id: editingId || ('new_' + Date.now()),
            type: type,
            text: title,
            title: title,
            url: finalUrl,
            description: this.inputs.desc?.value || '',
            icon: finalIcon,
            index: editingId ? (links.find(l => l.id === editingId)?.index || 0) : (links.length > 0 ? Math.max(...links.map(l => l.index || 0)) + 1 : 0),
            iosUrl: this.inputs.ios?.value || '',
            androidUrl: this.inputs.android?.value || '',
            forceAppOpen: this.inputs.forceApp?.checked || false,
            embedData: type === 'EMBED' ? { url: finalUrl } : null,
            formData: type === 'FORM' ? {
                buttonText: this.inputs.formBtnText?.value || 'Envoyer',
                successMessage: this.inputs.formSuccessMsg?.value || 'Message envoyé avec succès !',
                fields: (editingId ? (links.find(l => l.id === editingId)?.formData?.fields) : null) || [
                    { label: 'Nom', type: 'text', required: true, name: 'name', placeholder: 'Votre nom' },
                    { label: 'Email', type: 'email', required: true, name: 'email', placeholder: 'votre@email.com' },
                    { label: 'Message', type: 'textarea', required: true, name: 'message', placeholder: 'Votre message...' }
                ]
            } : null,
            buttonTheme: this.inputs.theme?.value || 'system'
        };

        if (editingId) {
            const idx = links.findIndex(l => l.id === editingId);
            if (idx !== -1) {
                links[idx] = { ...links[idx], ...data };
            }
        } else {
            const tempId = data.id;
            links.push(data);
            this.currentEditingId = tempId;
        }

        this.renderLinksList(links);

        if (this.saveBtn) this.saveBtn.disabled = true;

        try {
            this.closeModal();

            const result = await saveFn(links);

            if (result && result.links) {
                if (data.id.startsWith('new_')) {
                    const newLink = result.links.find(l => l.text === data.text && l.url === data.url);
                    if (newLink) this.currentEditingId = newLink.id;
                }

                if (window.__PLINKK_GET_CONFIG__) {
                    const cfg = window.__PLINKK_GET_CONFIG__();
                    if (cfg) cfg.links = result.links;
                }
                if (window.__INITIAL_STATE__) window.__INITIAL_STATE__.links = result.links;
                if (window.__PLINKK_SYNC_SIDEBAR__) window.__PLINKK_SYNC_SIDEBAR__();

                this.renderLinksList(result.links);
            }

            if (window.__PLINKK_RENDERER_RELOAD__) window.__PLINKK_RENDERER_RELOAD__();
        } catch (e) {
            if (window.__PLINKK_SHOW_ERROR__) window.__PLINKK_SHOW_ERROR__();

            const originalLinks = window.__PLINKK_GET_CONFIG__ && window.__PLINKK_GET_CONFIG__() ? window.__PLINKK_GET_CONFIG__().links : (window.__INITIAL_STATE__?.links || []);
            this.renderLinksList(originalLinks);
        } finally {
            this.isSaving = false;
            if (this.saveBtn) this.saveBtn.disabled = false;
        }
    }

    handleEdit = (id) => {
        const currentConfig = window.__PLINKK_GET_CONFIG__ ? window.__PLINKK_GET_CONFIG__() : null;
        const links = currentConfig?.links || window.__INITIAL_STATE__?.links || [];
        const link = links.find(l => l.id === id);
        if (link) {
            this.openModal(link.type || 'LINK', link);
        }
    }

    async handleDelete(id) {
        if (!confirm('Voulez-vous vraiment supprimer cet élément ?')) return;

        const saveFn = window.__PLINKK_SAVE_LINKS__;
        if (!saveFn) return;

        const currentConfig = window.__PLINKK_GET_CONFIG__ ? window.__PLINKK_GET_CONFIG__() : null;
        let links = currentConfig?.links || window.__INITIAL_STATE__?.links || [];

        links = links.filter(l => l.id !== id);

        this.renderLinksList(links);

        try {
            if (window.__PLINKK_SHOW_SAVING__) window.__PLINKK_SHOW_SAVING__();
            await saveFn(links);
            if (window.__PLINKK_SHOW_SAVED__) window.__PLINKK_SHOW_SAVED__();
            if (window.__PLINKK_RENDERER_RELOAD__) window.__PLINKK_RENDERER_RELOAD__();
        } catch (e) {
            if (window.__PLINKK_SHOW_ERROR__) window.__PLINKK_SHOW_ERROR__();

            const originalLinks = window.__PLINKK_GET_CONFIG__ && window.__PLINKK_GET_CONFIG__() ? window.__PLINKK_GET_CONFIG__().links : (window.__INITIAL_STATE__?.links || []);
            this.renderLinksList(originalLinks);
        }
    }

    async saveNewOrder() {
        const list = document.getElementById('linksList');
        if (!list) return;

        // Flatten all links across any nested structures to capture visual order
        const ids = Array.from(list.querySelectorAll('.group[data-id]')).map(el => el.dataset.id);
        const currentConfig = window.__PLINKK_GET_CONFIG__ ? window.__PLINKK_GET_CONFIG__() : null;
        let links = currentConfig && currentConfig.links ? [...currentConfig.links] : (window.__INITIAL_STATE__?.links || []);

        if (links.length === 0) return;

        // Reorder links based on ids and update indices
        const sortedLinks = ids.map((id, index) => {
            const link = links.find(l => l.id === id);
            if (link) {
                return { ...link, index: index };
            }
            return null;
        }).filter(Boolean);

        const saveFn = window.__PLINKK_SAVE_LINKS__;
        if (saveFn) {
            try {
                if (window.__PLINKK_SHOW_SAVING__) window.__PLINKK_SHOW_SAVING__();
                const result = await saveFn(sortedLinks);
                if (result && result.links) {
                    if (window.__PLINKK_GET_CONFIG__) {
                        const cfg = window.__PLINKK_GET_CONFIG__();
                        if (cfg) cfg.links = result.links;
                    }
                    if (window.__INITIAL_STATE__) window.__INITIAL_STATE__.links = result.links;
                    if (window.__PLINKK_SYNC_SIDEBAR__) window.__PLINKK_SYNC_SIDEBAR__();
                }
                if (window.__PLINKK_SHOW_SAVED__) window.__PLINKK_SHOW_SAVED__();
                if (window.__PLINKK_RENDERER_RELOAD__) window.__PLINKK_RENDERER_RELOAD__();
            } catch (e) {
                if (window.__PLINKK_SHOW_ERROR__) window.__PLINKK_SHOW_ERROR__();
            }
        }
    }

    renderLinksList(links) {
        const list = document.getElementById('linksList');
        if (!list) return;

        if (!links || links.length === 0) {
            list.innerHTML = '<div class="text-center py-8 text-slate-500 text-sm italic">Aucun lien créé.</div>';
            return;
        }

        // Sort by index
        const sortedLinks = [...links].sort((a, b) => (a.index || 0) - (b.index || 0));

        let html = '';
        let currentHeaderGroup = null;

        sortedLinks.forEach(link => {
            const isHeader = link.type === 'HEADER';

            if (isHeader) {
                // If we were in a header group, close it (not really needed for visual, but for Sortable)
                if (currentHeaderGroup) {
                    html += `</div></div>`; // Close nested-links and current header div
                }

                currentHeaderGroup = link.id;
                html += `
                    <div class="header-group-wrapper mb-4" data-id="${link.id}">
                        ${this.getLinkItemHtml(link)}
                        <div class="nested-links ml-8 mt-2 space-y-2 min-h-[40px] border-l-2 border-slate-800/50 pl-4" data-header-id="${link.id}">
                `;
            } else {
                if (currentHeaderGroup) {
                    html += this.getLinkItemHtml(link);
                } else {
                    html += this.getLinkItemHtml(link);
                }
            }
        });

        if (currentHeaderGroup) {
            html += `</div></div>`;
        }

        list.innerHTML = html;

        if (window.initSortable) window.initSortable();
    }

    getLinkItemHtml(link) {
        const text = link.text || link.name || 'Sans titre';
        const url = link.url || '';
        const id = link.id;
        const type = link.type || 'LINK';

        let typeBadge = '';
        switch (type) {
            case 'HEADER': typeBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 uppercase tracking-wider">Titre</span>'; break;
            case 'EMBED': typeBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 uppercase tracking-wider">Embed</span>'; break;
            case 'MUSIC': typeBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-400 uppercase tracking-wider">Musique</span>'; break;
            case 'FORM': typeBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">Formulaire</span>'; break;
            default: typeBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 uppercase tracking-wider">Lien</span>'; break;
        }
        const themeBadge = (link.buttonTheme && link.buttonTheme !== 'system') ? `<span class="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 text-[10px] font-medium border border-violet-500/20">${link.buttonTheme.replace('button-', '')}</span>` : '';

        return `
            <div class="group relative bg-slate-950 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700" data-id="${id}">
                <div class="flex items-center justify-between gap-4">
                    <div class="flex-1 flex items-center gap-3">
                        <div class="cursor-move text-slate-600 hover:text-slate-400 p-1">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
                                <circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
                            </svg>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-0.5">
                                <h4 class="text-sm font-medium text-slate-200">${this.escapeHtml(text)}</h4>
                               <div class="flex items-center gap-1.5 mt-1">
                        ${typeBadge}
                        ${themeBadge}
                    </div>
                </div>
                <p class="text-xs text-slate-500 truncate">${this.escapeHtml(url)}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="p-2 text-slate-400 hover:text-white transition-colors edit-link-trigger" data-id="${id}">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="p-2 text-slate-400 hover:text-red-400 transition-colors delete-link-trigger" data-id="${id}">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

export const linkManager = new LinkManager();
