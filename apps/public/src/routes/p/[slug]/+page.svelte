<script lang="ts">
	import { onMount } from 'svelte';
	import Head from '$lib/components/Head.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	const { page, user, links, settings, isOwner, publicPath } = data;
	const username = user?.name || page?.slug || 'User';
	const pageTitle = page?.title || username;
	const pageDesc = page?.description || `Découvre le profil de ${username} sur Plinkk !`;

	onMount(async () => {
		// Pass globals needed by the vanilla JS renderer
		(window as any).__PLINKK_USERNAME__ = user?.id || '';
		(window as any).__PLINKK_IDENTIFIER__ = page?.slug || '';
		(window as any).__PLINKK_IS_PREVIEW__ = new URLSearchParams(window.location.search).get('preview') === '1';
		
		// If we want to use the vanilla JS renderer, we should load it here
		// But for now, let's try to render the basic info in Svelte
	});
</script>

<Head 
	title="{pageTitle} — Plinkk" 
	description={pageDesc}
/>

<!-- Basic Svelte Renderer (to be refined) -->
<div class="min-h-screen flex flex-col items-center py-16 px-4" style="background: {settings?.backgroundSize ? 'var(--bg-color)' : '#0f172a'}">
	<div id="profile-article" class="w-full max-w-xl flex flex-col items-center">
		<!-- Profile Image -->
		<div class="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 mb-6">
			{#if settings?.profileImage || user?.image}
				<img src={settings?.profileImage || user?.image} alt={username} class="w-full h-full object-cover" />
			{:else}
				<div class="w-full h-full bg-violet-600 flex items-center justify-center text-4xl font-bold text-white">
					{username.charAt(0).toUpperCase()}
				</div>
			{/if}
		</div>

		<!-- Name & Bio -->
		<h1 class="text-2xl font-bold text-white mb-2">{settings?.userName || username}</h1>
		<p class="text-slate-400 text-center mb-8 max-w-md">{settings?.description || ''}</p>

		<!-- Links -->
		<div class="w-full space-y-4">
			{#each links as link}
				<a href="/click/{link.id}" class="block w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-center text-white font-medium">
					{link.title}
				</a>
			{/each}
		</div>

		<!-- Footer -->
		<div class="mt-12">
			<a href="/" class="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm">
				<img src="https://cdn.plinkk.fr/logo.svg" alt="Plinkk" class="w-5 h-5" />
				Créé avec Plinkk
			</a>
		</div>
	</div>
</div>

<style>
	:global(body) {
		background-color: #07080d;
	}
</style>
