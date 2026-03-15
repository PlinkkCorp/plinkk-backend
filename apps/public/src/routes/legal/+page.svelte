<script lang="ts">
	import LegalLayout from '$lib/components/LegalLayout.svelte';
</script>

<LegalLayout 
	title="Mentions légales" 
	description="Informations sur l’éditeur et l’hébergement de Plinkk."
	lastUpdated="25 février 2026"
	activePage="legal"
>
	<h2 id="editeur">Éditeur du site</h2>
	<p>
		<strong>Plinkk</strong> — Klaynight (Elouan Passereau)<br>
		Site : <a href="https://klaynight.fr" target="_blank" rel="noopener noreferrer">klaynight.fr</a><br>
		Contact : <a href="mailto:contact@plinkk.fr">contact@plinkk.fr</a>
	</p>

	<h2 id="hebergeur">Hébergeur</h2>
	<p>Contabo GmbH — Détails sur <a href="https://contabo.com" target="_blank" rel="noopener noreferrer">contabo.com</a>.</p>

	<h2 id="droit">Droit applicable</h2>
	<p>Droit français. Compétence des tribunaux du ressort du siège de l’éditeur.</p>
</LegalLayout>
