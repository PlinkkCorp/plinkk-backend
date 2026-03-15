<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let pclUsageVisible = false;
	const nf = new Intl.NumberFormat();

	function format(num: number | undefined) {
		return num !== undefined ? nf.format(num) : '—';
	}
</script>

<Head 
	title="À propos" 
	description="En savoir plus sur Plinkk, le projet open-source qui révolutionne les pages de liens."
	canonical="https://plinkk.fr/about"
/>

<main class="relative isolate overflow-hidden min-h-screen">
	<!-- Background Effects -->
	<div class="absolute inset-0 -z-10 overflow-hidden">
		<div class="absolute left-[50%] top-0 -translate-x-1/2 blur-3xl opacity-20" aria-hidden="true">
			<div class="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc]"
				style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)">
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
		<!-- Hero Section -->
		<div class="mx-auto max-w-2xl text-center">
			<h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
				L'alternative open-source <br> à Linktree.
			</h1>
			<p class="mt-6 text-lg leading-8 text-slate-300">
				Plinkk est conçu pour être rapide, beau et respectueux de votre vie privée. <br class="hidden sm:block">
				Une expérience fluide, personnalisable et facile à auto-héberger.
			</p>
			
			<div class="mt-10 flex flex-col items-center justify-center gap-6">
				<div class="flex items-center gap-6 flex-wrap justify-center">
					<a href="https://github.com/PlinkkCorp/plinkk" target="_blank" rel="noopener noreferrer"
						class="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-200 transition-all hover:scale-105">
						Star sur GitHub
					</a>
					<a href="https://github.com/PlinkkCorp/plinkk-backend" target="_blank" rel="noopener noreferrer"
						class="rounded-xl bg-slate-800/80 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition-all hover:scale-105">
						Repo Backend
					</a>
					<a href="/docs" class="text-sm font-semibold leading-6 text-white hover:text-violet-300 transition-colors">
						Documentation <span aria-hidden="true">→</span>
					</a>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
					<a href="https://github.com/PlinkkCorp/plinkk" target="_blank" rel="noopener noreferrer"
						class="rounded-xl bg-slate-900/30 p-4 border border-white/5 flex flex-col items-start gap-2 hover:bg-slate-900/50 transition-colors group">
						<div class="font-semibold text-white group-hover:text-violet-300">Plinkk</div>
						<div class="text-sm text-slate-300 flex items-center gap-4">
							<span class="flex items-center gap-1">⭐ {format(data.repoStats['PlinkkCorp/plinkk']?.stars)}</span>
							<span class="flex items-center gap-1">🍴 {format(data.repoStats['PlinkkCorp/plinkk']?.forks)}</span>
						</div>
					</a>
					<a href="https://github.com/PlinkkCorp/plinkk-backend" target="_blank" rel="noopener noreferrer"
						class="rounded-xl bg-slate-900/30 p-4 border border-white/5 flex flex-col items-start gap-2 hover:bg-slate-900/50 transition-colors group">
						<div class="font-semibold text-white group-hover:text-violet-300">Plinkk Backend</div>
						<div class="text-sm text-slate-300 flex items-center gap-4">
							<span class="flex items-center gap-1">⭐ {format(data.repoStats['PlinkkCorp/plinkk-backend']?.stars)}</span>
							<span class="flex items-center gap-1">🍴 {format(data.repoStats['PlinkkCorp/plinkk-backend']?.forks)}</span>
						</div>
					</a>
				</div>
			</div>
		</div>

		<!-- Features Grid -->
		<div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
			<dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
				<div class="flex flex-col bg-slate-900/40 backdrop-blur-md rounded-3xl p-8 border border-white/5 hover:border-violet-500/30 transition-colors group">
					<dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
						Open Source
					</dt>
					<dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
						<p class="flex-auto">
							Le code de <strong>Plinkk Backend</strong> est open source sous <strong>PCL</strong>.<br>
							<button 
								on:click={() => pclUsageVisible = !pclUsageVisible}
								class="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-violet-300 hover:bg-slate-700 transition-colors"
							>
								Découvrir les usages autorisés
								<span class="transition-transform duration-200" style:transform={pclUsageVisible ? 'rotate(180deg)' : ''}>▼</span>
							</button>
							{#if pclUsageVisible}
								<div class="mt-3 rounded-lg bg-slate-800/80 p-4 text-sm text-slate-300 border border-violet-900/30 animate-in fade-in slide-in-from-top-2">
									<strong>Usages autorisés :</strong> consultation, apprentissage, contribution, usage strictement privé.<br>
									<strong>Interdit :</strong> tout usage commercial ou auto-hébergement sans accord écrit.
								</div>
							{/if}
						</p>
					</dd>
				</div>
				<!-- Simplified for now -->
			</dl>
		</div>

		<!-- Team Section -->
		<div class="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
			<h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl text-center mb-16">L'équipe</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
				<div class="group block">
					<div class="relative aspect-[3/2] w-full rounded-2xl overflow-hidden">
						<img class="absolute inset-0 h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src="https://github.com/Klaynight-dev.png?size=400" alt="Klaynight">
						<div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
						<div class="absolute bottom-0 left-0 p-6">
							<h3 class="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors">Klaynight-dev</h3>
							<p class="text-sm text-slate-300">Lead Developer & UI/UX</p>
						</div>
					</div>
				</div>
				<div class="group block">
					<div class="relative aspect-[3/2] w-full rounded-2xl overflow-hidden">
						<img class="absolute inset-0 h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src="https://github.com/Marvideo2009.png?size=400" alt="Marvideo">
						<div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
						<div class="absolute bottom-0 left-0 p-6">
							<h3 class="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors">Marvideo2009</h3>
							<p class="text-sm text-slate-300">Backend & DevOps</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>
