<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let searchQuery = '';
	let sortBy = 'name-asc';

	$: filteredPlinkks = data.plinkks.filter((p: any) => {
		const searchStr = `${p.name} ${p.slug} ${p.user?.userName || ''} ${p.settings?.affichageEmail || ''}`.toLowerCase();
		return searchStr.includes(searchQuery.toLowerCase());
	});

	$: sortedPlinkks = [...filteredPlinkks].sort((a: any, b: any) => {
		const nameA = (a.name || '').toLowerCase();
		const nameB = (b.name || '').toLowerCase();
		const slugA = (a.slug || '').toLowerCase();
		const slugB = (b.slug || '').toLowerCase();

		switch (sortBy) {
			case 'name-asc': return nameA.localeCompare(nameB);
			case 'name-desc': return nameB.localeCompare(nameA);
			case 'id-asc': return slugA.localeCompare(slugB);
			case 'id-desc': return slugB.localeCompare(slugA);
			default: return 0;
		}
	});

	function copyToClipboard(slug: string) {
		const url = `${window.location.origin}/${slug}`;
		navigator.clipboard.writeText(url).then(() => {
			// Could add a toast here
		});
	}

	function getBannerStyle(cosmetics: any, data: any) {
		if (cosmetics.bannerUrl) return `background-image: url('${cosmetics.bannerUrl}')`;
		if (cosmetics.banner === 'gradient-emerald') return 'background: linear-gradient(135deg, #064e3b, #10b981)';
		if (cosmetics.banner === 'gradient-fuchsia') return 'background: linear-gradient(135deg, #701a75, #d946ef)';
		if (cosmetics.banner === 'cosmos') return 'background: linear-gradient(to right, #0f172a, #312e81)';
		return `background: linear-gradient(to right, ${data.primaryColor || '#1e293b'}, ${data.accentColor || '#0f172a'})`;
	}

	function getFrameStyle(frame: string) {
		if (frame === 'neon') return 'box-shadow: 0 0 0 2px rgba(139,92,246,0.8), 0 0 15px rgba(139,92,246,0.6), inset 0 0 10px rgba(139,92,246,0.4); border-radius: 12px;';
		if (frame === 'glow') return 'box-shadow: 0 0 0 2px rgba(16,185,129,0.8), 0 0 15px rgba(16,185,129,0.6); border-radius: 12px;';
		if (frame === 'gold') return 'box-shadow: 0 0 0 2px rgba(234,179,8,0.8), 0 0 15px rgba(234,179,8,0.4); border-radius: 12px;';
		return '';
	}
</script>

<Head title="Utilisateurs" description="Tous les profils hébergés sur Plinkk." />

<main class="max-w-[1600px] mx-auto p-6 pt-24 space-y-8">
	<div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
		<div class="space-y-1">
			<h1 class="text-2xl font-bold tracking-tight text-white">Tous les profils hébergés</h1>
			<p class="text-sm text-slate-400">Découvrez les comptes publics Plinkk.</p>
		</div>

		<div class="w-full md:w-auto flex flex-col sm:flex-row gap-3">
			<div class="relative flex-1 min-w-[300px]">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg class="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</div>
				<input bind:value={searchQuery} type="text" placeholder="Rechercher (nom, @id, email)" class="block w-full pl-10 pr-12 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all sm:text-sm" />
			</div>
			<div class="flex gap-3">
				<select bind:value={sortBy} class="bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-xl focus:ring-violet-500 focus:border-violet-500 block w-full p-2.5">
					<option value="name-asc">Nom (A→Z)</option>
					<option value="name-desc">Nom (Z→A)</option>
					<option value="id-asc">@Id (A→Z)</option>
					<option value="id-desc">@Id (Z→A)</option>
				</select>
				<button on:click={() => { searchQuery = ''; sortBy = 'name-asc'; }} class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors border border-slate-700">
					Réinitialiser
				</button>
			</div>
		</div>
	</div>

	<div class="flex items-center justify-between px-1 text-xs font-medium text-slate-500">
		<p>Total: <span class="text-slate-300">{data.plinkks.length}</span></p>
		<p class="hidden sm:block"><span class="text-slate-300">{sortedPlinkks.length}</span> affiché(s)</p>
	</div>

	{#if sortedPlinkks.length === 0}
		<div class="rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center space-y-3">
			<div class="text-4xl mb-2">🫥</div>
			<h3 class="text-lg font-medium text-slate-200">Aucun Plinkks pour le moment</h3>
			<p class="text-sm text-slate-500">Les Plinkks publics s’afficheront ici.</p>
		</div>
	{:else}
		<ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each sortedPlinkks as plinkk}
				{@const user = plinkk.user || {}}
				{@const cosmetics = user.cosmetics || {}}
				{@const data_cosm = cosmetics.data || {}}
				{@const isBanned = user.email && data.bannedEmails[user.email]}
				<li class="group relative flex flex-col h-full rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] bg-slate-950 border border-slate-800/50 hover:border-violet-500/50">
					<div class="absolute inset-x-0 top-0 h-32 bg-cover bg-center opacity-50" style={getBannerStyle(cosmetics, data_cosm)}></div>
					<div class="relative z-10 p-5 flex flex-col h-full">
						<div class="flex justify-between items-start mb-2">
							<div class="relative h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-white/10" style={getFrameStyle(cosmetics.frame)}>
								<Avatar user={{ ...user, userName: plinkk.name, id: plinkk.slug, profileImage: plinkk.settings?.profileImage }} />
							</div>
							{#if isBanned}
								<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-500/15 border border-rose-500/30 text-rose-400">Banni</span>
							{/if}
						</div>
						<div class="mt-auto pt-2">
							<h3 class="text-lg font-bold text-white truncate">{plinkk.name}</h3>
							<div class="flex items-center justify-between text-xs text-slate-500">
								<span>@{user.userName || plinkk.slug}</span>
								<span>/{plinkk.slug}</span>
							</div>
						</div>
						<div class="mt-4 flex items-center gap-2">
							<a href="/{plinkk.slug}" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-bold transition-colors">
								Voir
							</a>
							<button on:click={() => copyToClipboard(plinkk.slug)} class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
								</svg>
							</button>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</main>
