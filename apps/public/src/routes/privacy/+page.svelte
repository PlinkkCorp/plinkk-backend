<script lang="ts">
	import LegalLayout from '$lib/components/LegalLayout.svelte';
</script>

<LegalLayout 
	title="Politique de confidentialité" 
	description="Découvrez comment nous protégeons vos données personnelles."
	lastUpdated="29 septembre 2025"
	activePage="privacy"
>
	<h2 id="responsable">Responsable de traitement</h2>
	<p>Plinkk — Klaynight (Elouan Passereau). <br>Contact : <a href="mailto:contact@plinkk.fr">contact@plinkk.fr</a>.</p>

	<h2 id="donnees">Données traitées</h2>
	<ul class="grid sm:grid-cols-2 gap-4 list-none pl-0">
		<li class="bg-white/5 rounded-xl p-4 border border-white/5">
			<strong class="block text-white mb-1">Compte</strong>
			Email, nom d’utilisateur, mot de passe chiffré.
		</li>
		<li class="bg-white/5 rounded-xl p-4 border border-white/5">
			<strong class="block text-white mb-1">Profil</strong>
			Liens, icônes sociales, couleurs, textes et préférences.
		</li>
	</ul>

	<h2 id="finalites">Finalités et base légale</h2>
	<ul>
		<li><strong>Fourniture du service</strong> : création et gestion de votre page de liens.</li>
		<li><strong>Sécurité</strong> : prévention des abus et fraude.</li>
	</ul>

	<!-- ... Rest of the privacy policy content ... -->
</LegalLayout>
