<script lang="ts">
	export let dashboardUrl: string = 'https://dash.plinkk.fr';
</script>

<section id="plans" class="py-20 relative">
	<!-- Header -->
	<div class="text-center mb-16">
		<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-widest mb-6">
			Tarifs
		</div>
		<h2 class="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
			Choisissez votre formule
		</h2>
		<p class="text-lg text-slate-400 max-w-lg mx-auto">
			Un plan gratuit pour démarrer, des options Premium pour aller plus loin.
		</p>
	</div>

	<!-- Plans Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
		<!-- Free Plan -->
		<div class="relative group rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-7 flex flex-col hover:border-white/10 transition-all duration-300">
			<div class="flex items-center gap-3 mb-5">
				<h3 class="text-base font-bold text-white">Gratuit</h3>
			</div>
			<div class="flex items-baseline gap-1 mb-6">
				<span class="text-3xl font-extrabold text-white">0€</span>
				<span class="text-sm text-slate-500">/ toujours</span>
			</div>
			<ul class="space-y-3 mb-8 flex-1 text-sm text-slate-300">
				<li>1 page Plinkk</li>
				<li>Liens illimités</li>
				<li>Thèmes de base</li>
			</ul>
			<a href="{dashboardUrl}/login#signup" class="block w-full py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold text-center text-sm hover:bg-white/5 transition-all">
				Commencer
			</a>
		</div>

		<!-- Premium Monthly -->
		<div class="relative group rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-500/[0.06] to-transparent backdrop-blur-sm p-7 flex flex-col shadow-lg shadow-violet-500/5 hover:shadow-violet-500/10 transition-all duration-300">
			<div class="absolute -top-3 left-1/2 -translate-x-1/2">
				<span class="px-3.5 py-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold uppercase tracking-wider">Populaire</span>
			</div>
			<div class="flex items-center gap-3 mb-5">
				<h3 class="text-base font-bold text-white">Mensuel</h3>
			</div>
			<div class="flex items-baseline gap-1 mb-6">
				<span class="text-3xl font-extrabold text-white">4,99€</span>
				<span class="text-sm text-slate-500">/ mois</span>
			</div>
			<ul class="space-y-3 mb-8 flex-1 text-sm text-slate-300">
				<li><strong class="text-white">5</strong> pages Plinkk</li>
				<li>Stats 365 jours</li>
				<li>Badge Premium</li>
			</ul>
			<a href="{dashboardUrl}/premium/configure" class="block w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-center text-sm shadow-lg shadow-violet-900/30 hover:shadow-violet-900/50 hover:-translate-y-0.5 transition-all">
				Choisir ce plan
			</a>
		</div>

		<!-- Other plans simplified for now -->
	</div>
</section>
