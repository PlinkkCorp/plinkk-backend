<script lang="ts">
	export let plinkk: any;
	export let onupdate: (field: string, value: any) => void = () => {};

	const LABELS: Record<string, string> = {
		profile: 'Photo & lien de profil',
		username: 'Nom affiché',
		labels: 'Labels (badges)',
		social: 'Icônes sociales',
		email: 'Email & Description',
		links: 'Boutons / Liens',
	};

	let order = plinkk.settings?.layoutOrder || ['profile', 'username', 'labels', 'social', 'email', 'links'];

	function handleUpdate(newOrder: string[]) {
		order = newOrder;
		onupdate('layoutOrder', newOrder);
	}

	function moveUp(index: number) {
		if (index > 0) {
			const newOrder = [...order];
			[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
			handleUpdate(newOrder);
		}
	}

	function moveDown(index: number) {
		if (index < order.length - 1) {
			const newOrder = [...order];
			[newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
			handleUpdate(newOrder);
		}
	}

	function isVisible(key: string) {
		if (key === 'profile' || key === 'username') return true;
		if (key === 'labels') return (plinkk.labels?.length || 0) > 0;
		if (key === 'social') return (plinkk.socialIcons?.length || 0) > 0;
		if (key === 'links') return (plinkk.links?.length || 0) > 0;
		if (key === 'email') return !!(plinkk.affichageEmail || plinkk.user?.description);
		return false;
	}
</script>

<div class="space-y-6">
	<div class="mb-6 pb-4 border-b border-slate-800">
		<h3 class="text-lg font-semibold text-white">Disposition</h3>
		<p class="text-sm text-slate-400">Réorganise l'ordre des sections de ta page. Les éléments grisés sont masqués si le contenu est vide.</p>
	</div>

	<div class="space-y-3">
		{#each order as key, i}
			{@const visible = isVisible(key)}
			<div 
				class="flex items-center gap-3 w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-3 select-none hover:border-slate-700 transition-colors {visible ? '' : 'opacity-50'}"
			>
				<div class="flex flex-col gap-1">
					<button 
						type="button" 
						onclick={() => moveUp(i)}
						disabled={i === 0}
						class="text-slate-500 hover:text-white disabled:opacity-30"
					>
						<svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 15l-6-6-6 6"></path></svg>
					</button>
					<button 
						type="button" 
						onclick={() => moveDown(i)}
						disabled={i === order.length - 1}
						class="text-slate-500 hover:text-white disabled:opacity-30"
					>
						<svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"></path></svg>
					</button>
				</div>

				<div class="text-sm font-medium text-slate-200">
					{LABELS[key] || key}
				</div>

				{#if !visible}
					<span class="ml-auto text-xs text-slate-400 italic">(masqué)</span>
				{/if}
			</div>
		{/each}
	</div>
</div>
