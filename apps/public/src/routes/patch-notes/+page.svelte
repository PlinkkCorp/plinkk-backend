<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('fr-FR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function stripHtmlAndTruncate(html: string, length: number) {
		const text = html.replace(/<[^>]*>/g, '').replace(/#+\s/g, '').replace(/\*\*/g, '').replace(/[-*]\s/g, '');
		return text.substring(0, length) + (text.length > length ? '...' : '');
	}
</script>

<Head 
	title="Patch Notes - Plinkk" 
	description="Découvrez toutes les mises à jour et améliorations de Plinkk."
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
		<div class="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
			<h1 class="text-4xl font-bold tracking-tight text-white sm:text-5xl">
				Patch Notes Plinkk
			</h1>
			<p class="mt-4 text-slate-400">Découvrez toutes les mises à jour et améliorations</p>
		</div>

		{#if data.patchNotes && data.patchNotes.length > 0}
			<div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
				{#each data.patchNotes as note, index}
					<a href="/patch-notes/{note.version}" class="block group">
						<div class="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 sm:p-8 shadow-xl hover:border-violet-500/20 hover:bg-slate-900/60 transition-all duration-300">
							<div class="flex items-start justify-between gap-4 mb-4">
								<div class="flex items-center gap-3 flex-1">
									<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 text-sm font-bold flex-shrink-0">{index + 1}</span>
									<h3 class="text-lg sm:text-xl font-bold text-white group-hover:text-violet-300 transition-colors truncate">{note.title}</h3>
								</div>
								<span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">v{note.version}</span>
							</div>

							<div class="flex items-center gap-4 text-sm text-slate-400 mb-4">
								<span>{formatDate(note.publishedAt)}</span>
								{#if note.createdBy}
									<div class="flex items-center gap-2">
										{#if note.createdBy.image}
											<img src={note.createdBy.image} alt={note.createdBy.name} class="w-5 h-5 rounded-full object-cover">
										{:else}
											<div class="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-300">
												{note.createdBy.name.charAt(0).toUpperCase()}
											</div>
										{/if}
										<span>{note.createdBy.name}</span>
									</div>
								{/if}
							</div>

							<p class="text-slate-300 text-sm leading-relaxed line-clamp-2">
								{stripHtmlAndTruncate(note.content, 200)}
							</p>

							<div class="mt-4 inline-flex items-center gap-2 text-violet-400 text-sm font-medium group-hover:gap-3 transition-all">
								<span>Voir plus</span>
								<span class="transition-transform group-hover:translate-x-1">→</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="text-center py-16">
				<p class="text-xl text-slate-400 mb-4">Aucune mise à jour publiée pour le moment</p>
			</div>
		{/if}
	</div>
</main>
