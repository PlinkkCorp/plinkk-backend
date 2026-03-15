<script lang="ts">
	import IconPicker from './IconPicker.svelte';

	export let show = false;
	export let icon: any = null;
	export let userEmail = '';
	export let onsave: (data: any) => void = () => {};
	export let onclose: () => void = () => {};

	let showIconPicker = false;
	let iconName = '';
	let url = '';

	$: if (show && icon) {
		iconName = icon.icon || '';
		url = icon.url || '';
	} else if (show && !icon) {
		iconName = '';
		url = '';
	}

	function handleSave() {
		onsave({
			id: icon?.id,
			icon: iconName,
			url: url
		});
		close();
	}

	function close() {
		show = false;
		onclose();
	}

	function handleIconSelect(url: string) {
		iconName = url;
		showIconPicker = false;
	}
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={close}></div>
		
		<div class="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
			<!-- HEADER -->
			<div class="flex items-center justify-between px-6 py-4 border-b border-white/5">
				<h3 class="text-lg font-semibold text-white">{icon ? 'Modifier le réseau social' : 'Ajouter un réseau social'}</h3>
				<button onclick={close} class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
					<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
				</button>
			</div>

			<div class="p-6 space-y-6">
				<!-- ICON SELECTION -->
				<div class="space-y-1.5">
					<label for="icon" class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Icône</label>
					<div class="flex gap-3">
						<div class="size-16 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
							{#if iconName}
								<img 
									src={iconName.startsWith('http') || iconName.startsWith('/') ? iconName : `https://cdn.plinkk.fr/icons/${iconName}.svg`} 
									alt="Selected icon" 
									class="size-8 object-contain" 
								/>
							{:else}
								<div class="size-8 rounded-full bg-slate-800"></div>
							{/if}
						</div>
						<div class="flex-1 flex flex-col justify-center gap-2">
							<button 
								onclick={() => showIconPicker = true}
								class="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-center"
							>
								{iconName ? 'Changer d\'icône' : 'Choisir une icône'}
							</button>
							<p class="text-[10px] text-slate-500 text-center">Recommandé: icônes monochromes</p>
						</div>
					</div>
				</div>

				<!-- URL -->
				<div class="space-y-1.5">
					<label for="url" class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Lien du profil</label>
					<input 
						id="url"
						type="text" 
						bind:value={url}
						placeholder="https://instagram.com/username" 
						class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-slate-200 focus:border-violet-500/50 outline-none transition-all placeholder:text-slate-600"
					/>
				</div>
			</div>

			<!-- FOOTER -->
			<div class="p-6 border-t border-white/5 bg-[#0f172a]/50 flex gap-3">
				<button 
					onclick={close}
					class="flex-1 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all"
				>
					Annuler
				</button>
				<button 
					onclick={handleSave}
					disabled={!iconName || !url}
					class="flex-1 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg shadow-violet-900/20"
				>
					Enregistrer
				</button>
			</div>
		</div>
	</div>
{/if}

<IconPicker 
	bind:show={showIconPicker} 
	email={userEmail}
	onselect={handleIconSelect}
	onclose={close}
/>
