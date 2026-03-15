<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import type { LayoutData } from './$types';
	
	export let data: LayoutData;
</script>

<div class="min-h-screen bg-gradient-to-br from-[#0B1020] via-slate-950 to-[#0b1324] text-slate-100 flex flex-col">
	<Header user={data.user} />
	<main class="flex-grow">
		<slot />
	</main>
	<Footer />
</div>
