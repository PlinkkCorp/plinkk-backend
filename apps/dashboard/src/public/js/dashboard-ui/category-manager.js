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

        if (!this.listContainer) return;
        this.setupListeners();
    }

    setupListeners() {
        this.listContainer.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-category-trigger');
            const deleteBtn = e.target.closest('.delete-category-trigger');

            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                this.handleEdit(id);
            }
            if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-id');
                this.handleDelete(id);
            }
        });

        if (this.addButton) {
            this.addButton.addEventListener('click', () => this.handleAdd());
        }
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

    async handleEdit(id) {
        const categories = this.getCurrentCategories();
        const cat = categories.find(c => c.id === id);
        if (!cat) return;

        const { value: name } = await Swal.fire({
            title: 'Modifier la catégorie',
            input: 'text',
            inputLabel: 'Nom de la catégorie',
            inputValue: cat.name,
            showCancelButton: true,
            confirmButtonText: 'Enregistrer',
            cancelButtonText: 'Annuler',
            background: '#0f172a',
            color: '#fff',
            inputValidator: (value) => !value && 'Le nom est requis !'
        });

        if (name && name !== cat.name) {
            cat.name = name;
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

    async saveAll(categories) {
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

                // Re-render sidebar list
                this.renderList(result.categories);
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
                        <input type="text" value="${this.escapeHtml(category.name)}" class="bg-transparent text-slate-200 font-medium focus:outline-none w-full" readonly />
                    </div>
                    <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="p-2 text-slate-400 hover:text-white transition-colors edit-category-trigger" data-id="${category.id}">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
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
