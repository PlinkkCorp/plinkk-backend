import { store as state } from './state.js';

export class CategoryManager {
    constructor() {
        this.plinkkId = window.__PLINKK_SELECTED_ID__;
        this.listContainer = document.getElementById('categoriesList');
        this.addButton = document.getElementById('addCategory');
    }

    init() {
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

            if (window.__PLINKK_SHOW_SAVED__) window.__PLINKK_SHOW_SAVED__();

            // For categories, we reload the page because they are used in link creation/editing 
            // and the sidebar needs a refresh to show the new ones.
            location.reload();
        } catch (err) {
            console.error('Category save error:', err);
            if (window.__PLINKK_SHOW_ERROR__) window.__PLINKK_SHOW_ERROR__();
        }
    }
}

export const categoryManager = new CategoryManager();
