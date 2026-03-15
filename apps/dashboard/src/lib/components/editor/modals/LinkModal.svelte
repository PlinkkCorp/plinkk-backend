<script lang="ts">
	import IconPicker from './IconPicker.svelte';
	import { btnIconThemeConfig } from '$lib/config/btnIconThemeConfig.js';

	export let show = false;
	export let link: any = null;
	export let categories: any[] = [];
	export let userEmail = '';
	export let onsave: (data: any) => void = () => {};
	export let onclose: () => void = () => {};

	let showIconPicker = false;
	let type = 'LINK';
	let title = '';
	let url = '';
	let description = '';
	let icon = '';
	let categoryId = '';
	let newTab = true;
	let iosUrl = '';
	let androidUrl = '';
	let forceAppOpen = false;
	let clickLimit: number | null = null;
	let buttonTheme = 'system';
	let formBtnText = 'Envoyer';
	let formSuccessMsg = 'Message envoyé avec succès !';

	let scheme = 'https://';

	$: if (show && link) {
		type = link.type || 'LINK';
		title = link.text || link.title || '';
		description = link.description || '';
		icon = link.icon || '';
		categoryId = link.categoryId || '';
		buttonTheme = link.buttonTheme || 'system';
		
		let rawUrl = link.url || '';
		if (rawUrl.startsWith('https://')) {
			scheme = 'https://';
			url = rawUrl.substring(8);
		} else if (rawUrl.startsWith('http://')) {
			scheme = 'http://';
			url = rawUrl.substring(7);
		} else {
			url = rawUrl;
		}

		iosUrl = link.iosUrl || '';
		androidUrl = link.androidUrl || '';
		forceAppOpen = !!link.forceAppOpen;
		clickLimit = link.clickLimit || null;
		newTab = !!link.url && !link.forceAppOpen;

		if (type === 'FORM' && link.formData) {
			formBtnText = link.formData.buttonText || 'Envoyer';
			formSuccessMsg = link.formData.successMessage || 'Message envoyé avec succès !';
		}
	} else if (show && !link) {
		resetForm();
	}

	function resetForm() {
		type = 'LINK';
		title = '';
		url = '';
		description = '';
		icon = '';
		categoryId = '';
		scheme = 'https://';
		newTab = true;
		iosUrl = '';
		androidUrl = '';
		forceAppOpen = false;
		clickLimit = null;
		buttonTheme = 'system';
		formBtnText = 'Envoyer';
		formSuccessMsg = 'Message envoyé avec succès !';
	}

	function handleSave() {
		const finalUrl = (type === 'LINK' || type === 'EMBED' || type === 'MUSIC') ? (url ? scheme + url : '') : '';
		
		const data: any = {
			id: link?.id,
			type,
			text: title,
			name: title,
			url: finalUrl,
			description,
			icon,
			categoryId,
			buttonTheme,
			iosUrl,
			androidUrl,
			forceAppOpen,
			clickLimit
		};

		if (type === 'FORM') {
			data.formData = {
				buttonText: formBtnText,
				successMessage: formSuccessMsg,
				fields: link?.formData?.fields || [
					{ label: 'Nom', type: 'text', required: true, name: 'name', placeholder: 'Votre nom' },
					{ label: 'Email', type: 'email', required: true, name: 'email', placeholder: 'votre@email.com' },
					{ label: 'Message', type: 'textarea', required: true, name: 'message', placeholder: 'Votre message...' }
				]
			};
		}

		if (type === 'EMBED') {
			data.embedData = { url: finalUrl };
		}

		onsave(data);
		close();
	}

	function close() {
		show = false;
		onclose();
	}

	function toggleScheme() {
		scheme = scheme === 'https://' ? 'http://' : 'https://';
	}

	function handleIconSelect(selectedUrl: string) {
		icon = selectedUrl;
		showIconPicker = false;
	}

	const typeOptions = [
		{ id: 'LINK', label: 'Lien', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101' },
		{ id: 'HEADER', label: 'Titre', icon: 'M4 6h16M4 12h16M4 18h7' },
		{ id: 'EMBED', label: 'Embed', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
		{ id: 'FORM', label: 'Formulaire', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
	];
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={close}></div>
		
		<div class="relative w-full max-w-2xl max-h-[90vh] bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
			<!-- HEADER -->
			<div class="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-10">
				<h3 class="text-lg font-semibold text-white">{link ? 'Modifier l\'élément' : 'Ajouter un élément'}</h3>
				<button onclick={close} class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
					<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
				</button>
			</div>

			<div class="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
				<!-- TYPE SELECTOR -->
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
					{#each typeOptions as opt}
						<button 
							onclick={() => type = opt.id}
							class="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all {type === opt.id ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/10 hover:bg-slate-900'}"
						>
							<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d={opt.icon}/></svg>
							<span class="text-xs font-medium">{opt.label}</span>
						</button>
					{/each}
				</div>

				<!-- CONTENT FIELDS -->
				<div class="space-y-4">
					<div class="space-y-1.5">
						<label for="title" class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Texte du bouton</label>
						<input 
							id="title"
							type="text" 
							bind:value={title}
							placeholder="Ex: Mon Instagram, Portfolio..." 
							class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-slate-200 focus:border-violet-500/50 outline-none transition-all"
						/>
					</div>

					{#if type !== 'HEADER' && type !== 'FORM'}
						<div class="space-y-1.5">
							<label for="url" class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">URL</label>
							<div class="flex gap-2">
								<button 
									onclick={toggleScheme}
									class="px-3 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-slate-400 hover:text-white transition-colors"
								>
									{scheme}
								</button>
								<input 
									id="url"
									type="text" 
									bind:value={url}
									placeholder="example.com/username" 
									class="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-slate-200 focus:border-violet-500/50 outline-none transition-all"
								/>
							</div>
						</div>
					{/if}

					{#if type !== 'HEADER'}
						<div class="space-y-1.5">
							<label for="desc" class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Description (optionnel)</label>
							<textarea 
								id="desc"
								bind:value={description}
								placeholder="Ajouter un petit texte sous le bouton..." 
								class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-slate-200 focus:border-violet-500/50 outline-none transition-all min-h-[80px] resize-none"
							></textarea>
						</div>
					{/if}
				</div>

				<!-- ICON & CATEGORY -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="icon" class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Icône</label>
						<div class="flex gap-2">
							<div class="size-12 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center shrink-0">
								{#if icon}
									<img src={icon} alt="Selected icon" class="size-6 object-contain" />
								{:else}
									<div class="size-6 rounded-full bg-slate-800"></div>
								{/if}
							</div>
							<button 
								onclick={() => showIconPicker = true}
								class="flex-1 px-4 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-left"
							>
								{icon ? 'Changer l\'icône' : 'Choisir une icône'}
							</button>
						</div>
					</div>

					<div class="space-y-1.5">
						<label for="category" class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Catégorie</label>
						<select 
							id="category"
							bind:value={categoryId}
							class="w-full px-4 h-12 rounded-xl bg-slate-950 border border-white/10 text-slate-300 focus:border-violet-500/50 outline-none transition-all appearance-none cursor-pointer"
						>
							<option value="">Aucune catégorie</option>
							{#each categories as cat}
								<option value={cat.id}>{cat.name}</option>
							{/each}
						</select>
					</div>
				</div>

				{#if type === 'FORM'}
					<div class="space-y-4 p-4 rounded-2xl bg-slate-900/50 border border-white/5">
						<h4 class="text-xs font-bold text-white uppercase tracking-widest">Configuration du formulaire</h4>
						<div class="space-y-4">
							<div class="space-y-1.5">
								<label for="formBtnText" class="text-[10px] font-bold text-slate-500 uppercase">Texte du bouton d'envoi</label>
								<input 
									id="formBtnText"
									type="text" 
									bind:value={formBtnText}
									class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-slate-200 text-sm focus:border-violet-500/50 outline-none"
								/>
							</div>
							<div class="space-y-1.5">
								<label for="formSuccessMsg" class="text-[10px] font-bold text-slate-500 uppercase">Message de succès</label>
								<input 
									id="formSuccessMsg"
									type="text" 
									bind:value={formSuccessMsg}
									class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-slate-200 text-sm focus:border-violet-500/50 outline-none"
								/>
							</div>
						</div>
					</div>
				{/if}

				<!-- ADVANCED SETTINGS -->
				{#if type === 'LINK'}
					<div class="space-y-4 pt-4">
						<button 
							onclick={() => {/* toggle collapse if needed */}}
							class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
						>
							<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
							<span class="text-xs font-bold uppercase tracking-widest">Réglages avancés</span>
						</button>

						<div class="space-y-6">
							<div class="flex items-center justify-between p-4 rounded-xl bg-slate-900/30 border border-white/5">
								<div>
									<h5 class="text-sm font-medium text-white">Ouvrir dans un nouvel onglet</h5>
									<p class="text-[10px] text-slate-500">Recommandé pour la plupart des liens</p>
								</div>
								<label class="relative inline-flex items-center cursor-pointer">
									<input type="checkbox" bind:checked={newTab} class="sr-only peer">
									<div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
								</label>
							</div>

							<div class="space-y-4">
								<div class="space-y-1.5">
									<label for="ios" class="text-[10px] font-bold text-slate-500 uppercase">Lien profond iOS (facultatif)</label>
									<input 
										id="ios"
										type="text" 
										bind:value={iosUrl}
										placeholder="Ex: appname://..." 
										class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-slate-200 text-sm outline-none"
									/>
								</div>
								<div class="space-y-1.5">
									<label for="android" class="text-[10px] font-bold text-slate-500 uppercase">Lien profond Android (facultatif)</label>
									<input 
										id="android"
										type="text" 
										bind:value={androidUrl}
										placeholder="Ex: intent://..." 
										class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-slate-200 text-sm outline-none"
									/>
								</div>
								<div class="flex items-center gap-3">
									<input type="checkbox" id="forceApp" bind:checked={forceAppOpen} class="size-4 rounded border-white/10 bg-slate-950 text-violet-600 focus:ring-violet-500" />
									<label for="forceApp" class="text-xs text-slate-400">Forcer l'ouverture via l'application</label>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- THEME PICKER -->
				<div class="space-y-3">
					<label class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Thème du bouton</label>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
						<button 
							onclick={() => buttonTheme = 'system'}
							class="group flex flex-col items-center gap-2 p-3 rounded-xl border transition-all {buttonTheme === 'system' ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'}"
						>
							<div class="w-full h-8 rounded bg-slate-800 flex items-center justify-center text-[10px] font-mono">Auto</div>
							<span class="text-[10px] font-medium">System</span>
						</button>
						{#each btnIconThemeConfig.slice(0, 11) as theme}
							<button 
								onclick={() => buttonTheme = theme.themeClass}
								class="group flex flex-col items-center gap-2 p-3 rounded-xl border transition-all {buttonTheme === theme.themeClass ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'}"
							>
								<div class="w-full h-8 rounded bg-slate-800 flex items-center justify-center p-1">
									<img src={theme.icon} alt={theme.name} class="h-full object-contain" />
								</div>
								<span class="text-[10px] font-medium truncate w-full text-center">{theme.name}</span>
							</button>
						{/each}
						<!-- Potentially add a "More" or scrollable list if needed -->
					</div>
				</div>
			</div>

			<!-- FOOTER -->
			<div class="p-6 border-t border-white/5 bg-[#0f172a]/80 backdrop-blur-md sticky bottom-0 z-10 flex gap-3">
				<button 
					onclick={close}
					class="flex-1 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all"
				>
					Annuler
				</button>
				<button 
					onclick={handleSave}
					class="flex-1 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all shadow-lg shadow-violet-900/20"
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

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.1);
	}
</style>
