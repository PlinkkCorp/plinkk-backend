import { store as state } from './state.js';

export class CategoryManager {
    constructor() {
        this.plinkkId = window.__PLINKK_SELECTED_ID__;
        this.listContainer = null;
        this.addButton = null;
        this.saveTimeout = null;
    }

    init() {
        this.listContainer = document.getElementById('categoriesList');
        this.addButton = document.getElementById('addCategory');
        if (this.addButton) this.addButton.innerHTML = '<span class="bg-slate-800 p-1 rounded transition-colors">+</span> Nouvelle catégorie (JS Active)';

        if (!this.listContainer) return;
        this.setupListeners();

        // Always render from state to ensure consistency
        const categories = window.__INITIAL_STATE__?.categories || [];
        if (categories.length > 0) {
            this.renderList(categories);
        }
    }

    setupListeners() {
        this.listContainer.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-category-trigger');
            if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-id');
                this.handleDelete(id);
            }
        });

        this.listContainer.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT') {
                this.debounceSave();
            }
        });

        if (this.addButton) {
            this.addButton.addEventListener('click', () => this.handleAdd());
        }
    }

    debounceSave() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            const categories = this.getCurrentCategories();
            this.saveAll(categories, true);
        }, 1000);
    }

    getCurrentCategories() {
        const items = Array.from(this.listContainer.querySelectorAll('[data-id]'));
        return items.map((item, index) => {
            const input = item.querySelector('input');
            return {
                id: item.dataset.id,
                name: input ? input.value : '',
                order: index
            };
        });
    }

    async handleAdd() {
        const { value: name } = await Swal.fire({
            title: 'Nouvelle catégorie',
            input: 'text',
            inputLabel: 'Nom de la catégorie',
            showCancelButton: true,
            confirmButtonText: 'Créer',
            cancelButtonText: 'Annuler',
            background: '#0f172a',
            color: '#fff',
            inputValidator: (value) => !value && 'Le nom est requis !'
        });

        if (name) {
            const categories = this.getCurrentCategories();
            categories.push({ id: 'temp_' + Date.now(), name, order: categories.length });
            // Direct save for new item to get ID quickly
            await this.saveAll(categories);
        }
    }

    async handleDelete(id) {
        const result = await Swal.fire({
            title: 'Supprimer la catégorie ?',
            text: "Ceci dissociera les liens de cette catégorie.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Supprimer',
            cancelButtonText: 'Annuler',
            background: '#0f172a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            const categories = this.getCurrentCategories().filter(c => c.id !== id);
            await this.saveAll(categories);
        }
    }

    async saveAll(categories, isAutoSave = false) {
        if (!this.plinkkId) return;
        if (window.__PLINKK_SHOW_SAVING__) window.__PLINKK_SHOW_SAVING__();

        try {
            const strippedCategories = categories.map(c => ({
                id: c.id?.startsWith('temp_') ? undefined : c.id,
                name: c.name,
                order: c.order
            }));

            const res = await fetch(`/api/me/plinkks/${this.plinkkId}/config/categories`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories: strippedCategories })
            });

            if (!res.ok) throw new Error('Save failed');
            const result = await res.json();

            if (result && result.categories) {
                // Update global states
                if (window.__INITIAL_STATE__) window.__INITIAL_STATE__.categories = result.categories;
                if (window.__EDITOR_STORE__) window.__EDITOR_STORE__.set({ categories: result.categories });

                // Synchronize IDs in the DOM
                const items = Array.from(this.listContainer.querySelectorAll('[data-id]'));
                result.categories.forEach((cat, idx) => {
                    if (items[idx]) {
                        items[idx].dataset.id = cat.id;
                        // Also update delete button if it exists
                        const delBtn = items[idx].querySelector('.delete-category-trigger');
                        if (delBtn) delBtn.dataset.id = cat.id;
                    }
                });

                if (!isAutoSave) {
                    this.renderList(result.categories);
                }

                // Update dropdowns if LinkManager exists
                if (window.__PLINKK_SYNC_SIDEBAR__) window.__PLINKK_SYNC_SIDEBAR__();
            }

            if (window.__PLINKK_SHOW_SAVED__) window.__PLINKK_SHOW_SAVED__();
            if (window.__PLINKK_RENDERER_RELOAD__) window.__PLINKK_RENDERER_RELOAD__();
        } catch (err) {
            console.error('[CategoryManager] Save failed:', err);
            if (window.__PLINKK_SHOW_ERROR__) window.__PLINKK_SHOW_ERROR__();
        }
    }

    renderList(categories) {
        if (!this.listContainer) return;

        if (!categories || categories.length === 0) {
            this.listContainer.innerHTML = '<div class="text-center py-8 text-slate-500 text-sm italic">Aucune catégorie créée via l\'API pour le moment.</div>';
            return;
        }

        this.listContainer.innerHTML = categories.map(category => {
            const name = category.name || category.text || category.title || '(Sans nom JS)';
            // console.log('[CategoryManager] Rendering category:', category.id, name, category);
            return `
                <div class="group relative bg-slate-950 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700" data-id="${category.id}">
                    <div class="flex items-center justify-between gap-4">
                        <div class="flex-1 flex items-center gap-3">
                            <div class="cursor-move text-slate-600 hover:text-slate-400 p-1">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
                                    <circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
                                </svg>
                            </div>
                            <input type="text" value="${this.escapeHtml(name)}" class="bg-transparent text-slate-200 font-medium focus:outline-none w-full cursor-text" placeholder="Nom de la catégorie..." />
                        </div>
                        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="p-2 text-slate-400 hover:text-red-400 transition-colors delete-category-trigger" data-id="${category.id}">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>`;
        }).join('');

        if (window.initSortable) window.initSortable();
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

export const categoryManager = new CategoryManager();
