<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import Pricing from '$lib/components/Pricing.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<Head 
	title="Tarifs" 
	description="Découvrez les offres Plinkk : un plan gratuit pour démarrer et un plan Premium pour aller plus loin."
/>

<main class="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
	<Pricing dashboardUrl={data.dashboardUrl} />
</main>
