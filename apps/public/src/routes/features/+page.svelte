<script lang="ts">
	import { onMount } from 'svelte';
	import Head from '$lib/components/Head.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	onMount(() => {
		const obs = new IntersectionObserver((entries) => {
			entries.forEach((e) => {
				if (e.isIntersecting) {
					e.target.classList.add('visible');
					obs.unobserve(e.target);
				}
			});
		}, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
		document.querySelectorAll('.feat-reveal').forEach((el) => { obs.observe(el); });
	});
</script>

<Head 
	title="Fonctionnalités" 
	description="Découvrez toutes les fonctionnalités de Plinkk : thèmes personnalisables, statistiques intégrées, SEO optimisé et bien plus."
	canonical="https://plinkk.fr/features"
/>

<main class="relative isolate overflow-hidden min-h-screen">
	<!-- Background Effects -->
	<div class="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
		<div class="absolute left-[50%] top-0 -translate-x-1/2 blur-3xl opacity-20" aria-hidden="true">
			<div class="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#7c3aed] to-[#06b6d4]"
				style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)">
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
		<!-- Hero -->
		<div class="mx-auto max-w-3xl text-center feat-reveal">
			<span class="section-badge bg-violet-500/10 text-violet-400 ring-1 ring-inset ring-violet-500/20 mb-6">
				Toutes les fonctionnalités
			</span>
			<h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
				Tout ce dont vous avez besoin,<br>en une seule plateforme.
			</h1>
			<p class="mt-6 text-lg leading-8 text-slate-400 max-w-2xl mx-auto">
				De la personnalisation avancée aux statistiques en temps réel, Plinkk vous offre un outil complet pour créer des pages de liens uniques et performantes.
			</p>
			<div class="mt-8 flex items-center justify-center gap-4">
				<a href="{data.dashboardUrl}/login#signup" class="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500 transition-all hover:scale-105 hover:shadow-violet-500/40">
					Commencer gratuitement
				</a>
				<a href="/pricing" class="rounded-xl bg-white/5 px-6 py-3 text-sm font-semibold text-slate-300 ring-1 ring-inset ring-white/10 hover:bg-white/10 hover:text-white transition-all">
					Voir les tarifs
				</a>
			</div>
		</div>

		<!-- Profils & Pages Section -->
		<section class="mt-32 feat-reveal">
			<div class="flex flex-col items-center text-center mb-12">
				<h2 class="text-3xl font-bold text-white sm:text-4xl">Votre page, votre identité</h2>
				<p class="mt-3 text-slate-400 max-w-xl">Créez des pages de liens uniques qui reflètent parfaitement votre image.</p>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<!-- Features would be mapped here, simplified for brevity -->
				<div class="feat-card rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-white/5 hover:border-indigo-500/30 p-6">
					<h3 class="mt-4 text-sm font-semibold text-white">Multi-pages</h3>
					<p class="mt-1.5 text-xs text-slate-400 leading-relaxed">Créez plusieurs pages Plinkk : 1 en gratuit, 2 en Premium, et ajoutez-en plus à la carte.</p>
				</div>
				<!-- More cards... -->
			</div>
		</section>
	</div>
</main>

<style>
	:global(.feat-reveal) {
		opacity: 0;
		transform: translateY(32px);
		transition: opacity .7s cubic-bezier(.16, 1, .3, 1), transform .7s cubic-bezier(.16, 1, .3, 1);
	}
	:global(.feat-reveal.visible) {
		opacity: 1;
		transform: none;
	}
	.feat-card {
		transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
	}
	.feat-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 32px -8px rgba(139, 92, 246, .15);
	}
	.section-badge {
		display: inline-flex;
		align-items: center;
		gap: .375rem;
		font-size: .75rem;
		font-weight: 600;
		letter-spacing: .05em;
		text-transform: uppercase;
		padding: .25rem .75rem;
		border-radius: 9999px;
	}
</style>
