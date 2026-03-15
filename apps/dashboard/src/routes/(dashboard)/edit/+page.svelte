<script lang="ts">
	import { onMount, tick } from 'svelte';
	import ProfileSection from '$lib/components/editor/ProfileSection.svelte';
	import AppearanceSection from '$lib/components/editor/AppearanceSection.svelte';
	import BackgroundSection from '$lib/components/editor/BackgroundSection.svelte';
	import LinksSection from '$lib/components/editor/LinksSection.svelte';
	import LayoutSection from '$lib/components/editor/LayoutSection.svelte';
	import AnimationsSection from '$lib/components/editor/AnimationsSection.svelte';
	import StatusbarSection from '$lib/components/editor/StatusbarSection.svelte';
import LinkModal from '$lib/components/editor/modals/LinkModal.svelte';
import SocialIconModal from '$lib/components/editor/modals/SocialIconModal.svelte';

	export let data: any;

	let { plinkk, user, themes, pages, userLimits, categories } = data;
	let activeTab = 'links';
	let isSaving = false;
	let saveError = false;
	let lastSavedAt = new Date();

	// Modal State
	let showLinkModal = false;
	let editingLink: any = null;
	let showSocialIconModal = false;
	let editingSocialIcon: any = null;

	const tabs = [
		{ id: 'profile', label: 'Profil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
		{ id: 'links', label: 'Liens', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
		{ id: 'appearance', label: 'Apparence', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3' },
		{ id: 'background', label: 'Fond', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
		{ id: 'animations', label: 'Animations', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
		{ id: 'status', label: 'Statut', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
		{ id: 'layout', label: 'Disposition', icon: 'M4 6h16M4 12h16m-7 6h7' }
	];

	async function updatePlinkk(field: string, value: any) {
		isSaving = true;
		saveError = false;
		
		try {
			const res = await fetch(`?/update`, {
				method: 'POST',
				body: JSON.stringify({ field, value }),
				headers: {
					'x-sveltekit-action': 'true',
					'content-type': 'application/json'
				}
			});
			
			if (res.ok) {
				const result = await res.json();
				// Update local state if needed (usually SvelteKit does this via data refresh if we return it)
				lastSavedAt = new Date();
				syncToPreview();
			} else {
				saveError = true;
			}
		} catch (e) {
			console.error('Save failed', e);
			saveError = true;
		} finally {
			setTimeout(() => { isSaving = false; }, 500);
		}
	}

	async function handleAction(action: string, data: any) {
		isSaving = true;
		saveError = false;
		
		try {
			const res = await fetch(`?/${action}`, {
				method: 'POST',
				body: JSON.stringify(data),
				headers: {
					'x-sveltekit-action': 'true',
					'content-type': 'application/json'
				}
			});
			
			if (res.ok) {
				lastSavedAt = new Date();
				// Force data refresh
				window.location.reload(); // Simple way to refresh data for now, or use invalidateAll()
			} else {
				saveError = true;
			}
		} catch (e) {
			console.error('Action failed', e);
			saveError = true;
		} finally {
			isSaving = false;
		}
	}

	function handleAddLink() {
		editingLink = null;
		showLinkModal = true;
	}

	function handleEditLink(link: any) {
		editingLink = link;
		showLinkModal = true;
	}

	function handleDeleteLink(id: string) {
		if (confirm('Es-tu sûr de vouloir supprimer ce lien ?')) {
			handleAction('deleteLink', { id });
		}
	}

	function handleSaveLink(data: any) {
		handleAction('saveLink', data);
	}

	function handleAddSocialIcon() {
		editingSocialIcon = null;
		showSocialIconModal = true;
	}

	function handleEditSocialIcon(icon: any) {
		editingSocialIcon = icon;
		showSocialIconModal = true;
	}

	function handleDeleteSocialIcon(id: string) {
		if (confirm('Es-tu sûr de vouloir supprimer ce réseau social ?')) {
			handleAction('deleteSocialIcon', { id });
		}
	}

	function handleSaveSocialIcon(data: any) {
		handleAction('saveSocialIcon', data);
	}

	function handleAddLabel() {
		// handle adding label logic (e.g. open a modal or add directly)
		handleAction('addLabel', {});
	}

	function handleAddCategory() {
		// handle adding category logic
		handleAction('addCategory', { name: 'Nouvelle catégorie' });
	}

	function syncToPreview() {
		const iframe = document.querySelector('iframe') as HTMLIFrameElement;
		if (iframe && iframe.contentWindow) {
			iframe.contentWindow.postMessage({ type: 'SYNC_CONFIG', config: plinkk }, '*');
		}
	}

	onMount(() => {
		// Initial sync
		setTimeout(syncToPreview, 1000);
	});
</script>

<div class="flex flex-col h-full bg-[#020617] text-slate-200 overflow-hidden">
	<!-- HEADER -->
	<header class="h-16 shrink-0 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md flex items-center justify-between px-6 z-20">
		<div class="flex items-center gap-4">
			<a href="/dashboard" class="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
				<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
			</a>
			<div class="h-6 w-px bg-white/10"></div>
			<div class="flex flex-col">
				<h1 class="text-sm font-semibold text-white truncate max-w-[200px]">
					{plinkk.slug || 'Éditeur'}
				</h1>
				<div class="flex items-center gap-1.5">
					<div class="size-1.5 rounded-full {isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}"></div>
					<span class="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
						{isSaving ? 'Enregistrement...' : saveError ? 'Erreur de sauvegarde' : 'Modifications enregistrées'}
					</span>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<button class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all border border-white/10">
				Voir la page
			</button>
			<button class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-lg shadow-violet-900/20">
				Publier
			</button>
		</div>
	</header>

	<main class="flex-1 flex overflow-hidden">
		<!-- LEFT SIDEBAR (TABS) -->
		<aside class="w-20 sm:w-64 shrink-0 border-r border-white/5 bg-[#020617] flex flex-col z-10">
			<nav class="flex-1 p-3 space-y-1 overflow-y-auto">
				{#each tabs as tab}
					<button 
						onclick={() => activeTab = tab.id}
						class="w-full flex items-center gap-3 p-3 rounded-xl transition-all group {activeTab === tab.id ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.1)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}"
					>
						<div class="size-10 sm:size-6 flex items-center justify-center shrink-0">
							<svg class="size-6 sm:size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d={tab.icon}/>
							</svg>
						</div>
						<span class="hidden sm:block text-sm font-medium">{tab.label}</span>
					</button>
				{/each}
			</nav>

			<div class="p-4 border-t border-white/5">
				<div class="p-3 rounded-xl bg-slate-900/50 border border-white/5">
					<div class="flex items-center justify-between mb-2">
						<span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Stockage</span>
						<span class="text-[10px] text-violet-400 font-mono">20%</span>
					</div>
					<div class="h-1 w-full bg-white/5 rounded-full overflow-hidden">
						<div class="h-full bg-violet-600 rounded-full" style="width: 20%"></div>
					</div>
				</div>
			</div>
		</aside>

		<!-- CENTER CANVAS (EDITOR) -->
		<section class="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/20 custom-scrollbar">
			<div class="max-w-2xl mx-auto pb-20">
				{#if activeTab === 'profile'}
					<ProfileSection 
						{plinkk} 
						{user}
						onupdate={(field, value) => updatePlinkk(field, value)} 
					/>
				{:else if activeTab === 'links'}
					<LinksSection 
						{plinkk} 
						{categories}
						onupdate={(field, value) => updatePlinkk(field, value)}
						onaddLink={handleAddLink}
						oneditLink={handleEditLink}
						ondeleteLink={handleDeleteLink}
						onaddSocialIcon={handleAddSocialIcon}
						oneditSocialIcon={handleEditSocialIcon}
						ondeleteSocialIcon={handleDeleteSocialIcon}
						onaddCategory={handleAddCategory}
					/>
				{:else if activeTab === 'appearance'}
					<AppearanceSection 
						{plinkk} 
						{themes}
						onupdate={(field, value) => updatePlinkk(field, value)}
						onopenPicker={(data) => { /* handle theme picker */ }}
					/>
				{:else if activeTab === 'background'}
					<BackgroundSection 
						{plinkk} 
						onupdate={(field, value) => updatePlinkk(field, value)}
						onupdateGradient={(data) => updatePlinkk('background', data.colors)}
					/>
				{:else if activeTab === 'animations'}
					<AnimationsSection 
						{plinkk} 
						onupdate={(field, value) => updatePlinkk(field, value)}
						onopenPicker={(data) => { /* handle animation picker */ }}
					/>
				{:else if activeTab === 'status'}
					<StatusbarSection 
						{plinkk} 
						onupdate={(field, value) => updatePlinkk(field, value)}
						onaddLabel={handleAddLabel}
						oneditLabel={(data) => { /* handle edit label */ }}
						ondeleteLabel={(data) => handleAction('deleteLabel', { id: data.id })}
						onopenPicker={(data) => { /* handle emoji picker */ }}
					/>
				{:else if activeTab === 'layout'}
					<LayoutSection 
						{plinkk} 
						onupdate={(field, value) => updatePlinkk(field, value)}
					/>
				{/if}
			</div>
		</section>

		<!-- RIGHT PREVIEW -->
		<aside class="hidden xl:flex w-[480px] shrink-0 border-l border-white/5 bg-[#020617] flex-col p-8 items-center justify-center">
			<div class="relative w-full max-w-[320px] aspect-[9/19] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden ring-1 ring-white/10">
				<!-- Notch -->
				<div class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-30"></div>
				
				<!-- Iframe -->
				<div class="absolute inset-0 bg-white">
					<iframe 
						src="{data.frontendUrl}/{plinkk.slug || plinkk.id}?preview=true" 
						title="Preview" 
						class="w-full h-full border-none"
					></iframe>
				</div>
			</div>
			
			<div class="mt-8 flex flex-col items-center gap-2">
				<div class="flex items-center gap-2 text-slate-500 text-xs font-medium">
					<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
					Aperçu mobile en direct
				</div>
				<p class="text-[10px] text-slate-600 text-center max-w-[200px]">
					Certaines modifications peuvent prendre quelques secondes à apparaître dans l'aperçu.
				</p>
			</div>
		</aside>
	</main>
</div>

<LinkModal 
	bind:show={showLinkModal} 
	link={editingLink} 
	{categories}
	userEmail={user.email}
	onsave={(data) => handleSaveLink(data)}
/>

<SocialIconModal 
	bind:show={showSocialIconModal} 
	icon={editingSocialIcon}
	userEmail={user.email}
	onsave={(data) => handleSaveSocialIcon(data)}
/>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.1);
	}
</style>
