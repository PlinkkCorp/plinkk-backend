<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let loading = false;
	let plinkkGems = data.plinkkGems;

	async function completeQuest(questId: string, actionUrl: string) {
		loading = true;
		try {
			const res = await fetch(`/api/quests/${questId}/complete`, {
				method: 'POST'
			});
			const result = await res.json();

			if (res.ok) {
				if (!result.alreadyCompleted) {
					plinkkGems += result.rewardGems;
				}
				window.open(result.actionUrl || actionUrl, '_blank');
				// Refresh data or update local state
			} else {
				alert(result.message || 'Erreur lors de la quête.');
			}
		} catch (err) {
			alert('Erreur réseau');
		} finally {
			loading = false;
		}
	}
</script>

<Head 
	title="Partenaires & Plinkk Gems" 
	description="Découvrez nos partenaires et gagnez des Plinkk Gems !"
/>

<!-- Particles background base (simplified CSS) -->
<div class="fixed inset-0 z-[-1] bg-slate-950">
	<div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.15),transparent_50%)]"></div>
	<div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.1),transparent_50%)]"></div>
</div>

<main class="min-h-screen pt-24 pb-20 px-4 max-w-7xl mx-auto">
	<div class="text-center mb-16 relative">
		<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
			Partenaires & Récompenses
		</div>
		<h1 class="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
			Soutenez nos <span class="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">partenaires</span>
		</h1>
		<p class="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
			Accomplissez des quêtes en interagissant avec nos partenaires et gagnez des <strong class="text-violet-400 font-semibold">Plinkk Gems</strong>.
		</p>
	</div>

	{#if data.error}
		<div class="text-rose-400 text-center py-20">
			<p>{data.error}</p>
		</div>
	{:else if data.partners.length === 0}
		<div class="col-span-full py-20 text-center bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5">
			<h3 class="text-xl font-bold text-white">Aucun partenaire</h3>
			<p class="text-slate-400 mt-2">Revenez plus tard pour découvrir de nouvelles quêtes !</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.partners as partner}
				<div class="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden flex flex-col group transition-all hover:border-violet-500/30">
					<!-- Banner & Logo -->
					<div class="h-40 relative overflow-hidden bg-slate-900">
						{#if partner.bannerUrl}
							<img src={partner.bannerUrl} alt="Banner" class="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500">
						{:else}
							<div class="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900">}</div>
						{/if}
						<div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
						
						<div class="absolute -bottom-6 left-6 z-10">
							<div class="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-slate-800 overflow-hidden flex items-center justify-center shadow-2xl relative group-hover:-translate-y-1 transition-transform duration-300">
								{#if partner.logoUrl}
									<img src={partner.logoUrl} alt="Logo" class="w-full h-full object-contain p-2">
								{:else}
									<span class="text-3xl font-black text-slate-600">{partner.name.charAt(0).toUpperCase()}</span>
								{/if}
							</div>
						</div>
					</div>

					<div class="p-6 pt-10 flex-1 flex flex-col z-20 relative text-white">
						<h3 class="text-2xl font-bold mb-2 group-hover:text-violet-400 transition-colors">{partner.name}</h3>
						<p class="text-sm text-slate-400 mb-6 flex-1">{partner.description || ''}</p>
						
						<div class="border-t border-slate-800/60 pt-4">
							<div class="space-y-2">
								{#each partner.quests as quest}
									{@const completed = data.userQuests.includes(quest.id)}
									<div class="p-3 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between gap-3">
										<div class="flex-1 min-w-0 text-left">
											<h4 class="text-sm font-bold truncate">{quest.title}</h4>
										</div>
										<button 
											on:click={() => !completed && completeQuest(quest.id, quest.actionUrl)}
											class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all {completed ? 'bg-slate-800 text-slate-500 grayscale cursor-default' : 'bg-violet-600 hover:bg-violet-500 text-white'}"
										>
											{#if completed}
												✓ Quête accomplie
											{:else}
												+{quest.rewardGems} Gems
											{/if}
										</button>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</main>
