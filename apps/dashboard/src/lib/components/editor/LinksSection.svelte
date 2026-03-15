<script lang="ts">
	export let plinkk: any;
	export let categories: any[] = [];
	export let onupdate: (field: string, value: any) => void = () => {};
	export let onaddLink: () => void = () => {};
	export let oneditLink: (link: any) => void = () => {};
	export let ondeleteLink: (id: string) => void = () => {};
	export let onaddSocialIcon: () => void = () => {};
	export let oneditSocialIcon: (icon: any) => void = () => {};
	export let ondeleteSocialIcon: (id: string) => void = () => {};
	export let onaddCategory: () => void = () => {};

	$: links = plinkk.links || [];
	$: socialIcons = plinkk.socialIcons || [];

	function handleUpdate(field: string, value: any) {
		onupdate(field, value);
	}

	function handleEditLink(link: any) {
		oneditLink(link);
	}

	function handleDeleteLink(linkId: string) {
		ondeleteLink(linkId);
	}

	function handleAddLink() {
		onaddLink();
	}

	function handleAddHeader() {
		// Just reuse addLink if the logic handles it, or add a specific one
		onaddLink(); 
	}

	function handleAddSocialIcon() {
		onaddSocialIcon();
	}

	function handleEditSocialIcon(icon: any) {
		oneditSocialIcon(icon);
	}

	function handleDeleteSocialIcon(iconId: string) {
		ondeleteSocialIcon(iconId);
	}
</script>

<div class="space-y-6">
	<div class="mb-6 pb-4 border-b border-slate-800 flex items-center justify-between">
		<div>
			<h3 class="text-lg font-semibold text-white">Liens</h3>
			<p class="text-sm text-slate-400">Gère tes liens et en-têtes.</p>
		</div>
	</div>

	<!-- RÉSEAUX SOCIAUX -->
	<div class="mb-8 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
					<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
					</svg>
				</div>
				<h4 class="text-sm font-semibold text-white">Réseaux Sociaux</h4>
			</div>
			<button 
				type="button"
				onclick={handleAddSocialIcon}
				class="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1.5"
			>
				<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<line x1="12" y1="5" x2="12" y2="19"></line>
					<line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
				Ajouter un réseau
			</button>
		</div>

		<div class="flex flex-wrap gap-3 min-h-[40px]">
			{#each socialIcons as icon}
				<div 
					class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all group relative shadow-md cursor-pointer"
					onclick={() => handleEditSocialIcon(icon)}
					onkeydown={(e) => e.key === 'Enter' && handleEditSocialIcon(icon)}
					role="button"
					tabindex="0"
				>
					<img 
						src={icon.icon.startsWith('http') || icon.icon.startsWith('/') ? icon.icon : `https://cdn.plinkk.fr/icons/${icon.icon}.svg`}
						alt={icon.name || "Social Icon"}
						class="size-6 object-contain"
					/>
					<div class="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
						<button 
							type="button"
							onclick={(e) => { e.stopPropagation(); handleDeleteSocialIcon(icon.id); }}
							class="size-5 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 shadow-sm"
							aria-label="Supprimer le réseau social"
						>
							<svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"></path></svg>
						</button>
					</div>
				</div>
			{:else}
				<div class="text-xs text-slate-600 italic py-2">Aucun réseau social ajouté.</div>
			{/each}
		</div>
	</div>

	<div class="space-y-4">
		<div class="space-y-3 min-h-[50px]">
			{#each links as link}
				<div class="group relative bg-slate-950 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700">
					<div class="flex items-center justify-between gap-4">
						<div class="flex-1 flex items-center gap-3">
							<div class="cursor-move text-slate-600 hover:text-slate-400 p-1">
								<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<circle cx="9" cy="12" r="1"></circle>
									<circle cx="9" cy="5" r="1"></circle>
									<circle cx="9" cy="19" r="1"></circle>
									<circle cx="15" cy="12" r="1"></circle>
									<circle cx="15" cy="5" r="1"></circle>
									<circle cx="15" cy="19" r="1"></circle>
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<h4 class="text-sm font-medium text-slate-200 truncate">
									{link.text || link.name || 'Sans titre'}
								</h4>
								<p class="text-xs text-slate-500 truncate">
									{link.url}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-1 opacity-10 sm:opacity-0 group-hover:opacity-100 transition-opacity">
							<button 
								onclick={() => handleEditLink(link)}
								class="p-2 text-slate-400 hover:text-white transition-colors"
								aria-label="Modifier le lien"
							>
								<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
									<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
								</svg>
							</button>
							<button 
								onclick={() => handleDeleteLink(link.id)}
								class="p-2 text-slate-400 hover:text-red-400 transition-colors"
								aria-label="Supprimer le lien"
							>
								<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="3 6 5 6 21 6"></polyline>
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
								</svg>
							</button>
						</div>
					</div>
				</div>
			{:else}
				<div class="text-center py-8 text-slate-500 text-sm italic border border-dashed border-slate-800 rounded-xl">
					Aucun lien créé.
				</div>
			{/each}
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
			<button 
				onclick={handleAddLink}
				class="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all shadow-lg shadow-violet-900/20 group"
			>
				<div class="bg-white/20 p-1 rounded-lg group-hover:scale-110 transition-transform">
					<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
				</div>
				Ajouter un lien
			</button>
			<button 
				onclick={handleAddHeader}
				class="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all border border-slate-700 hover:border-slate-600 group"
			>
				<div class="bg-slate-700 p-1 rounded-lg group-hover:bg-slate-600 transition-colors">
					<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
						<path d="M4 6h16M4 12h16M4 18h7" />
					</svg>
				</div>
				Ajouter un en-tête
			</button>
		</div>
	</div>
	<!-- CATEGORIES (If Any) -->
	{#if categories && categories.length > 0}
		<div class="space-y-4 pt-6 border-t border-slate-800">
			<div class="flex items-center justify-between">
				<h4 class="text-sm font-semibold text-white">Catégories</h4>
				<button 
					type="button"
					onclick={() => onaddCategory()}
					class="text-xs text-violet-400 hover:text-violet-300"
				>
					Gérer les catégories
				</button>
			</div>
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
				{#each categories as cat}
					<div class="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 truncate">
						{cat.name}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
