<script lang="ts">
	export let plinkk: any;
	export let themes: any = { builtIns: [], theme: [] };
	export let onupdate: (field: string, value: any) => void = () => {};
	export let onopenPicker: (data: { type: string, items: any[] }) => void = () => {};

	const btnStyles = [
		{ id: 'sharp', name: 'Carré', cls: 'rounded-none' },
		{ id: 'soft', name: 'Doux', cls: 'rounded-lg' },
		{ id: 'rounded', name: 'Arrondi', cls: 'rounded-xl' },
		{ id: 'extra-rounded', name: 'Extra', cls: 'rounded-3xl' },
		{ id: 'pill', name: 'Pilule', cls: 'rounded-full' },
		{ id: 'leaf', name: 'Feuille', cls: 'rounded-[24px_4px_24px_4px]' },
		{ id: 'leaf-alt', name: 'Inversé', cls: 'rounded-[4px_24px_4px_24px]' }
	];

	const fonts = ['Inter', 'Roboto', 'Lato', 'Open Sans', 'Montserrat', 'Poppins', 'Playfair Display'];

	$: allThemes = [...(themes.builtIns || []), ...(themes.theme || [])];
	$: selectedTheme = allThemes[plinkk.selectedThemeIndex] || allThemes[0];

	function handleUpdate(field: string, value: any) {
		onupdate(field, value);
	}

	function openThemePicker() {
		onopenPicker({ type: 'theme', items: allThemes });
	}
</script>

<div class="space-y-6">
	<div class="mb-6 pb-4 border-b border-slate-800">
		<h3 class="text-lg font-semibold text-white">Apparence</h3>
		<p class="text-sm text-slate-400">Personnalise les couleurs et le style de ta page.</p>
	</div>

	<div class="space-y-4 mb-8">
		<label class="block text-xs uppercase tracking-wider text-slate-500 mb-2">Thème de la page</label>
		
		<button 
			type="button"
			onclick={openThemePicker}
			class="w-full group p-4 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-violet-500/50 transition-all flex items-center justify-between"
		>
			<div class="flex items-center gap-4">
				<div class="size-12 rounded-xl border border-slate-700/50 flex items-center justify-center overflow-hidden bg-slate-900 shadow-lg">
					{#if selectedTheme}
						<div class="w-full h-full" style="background: {selectedTheme.background || '#1e293b'}">
							<div class="flex flex-col h-full p-1 gap-1">
								<div class="h-1 w-full rounded-full" style="background: {selectedTheme.buttonBackground || '#8b5cf6'}"></div>
								<div class="h-1 w-2/3 rounded-full opacity-50" style="background: {selectedTheme.textColor || 'white'}"></div>
							</div>
						</div>
					{/if}
				</div>
				<div class="text-left">
					<div class="text-sm font-semibold text-white">{selectedTheme?.name || 'Thème par défaut'}</div>
					<div class="text-xs text-slate-500 hover:text-slate-400">Clique pour changer de thème</div>
				</div>
			</div>
			<div class="size-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-violet-400 group-hover:bg-slate-700 transition-all">
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M9 18l6-6-6-6"></path>
				</svg>
			</div>
		</button>
	</div>

	<div class="space-y-4 pt-4 border-t border-slate-800">
		<label class="block text-xs uppercase tracking-wider text-slate-500 mb-2">Badges de profil</label>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div class="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-between gap-4">
				<div class="space-y-1">
					<div class="text-sm font-medium text-slate-200">Badge Vérifié</div>
					<p class="text-xs text-slate-500">Affiche le badge de vérification sous ton nom.</p>
				</div>
				<label class="relative inline-flex items-center cursor-pointer">
					<input 
						type="checkbox" 
						checked={plinkk.showVerifiedBadge}
						onchange={(e) => handleUpdate('showVerifiedBadge', e.currentTarget.checked)}
						class="sr-only peer"
					>
					<div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
				</label>
			</div>
			
			<div class="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-between gap-4">
				<div class="space-y-1">
					<div class="text-sm font-medium text-slate-200">Badge Partenaire</div>
					<p class="text-xs text-slate-500">Affiche le badge partenaire sous ton nom.</p>
				</div>
				<label class="relative inline-flex items-center cursor-pointer">
					<input 
						type="checkbox" 
						checked={plinkk.showPartnerBadge}
						onchange={(e) => handleUpdate('showPartnerBadge', e.currentTarget.checked)}
						class="sr-only peer"
					>
					<div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
				</label>
			</div>
		</div>
	</div>

	<div class="space-y-4 pt-4 border-t border-slate-800">
		<label class="block text-xs uppercase tracking-wider text-slate-500 mb-2">Style des boutons</label>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
			{#each btnStyles as s}
				<label class="cursor-pointer">
					<input 
						type="radio" 
						name="buttonStyle" 
						value={s.id}
						checked={plinkk.buttonStyle === s.id}
						onchange={() => handleUpdate('buttonStyle', s.id)}
						class="peer sr-only"
					>
					<div class="h-12 border border-slate-700 bg-slate-800 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:border-white transition-all flex items-center justify-center text-sm font-medium text-slate-300 {s.cls} hover:bg-slate-700">
						{s.name}
					</div>
				</label>
			{/each}
		</div>
	</div>

	<div class="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-between gap-4">
		<div class="space-y-1">
			<div class="text-sm font-medium text-slate-200">Thèmes de boutons</div>
			<p class="text-xs text-slate-500">Permettre aux thèmes spécifiques (Amazon, Spotify, etc.) de s'appliquer aux liens.</p>
		</div>
		<label class="relative inline-flex items-center cursor-pointer">
			<input 
				type="checkbox" 
				checked={plinkk.buttonThemeEnable !== 0}
				onchange={(e) => handleUpdate('buttonThemeEnable', e.currentTarget.checked ? 1 : 0)}
				class="sr-only peer"
			>
			<div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
		</label>
	</div>

	<div class="pt-4 border-t border-slate-800">
		<label class="block text-sm font-medium text-slate-300 mb-2">Police d'écriture</label>
		<select 
			value={plinkk.fontFamily || 'Inter'}
			onchange={(e) => handleUpdate('fontFamily', e.currentTarget.value)}
			class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-slate-200"
		>
			{#each fonts as f}
				<option value={f}>{f}</option>
			{/each}
		</select>
	</div>
</div>
