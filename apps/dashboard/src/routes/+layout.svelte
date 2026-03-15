<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import DashboardHeader from '$lib/components/DashboardHeader.svelte';
	import DashboardSidebar from '$lib/components/DashboardSidebar.svelte';

	export let data;

	$: user = data.user;
	$: isAuthPage = $page.url.pathname.startsWith('/login') || $page.url.pathname.startsWith('/onboarding');
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-[#0B1020] font-['Inter',_sans-serif] text-slate-200 selection:bg-violet-500/30">
	{#if isAuthPage}
		<slot />
	{:else}
		<DashboardHeader {user} />
		
		<main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
			<div class="lg:grid lg:grid-cols-12 lg:gap-8">
				<DashboardSidebar {user} />
				
				<div class="lg:col-span-10">
					<slot />
				</div>
			</div>
		</main>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #0B1020;
	}
	
	:global(.no-scrollbar::-webkit-scrollbar) {
		display: none;
	}
	:global(.no-scrollbar) {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
