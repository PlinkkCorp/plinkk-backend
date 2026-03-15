<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<Head 
	title="Documentation - Plinkk" 
	description="Documentation complète de Plinkk : guides de démarrage, tutoriels, API, thèmes personnalisés, et bien plus."
/>

<section class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-32">
	<div class="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 px-6 sm:px-10 py-16 text-center shadow-2xl">
		<div class="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
			<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
				<line x1="12" y1="9" x2="12" y2="13" />
				<line x1="12" y1="17" x2="12" y2="17" />
			</svg>
		</div>
		<h1 class="text-4xl font-black text-white mb-4 tracking-tight">Documentation en construction</h1>
		<p class="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
			Nous préparons une documentation claire et complète pour vous aider à maîtriser Plinkk. Elle sera disponible très bientôt !
		</p>
		<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
			<a href="/" class="px-8 py-3 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition-all">
				Retour à l'accueil
			</a>
			<a href="{data.dashboardUrl}/login#signup" class="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold shadow-lg shadow-violet-900/20 hover:shadow-violet-900/40 transition-all active:scale-95">
				Créer mon profil
			</a>
		</div>
	</div>
</section>
