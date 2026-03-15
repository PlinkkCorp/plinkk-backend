<script lang="ts">
	import { onMount } from 'svelte';
	import Head from '$lib/components/Head.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let scrollProgress = 0;
	let cursorGlow: HTMLDivElement;
	let counters: HTMLParagraphElement[] = [];

	onMount(() => {
		// Scroll progress
		const handleScroll = () => {
			const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
			const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
			scrollProgress = (winScroll / height) * 100;
		};
		window.addEventListener('scroll', handleScroll);

		// Cursor glow
		const handleMouseMove = (e: MouseEvent) => {
			if (cursorGlow) {
				cursorGlow.style.left = e.clientX + 'px';
				cursorGlow.style.top = e.clientY + 'px';
			}
		};
		window.addEventListener('mousemove', handleMouseMove);

		// Reveal on scroll
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.classList.add('visible');
				}
			});
		}, { threshold: 0.1 });

		document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right').forEach(el => {
			observer.observe(el);
		});

		// Counters
		const countObserver = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const target = parseInt(entry.target.getAttribute('data-target') || '0');
					let count = 0;
					const speed = 2000 / target;
					const updateCount = () => {
						count += Math.ceil(target / 100);
						if (count < target) {
							entry.target.innerHTML = count.toLocaleString();
							setTimeout(updateCount, 1);
						} else {
							entry.target.innerHTML = target.toLocaleString();
						}
					};
					updateCount();
					countObserver.unobserve(entry.target);
				}
			});
		}, { threshold: 0.5 });

		document.querySelectorAll('.counter').forEach(el => countObserver.observe(el));

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('mousemove', handleMouseMove);
		};
	});
</script>

<Head 
	title="Plinkk — Votre univers en un seul lien" 
	description="L'alternative open-source à Linktree. Créez une page de liens magnifique, rapide et entièrement personnalisable en quelques minutes."
/>

<div class="scroll-progress">
	<div class="scroll-progress-bar" style="width: {scrollProgress}%"></div>
</div>

<div class="cursor-glow hidden lg:block" bind:this={cursorGlow}></div>

<main class="relative overflow-hidden">
	<!-- Hero Section -->
	<section class="hero-shell relative min-h-screen flex items-center px-6 py-24 lg:py-14 overflow-hidden">
		<div class="hero-grid absolute inset-0 pointer-events-none" aria-hidden="true"></div>
		<div class="hero-layout relative z-10 w-full text-center">
			<h1 class="reveal hero-title">
				Votre univers en un lien.
				<span class="hero-title-accent">Clair, vivant, mémorisable.</span>
			</h1>
			<p class="reveal reveal-delay-2 hero-subtitle">
				Plinkk rassemble vos contenus, offres et réseaux dans une page qui convertit vraiment. Une expérience fluide inspirée des meilleurs standards creator, avec une vraie identité de marque.
			</p>
			<div class="reveal hero-input-stack mx-auto max-w-2xl px-4">
				<form on:submit|preventDefault={() => {}}>
					<div class="hero-input-wrap flex flex-col sm:flex-row items-stretch gap-2">
						<div class="relative flex-1">
							<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
								<svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
								</svg>
							</div>
							<input type="email" required class="hero-input w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-slate-500" placeholder="vous@exemple.com" />
						</div>
						<button type="submit" class="btn-primary px-6 py-3.5 rounded-xl text-sm font-semibold whitespace-nowrap">
							Créer mon Plinkk
						</button>
					</div>
				</form>
				<div class="hero-strip mt-4 flex justify-center gap-4 flex-wrap text-xs text-slate-400">
					<span class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
						<svg class="w-3.5 h-3.5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
						Gratuit pour commencer
					</span>
					<span class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
						<svg class="w-3.5 h-3.5 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
						Setup en 2 minutes
					</span>
					<span class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
						<svg class="w-3.5 h-3.5 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
						Open source
					</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Stats Section -->
	<section class="py-32 px-6 lg:px-12 border-y border-white/5">
		<div class="max-w-7xl mx-auto">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24">
				<div class="reveal text-center md:text-left">
					<p class="big-number gradient-text counter" data-target={data.userCount}>0</p>
					<p class="text-slate-400 text-lg mt-2">Créateurs actifs</p>
				</div>
				<div class="reveal reveal-delay-1 text-center md:text-left">
					<p class="big-number gradient-text counter" data-target={data.linkCount}>0</p>
					<p class="text-slate-400 text-lg mt-2">Liens partagés</p>
				</div>
				<div class="reveal reveal-delay-2 text-center md:text-left">
					<p class="big-number gradient-text counter" data-target={data.totalViews}>0</p>
					<p class="text-slate-400 text-lg mt-2">Vues totales</p>
				</div>
			</div>
		</div>
	</section>
</main>

<style>
	.hero-shell {
		background:
			radial-gradient(1200px 520px at 10% 0%, rgba(0, 194, 168, 0.14), transparent 60%),
			radial-gradient(980px 480px at 92% 12%, rgba(255, 122, 89, 0.16), transparent 60%),
			linear-gradient(180deg, #07080d 0%, #0b1020 55%, #0a0f1a 100%);
	}
	.hero-grid {
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
		background-size: 52px 52px;
		mask-image: radial-gradient(ellipse 82% 70% at 50% 40%, black 28%, transparent 100%);
	}
	.hero-title {
		font-family: "Sora", sans-serif;
		font-size: clamp(2.3rem, 5.2vw, 4.5rem);
		line-height: 1.03;
		letter-spacing: -0.035em;
		font-weight: 700;
		color: #f8fafc;
		margin-bottom: 16px;
	}
	.hero-title-accent {
		background: linear-gradient(92deg, #8af9ef 0%, #63d8ff 42%, #ffd3a7 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}
	.hero-subtitle {
		color: rgba(226, 232, 240, 0.78);
		max-width: 640px;
		margin: 0 auto 30px;
		font-size: clamp(0.98rem, 1.7vw, 1.16rem);
		line-height: 1.65;
	}
	.hero-input-wrap {
		background: rgba(8, 12, 20, 0.66);
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 18px;
		padding: 6px;
		backdrop-filter: blur(10px);
	}
	.hero-input {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid transparent;
		transition: border-color .2s;
	}
	.hero-input:focus {
		outline: none;
		border-color: rgba(99, 216, 255, 0.75);
	}
	.big-number {
		font-size: clamp(3rem, 8vw, 6rem);
		font-weight: 700;
		line-height: 1;
	}
	.scroll-progress {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 3px;
		z-index: 100;
	}
	.scroll-progress-bar {
		height: 100%;
		background: linear-gradient(90deg, #818cf8, #c084fc, #f472b6);
	}
	.cursor-glow {
		position: fixed;
		width: 400px;
		height: 400px;
		background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
		transform: translate(-50%, -50%);
		pointer-events: none;
		z-index: 0;
	}
	
	:global(.reveal) {
		opacity: 0;
		transform: translateY(30px);
		transition: all 0.8s ease-out;
	}
	:global(.reveal.visible) {
		opacity: 1;
		transform: translateY(0);
	}
</style>
