<script lang="ts">
	export let plinkk: any;
	export let onupdate: (field: string, value: any) => void = () => {};
	export let onaddLabel: () => void = () => {};
	export let oneditLabel: (data: { label: any }) => void = () => {};
	export let ondeleteLabel: (data: { id: string }) => void = () => {};
	export let onopenPicker: (data: { type: string, field: string, title: string }) => void = () => {};

	function handleUpdate(field: string, value: any) {
		onupdate(field, value);
	}

	function handleAddLabel() {
		onaddLabel();
	}

	function handleEditLabel(label: any) {
		oneditLabel({ label });
	}

	function handleDeleteLabel(labelId: string) {
		ondeleteLabel({ id: labelId });
	}

	function openEmojiPicker() {
		onopenPicker({ 
			type: 'emoji', 
			field: 'statusEmoji', 
			title: 'Choisir un emoji' 
		});
	}

	$: labels = plinkk.labels || [];
</script>

<div class="space-y-6">
	<div class="mb-6 pb-4 border-b border-slate-800">
		<h3 class="text-lg font-semibold text-white">Status</h3>
		<p class="text-sm text-slate-400">Affiche un message temporaire ou ton état actuel.</p>
	</div>

	<div class="space-y-6">
		<div class="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
			<div>
				<span class="block text-sm font-medium text-slate-200">Afficher le status</span>
				<span class="block text-xs text-slate-500">Rend le message visible sur ton profil.</span>
			</div>
			<label class="relative inline-flex items-center cursor-pointer">
				<input 
					type="checkbox" 
					checked={plinkk.statusVisible}
					onchange={(e) => handleUpdate('statusVisible', e.currentTarget.checked)}
					class="sr-only peer"
				>
				<div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
			</label>
		</div>

		<div class="{plinkk.statusVisible ? '' : 'opacity-50 pointer-events-none'} transition-opacity">
			<label class="block text-sm font-medium text-slate-300 mb-2">Message</label>
			<div class="flex gap-2">
				<div class="relative w-16 shrink-0">
					<button 
						type="button" 
						onclick={openEmojiPicker}
						class="w-full h-[46px] rounded-xl bg-slate-950 border border-slate-800 text-xl flex items-center justify-center hover:bg-slate-900 transition-colors"
					>
						{plinkk.statusEmoji || '👋'}
					</button>
				</div>
				<div class="flex-1">
					<input 
						type="text" 
						value={plinkk.statusText || ''}
						oninput={(e) => handleUpdate('statusText', e.currentTarget.value)}
						class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-slate-200"
						placeholder="En ligne..."
					>
				</div>
			</div>
			<div class="mt-2 flex justify-end">
				<button 
					type="button" 
					onclick={() => { handleUpdate('statusText', ''); handleUpdate('statusEmoji', '👋'); }}
					class="text-xs text-slate-500 hover:text-red-400 transition-colors"
				>
					Effacer
				</button>
			</div>
		</div>

		<div class="mt-8 pt-6 border-t border-slate-800">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h4 class="font-medium text-white">Labels</h4>
					<p class="text-xs text-slate-400">Badges affichés sous votre profil.</p>
				</div>
				<button 
					type="button"
					onclick={handleAddLabel}
					class="px-3 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-colors"
				>
					+ Ajouter
				</button>
			</div>
			
			<div class="space-y-3">
				{#each labels as label}
					<div class="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all group">
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-slate-200 truncate">{label.text}</div>
						</div>
						<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
							<button 
								onclick={() => handleEditLabel(label)}
								class="p-1.5 text-slate-500 hover:text-white transition-colors"
							>
								<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
							</button>
							<button 
								onclick={() => handleDeleteLabel(label.id)}
								class="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
							>
								<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
							</button>
						</div>
					</div>
				{:else}
					<div class="text-xs text-slate-600 italic py-4 text-center border border-dashed border-slate-800 rounded-xl">
						Aucun badge ajouté.
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
