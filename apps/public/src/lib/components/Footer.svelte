<script lang="ts">
	const year = new Date().getFullYear();
</script>

<footer class="border-t border-white/5 bg-[#0B1020]/30 pt-16 pb-8">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-2 gap-12 md:grid-cols-5 lg:gap-8">
			<div class="col-span-2 md:col-span-1">
				<a href="/" class="flex items-center gap-2.5">
					<img src="https://cdn.plinkk.fr/logo.svg" alt="Plinkk" class="h-7 w-7" />
					<span class="text-lg font-bold text-white">Plinkk</span>
				</a>
				<p class="mt-4 text-sm leading-relaxed text-slate-400">
					Créez une page de liens unique pour votre bio. Simple, rapide et élégant.
				</p>
			</div>

			<div>
				<h3 class="text-sm font-semibold text-white">Produit</h3>
				<ul class="mt-4 space-y-3 text-sm text-slate-400">
					<li><a href="/pricing" class="hover:text-white transition-colors">Tarifs</a></li>
					<li><a href="/patch-notes" class="hover:text-white transition-colors">Patch Notes</a></li>
					<li><a href="/partners" class="hover:text-white transition-colors">Partenaires</a></li>
					<li><a href="/users" class="hover:text-white transition-colors">Utilisateurs</a></li>
					<li><a href="/dashboard" class="hover:text-white transition-colors">Dashboard</a></li>
				</ul>
			</div>

			<div>
				<h3 class="text-sm font-semibold text-white">Support & Contact</h3>
				<ul class="mt-4 space-y-3 text-sm text-slate-400">
					<li><a href="mailto:contact@plinkk.fr" class="hover:text-white transition-colors">Contactez-nous</a></li>
					<li><a href="https://discord.gg/SJRx86UFWe" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors font-bold text-violet-400">Devenir partenaire</a></li>
					<li><a href="/dashboard/support" class="hover:text-white transition-colors">Ouvrir un ticket</a></li>
					<li><a href="/docs" class="hover:text-white transition-colors">Aide & Documentation</a></li>
				</ul>
			</div>

			<div>
				<h3 class="text-sm font-semibold text-white">Légal</h3>
				<ul class="mt-4 space-y-3 text-sm text-slate-400">
					<li><a href="/privacy" class="hover:text-white transition-colors">Politiques de confidentialité</a></li>
					<li><a href="/terms" class="hover:text-white transition-colors">Conditions Générales d'Utilisation</a></li>
					<li><a href="/cgv" class="hover:text-white transition-colors">Conditions Générales de Vente</a></li>
					<li><a href="/cookies" class="hover:text-white transition-colors">Politique des cookies</a></li>
					<li><a href="/legal" class="hover:text-white transition-colors">Mentions légales</a></li>
				</ul>
			</div>

			<div>
				<h3 class="text-sm font-semibold text-white">Communauté</h3>
				<ul class="mt-4 space-y-3 text-sm text-slate-400">
					<li><a href="https://github.com/PlinkkCorp/plinkk" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">GitHub (Frontend)</a></li>
					<li><a href="https://github.com/PlinkkCorp/plinkk-backend" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">GitHub (Backend)</a></li>
					<li><a href="https://discord.gg/SJRx86UFWe" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">Discord</a></li>
					<li><a href="https://github.com/PlinkkCorp/plinkk#readme" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">Documentation</a></li>
				</ul>
			</div>
		</div>

		<div class="mt-12 border-t border-white/5 pt-8">
			<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
				<p class="text-xs text-slate-500">
					&copy; {year} Plinkk. Tous droits réservés.
				</p>
				<div class="flex gap-6 text-xs text-slate-500">
					<a href="/privacy" class="hover:text-slate-300 transition-colors">Confidentialité</a>
				</div>
			</div>
		</div>
	</div>
</footer>
