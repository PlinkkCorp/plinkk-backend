<script lang="ts">
	import EmailVerificationBanner from '$lib/components/EmailVerificationBanner.svelte';
	import OnboardingModal from '$lib/components/OnboardingModal.svelte';

	export let data;

	$: ({ user, plinkk, stats, links, frontendUrl } = data);

	const fmt = new Intl.NumberFormat('fr-FR');
</script>

<OnboardingModal {user} plinkkUrl="{frontendUrl}/p/{plinkk?.slug || user?.id}" />

<div class="space-y-8">
	<EmailVerificationBanner {user} />

	{#if !user.isPremium}
		<div class="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-violet-500/10 p-5 mb-0">
			<div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDMiIGN4PSIzMCIgY3k9IjMwIiByPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-50"></div>
			<div class="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div class="flex items-center gap-4">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
						<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
						</svg>
					</div>
					<div>
						<p class="text-sm font-semibold text-white">Débloquez tout le potentiel de Plinkk</p>
						<p class="text-xs text-slate-400 mt-0.5">Plus de pages, thèmes exclusifs, stats avancées — à partir de 4,99€/mois</p>
					</div>
				</div>
				<div class="flex items-center gap-3 flex-shrink-0">
					<a href="/premium" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold shadow-lg shadow-violet-900/20 hover:shadow-violet-900/40 hover:-translate-y-0.5 transition-all whitespace-nowrap">
						Passer à Premium →
					</a>
				</div>
			</div>
		</div>
	{/if}

	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
		<div class="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
		<div class="relative z-10">
			<h1 class="text-3xl md:text-4xl font-bold text-white mb-2">Bonjour, <span class="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">{user?.userName || 'Créateur'}</span> 👋</h1>
			<p class="text-slate-400 text-lg">Prêt à développer votre audience aujourd'hui ?</p>
		</div>
		<div class="flex gap-3 relative z-10">
			<a href="/p/{plinkk?.slug || user?.id}" target="_blank" class="px-5 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl border border-slate-600 transition-all flex items-center gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
					<polyline points="15 3 21 3 21 9"></polyline>
					<line x1="10" y1="14" x2="21" y2="3"></line>
				</svg>
				Voir ma page
			</a>
			<button on:click={() => navigator.clipboard.writeText(`${frontendUrl}/p/${plinkk?.slug || user?.id}`)} class="px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-lg shadow-violet-900/20 transition-all flex items-center gap-2 font-medium">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
					<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
				</svg>
				Copier le lien
			</button>
		</div>
	</div>

	<div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
		<div class="space-y-8">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors">
					<div class="flex items-center justify-between mb-4">
						<div class="p-3 bg-blue-500/10 rounded-xl text-blue-400">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
								<circle cx="12" cy="12" r="3"></circle>
							</svg>
						</div>
					</div>
					<p class="text-slate-400 text-sm font-medium">Vues totales</p>
					<h3 class="text-3xl font-bold text-white mt-1">{fmt.format(stats.views)}</h3>
				</div>
				<div class="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors">
					<div class="flex items-center justify-between mb-4">
						<div class="p-3 bg-violet-500/10 rounded-xl text-violet-400">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
								<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
							</svg>
						</div>
					</div>
					<p class="text-slate-400 text-sm font-medium">Clics totaux</p>
					<h3 class="text-3xl font-bold text-white mt-1">{fmt.format(stats.clicks)}</h3>
				</div>
				<div class="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors">
					<div class="flex items-center justify-between mb-4">
						<div class="p-3 bg-pink-500/10 rounded-xl text-pink-400">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M12 20v-6M6 20V10M18 20V4"></path>
							</svg>
						</div>
					</div>
					<p class="text-slate-400 text-sm font-medium">Taux de clic (CTR)</p>
					<h3 class="text-3xl font-bold text-white mt-1">{stats.ctr}</h3>
				</div>
			</div>

			<div>
				<h2 class="text-lg font-semibold text-white mb-4">Actions rapides</h2>
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
					<a href="/edit" class="group flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-violet-500/50 transition-all cursor-pointer">
						<div class="w-12 h-12 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M5 12h14"></path>
								<path d="M12 5v14"></path>
							</svg>
						</div>
						<span class="text-sm text-center font-medium text-slate-300 group-hover:text-white">Ajouter un lien</span>
					</a>
					<a href="/edit?tab=appearance" class="group flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-pink-500/50 transition-all cursor-pointer">
						<div class="w-12 h-12 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
							</svg>
						</div>
						<span class="text-sm font-medium text-slate-300 group-hover:text-white">Apparence</span>
					</a>
					<a href="/stats" class="group flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-blue-500/50 transition-all cursor-pointer">
						<div class="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<line x1="18" y1="20" x2="18" y2="10"></line>
								<line x1="12" y1="20" x2="12" y2="4"></line>
								<line x1="6" y1="20" x2="6" y2="14"></line>
							</svg>
						</div>
						<span class="text-sm font-medium text-slate-300 group-hover:text-white">Statistiques</span>
					</a>
					<a href="/account" class="group flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-orange-500/50 transition-all cursor-pointer">
						<div class="w-12 h-12 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
								<circle cx="12" cy="12" r="3"></circle>
							</svg>
						</div>
						<span class="text-sm font-medium text-slate-300 group-hover:text-white">Paramètres</span>
					</a>
				</div>
			</div>

			<div class="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
				<div class="p-6 border-b border-slate-800 flex justify-between items-center">
					<h3 class="font-semibold text-white text-lg">Vos liens performants</h3>
					<a href="/edit" class="text-sm text-violet-400 hover:text-violet-300 font-medium">Voir tout →</a>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left">
						<thead class="bg-slate-950/50 text-xs uppercase font-semibold text-slate-500">
							<tr>
								<th class="px-6 py-4">Titre</th>
								<th class="px-6 py-4">Lien</th>
								<th class="px-6 py-4 text-right">Clics</th>
								<th class="px-6 py-4 text-right">Statut</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-800 text-sm">
							{#each links as link}
								<tr class="hover:bg-slate-800/30 transition-colors">
									<td class="px-6 py-4 font-medium text-slate-200">{link.text || 'Sans titre'}</td>
									<td class="px-6 py-4 text-slate-400 truncate max-w-[200px]">{link.url}</td>
									<td class="px-6 py-4 text-right text-slate-300">{link.clicks || 0}</td>
									<td class="px-6 py-4 text-right">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">Actif</span>
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="4" class="px-6 py-12 text-center text-slate-500">
										<div class="flex flex-col items-center justify-center">
											<div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-slate-600">
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
													<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
													<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
												</svg>
											</div>
											<p>Aucun lien pour le moment.</p>
											<a href="/edit" class="mt-2 text-violet-400 hover:underline">Ajouter votre premier lien</a>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<div>
			<div class="sticky top-8">
				<div class="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 shadow-2xl shadow-black/50 relative overflow-hidden">
					<div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none"></div>

					<div class="flex items-center justify-between mb-6 relative z-10">
						<h3 class="text-base font-semibold text-white">Aperçu mobile</h3>
						<a href="/p/{plinkk?.slug || user?.id}" target="_blank" class="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
								<polyline points="15 3 21 3 21 9"></polyline>
								<line x1="10" y1="14" x2="21" y2="3"></line>
							</svg>
						</a>
					</div>

					<div class="relative mx-auto border-slate-950 bg-slate-950 border-[10px] rounded-[3rem] h-[600px] w-[300px] shadow-xl ring-1 ring-slate-800">
						<div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-slate-950 rounded-b-2xl z-20"></div>

						<div class="w-full h-full rounded-[2.3rem] overflow-hidden bg-white relative z-10">
							<iframe src="{frontendUrl}/p/{plinkk?.slug || user?.id}?preview=1" class="w-full h-full border-0" title="Preview"></iframe>
						</div>
					</div>

					<div class="mt-6 text-center">
						<p class="text-xs text-slate-500">L'aperçu se met à jour automatiquement</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
