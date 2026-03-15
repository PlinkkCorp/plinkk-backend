<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let user: any;
	export let plinkkUrl: string = '';

	let showModal = false;
	let step = 0;
	const TOTAL_STEPS = 2;

	onMount(() => {
		if (browser) {
			const ONBOARD_KEY = 'plinkk_onboarding_done';
			const createdAt = user?.createdAt;

			if (createdAt && !localStorage.getItem(ONBOARD_KEY)) {
				const created = new Date(createdAt);
				const diffMs = Date.now() - created.getTime();
				
				// Show onboarding if account is less than 10 minutes old
				if (diffMs < 10 * 60 * 1000) {
					setTimeout(() => { showModal = true; }, 400);
				}
			}
		}
	});

	function nextStep() {
		if (step < TOTAL_STEPS - 1) step++;
	}

	function prevStep() {
		if (step > 0) step--;
	}

	function close() {
		if (browser) {
			localStorage.setItem('plinkk_onboarding_done', '1');
		}
		showModal = false;
	}

	async function copyLink(text: string, event: MouseEvent) {
		const btn = event.currentTarget as HTMLButtonElement;
		const span = btn.querySelector('.onboard-copy-text');
		if (!span) return;
		
		const originalText = span.textContent;
		await navigator.clipboard.writeText(text);
		span.textContent = '✓ Copié !';
		setTimeout(() => { span.textContent = originalText; }, 2000);
	}
</script>

{#if showModal}
	<div class="fixed inset-0 z-[100]">
		<div class="absolute inset-0 bg-black/75" onclick={close}></div>
		<div class="relative min-h-screen flex items-center justify-center p-4">
			<div class="w-full max-w-md">
				<div class="bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-onboard-fade-up">
					<!-- Step dots -->
					<div class="flex items-center justify-center gap-2 pt-7 pb-1">
						{#each Array(TOTAL_STEPS) as _, i}
							<div class="onboard-dot h-2 rounded-full transition-all duration-300 {i <= step ? 'bg-violet-500' : 'bg-slate-700'} {i === step ? 'w-4' : 'w-2'}"></div>
						{/each}
					</div>

					<!-- Step 1 : Bienvenue -->
					{#if step === 0}
						<div class="onboard-step px-8 py-8 text-center">
							<div class="w-18 h-18 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-500/30" style="width:72px;height:72px;">
								<svg class="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"/>
								</svg>
							</div>
							<h2 class="text-2xl font-bold text-white mb-2">Ton Plinkk est prêt ! 🎉</h2>
							<p class="text-slate-400 text-sm leading-relaxed mb-5">Ta page de liens est en ligne et accessible dès maintenant.</p>
							<button onclick={(e) => copyLink(plinkkUrl, e)} class="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 hover:bg-violet-500/15 border border-white/10 hover:border-violet-500/40 text-violet-300 text-sm font-medium transition-all max-w-full">
								<svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
								</svg>
								<span class="truncate onboard-copy-text">{plinkkUrl}</span>
								<svg class="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
									<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
								</svg>
							</button>
						</div>
					{/if}

					<!-- Step 2 : Partage -->
					{#if step === 1}
						<div class="onboard-step px-8 py-8 text-center">
							<div class="w-18 h-18 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/30" style="width:72px;height:72px;">
								<svg class="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
									<path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"/>
								</svg>
							</div>
							<h2 class="text-2xl font-bold text-white mb-2">Partage-le partout 🚀</h2>
							<p class="text-slate-400 text-sm leading-relaxed mb-5">Mets ton lien Plinkk dans ta bio Instagram, TikTok, X… et centralise toutes tes pages en un seul endroit.</p>
							<button onclick={(e) => copyLink(plinkkUrl, e)} class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-400/40 text-emerald-400 text-sm font-medium transition-all">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
									<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
								</svg>
								<span class="onboard-copy-text">Copier mon lien</span>
							</button>
						</div>
					{/if}

					<!-- Navigation -->
					<div class="px-8 pb-7">
						<div class="flex items-center justify-center mb-5">
							<a href="/premium" onclick={close} class="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors group">
								<svg class="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
								</svg>
								<span>Boostez votre page avec Premium</span>
								<svg class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
								</svg>
							</a>
						</div>
						<div class="flex items-center justify-between">
							<button onclick={close} class="text-sm text-slate-500 hover:text-slate-300 font-medium transition-colors">
								{step === TOTAL_STEPS - 1 ? 'Fermer' : 'Passer'}
							</button>
							<div class="flex items-center gap-2">
								{#if step > 0}
									<button onclick={prevStep} class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium text-slate-300 transition-colors border border-white/10">
										← Retour
									</button>
								{/if}
								{#if step < TOTAL_STEPS - 1}
									<button onclick={nextStep} class="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-semibold text-white transition-all shadow-lg shadow-violet-500/20">
										Suivant →
									</button>
								{:else}
									<a href="/edit" onclick={close} class="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-sm font-semibold text-white transition-all shadow-lg shadow-emerald-500/20 inline-flex items-center gap-1.5">
										Personnaliser →
									</a>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes onboardFadeUp {
		from { opacity: 0; transform: translateY(24px) scale(0.97); }
		to   { opacity: 1; transform: translateY(0) scale(1); }
	}
	.animate-onboard-fade-up {
		animation: onboardFadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
</style>
