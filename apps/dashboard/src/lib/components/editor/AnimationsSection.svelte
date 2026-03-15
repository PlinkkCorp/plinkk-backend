<script lang="ts">
	import { animations, animationBackground } from '../../../public/config/animationConfig.js';

	export let plinkk: any;
	export let onupdate: (field: string, value: any) => void = () => {};
	export let onopenPicker: (data: { type: string, items: any[], field: string, title: string }) => void = () => {};

	function handleUpdate(field: string, value: any) {
		onupdate(field, value);
	}

	function openAnimationPicker(type: 'profile' | 'button' | 'background') {
		const items = type === 'background' ? animationBackground : animations;
		const field = type === 'profile' ? 'selectedAnimationIndex' : 
		              type === 'button' ? 'selectedAnimationButtonIndex' : 
					  'selectedAnimationBackgroundIndex';
		
		onopenPicker({ 
			type: 'animation', 
			items, 
			field,
			title: type === 'profile' ? 'Animation du Profil' : 
			       type === 'button' ? 'Animation des Boutons' : 
				   'Animation du Fond'
		});
	}

	$: profileAnim = animations[plinkk.selectedAnimationIndex] || animations[0];
	$: buttonAnim = animations[plinkk.selectedAnimationButtonIndex] || animations[0];
	$: backgroundAnim = animationBackground[plinkk.selectedAnimationBackgroundIndex] || animationBackground[0];
</script>

<div class="space-y-6">
	<div class="mb-6 pb-4 border-b border-slate-800">
		<h3 class="text-lg font-semibold text-white">Animations</h3>
		<p class="text-sm text-slate-400">Personnalisez les effets d'apparition de vos éléments.</p>
	</div>

	<div class="space-y-8">
		<!-- PROFIL ANIMATION -->
		<div class="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-6">
			<div class="flex items-center justify-between">
				<div>
					<h4 class="text-sm font-medium text-white">Animation du Profil</h4>
					<p class="text-xs text-slate-500">Effet d'apparition du bloc principal.</p>
				</div>
				<label class="relative inline-flex items-center cursor-pointer">
					<input 
						type="checkbox" 
						checked={plinkk.EnableAnimationArticle}
						onchange={(e) => handleUpdate('EnableAnimationArticle', e.currentTarget.checked)}
						class="sr-only peer"
					>
					<div class="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:bg-violet-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
				</label>
			</div>

			<div class="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
				<div class="flex-1 min-w-0">
					<div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Animation sélectionnée</div>
					<div class="text-sm text-slate-200 truncate font-medium">{profileAnim.name}</div>
				</div>
				<button 
					type="button" 
					onclick={() => openAnimationPicker('profile')}
					class="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
				>
					Choisir
				</button>
			</div>
		</div>

		<!-- BUTTONS ANIMATION -->
		<div class="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-6">
			<div class="flex items-center justify-between">
				<div>
					<h4 class="text-sm font-medium text-white">Animation des Boutons</h4>
					<p class="text-xs text-slate-500">Effet cascade sur vos liens.</p>
				</div>
				<label class="relative inline-flex items-center cursor-pointer">
					<input 
						type="checkbox" 
						checked={plinkk.EnableAnimationButton}
						onchange={(e) => handleUpdate('EnableAnimationButton', e.currentTarget.checked)}
						class="sr-only peer"
					>
					<div class="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:bg-violet-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
				</label>
			</div>

			<div class="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
				<div class="flex-1 min-w-0">
					<div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Animation sélectionnée</div>
					<div class="text-sm text-slate-200 truncate font-medium">{buttonAnim.name}</div>
				</div>
				<button 
					type="button" 
					onclick={() => openAnimationPicker('button')}
					class="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
				>
					Choisir
				</button>
			</div>

			<div class="pt-4 border-t border-slate-800">
				<div class="flex items-center justify-between mb-2">
					<label class="text-xs font-medium text-slate-400">Délai de cascade</label>
					<span class="text-xs font-mono text-violet-400">{plinkk.delayAnimationButton || 0.1}s</span>
				</div>
				<input 
					type="range" 
					min="0" max="1.0" step="0.05"
					value={plinkk.delayAnimationButton || 0.1}
					oninput={(e) => handleUpdate('delayAnimationButton', parseFloat(e.currentTarget.value))}
					class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
				>
			</div>
		</div>

		<!-- BACKGROUND ANIMATION (CSS) -->
		<div class="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-6">
			<div class="flex items-center justify-between">
				<div>
					<h4 class="text-sm font-medium text-white">Animation du Fond</h4>
					<p class="text-xs text-slate-500">Mouvement du fond d'écran (CSS).</p>
				</div>
				<label class="relative inline-flex items-center cursor-pointer">
					<input 
						type="checkbox" 
						checked={plinkk.EnableAnimationBackground}
						onchange={(e) => handleUpdate('EnableAnimationBackground', e.currentTarget.checked)}
						class="sr-only peer"
					>
					<div class="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:bg-violet-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
				</label>
			</div>

			<div class="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
				<div class="flex-1 min-w-0">
					<div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Animation sélectionnée</div>
					<div class="text-sm text-slate-200 truncate font-medium">{backgroundAnim.name}</div>
				</div>
				<button 
					type="button" 
					onclick={() => openAnimationPicker('background')}
					class="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
				>
					Choisir
				</button>
			</div>
		</div>

		<!-- GLOBAL DURATION -->
		<div class="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
			<div class="flex items-center justify-between mb-4">
				<label class="text-sm font-medium text-white">Vitesse globale</label>
				<span class="text-xs font-mono text-violet-400">{plinkk.animationDuration || 0.5}s</span>
			</div>
			<input 
				type="range" 
				min="0.1" max="2.0" step="0.1"
				value={plinkk.animationDuration || 0.5}
				oninput={(e) => handleUpdate('animationDuration', parseFloat(e.currentTarget.value))}
				class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
			>
			<div class="flex justify-between text-[10px] text-slate-600 mt-2 uppercase tracking-wider font-semibold">
				<span>Rapide</span>
				<span>Lent</span>
			</div>
		</div>
	</div>
</div>
