<script lang="ts">
	import Avatar from './Avatar.svelte';
	export let user: any = null;
	export let dashboardUrl: string = '/dashboard';
	export let isDashboard: boolean = false;
	export let currentPath: string = '';

	$: _isDash = isDashboard || currentPath.startsWith('/admin');
	$: _isLogged = !!user;
</script>

<header class="sticky top-0 z-50 border-b border-white/5 bg-[#0B1020]/80 backdrop-blur-md transition-all duration-300" id="mainHeader">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between gap-4">
			<div class="flex items-center gap-8">
				<a href="/" class="flex items-center gap-2.5 transition-opacity hover:opacity-80">
					<img src="https://cdn.plinkk.fr/logo.svg" alt="Plinkk" class="h-8 w-8" />
					<span class="text-lg font-bold tracking-tight text-white">Plinkk</span>
				</a>

				<nav class="hidden md:flex items-center gap-1">
					{#if _isDash}
						<a href="/" class="rounded-full px-4 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">Dashboard</a>
						<a href="/edit" class="rounded-full px-4 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">Éditeur</a>
						<a href="/stats" class="rounded-full px-4 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">Stats</a>
						<a href="/users" class="rounded-full px-4 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">Liste des Utilisateurs</a>
					{:else}
						<a href="/features" class="rounded-full px-4 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">Fonctionnalités</a>
						<a href="/about" class="rounded-full px-4 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">À propos</a>
						<a href="/patch-notes" class="rounded-full px-4 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">Patch Notes</a>
						<a href="/pricing" class="rounded-full px-4 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">Tarifs</a>
						<a href="/partners" class="rounded-full px-4 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">Partenaires</a>
						<a href="/users" class="rounded-full px-4 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">Utilisateurs</a>
					{/if}
				</nav>
			</div>

			<div class="flex items-center gap-3">
				<div class="hidden md:flex items-center gap-3">
					{#if _isLogged}
						{#if user.role && ['ADMIN', 'DEVELOPER', 'MODERATOR'].includes(user.role.id || user.role.name)}
							<a href="{dashboardUrl}/admin" class="inline-flex items-center justify-center rounded-full bg-rose-500/10 px-4 py-1.5 text-sm font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20 transition-colors hover:bg-rose-500/20 hover:text-rose-300">Admin</a>
						{/if}

						<div class="relative">
							<button class="group flex items-center gap-2 rounded-full bg-white/5 pl-1.5 pr-3 py-1 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20 focus:outline-none">
								<div class="relative h-8 w-8 shrink-0">
									<Avatar {user} />
								</div>
								<span class="max-w-[100px] truncate text-sm font-medium text-slate-200 group-hover:text-white">
									{user.userName || user.id}
								</span>
								<svg class="h-4 w-4 text-slate-500 transition-transform group-hover:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</button>
						</div>
					{:else}
						<a href="{dashboardUrl}/login" class="text-sm font-medium text-slate-300 transition-colors hover:text-white">Se connecter</a>
						<a href="{dashboardUrl}/login#signup" class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 hover:bg-slate-200">S'inscrire</a>
					{/if}
				</div>
			</div>
		</div>
	</div>
</header>
