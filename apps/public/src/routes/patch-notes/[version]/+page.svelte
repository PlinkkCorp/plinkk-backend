<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const { patchNote } = data;

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('fr-FR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<Head 
	title="{patchNote.title} - Patch Notes - Plinkk" 
	description="Découvrez les détails de cette mise à jour Plinkk."
/>

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
		<a href="/patch-notes" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors mb-8">
			<span>←</span> Retour aux patch notes
		</a>

		<div class="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 p-8 sm:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div class="mb-8 pb-8 border-b border-white/5">
				<div class="flex items-center gap-3 mb-6">
					<span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">v{patchNote.version}</span>
				</div>
				
				<h1 class="text-4xl font-bold tracking-tight text-white mb-6">{patchNote.title}</h1>

				<div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-sm text-slate-400">
					<div class="flex items-center gap-2">
						<time datetime={patchNote.publishedAt}>{formatDate(patchNote.publishedAt)}</time>
					</div>

					{#if patchNote.createdBy}
						<div class="flex items-center gap-2">
							{#if patchNote.createdBy.image}
								<img src={patchNote.createdBy.image} alt={patchNote.createdBy.name} class="w-6 h-6 rounded-full object-cover">
							{:else}
								<div class="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-300">
									{patchNote.createdBy.name.charAt(0).toUpperCase()}
								</div>
							{/if}
							<span>{patchNote.createdBy.name}</span>
						</div>
					{/if}
				</div>
			</div>

			<div class="prose prose-invert max-w-none">
				<div class="patch-note-content text-slate-300 leading-relaxed">
					{@html patchNote.htmlContent}
				</div>
			</div>

			<div class="mt-12 pt-8 border-t border-white/5 text-center">
				<p class="text-slate-400 mb-6">✨ Merci de votre soutien ! ❤️</p>
				<a href="/patch-notes" class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium transition-all active:scale-[0.97]">
					Voir tous les patchs
				</a>
			</div>
		</div>
	</div>
</main>

<style>
	/* Add original styles for content rendering if needed */
	:global(.patch-note-content h2) {
		font-size: 1.5rem;
		font-weight: 700;
		color: rgb(196 181 253);
		margin-top: 2rem;
		margin-bottom: 1rem;
	}
	:global(.patch-note-content p) {
		margin-bottom: 1rem;
	}
</style>
