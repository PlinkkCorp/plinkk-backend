<script lang="ts">
	import { page } from '$app/stores';
	import Avatar from './Avatar.svelte';

	export let user: any;

	let profileMenuOpen = false;
	let mobileMenuOpen = false;

	$: roleName = user && user.role ? (user.role.id || user.role.name) : null;
	$: isStaff = !!(roleName && ['ADMIN', 'DEVELOPER', 'MODERATOR'].includes(roleName));
	$: premiumUntil = user && user.premiumUntil ? new Date(user.premiumUntil) : null;
	$: hasActivePremium = !!(user && user.isPremium && (!premiumUntil || premiumUntil.getTime() > Date.now()));
	$: isPremiumUser = !!(user && (isStaff || user.isPartner || hasActivePremium));

	function toggleProfileMenu() {
		profileMenuOpen = !profileMenuOpen;
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMenus() {
		profileMenuOpen = false;
		mobileMenuOpen = false;
	}
</script>

<header class="sticky top-0 z-50 border-b border-white/5 bg-[#0B1020]/80 backdrop-blur-md transition-all duration-300">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between gap-4">
			<div class="flex items-center gap-8">
				<a href="/" class="flex items-center gap-2.5 transition-opacity hover:opacity-80">
					<img src="https://cdn.plinkk.fr/logo.svg" alt="Plinkk" class="h-8 w-8" />
					<span class="text-lg font-bold tracking-tight text-white">Plinkk</span>
				</a>

				<nav class="hidden md:flex items-center gap-1">
					<a href="/" class="rounded-full px-4 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">Dashboard</a>
					<a href="/edit" class="rounded-full px-4 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">Éditeur</a>
					<a href="/stats" class="rounded-full px-4 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">Stats</a>
				</nav>
			</div>

			<div class="flex items-center gap-3">
				<div class="hidden md:flex items-center gap-3">
					{#if !isPremiumUser}
						<a href="/premium" class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-900/30 hover:shadow-violet-900/50 hover:-translate-y-0.5 transition-all">
							<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
								<path d="M12 2L9 9l-7 1 5 4-2 7 7-4 7 4-2-7 5-4-7-1z" />
							</svg>
							<span>Passer Premium</span>
						</a>
					{/if}
					
					{#if isStaff}
						<a href="/admin" class="inline-flex items-center justify-center rounded-full bg-rose-500/10 px-4 py-1.5 text-sm font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20 transition-colors hover:bg-rose-500/20 hover:text-rose-300">Admin</a>
					{/if}

					<div class="relative">
						<button onclick={toggleProfileMenu} class="group flex items-center gap-2 rounded-full bg-white/5 pl-1.5 pr-3 py-1 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20 focus:outline-none">
							<div class="relative h-8 w-8 shrink-0">
								<Avatar {user} />
							</div>
							<span class="max-w-[100px] truncate text-sm font-medium text-slate-200 group-hover:text-white">
								{user?.userName || 'Moi'}
							</span>
							<svg class="h-4 w-4 text-slate-500 transition-transform group-hover:text-slate-300" class:rotate-180={profileMenuOpen} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
							</svg>
						</button>

						{#if profileMenuOpen}
							<div class="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-xl border border-white/10 bg-[#161b2e] p-1 shadow-2xl animate-popup-in">
								<div class="px-3 py-3 flex items-center gap-3">
									<div class="relative h-9 w-9 shrink-0">
										<Avatar {user} />
									</div>
									<div class="min-w-0">
										<div class="flex items-center gap-1.5">
											<p class="truncate text-sm font-medium text-white">{user?.userName}</p>
											{#if isPremiumUser}
												<span class="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider leading-none">PRO</span>
											{/if}
										</div>
										<p class="truncate text-xs text-slate-500">{user?.email}</p>
									</div>
								</div>

								<div class="h-px bg-white/5 my-1"></div>

								<a href="/" onclick={closeMenus} class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white">
									<svg class="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
									</svg>
									Dashboard
								</a>
								<a href="/account" onclick={closeMenus} class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white">
									<svg class="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
									Paramètres
								</a>
								<div class="h-px bg-white/5 my-1"></div>
								<form action="/logout" method="POST">
									<button type="submit" class="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-400 transition-colors hover:bg-rose-500/10">
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
										</svg>
										Se déconnecter
									</button>
								</form>
							</div>
						{/if}
					</div>
				</div>

				<button onclick={toggleMobileMenu} class="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white focus:outline-none">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
			</div>
		</div>
	</div>

	{#if mobileMenuOpen}
		<div class="border-t border-white/5 bg-[#0B1020]/95 backdrop-blur-xl md:hidden">
			<div class="space-y-1 px-4 py-4">
				<a href="/" onclick={closeMenus} class="block rounded-lg px-3 py-2 text-base font-medium text-slate-300 hover:bg-white/5 hover:text-white">Dashboard</a>
				<a href="/edit" onclick={closeMenus} class="block rounded-lg px-3 py-2 text-base font-medium text-slate-300 hover:bg-white/5 hover:text-white">Éditeur</a>
				<a href="/stats" onclick={closeMenus} class="block rounded-lg px-3 py-2 text-base font-medium text-slate-300 hover:bg-white/5 hover:text-white">Stats</a>
			</div>
			<div class="border-t border-white/5 px-4 py-4">
				<div class="flex items-center gap-3 mb-4">
					<div class="relative h-11 w-11 shrink-0">
						<Avatar {user} />
					</div>
					<div>
						<div class="text-base font-medium text-white">{user?.userName}</div>
						<div class="text-sm text-slate-500">{user?.email}</div>
					</div>
				</div>
				<div class="space-y-1">
					<a href="/account" onclick={closeMenus} class="block rounded-lg px-3 py-2 text-base font-medium text-slate-300 hover:bg-white/5 hover:text-white">Paramètres</a>
					<form action="/logout" method="POST">
						<button type="submit" class="w-full text-left block rounded-lg px-3 py-2 text-base font-medium text-rose-400 hover:bg-rose-500/10">Se déconnecter</button>
					</form>
				</div>
			</div>
		</div>
	{/if}
</header>

<style>
	@keyframes popupIn {
		from { opacity: 0; transform: scale(0.9); }
		to { opacity: 1; transform: scale(1); }
	}
	.animate-popup-in {
		animation: popupIn 0.2s ease-out both;
	}
</style>
