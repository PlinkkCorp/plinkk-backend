export class HistoryManager {
    constructor() {
        this.historyData = { versions: [], backups: [] };
        this.currentTab = 'auto'; // 'auto' | 'manual'
        this.plinkkId = window.__PLINKK_SELECTED_ID__;
    }

    init() {
        this.bindEvents();
        window.switchHistoryTab = (tab) => this.switchTab(tab);
        window.createBackup = () => this.createBackup();
        window.restoreVersion = (id) => this.restoreVersion(id);
        window.previewVersion = (id) => this.previewVersion(id);
        window.toggleDetails = (id) => {
            const el = document.getElementById(`details-${id}`);
            if (el) el.classList.toggle('hidden');
        };
    }

    bindEvents() {
        document.getElementById('refreshHistory')?.addEventListener('click', () => this.loadHistory());

        const btnAuto = document.getElementById('tab-history-auto');
        const btnManual = document.getElementById('tab-history-manual');

        btnAuto?.addEventListener('click', () => this.switchTab('auto'));
        btnManual?.addEventListener('click', () => this.switchTab('manual'));
    }

    async loadHistory() {
        const list = document.getElementById('historyList');
        if (!list) return;

        if (!this.historyData.versions.length && !this.historyData.backups.length) {
            list.innerHTML = this.getSkeletonHtml();
        }

        try {
            const res = await fetch(`/api/me/plinkks/${this.plinkkId}/history`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            this.historyData = await res.json();
            this.renderList();
        } catch (e) {
            console.error('History fetch error:', e);
            list.innerHTML = '<div class="text-center py-8 text-red-400">Erreur lors du chargement de l\'historique.</div>';
        }
    }

    renderList() {
        const list = document.getElementById('historyList');
        const items = this.currentTab === 'auto' ? this.historyData.versions : this.historyData.backups;

        if (items && items.length > 0) {
            list.innerHTML = items.map(v => this.renderItem(v)).join('');
        } else {
            list.innerHTML = '<div class="text-center py-8 text-slate-500">Aucun élément disponible.</div>';
        }
    }

    renderItem(v) {
        const dateStr = new Date(v.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const detailsHtml = v.changes && v.changes.length > 0
            ? `<div class="mt-3 pl-3 border-l-2 border-violet-500/30 text-xs space-y-2 hidden" id="details-${v.id}">
                    ${v.changes.map(c => this.renderChange(c)).join('')}
                   </div>`
            : '';

        // Toggle button if changes exist
        const hasChanges = v.changes && v.changes.length > 0;
        const expandBtn = hasChanges
            ? `<button onclick="toggleDetails('${v.id}')" class="ml-2 text-slate-500 hover:text-slate-300"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button>`
            : '';

        return `
            <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all group">
                <div class="flex items-start justify-between mb-2">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center">
                            <div class="font-medium text-slate-200 truncate">${v.label || (this.currentTab === 'auto' ? 'Modification' : 'Sauvegarde')}</div>
                            ${expandBtn}
                        </div>
                        <div class="text-xs text-slate-500">${dateStr}</div>
                    </div>
                </div>
                ${detailsHtml}
                <div class="flex items-center gap-2 mt-3 justify-end">
                    <button onclick="previewVersion('${v.id}')" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700">Aperçu</button>
                    <button onclick="restoreVersion('${v.id}')" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors shadow-lg shadow-violet-900/20">Restaurer</button>
                </div>
            </div>
        `;
    }

    renderChange(c) {
        if (typeof c === 'string') return `<div>• ${c}</div>`;
        const keyLabel = c.key.replace('.', ' ').replace(/([A-Z])/g, ' $1').toLowerCase();

        let diffHtml = '';
        if (c.type === 'added') diffHtml = `<span class="text-emerald-400 font-medium">Nouveau:</span> <span class="text-slate-200">${c.new}</span>`;
        else if (c.type === 'removed') diffHtml = `<span class="text-rose-400 font-medium">Supprimé:</span> <span class="text-slate-400 line-through">${c.old}</span>`;
        else if (c.type === 'reordered') diffHtml = `<span class="text-violet-400 font-medium">Réorganisé</span>`;
        else diffHtml = `<span class="text-slate-400 line-through">${typeof c.old === 'object' ? '...' : c.old}</span> <span class="mx-1">→</span> <span class="text-emerald-400">${typeof c.new === 'object' ? '...' : c.new}</span>`;

        return `<div class="flex flex-col mb-1 last:mb-0">
                <div class="flex items-center gap-2">
                    <span class="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 uppercase font-bold tracking-tight">${keyLabel}</span>
                    <span class="text-[11px] text-slate-300">${diffHtml}</span>
                </div>
            </div>`;
    }

    switchTab(tab) {
        this.currentTab = tab;
        const btnAuto = document.getElementById('tab-history-auto');
        const btnManual = document.getElementById('tab-history-manual');
        const manualActions = document.getElementById('manual-backup-actions');

        if (tab === 'auto') {
            btnAuto?.classList.add('bg-white', 'shadow', 'text-slate-900');
            btnAuto?.classList.remove('text-slate-400', 'hover:bg-white/[0.12]', 'hover:text-white');
            btnManual?.classList.remove('bg-white', 'shadow', 'text-slate-900');
            btnManual?.classList.add('text-slate-400', 'hover:bg-white/[0.12]', 'hover:text-white');
            manualActions?.classList.add('hidden');
        } else {
            btnManual?.classList.add('bg-white', 'shadow', 'text-slate-900');
            btnManual?.classList.remove('text-slate-400', 'hover:bg-white/[0.12]', 'hover:text-white');
            btnAuto?.classList.remove('bg-white', 'shadow', 'text-slate-900');
            btnAuto?.classList.add('text-slate-400', 'hover:bg-white/[0.12]', 'hover:text-white');
            manualActions?.classList.remove('hidden');
        }
        this.renderList();
    }

    async createBackup() {
        const nameInput = document.getElementById('backupName');
        const name = nameInput.value;
        const btn = document.querySelector('#manual-backup-actions button');

        const originalText = btn.innerText;
        btn.innerText = 'Création...';
        btn.disabled = true;

        try {
            const res = await fetch(`/api/me/plinkks/${this.plinkkId}/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await res.json();
            if (data.ok) {
                nameInput.value = '';
                this.loadHistory();
            } else {
                alert('Erreur: ' + (data.error || 'Impossible de créer la sauvegarde'));
            }
        } catch (e) {
            alert('Erreur lors de la création de la sauvegarde');
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }

    async restoreVersion(versionId) {
        if (!confirm('Êtes-vous sûr de vouloir restaurer cette version ?')) return;
        try {
            const res = await fetch(`/api/me/plinkks/${this.plinkkId}/history/${versionId}/restore`, { method: 'POST' });
            const data = await res.json();
            if (data.ok) window.location.reload();
            else alert('Erreur: ' + (data.error || 'Impossible de restaurer'));
        } catch (e) { alert('Erreur contact serveur'); }
    }

    previewVersion(versionId) {
        const frame = document.getElementById('preview');
        if (!frame) return;
        const url = new URL(frame.src);
        if (versionId) url.searchParams.set('versionId', versionId);
        else url.searchParams.delete('versionId');
        url.searchParams.set('t', Date.now());
        frame.src = url.toString();
        if (window.switchSidebarMode) window.switchSidebarMode('live');
    }

    getSkeletonHtml() {
        return Array(3).fill(0).map(() => `
            <div class="p-4 rounded-xl bg-slate-900/50 border border-slate-800 animate-pulse mb-3">
                <div class="h-4 bg-slate-800 rounded w-1/3 mb-2"></div>
                <div class="h-3 bg-slate-800/60 rounded w-1/4"></div>
            </div>`).join('');
    }
}

export const historyManager = new HistoryManager();
