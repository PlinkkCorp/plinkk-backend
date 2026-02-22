import { store as state } from './state.js';

export class SettingsManager {
    constructor() {
        this.plinkkId = window.__PLINKK_SELECTED_ID__;
        this.fields = [
            'profileLink', 'profileSiteText', 'userName', 'email',
            'profileImage', 'profileIcon', 'iconUrl', 'description',
            'publicPhone', 'affichageEmail', 'fontFamily', 'status_text',
            'animationDuration', 'delayAnimationButton',
            'selectedAnimationIndex', 'selectedAnimationButtonIndex', 'selectedAnimationBackgroundIndex',
            'selectedThemeIndex'
        ];
        this.checkboxes = [
            'showStatus', 'enableLinkCategories', 'canvaEnable', 'buttonThemeEnable',
            'EnableAnimationArticle', 'EnableAnimationButton', 'EnableAnimationBackground',
            'showVerifiedBadge', 'showPartnerBadge'
        ];
        this.radios = [
            'theme', 'accentColor', 'buttonStyle'
        ];
        this.saveTimeout = null;
    }

    init() {
        this.populateFields();
        this.setupListeners();
        window.__PLINKK_SYNC_SIDEBAR__ = () => this.populateFields();
    }

    populateFields() {
        // Use a more robust check for data source
        const config = window.__PLINKK_GET_CONFIG__ ? window.__PLINKK_GET_CONFIG__() : null;
        const data = config || window.__INITIAL_STATE__ || {};
        const settings = data.settings || {};

        // Text fields & Selects
        this.fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const val = data[id] !== undefined ? data[id] : settings[id];
                if (val !== undefined && val !== null) {
                    // Only update if it's not the currently active element to avoid focus jumping
                    if (document.activeElement !== el) {
                        el.value = val;
                    }
                }
            }
        });

        // Checkboxes
        this.checkboxes.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const val = data[id] !== undefined ? data[id] : settings[id];
                if (document.activeElement !== el) {
                    el.checked = !!val;
                }
            }
        });

        // Radios
        this.radios.forEach(name => {
            const val = data[name] !== undefined ? data[name] : settings[name];
            if (val !== undefined && val !== null) {
                const radio = document.querySelector(`input[name="${name}"][value="${val}"]`);
                if (radio && document.activeElement !== radio) radio.checked = true;
            }
        });
    }

    setupListeners() {
        // Listen to all inputs
        document.addEventListener('input', (e) => {
            const target = e.target;
            // Filter to only our fields
            if (this.fields.includes(target.id) || this.checkboxes.includes(target.id) || this.radios.includes(target.name)) {
                this.debouncedSave();
            }
        });

        // Special case for custom accent color
        const customAccent = document.getElementById('customAccentColor');
        if (customAccent) {
            customAccent.addEventListener('input', () => {
                const radio = document.querySelector('input[name="accentColor"]:checked');
                if (radio) radio.checked = false;
                this.debouncedSave();
            });
        }
    }

    debouncedSave() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.save(), 1000);
    }

    async save() {
        if (!this.plinkkId) return;

        const data = {};

        this.fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) data[id] = el.value;
        });

        this.checkboxes.forEach(id => {
            const el = document.getElementById(id);
            if (el) data[id] = el.checked;
        });

        this.radios.forEach(name => {
            const radio = document.querySelector(`input[name="${name}"]:checked`);
            if (radio) data[name] = radio.value;
        });

        const customAccent = document.getElementById('customAccentColor');
        if (customAccent && !data.accentColor) {
            data.accentColor = customAccent.value;
        }

        if (window.__PLINKK_SHOW_SAVING__) window.__PLINKK_SHOW_SAVING__();

        try {
            const res = await fetch(`/api/me/plinkks/${this.plinkkId}/config/plinkk`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error('Failed to save settings');

            if (window.__PLINKK_SHOW_SAVED__) window.__PLINKK_SHOW_SAVED__();

            // Update local state and sync everything
            if (window.__INITIAL_STATE__) Object.assign(window.__INITIAL_STATE__, data);
            if (window.__EDITOR_STORE__) window.__EDITOR_STORE__.set(data);

            // If we have an active preview reload function, call it
            if (window.__PLINKK_RENDERER_RELOAD__) window.__PLINKK_RENDERER_RELOAD__();

        } catch (err) {
            console.error('Settings save error:', err);
            if (window.__PLINKK_SHOW_ERROR__) window.__PLINKK_SHOW_ERROR__();
        }
    }
}

export const settingsManager = new SettingsManager();
