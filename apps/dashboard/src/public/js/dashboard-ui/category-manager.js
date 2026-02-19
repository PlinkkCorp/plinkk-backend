import { store as state } from './state.js';

export class CategoryManager {
    constructor() {
        this.plinkkId = window.__PLINKK_SELECTED_ID__;
        this.listContainer = null;
        this.addButton = null;
    }

    init() {
        console.log('Category Manager Initializing...');
        this.listContainer = document.getElementById('categoriesList');
        this.addButton = document.getElementById('addCategory');
        this.saveTimeout = null;

        if (!this.listContainer) return;
        this.setupListeners();
    }

    setupListeners() {
        this.listContainer.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-category-trigger');

            if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-id');
                this.handleDelete(id);
            }
        });

        // Add auto-save on input
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
            this.saveAll(categories, true); // true = isAutoSave
        }, 1000);
    }

    getCurrentCategories() {
        const items = Array.from(this.listContainer.querySelectorAll('[data-id]'));
        return items.map((item, index) => ({
            id: item.dataset.id,
            name: item.querySelector('input')?.value || '',
            order: index
        }));
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
            categories.push({ name, order: categories.length });
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
            const res = await fetch(`/api/me/plinkks/${this.plinkkId}/config/categories`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories })
            });

            if (!res.ok) throw new Error('Save failed');
            const result = await res.json();

            if (result && result.categories) {
                // Update global state
                if (window.__PLINKK_GET_CONFIG__) {
                    const cfg = window.__PLINKK_GET_CONFIG__();
                    if (cfg) cfg.categories = result.categories;
                }
                if (window.__INITIAL_STATE__) window.__INITIAL_STATE__.categories = result.categories;
                if (window.__EDITOR_STORE__) window.__EDITOR_STORE__.set({ categories: result.categories });

                // IMPORTANT: If this is an auto-save, we DON'T re-render the list 
                // to avoid losing focus and cursor position in the input field.
                // We only sync IDs for new items if any (unlikely in pure inline input edit).
                if (!isAutoSave) {
                    this.renderList(result.categories);
                } else {
                    // Just sync IDs without re-rendering the whole DOM
                    result.categories.forEach((cat, idx) => {
                        const items = this.listContainer.querySelectorAll('[data-id]');
                        if (items[idx] && !items[idx].dataset.id) {
                            items[idx].dataset.id = cat.id;
                        }
                    });
                }
            }

            if (window.__PLINKK_SHOW_SAVED__) window.__PLINKK_SHOW_SAVED__();
            if (window.__PLINKK_RENDERER_RELOAD__) window.__PLINKK_RENDERER_RELOAD__();
        } catch (err) {
            console.error('Category save error:', err);
            if (window.__PLINKK_SHOW_ERROR__) window.__PLINKK_SHOW_ERROR__();
        }
    }

    renderList(categories) {
        if (!this.listContainer) return;

        if (!categories || categories.length === 0) {
            this.listContainer.innerHTML = '<div class="text-center py-8 text-slate-500 text-sm italic">Aucune catégorie créée via l\'API pour le moment.</div>';
            return;
        }

        this.listContainer.innerHTML = categories.map(category => `
            <div class="group relative bg-slate-950 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700" data-id="${category.id}">
                <div class="flex items-center justify-between gap-4">
                    <div class="flex-1 flex items-center gap-3">
                        <div class="cursor-move text-slate-600 hover:text-slate-400 p-1">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
                                <circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
                            </svg>
                        </div>
                        <input type="text" value="${this.escapeHtml(category.name)}" class="bg-transparent text-slate-200 font-medium focus:outline-none w-full cursor-text" placeholder="Nom de la catégorie..." />
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
            </div>
        `).join('');
    }

    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

export const categoryManager = new CategoryManager();
