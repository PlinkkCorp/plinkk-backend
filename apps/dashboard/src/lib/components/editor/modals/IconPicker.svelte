<script lang="ts">
	export let show = false;
	export let email = '';
	export let onselect: (url: string) => void = () => {};
	export let onclose: () => void = () => {};

	let activeTab = 'library';
	let iconCatalog: any[] = [];
	let userUploads: any[] = [];
	let isLoadingIcons = false;
	let isLoadingUploads = false;
	let iconSearch = '';
	let uploadSearch = '';
	let gravatarUrl = '';

	const tabs = [
		{ id: 'library', label: 'Bibliothèque', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
		{ id: 'uploads', label: 'Mes images', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
		{ id: 'gravatar', label: 'Gravatar', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' }
	];

	$: filteredIcons = iconCatalog.filter(i => 
		!iconSearch || 
		(i.displayName && i.displayName.toLowerCase().includes(iconSearch.toLowerCase())) || 
		i.slug.includes(iconSearch.toLowerCase())
	);

	$: filteredUploads = userUploads.filter(u => 
		!uploadSearch || (u.name && u.name.toLowerCase().includes(uploadSearch.toLowerCase()))
	);

	async function fetchIcons() {
		if (iconCatalog.length > 0) return;
		isLoadingIcons = true;
		try {
			const res = await fetch('/api/icons');
			if (res.ok) {
				iconCatalog = await res.json();
			}
		} catch (e) {
			console.error('Failed to fetch icons', e);
		} finally {
			isLoadingIcons = false;
		}
	}

	async function fetchUploads() {
		isLoadingUploads = true;
		try {
			const res = await fetch('/api/me/uploads');
			if (res.ok) {
				const data = await res.json();
				userUploads = data.uploads || [];
			}
		} catch (e) {
			console.error('Failed to fetch uploads', e);
		} finally {
			isLoadingUploads = false;
		}
	}

	async function updateGravatar() {
		if (!email) return;
		const msgBuffer = new TextEncoder().encode(email.trim().toLowerCase());
		const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
		const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
		gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=mp&s=400`;
	}

	function handleSelect(url: string) {
		onselect(url);
		show = false;
	}

	function close() {
		show = false;
		onclose();
	}

	$: if (show && activeTab === 'library') fetchIcons();
	$: if (show && activeTab === 'uploads') fetchUploads();
	$: if (show && activeTab === 'gravatar') updateGravatar();
</script>

{#if show}
	<div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={close}></div>
		
		<div class="relative w-full max-w-4xl max-h-[85vh] bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
			<!-- HEADER -->
			<div class="flex items-center justify-between px-6 py-4 border-b border-white/5">
				<h3 class="text-lg font-semibold text-white">Sélectionner une image</h3>
				<button onclick={close} class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
					<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
				</button>
			</div>

			<div class="flex flex-1 overflow-hidden">
				<!-- SIDEBAR -->
				<aside class="w-48 border-r border-white/5 bg-[#020617]/50 p-2 space-y-1">
					{#each tabs as tab}
						<button 
							onclick={() => activeTab = tab.id}
							class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all {activeTab === tab.id ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20 shadow-lg shadow-violet-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}"
						>
							<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d={tab.icon}/></svg>
							{tab.label}
						</button>
					{/each}
				</aside>

				<!-- CONTENT -->
				<div class="flex-1 flex flex-col min-h-0 bg-[#0f172a]">
					{#if activeTab === 'library'}
						<div class="p-4 border-b border-white/5 bg-[#0f172a]/50 backdrop-blur-sm">
							<div class="relative">
								<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
								<input 
									type="text" 
									bind:value={iconSearch}
									placeholder="Rechercher une icône..." 
									class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-slate-200 focus:border-violet-500/50 outline-none transition-all placeholder:text-slate-600"
								/>
							</div>
						</div>
						<div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
							{#if isLoadingIcons}
								<div class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
									{#each Array(12) as _}
										<div class="aspect-square rounded-xl bg-white/5 animate-pulse"></div>
									{/each}
								</div>
							{:else}
								<div class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
									{#each filteredIcons as icon}
										<button 
											onclick={() => handleSelect(icon.url || `https://cdn.plinkk.fr/icons/${icon.slug}.svg`)}
											class="group aspect-square p-3 flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-950/50 border border-white/5 hover:border-violet-500/50 hover:bg-white/5 transition-all"
										>
											<img 
												src={icon.url || `https://cdn.plinkk.fr/icons/${icon.slug}.svg`} 
												alt={icon.displayName} 
												class="w-8 h-8 object-contain transition-transform group-hover:scale-110" 
											/>
											<span class="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors truncate w-full text-center">
												{icon.displayName}
											</span>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{:else if activeTab === 'uploads'}
						<div class="p-4 border-b border-white/5 bg-[#0f172a]/50 backdrop-blur-sm">
							<div class="flex items-center gap-3">
								<div class="relative flex-1">
									<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
									<input 
										type="text" 
										bind:value={uploadSearch}
										placeholder="Rechercher dans vos images..." 
										class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-slate-200 focus:border-violet-500/50 outline-none transition-all placeholder:text-slate-600"
									/>
								</div>
							</div>
						</div>
						<div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
							{#if isLoadingUploads}
								<div class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
									{#each Array(8) as _}
										<div class="aspect-square rounded-xl bg-white/5 animate-pulse"></div>
									{/each}
								</div>
							{:else if filteredUploads.length === 0}
								<div class="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
									<svg class="w-12 h-12 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
									<p class="text-sm">Aucune image importée.</p>
								</div>
							{:else}
								<div class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
									{#each filteredUploads as upload}
										<button 
											onclick={() => handleSelect(upload.url)}
											class="group aspect-square p-3 flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-950 border border-white/5 hover:border-violet-500/50 hover:bg-white/5 transition-all"
										>
											<div class="w-20 h-20 rounded-xl overflow-hidden bg-white/5 p-2">
												<img 
													src={upload.url} 
													alt={upload.name} 
													class="w-full h-full object-contain transition-transform group-hover:scale-110" 
												/>
											</div>
											<span class="text-[11px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors truncate w-full text-center">
												{upload.name}
											</span>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{:else if activeTab === 'gravatar'}
						<div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0f172a]">
							<div class="relative group mb-6">
								<div class="absolute -inset-1 bg-gradient-to-tr from-violet-600 to-amber-500 rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
								<div class="relative w-32 h-32 rounded-full border-4 border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
									{#if gravatarUrl}
										<img src={gravatarUrl} alt="Gravatar Preview" class="w-full h-full object-cover" />
									{:else}
										<div class="w-full h-full flex items-center justify-center text-slate-600">
											<svg class="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
										</div>
									{/if}
								</div>
							</div>
							<h4 class="text-xl font-bold text-white mb-2">Votre image Gravatar</h4>
							<p class="text-sm text-slate-400 max-w-sm mb-10 leading-relaxed">
								Cette image est récupérée automatiquement via votre email <br/>
								<span class="text-violet-400 font-medium">{email}</span>
							</p>
							<button 
								onclick={() => handleSelect(gravatarUrl)}
								disabled={!gravatarUrl}
								class="px-8 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-xl shadow-violet-900/20 active:scale-95"
							>
								Utiliser cette image
							</button>
							<a 
								href="https://gravatar.com/" 
								target="_blank" 
								rel="noopener noreferrer"
								class="mt-10 text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1.5 transition-colors"
							>
								Gérer mon Gravatar sur Gravatar.com
								<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
							</a>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

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
