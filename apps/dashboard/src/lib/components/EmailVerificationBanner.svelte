<script lang="ts">
	export let user: any;
	export let onVerify: () => void = () => {};

	$: showBanner = user && user.emailVerified === false;
</script>

{#if showBanner}
	<div class="bg-rose-500/10 border-b border-rose-500/20 py-3 relative z-40">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<div class="p-2 bg-rose-500/20 rounded-lg text-rose-400">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
						<line x1="12" y1="9" x2="12" y2="13"></line>
						<line x1="12" y1="17" x2="12.01" y2="17"></line>
					</svg>
				</div>
				<p class="text-sm font-medium text-rose-300">
					Votre adresse email (<strong class="text-rose-200">{user.email}</strong>) n'a pas encore été vérifiée. Certaines fonctionnalités peuvent être limitées.
				</p>
			</div>
			<button onclick={onVerify} class="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-900/20 hover:bg-rose-400 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
				Vérifier mon compte
			</button>
		</div>
	</div>
{/if}
