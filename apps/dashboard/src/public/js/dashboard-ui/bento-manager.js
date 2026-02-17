import { store } from './state.js';

export class BentoManager {
    constructor() {
        this.grid = null;
        this.container = null;
        this.isInitialized = false;
        this.saveTimeout = null;
    }

    init() {
        store.subscribe((state, updates) => {
            if (updates.links) {
                this.sync(state.links);
            }
        });
    }

    initGrid(containerSelector = '.grid-stack') {
        if (this.isInitialized) return;

        this.container = document.querySelector(containerSelector);
        if (!this.container) return;

        this.grid = GridStack.init({
            column: 12,
            cellHeight: 100,
            minRow: 1,
            margin: 5,
            float: true,
            disableOneColumnMode: true,
            acceptWidgets: true,
            dragOut: false,
        }, this.container);

        this.isInitialized = true;

        this.sync(store.get().links);

        this.grid.on('change', (event, items) => {
            if (!items || items.length === 0) return;
            this.debouncedSave();
        });
    }


    sync(links) {
        if (!this.grid) return;

        this.grid.removeAll();

        links.forEach(link => {

            const widget = this.createWidgetElement(link);
            this.grid.addWidget(widget);
        });
    }

    createWidgetElement(link) {
        const x = link.gridX ?? 0;
        const y = link.gridY ?? 0;
        const w = link.gridW ?? 2;
        const h = link.gridH ?? 1;

        const el = document.createElement('div');
        el.className = 'grid-stack-item';
        el.setAttribute('gs-x', x);
        el.setAttribute('gs-y', y);
        el.setAttribute('gs-w', w);
        el.setAttribute('gs-h', h);
        el.setAttribute('data-id', link.id);

        const content = `
            <div class="grid-stack-item-content bento-widget-content">
                <div class="w-full h-full flex flex-col p-3 bg-slate-800/50 rounded-xl border border-white/5 overflow-hidden">
                    <div class="font-medium text-slate-200 truncate text-sm">${link.text || 'Lien'}</div>
                    <div class="text-xs text-slate-400 truncate opacity-70">${link.url || '#'}</div>
                </div>
            </div>
        `;
        el.innerHTML = content;
        return el;
    }

    getLayoutUpdates() {
        if (!this.grid) return [];
        const updates = [];
        this.grid.getGridItems().forEach(item => {
            const node = item.gridstackNode;
            const id = item.getAttribute('data-id');
            if (node && id) {
                updates.push({
                    id,
                    gridX: node.x,
                    gridY: node.y,
                    gridW: node.w,
                    gridH: node.h
                });
            }
        });
        return updates;
    }

    async saveLayout() {
        const updates = this.getLayoutUpdates();
        const currentLinks = store.get().links;

        const updatedLinks = currentLinks.map(link => {
            const update = updates.find(u => u.id === link.id);
            if (update) {
                return { ...link, ...update };
            }
            return link;
        });

        // Use the global save function provided in editor-core.js
        if (window.__PLINKK_SAVE_LINKS__) {
            await window.__PLINKK_SAVE_LINKS__(updatedLinks);
            store.set({ links: updatedLinks });
        } else {
            console.error('Save function window.__PLINKK_SAVE_LINKS__ not available');
            throw new Error('Save function not available');
        }
    }

    debouncedSave() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveLayout().catch(err => console.error('Auto-save bento error:', err));
        }, 1000);
    }
}

export const bentoManager = new BentoManager();
