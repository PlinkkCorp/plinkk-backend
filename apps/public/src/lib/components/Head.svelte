<script lang="ts">
	export let title: string = 'Plinkk';
	export let description: string = 'Crée ta page de liens élégante et personnalisée avec Plinkk.';
	export let image: string = 'https://cdn.plinkk.fr/logo.svg';
	export let canonical: string | null = null;
</script>

<svelte:head>
	<title>{title ? title + ' — ' : ''}Plinkk</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title ? title + ' — ' : '' + 'Plinkk'} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	{#if canonical}
		<link rel="canonical" href={canonical} />
		<meta property="og:url" content={canonical} />
	{/if}
</svelte:head>
