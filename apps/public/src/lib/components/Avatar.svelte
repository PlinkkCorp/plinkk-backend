<script lang="ts">
	export let user: any;

	$: _av_entity = user;
	let _av_imgUrl: string | null = null;
	
	$: if (_av_entity && _av_entity.image) {
		_av_imgUrl = String(_av_entity.image);
		if (!/^https?:\/\//i.test(_av_imgUrl) && _av_imgUrl[0] !== '/' && !/^data:/i.test(_av_imgUrl)) {
			_av_imgUrl = '/public/uploads/avatars/' + _av_imgUrl;
		}
	} else if (_av_entity) {
		// Gravatar logic omitted for brevity, but could be added
		_av_imgUrl = null;
	}

	$: _av_initial = _av_entity && (_av_entity.userName || _av_entity.id) 
		? String(_av_entity.userName || _av_entity.id).charAt(0).toUpperCase() 
		: 'U';

	$: _av_rn = _av_entity && _av_entity.role ? (_av_entity.role.id || _av_entity.role.name) : null;
	$: _av_staff = !!(_av_rn && ['ADMIN', 'DEVELOPER', 'MODERATOR'].includes(_av_rn));
	$: _av_pu = _av_entity && _av_entity.premiumUntil ? new Date(_av_entity.premiumUntil) : null;
	$: _av_activePremium = !!(_av_entity && _av_entity.isPremium && (!_av_pu || _av_pu.getTime() > Date.now()));
	$: _av_isPremium = !!(_av_entity && (_av_staff || _av_entity.isPartner || _av_activePremium));
	$: _av_showUi = !!(_av_entity && _av_entity.showPremiumUi !== false);
	$: _av_show = _av_isPremium && _av_showUi;
</script>

<div class="plinkk-av w-full h-full" class:plinkk-av--premium={_av_show} data-avatar data-avatar-user={_av_entity?.id || ''}>
	{#if _av_show}
		<div class="plinkk-av-glow"></div>
		<div class="plinkk-av-ring"></div>
	{/if}
	<div class="plinkk-av-img bg-slate-800" class:animate-pulse={!_av_imgUrl && !_av_entity?.profileImage}>
		{#if _av_imgUrl}
			<img src={_av_imgUrl} alt="Avatar" class="h-full w-full object-cover transition-opacity duration-300" on:load={(e) => e.currentTarget.classList.remove('opacity-0')} />
		{:else if _av_entity?.profileImage}
			<img src={_av_entity.profileImage} alt="Avatar" class="h-full w-full object-cover transition-opacity duration-300" on:load={(e) => e.currentTarget.classList.remove('opacity-0')} />
		{:else}
			{_av_initial}
		{/if}
	</div>
	{#if _av_show}
		<div class="plinkk-av-badge">
			<svg viewBox="0 0 24 24" fill="#fff">
				<path d="M2 8l4 3 4-5 4 5 4-3-2 10H4L2 8z" />
				<rect x="3" y="18" width="14" height="2" rx="1" transform="translate(2 0)" />
			</svg>
		</div>
	{/if}
</div>

<style>
	@keyframes _av_ring_spin {
		0% { transform: rotate(0deg) }
		100% { transform: rotate(360deg) }
	}
	@keyframes _av_glow_pulse {
		0%, 100% { opacity: .55 }
		50% { opacity: .9 }
	}
	.plinkk-av {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.plinkk-av-img {
		width: 100%;
		height: 100%;
		border-radius: 9999px;
		overflow: hidden;
		display: grid;
		place-items: center;
		font-weight: 700;
		position: relative;
		z-index: 2;
	}
	.plinkk-av--premium .plinkk-av-ring {
		position: absolute;
		inset: -3px;
		border-radius: 9999px;
		z-index: 1;
		padding: 2px;
		background: conic-gradient(from 180deg, #2dd4bf, #06b6d4, #8b5cf6, #d946ef, #2dd4bf);
		animation: _av_ring_spin 3s linear infinite;
		-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		mask-composite: exclude;
	}
	.plinkk-av--premium .plinkk-av-glow {
		position: absolute;
		inset: -6px;
		border-radius: 9999px;
		z-index: 0;
		background: radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, rgba(168, 85, 247, 0.2) 60%, transparent 80%);
		animation: _av_glow_pulse 2.5s ease-in-out infinite;
		pointer-events: none;
	}
	.plinkk-av--premium .plinkk-av-badge {
		position: absolute;
		bottom: -1px;
		right: -1px;
		z-index: 3;
		width: 40%;
		height: 40%;
		max-width: 18px;
		max-height: 18px;
		min-width: 10px;
		min-height: 10px;
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #06b6d4, #a855f7);
		box-shadow: 0 2px 8px rgba(139, 92, 246, 0.5), 0 0 0 2px #0f172a;
	}
	.plinkk-av--premium .plinkk-av-badge svg {
		width: 60%;
		height: 60%;
	}
</style>
