<script lang="ts">
	export let plinkk: any;
	export let user: any;
	export let onupdate: (field: string, value: any) => void = () => {};
	export let onupload: (data: { field: string, file: File }) => void = () => {};

	let maskedFields = {
		profileSiteText: true,
		email: true,
		profileIcon: true,
		iconUrl: true,
		description: true
	};

	function toggleMask(field: string) {
		maskedFields[field] = !maskedFields[field];
	}

	function handleInput(field: string, value: any) {
		onupdate(field, value);
	}

	function triggerUpload(field: string) {
		const input = document.getElementById(`upload-${field}`) as HTMLInputElement;
		if (input) input.click();
	}

	async function onFileChange(event: Event, field: string) {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) return;
		
		const file = input.files[0];
		onupload({ field, file });
	}
</script>

<div class="space-y-6">
	<div class="mb-6 pb-4 border-b border-slate-800">
		<h3 class="text-lg font-semibold text-white">Profil</h3>
		<p class="text-sm text-slate-400">Informations de base affichées publiquement.</p>
	</div>
	
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<label class="block space-y-2">
			<span class="text-sm font-medium text-slate-300 flex items-center gap-2">
				Lien du profil 
				<span class="info-i" title="Lien externe vers ton profil principal">i</span>
			</span>
			<input 
				type="url"
				value={plinkk.profileLink || ''}
				oninput={(e) => handleInput('profileLink', e.currentTarget.value)}
				class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-slate-200 placeholder-slate-600"
				placeholder="https://..." 
			/>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-slate-300 flex items-center gap-2">
				Texte du site 
				<span class="info-i" title="Texte court affiché à côté du lien">i</span>
			</span>
			<div class="relative">
				<input 
					type={maskedFields.profileSiteText ? 'password' : 'text'}
					value={plinkk.profileSiteText || ''}
					oninput={(e) => handleInput('profileSiteText', e.currentTarget.value)}
					class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-slate-200" 
				/>
				<button 
					type="button" 
					onclick={() => toggleMask('profileSiteText')}
					class="absolute right-2 top-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						{#if maskedFields.profileSiteText}
							<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"></path>
							<circle cx="12" cy="12" r="3"></circle>
						{:else}
							<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
							<line x1="1" y1="1" x2="23" y2="23"></line>
						{/if}
					</svg>
				</button>
			</div>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-slate-300 flex items-center gap-2">
				Nom affiché 
				<span class="info-i" title="Nom public visible sur ta page">i</span>
			</span>
			<input 
				type="text"
				value={plinkk.userName || user.userName || ''}
				oninput={(e) => handleInput('userName', e.currentTarget.value)}
				class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-slate-200" 
			/>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-slate-300 flex items-center gap-2">
				Email 
				<span class="info-i" title="Adresse e‑mail de contact">i</span>
			</span>
			<div class="relative">
				<input 
					type={maskedFields.email ? 'password' : 'email'}
					value={plinkk.email || user.email || ''}
					oninput={(e) => handleInput('email', e.currentTarget.value)}
					class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-slate-200" 
				/>
				<button 
					type="button" 
					onclick={() => toggleMask('email')}
					class="absolute right-2 top-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						{#if maskedFields.email}
							<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"></path>
							<circle cx="12" cy="12" r="3"></circle>
						{:else}
							<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
							<line x1="1" y1="1" x2="23" y2="23"></line>
						{/if}
					</svg>
				</button>
			</div>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-slate-300 flex items-center gap-2">
				Image de profil (URL) 
				<span class="info-i" title="URL d’une image carrée">i</span>
			</span>
			<div class="flex items-center gap-2">
				<input 
					type="url"
					value={plinkk.profileImage || ''}
					oninput={(e) => handleInput('profileImage', e.currentTarget.value)}
					class="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-slate-200" 
				/>
				<input type="file" id="upload-profileImage" accept="image/*" class="hidden" onchange={(e) => onFileChange(e, 'profileImage')} />
				<button 
					type="button" 
					onclick={() => triggerUpload('profileImage')}
					class="shrink-0 px-3 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors"
					title="Uploader une image"
				>
					<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="17 8 12 3 7 8" />
						<line x1="12" y1="3" x2="12" y2="15" />
					</svg>
				</button>
			</div>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-slate-300 flex items-center gap-2">
				Icône de profil (URL) 
				<span class="info-i" title="Petite icône affichée près de ton nom">i</span>
			</span>
			<div class="flex items-center gap-2">
				<div class="relative flex-1">
					<input 
						type={maskedFields.profileIcon ? 'password' : 'url'}
						value={plinkk.profileIcon || ''}
						oninput={(e) => handleInput('profileIcon', e.currentTarget.value)}
						class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-slate-200" 
					/>
					<button 
						type="button" 
						onclick={() => toggleMask('profileIcon')}
						class="absolute right-2 top-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
					>
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							{#if maskedFields.profileIcon}
								<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"></path>
								<circle cx="12" cy="12" r="3"></circle>
							{:else}
								<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
								<line x1="1" y1="1" x2="23" y2="23"></line>
							{/if}
						</svg>
					</button>
				</div>
				<input type="file" id="upload-profileIcon" accept="image/*" class="hidden" onchange={(e) => onFileChange(e, 'profileIcon')} />
				<button 
					type="button" 
					onclick={() => triggerUpload('profileIcon')}
					class="shrink-0 px-3 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors"
					title="Uploader une icône"
				>
					<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="17 8 12 3 7 8" />
						<line x1="12" y1="3" x2="12" y2="15" />
					</svg>
				</button>
			</div>
		</label>

		<label class="block space-y-2 md:col-span-2">
			<span class="text-sm font-medium text-slate-300 flex items-center gap-2">
				Description 
				<span class="info-i" title="Courte bio affichée sur ta page">i</span>
			</span>
			<div class="relative">
				<textarea 
					value={plinkk.description || ''}
					oninput={(e) => handleInput('description', e.currentTarget.value)}
					rows="3"
					class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-slate-200 resize-none"
				></textarea>
			</div>
		</label>
	</div>
</div>

<style>
	.info-i {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
		font-size: 10px;
		line-height: 1;
		border-radius: 9999px;
		border: 1px solid rgba(148, 163, 184, 0.35);
		color: #cbd5e1;
		margin-left: 6px;
		cursor: help;
		background: rgba(15, 23, 42, 0.5);
	}
	.info-i:hover {
		background: rgba(30, 41, 59, 0.6);
		color: #e5e7eb;
		border-color: rgba(148, 163, 184, 0.6);
	}
</style>
