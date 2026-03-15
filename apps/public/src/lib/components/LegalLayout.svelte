<script lang="ts">
	import Head from '$lib/components/Head.svelte';

	export let title: string;
	export let description: string;
	export let lastUpdated: string;
	export let activePage: string;
</script>

<Head {title} {description} />

<main class="relative isolate overflow-hidden min-h-screen">
	<!-- Background Effects -->
	<div class="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
		<div class="absolute left-[50%] top-0 -translate-x-1/2 blur-3xl opacity-20" aria-hidden="true">
			<div class="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc]"
				style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)">
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-4xl px-6 py-24 sm:py-32">
		<div class="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
			<h1 class="text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
			<div class="mt-4 flex items-center justify-center gap-2 text-slate-400">
				<span>Dernière mise à jour : <span class="text-slate-200 font-medium">{lastUpdated}</span></span>
			</div>
		</div>

		<div class="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 p-8 sm:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
			<!-- Navigation -->
			<nav class="flex flex-wrap gap-2 mb-12 border-b border-white/5 pb-8">
				<a href="/terms" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {activePage === 'terms' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}">Conditions d'utilisation</a>
				<a href="/cgv" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {activePage === 'cgv' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}">Conditions de vente</a>
				<a href="/privacy" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {activePage === 'privacy' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}">Confidentialité</a>
				<a href="/cookies" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {activePage === 'cookies' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}">Cookies</a>
				<a href="/legal" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {activePage === 'legal' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}">Mentions légales</a>
			</nav>

			<div class="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-violet-400 prose-a:no-underline hover:prose-a:text-violet-300 prose-strong:text-white prose-li:text-slate-300">
				<slot />
			</div>
		</div>
	</div>
</main>
