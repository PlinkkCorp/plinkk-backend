<script lang="ts">
	import { onMount } from 'svelte';
	import { canvaData } from '../../../public/config/canvaConfig.js';

	export let plinkk: any;
	export let onupdate: (field: string, value: any) => void = () => {};
	export let onupdateGradient: (data: { colors: any[] }) => void = () => {};

	let bgType = plinkk.backgroundType || 'color';
	let gradientColors = plinkk.background && plinkk.background.length > 0 
		? [...plinkk.background] 
		: [{ color: '#0f172a', stop: 0 }, { color: '#1e293b', stop: 100 }];
	
	let gradientDegree = plinkk.gradientDegree || 135;
	let selectedCanvasIndex = plinkk.selectedCanvasIndex || 0;

	let isDraggingDial = false;
	let dialEl: HTMLDivElement;

	function handleUpdate(field: string, value: any) {
		onupdate(field, value);
	}

	function setBgType(type: string) {
		bgType = type;
		handleUpdate('backgroundType', type);
	}

	function addGradientColor() {
		const lastColor = gradientColors[gradientColors.length - 1]?.color || '#8b5cf6';
		gradientColors = [...gradientColors, { color: lastColor, stop: 100 }];
		saveGradient();
	}

	function removeGradientColor(index: number) {
		if (gradientColors.length > 1) {
			gradientColors = gradientColors.filter((_, i) => i !== index);
			saveGradient();
		}
	}

	function saveGradient() {
		onupdateGradient({ colors: gradientColors });
	}

	function updateGradientColor(index: number, color: string) {
		gradientColors[index].color = color;
		gradientColors = [...gradientColors];
		saveGradient();
	}

	function updateGradientStop(index: number, stop: number) {
		gradientColors[index].stop = stop;
		gradientColors = [...gradientColors];
		saveGradient();
	}

	function handleDialMouseDown(e: MouseEvent | TouchEvent) {
		isDraggingDial = true;
		updateDialAngle(e);
	}

	function updateDialAngle(e: MouseEvent | TouchEvent) {
		if (!isDraggingDial || !dialEl) return;
		const rect = dialEl.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

		const angle = Math.atan2(clientY - centerY, clientX - centerX);
		let degrees = Math.round(angle * (180 / Math.PI)) + 90;
		if (degrees < 0) degrees += 360;
		
		gradientDegree = degrees;
		handleUpdate('gradientDegree', gradientDegree);
	}

	onMount(() => {
		const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
			if (isDraggingDial) updateDialAngle(e);
		};
		const handleGlobalUp = () => {
			isDraggingDial = false;
		};

		window.addEventListener('mousemove', handleGlobalMove);
		window.addEventListener('mouseup', handleGlobalUp);
		window.addEventListener('touchmove', handleGlobalMove);
		window.addEventListener('touchend', handleGlobalUp);

		return () => {
			window.removeEventListener('mousemove', handleGlobalMove);
			window.removeEventListener('mouseup', handleGlobalUp);
			window.removeEventListener('touchmove', handleGlobalMove);
			window.removeEventListener('touchend', handleGlobalUp);
		};
	});

	$: dotX = 50 + 40 * Math.cos((gradientDegree - 90) * (Math.PI / 180));
	$: dotY = 50 + 40 * Math.sin((gradientDegree - 90) * (Math.PI / 180));
</script>

<div class="space-y-6">
	<div class="mb-6 pb-4 border-b border-slate-800">
		<h3 class="text-lg font-semibold text-white">Arrière-plan</h3>
		<p class="text-sm text-slate-400">Personnalise l'ambiance visuelle de ton profil.</p>
	</div>

	<div class="space-y-6">
		<div>
			<label class="block text-sm font-medium text-slate-300 mb-3">Type d'arrière-plan</label>
			<div class="grid grid-cols-5 p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800">
				{#each ['color', 'gradient', 'image', 'video', 'canvas'] as type}
					<button 
						type="button" 
						onclick={() => setBgType(type)}
						class="py-2 text-xs font-medium rounded-lg transition-all {bgType === type ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
					>
						{#if type === 'color'}Couleur
						{:else if type === 'gradient'}Dégradé
						{:else if type === 'image'}Image <span class="text-[8px] bg-slate-800 text-slate-400 px-1 rounded ml-1">Bientôt</span>
						{:else if type === 'video'}Vidéo <span class="text-[8px] bg-slate-800 text-slate-400 px-1 rounded ml-1">Bientôt</span>
						{:else if type === 'canvas'}Canvas
						{/if}
					</button>
				{/each}
			</div>

			<!-- Couleur Unie -->
			{#if bgType === 'color'}
				<div class="bg-options space-y-4">
					<div class="p-4 rounded-xl bg-slate-950 border border-slate-800">
						<label for="bg-color-picker" class="block text-sm font-medium text-slate-400 mb-3">Couleur de fond</label>
						<div class="flex items-center gap-3">
							<input 
								type="color" 
								id="bg-color-picker"
								value={plinkk.backgroundColor || '#0f172a'}
								oninput={(e) => handleUpdate('backgroundColor', e.currentTarget.value)}
								class="h-10 w-20 rounded-lg bg-transparent cursor-pointer border-none" 
							/>
							<input 
								type="text" 
								value={plinkk.backgroundColor || '#0f172a'}
								oninput={(e) => handleUpdate('backgroundColor', e.currentTarget.value)}
								class="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm font-mono focus:border-violet-500 outline-none transition-all" 
							/>
						</div>
					</div>
				</div>
			{/if}

			<!-- Dégradé -->
			{#if bgType === 'gradient'}
				<div class="bg-options space-y-6">
					<div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
						<div class="flex items-center justify-between mb-2">
							<label class="block text-sm font-medium text-slate-300">Couleurs du dégradé</label>
							<button 
								type="button" 
								onclick={addGradientColor}
								class="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1"
							>
								<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<line x1="12" y1="5" x2="12" y2="19"></line>
									<line x1="5" y1="12" x2="19" y2="12"></line>
								</svg>
								Ajouter
							</button>
						</div>

						<div class="space-y-3">
							{#each gradientColors as colorObj, i}
								<div class="flex items-center gap-3 p-2 bg-slate-900 rounded-lg border border-slate-800">
									<input 
										type="color"
										value={colorObj.color}
										oninput={(e) => updateGradientColor(i, e.currentTarget.value)}
										class="h-8 w-12 rounded bg-transparent cursor-pointer border-none"
									>
									<div class="flex-1 space-y-1">
										<label for="stop-range-{i}" class="flex justify-between text-[10px] text-slate-500 font-mono">
											<span>Position</span>
											<span>{colorObj.stop}%</span>
										</label>
										<input 
											type="range"
											id="stop-range-{i}"
											min="0" max="100"
											value={colorObj.stop}
											oninput={(e) => updateGradientStop(i, parseInt(e.currentTarget.value))}
											class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
										>
									</div>
									<button 
										type="button"
										onclick={() => removeGradientColor(i)}
										disabled={gradientColors.length <= 1}
										class="text-slate-500 hover:text-red-400 transition-colors p-1 disabled:opacity-30 ripple"
									>
										<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M18 6L6 18M6 6l12 12"></path>
										</svg>
									</button>
								</div>
							{/each}
						</div>

						<div class="pt-4 border-t border-slate-800">
							<label id="dial-label" class="block text-sm font-medium text-slate-400 mb-4">Angle du dégradé</label>
							<div class="flex items-center gap-6">
								<div 
									bind:this={dialEl}
									onmousedown={handleDialMouseDown}
									ontouchstart={handleDialMouseDown}
									class="deg-dial relative w-16 h-16 flex-shrink-0"
									style="cursor: {isDraggingDial ? 'grabbing' : 'grab'}"
									role="slider"
									aria-valuenow={gradientDegree}
									aria-valuemin="0"
									aria-valuemax="360"
									aria-labelledby="dial-label"
									tabindex="0"
								>
									<div 
										class="deg-dial-dot"
										style="left: {dotX}%; top: {dotY}%"
									></div>
								</div>
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<input 
											type="number" 
											min="0" max="360"
											value={gradientDegree}
											oninput={(e) => handleUpdate('gradientDegree', parseInt(e.currentTarget.value))}
											class="w-16 px-2 py-1.5 text-center rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-violet-500 outline-none" 
										/>
										<span class="text-slate-500 text-xs">degrés</span>
									</div>
									<p class="text-[10px] text-slate-500">Maintiens et glisse sur le cercle.</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Canvas -->
			{#if bgType === 'canvas'}
				<div class="bg-options space-y-6">
					<div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
						<div class="flex items-center justify-between">
							<div>
								<span class="block text-sm font-medium text-slate-200">Animation Canvas</span>
								<span class="block text-xs text-slate-500">Choisissez une animation interactive pour votre fond d'écran.</span>
							</div>
						</div>

						<div class="space-y-3">
							<label for="canvas-select" class="block text-xs font-medium text-slate-400">Choisir une animation</label>
							<div id="canvas-select" class="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar" role="listbox">
								{#each canvaData as c, i}
									<button 
										type="button" 
										onclick={() => { selectedCanvasIndex = i; handleUpdate('selectedCanvasIndex', i); }}
										class="group relative flex items-center gap-3 p-3 rounded-xl border {i === selectedCanvasIndex ? 'border-violet-500 bg-violet-900/10' : 'border-slate-800 bg-slate-950'} hover:border-slate-700 transition-all text-left"
									>
										<div class="size-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-violet-400 transition-colors">
											<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
											</svg>
										</div>
										<div>
											<div class="text-sm font-medium {i === selectedCanvasIndex ? 'text-violet-400' : 'text-slate-200'}">{c.animationName}</div>
											{#if c.author}<div class="text-[10px] text-slate-500">par {c.author}</div>{/if}
										</div>
										{#if i === selectedCanvasIndex}
											<div class="ml-auto">
												<div class="size-2 rounded-full bg-violet-500 shadow-lg shadow-violet-500/50"></div>
											</div>
										{/if}
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Vidéo & Image (Bientôt) -->
			{#if bgType === 'video' || bgType === 'image'}
				<div class="bg-options space-y-4">
					<div class="p-4 rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden">
						<div class="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
							<span class="px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-full shadow-lg">Bientôt disponible</span>
						</div>
						<label class="block text-sm font-medium text-slate-400 mb-3">
							{bgType === 'video' ? "Vidéo d'arrière-plan (.mp4)" : "Image d'arrière-plan"}
						</label>
						<div class="flex flex-col gap-3">
							<div class="flex items-center gap-2">
								<input 
									type="url" 
									value={bgType === 'video' ? plinkk.backgroundVideo : plinkk.backgroundImage}
									class="flex-1 px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-violet-500 outline-none text-slate-200 text-sm"
									disabled
								/>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.deg-dial {
		border-radius: 100%;
		border: 1px solid #334155;
		background: radial-gradient(closest-side, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9));
		box-shadow: inset 0 0 0 2px rgba(148, 163, 184, 0.1);
		user-select: none;
		touch-action: none;
	}

	.deg-dial-dot {
		position: absolute;
		width: 14px;
		height: 14px;
		border-radius: 100%;
		background: #93c5fd;
		border: 2px solid #1f2937;
		transform: translate(-50%, -50%);
		box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.35);
		pointer-events: none;
	}

	.deg-dial:active .deg-dial-dot {
		background: #3b82f6;
	}

	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: rgba(15, 23, 42, 0.5);
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #334155;
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #475569;
	}
</style>
