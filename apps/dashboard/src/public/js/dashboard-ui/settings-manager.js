import { store as state } from './state.js';

export class SettingsManager {
    constructor() {
        this.plinkkId = window.__PLINKK_SELECTED_ID__;
        this.fields = [
            'profileLink', 'profileSiteText', 'userName', 'email',
            'profileImage', 'profileIcon', 'iconUrl', 'description',
            'publicPhone', 'affichageEmail', 'fontFamily', 'status_text',
            'animationDuration', 'delayAnimationButton',
            'selectedAnimationIndex', 'selectedAnimationButtonIndex', 'selectedAnimationBackgroundIndex'
        ];
        this.checkboxes = [
            'showStatus', 'enableLinkCategories', 'canvaEnable',
            'EnableAnimationArticle', 'EnableAnimationButton', 'EnableAnimationBackground'
        ];
        this.radios = [
            'theme', 'accentColor', 'buttonStyle'
        ];
        this.saveTimeout = null;
    }

    init() {
        console.log('SettingsManager Initializing...');
        this.populateFields();
        this.setupListeners();
    }

    populateFields() {
        const data = window.__INITIAL_STATE__ || {};
        const settings = data.settings || {};

        // Text fields & Selects
        this.fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const val = data[id] !== undefined ? data[id] : settings[id];
                if (val !== undefined && val !== null) el.value = val;
            }
        });

        // Checkboxes
        this.checkboxes.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const val = data[id] !== undefined ? data[id] : settings[id];
                el.checked = !!val;
            }
        });

        // Radios
        this.radios.forEach(name => {
            const val = data[name] !== undefined ? data[name] : settings[name];
            if (val !== undefined && val !== null) {
                const radio = document.querySelector(`input[name="${name}"][value="${val}"]`);
                if (radio) radio.checked = true;
            }
        });
    }

    setupListeners() {
        // Listen to all inputs
        document.addEventListener('input', (e) => {
            const target = e.target;
            if (this.fields.includes(target.id) || this.checkboxes.includes(target.id) || this.radios.includes(target.name)) {
                this.debouncedSave();
            }
        });

        // Special case for custom accent color
        const customAccent = document.getElementById('customAccentColor');
        if (customAccent) {
            customAccent.addEventListener('input', () => {
                const radio = document.querySelector('input[name="accentColor"]:checked');
                if (radio) radio.checked = false; // Uncheck others if we want... or just let it trigger
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

        // Handle special customAccentColor if any radio is NOT checked and we have color
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

            Object.assign(window.__INITIAL_STATE__, data);
            if (window.__PLINKK_RENDERER_RELOAD__) window.__PLINKK_RENDERER_RELOAD__();

        } catch (err) {
            console.error('Settings save error:', err);
            if (window.__PLINKK_SHOW_ERROR__) window.__PLINKK_SHOW_ERROR__();
        }
    }
}

export const settingsManager = new SettingsManager();
