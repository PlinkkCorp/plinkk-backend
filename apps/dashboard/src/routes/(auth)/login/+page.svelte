<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let email = data.email || '';
	let step = data.step || 'choice';
	let showPassword = false;
	let loading = false;

	$: if (form?.email) email = form.email;
	$: if (form?.error) loading = false;

	onMount(() => {
		// Google Sign-In initialization would go here if needed
	});
</script>

<svelte:head>
	<title>Connexion — Plinkk</title>
</svelte:head>

<div class="fixed inset-0 overflow-hidden pointer-events-none">
	<div class="absolute w-[600px] h-[600px] bg-violet-600/30 -top-48 -left-48 blur-[80px] rounded-full animate-float"></div>
	<div class="absolute w-[500px] h-[500px] bg-indigo-600/20 top-1/4 right-0 blur-[80px] rounded-full animate-float-delayed"></div>
	<div class="absolute w-[400px] h-[400px] bg-fuchsia-600/20 bottom-0 left-1/4 blur-[80px] rounded-full animate-pulse opacity-50"></div>
	<div class="absolute inset-0 bg-[url('https://cdn.plinkk.fr/grid.svg')] opacity-20"></div>
</div>

<main class="relative min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-950 text-white font-sans">
	<div class="w-full max-w-lg">
		<a href="https://plinkk.fr" class="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-6 transition-colors group">
			<svg class="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Retour à l'accueil
		</a>

		<div class="text-center mb-8">
			<a href="/" class="inline-flex items-center gap-3 group">
				<div class="relative">
					<div class="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
					<img src="https://cdn.plinkk.fr/logo.svg" alt="Plinkk" class="relative h-12 w-12 rounded-2xl shadow-2xl" />
				</div>
				<span class="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Plinkk</span>
			</a>
			<p class="mt-4 text-slate-400 text-sm">Créez votre page de liens personnalisée</p>
		</div>

		<div class="bg-slate-900/70 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
			<div class="relative">
				<nav class="grid grid-cols-1 relative z-10">
					<button type="button" class="py-4 text-sm font-semibold text-white border-b-2 border-violet-500">
						Connexion
					</button>
				</nav>
			</div>

			<div class="p-6 sm:p-8 space-y-6">
				{#if step === 'choice' || !data.email || form?.error && step !== 'password'}
					<div class="space-y-6">
						<!-- Google Sign-In Placeholder -->
						<button class="w-full flex items-center justify-center gap-3 bg-white text-slate-950 py-3.5 rounded-xl font-semibold hover:bg-slate-100 transition-all">
							<img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" class="w-5 h-5" alt="Google" />
							Continuer avec Google
						</button>

						<div class="relative py-2">
							<div class="absolute inset-0 flex items-center"><div class="w-full border-t border-white/10"></div></div>
							<div class="relative flex justify-center text-xs uppercase"><span class="bg-slate-900/10 px-2 text-slate-500">ou</span></div>
						</div>

						<form method="POST" action="?/email" use:enhance={() => { loading = true; return ({ result }) => { loading = false; if (result.type === 'redirect') step = 'password'; }; }}>
							<input type="hidden" name="returnTo" value={data.returnTo} />
							<div class="space-y-4">
								<div class="space-y-2">
									<label for="email" class="block text-sm font-medium text-slate-300">Adresse e-mail</label>
									<div class="relative">
										<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
											<svg class="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
											</svg>
										</div>
										<input id="email" type="email" name="email" required bind:value={email}
											class="w-full bg-slate-800/50 border border-white/10 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-slate-500 transition-all"
											placeholder="vous@exemple.com" />
									</div>
								</div>

								{#if form?.error && step !== 'password'}
									<p class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-shake">
										{form.error}
									</p>
								{/if}

								<button type="submit" disabled={loading} class="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98] py-4 rounded-xl text-white font-semibold shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50">
									{loading ? 'Chargement...' : 'Continuer'}
								</button>
							</div>
						</form>
					</div>
				{:else}
					<!-- Password Step -->
					<form method="POST" action="?/login" use:enhance={() => { loading = true; return () => { loading = false; }; }}>
						<input type="hidden" name="returnTo" value={data.returnTo} />
						<input type="hidden" name="email" value={email} />
						
						<div class="space-y-5">
							<div class="space-y-1">
								<p class="text-xs uppercase tracking-wider text-slate-500">Connexion par mot de passe</p>
								<p class="text-sm text-slate-300">{email}</p>
							</div>

							<div class="space-y-2">
								<label for="password" class="block text-sm font-medium text-slate-300">Mot de passe</label>
								<div class="relative">
									<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
										<svg class="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
										</svg>
									</div>
									<input id="password" type={showPassword ? 'text' : 'password'} name="password" required
										class="w-full bg-slate-800/50 border border-white/10 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none pl-12 pr-12 py-3.5 rounded-xl text-white placeholder-slate-500 transition-all"
										placeholder="••••••••" />
									<button type="button" on:click={() => showPassword = !showPassword}
										class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors">
										{#if showPassword}
											<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
											</svg>
										{:else}
											<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
											</svg>
										{/if}
									</button>
								</div>
							</div>

							<div class="flex items-center justify-between">
								<button type="button" on:click={() => step = 'choice'}
									class="text-xs text-slate-400 hover:text-slate-300 transition-colors">Changer d'email</button>
								<a href="/auth/forgot-password" class="text-xs text-violet-400 hover:text-violet-300 transition-colors">Mot de passe oublié ?</a>
							</div>

							{#if form?.error}
								<p class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-shake">
									{form.error}
								</p>
							{/if}

							<button type="submit" disabled={loading} class="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98] py-4 rounded-xl text-white font-semibold shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50">
								{loading ? 'Connexion...' : 'Se connecter'}
							</button>
						</div>
					</form>
				{/if}

				<div class="text-center pt-2">
					<p class="text-sm text-slate-400">
						Pas encore de compte ?
						<a href="/join" class="text-violet-400 hover:text-violet-300 font-medium ml-1 transition-colors underline underline-offset-2">
							Continuer avec Email (OTP)
						</a>
					</p>
				</div>
			</div>
		</div>

		<div class="mt-8 text-center">
			<p class="text-xs text-slate-500">© 2026 Plinkk. Tous droits réservés.</p>
		</div>
	</div>
</main>

<style>
	@keyframes float {
		0%, 100% { transform: translateY(0) rotate(0deg); }
		50% { transform: translateY(-20px) rotate(5deg); }
	}
	@keyframes float-delayed {
		0%, 100% { transform: translateY(0) rotate(0deg); }
		50% { transform: translateY(-15px) rotate(-5deg); }
	}
	.animate-float { animation: float 6s ease-in-out infinite; }
	.animate-float-delayed { animation: float-delayed 7s ease-in-out infinite; animation-delay: 1s; }
	
	:global(.animate-shake) {
		animation: shake 0.4s cubic-bezier(.36, .07, .19, .97) both;
	}
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		20% { transform: translateX(-8px); }
		40% { transform: translateX(8px); }
		60% { transform: translateX(-4px); }
		80% { transform: translateX(4px); }
	}
</style>
