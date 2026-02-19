class EditorState {
    constructor() {
        this.state = {
            plinkkId: null,
            userId: null,

            links: [],
            socials: [],
            labels: [],
            categories: [],

            profile: {},
            appearance: {},

            activeSection: 'profile',
            isSaving: false,
            isDirty: false,
        };

        this.listeners = new Set();
    }

    init(initialData) {
        this.state = { ...this.state, ...initialData };
        this.notify();
    }
    get() {
        return { ...this.state };
    }

    set(updates) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...updates };

        this.notify(updates, oldState);
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify(updates = {}, oldState = {}) {
        this.listeners.forEach(listener => listener(this.state, updates, oldState));
    }

    setLinks(links) {
        this.set({ links });
    }

    addLink(link) {
        const links = [...this.state.links, link];
        this.set({ links });
    }

    updateLink(id, updates) {
        const links = this.state.links.map(l => l.id === id ? { ...l, ...updates } : l);
        this.set({ links });
    }

    deleteLink(id) {
        const links = this.state.links.filter(l => l.id !== id);
        this.set({ links });
    }

}

export const store = new EditorState();
window.__EDITOR_STORE__ = store;
