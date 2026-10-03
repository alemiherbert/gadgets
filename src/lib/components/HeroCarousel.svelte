<script lang="ts" module>
	export type HeroSlide = {
		id: number | string;
		eyebrow?: string;
		title: string;
		subtitle: string;
		ctaText: string;
		ctaLink: string;
		bgColor: string;
		textColor: string;
		desktopSrc: string | null;
		mobileSrc: string | null;
		position: string;
		overlay: number;
		productSrc: string | null;
	};
</script>

<script lang="ts">
	import Icon from './Icon.svelte';

	let { slides }: { slides: HeroSlide[] } = $props();

	const DURATION = 6000;

	let current = $state(0);
	let paused = $state(false);
	let hidden = $state(false);
	let cycle = $state(0);
	let reducedMotion = $state(false);

	const autoplay = $derived(slides.length > 1 && !paused && !hidden && !reducedMotion);
	const activeText = $derived(slides[current]?.textColor || '#ffffff');

	$effect(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const onVisibility = () => (hidden = document.hidden);
		document.addEventListener('visibilitychange', onVisibility);
		return () => document.removeEventListener('visibilitychange', onVisibility);
	});

	$effect(() => {
		if (!autoplay) return;
		void current;
		void cycle;
		const t = setTimeout(() => go(current + 1), DURATION);
		return () => clearTimeout(t);
	});

	function go(index: number) {
		current = (index + slides.length) % slides.length;
		cycle++;
	}

	function togglePause() {
		paused = !paused;
		cycle++;
	}

	// Swipe
	let startX = 0;
	let startY = 0;
	let swiped = false;

	function onPointerDown(e: PointerEvent) {
		startX = e.clientX;
		startY = e.clientY;
		swiped = false;
	}

	function onPointerUp(e: PointerEvent) {
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
			swiped = true;
			go(current + (dx < 0 ? 1 : -1));
		}
	}

	function onClickCapture(e: MouseEvent) {
		if (swiped) {
			e.preventDefault();
			e.stopPropagation();
			swiped = false;
		}
	}

	// The first slide renders static so its text is painted immediately (LCP)
	function reveal(isActive: boolean) {
		if (!isActive) return 'opacity-0';
		return cycle > 0 ? 'animate-fade-up' : '';
	}

	function background(slide: HeroSlide) {
		return `radial-gradient(120% 120% at 85% 15%, ${slide.bgColor}cc 0%, ${slide.bgColor} 45%, ${slide.bgColor} 100%)`;
	}
</script>

<section
	class="relative overflow-hidden bg-ink select-none"
	aria-roledescription="carousel"
	aria-label="Featured offers"
	onpointerdown={onPointerDown}
	onpointerup={onPointerUp}
	onclickcapture={onClickCapture}
	style="touch-action: pan-y;"
>
	<div class="relative h-[min(560px,72svh)] min-h-[460px] lg:h-[540px]">
		{#each slides as slide, i (slide.id)}
			{@const isActive = i === current}
			{@const hasBg = !!(slide.desktopSrc || slide.mobileSrc)}
			<div
				class="absolute inset-0 transition-opacity duration-700 ease-out {isActive ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0'}"
				style="background: {background(slide)}; color: {slide.textColor};"
				role="group"
				aria-roledescription="slide"
				aria-label="{i + 1} of {slides.length}"
				aria-hidden={!isActive}
			>
				{#if hasBg}
					<picture>
						{#if slide.desktopSrc && slide.mobileSrc}
							<source media="(min-width: 768px)" srcset={slide.desktopSrc} />
						{/if}
						<img
							src={slide.mobileSrc ?? slide.desktopSrc}
							alt=""
							class="absolute inset-0 size-full object-cover {isActive ? 'scale-100' : 'scale-105'} transition-transform duration-[2000ms] ease-out"
							style="object-position: {slide.position};"
							loading={i === 0 ? 'eager' : 'lazy'}
							fetchpriority={i === 0 ? 'high' : 'auto'}
							decoding={i === 0 ? 'sync' : 'async'}
						/>
					</picture>
					<div
						class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10 md:bg-gradient-to-r md:from-black/75 md:via-black/35 md:to-transparent"
						style="opacity: {Math.min(1, Math.max(0.35, slide.overlay / 0.4))};"
					></div>
				{:else}
					<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
						<div class="absolute -right-24 -top-24 size-[28rem] rounded-full bg-white/10 blur-3xl"></div>
						<div class="absolute -bottom-32 left-1/4 size-[22rem] rounded-full bg-black/15 blur-3xl"></div>
						<div class="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:44px_44px]"></div>
					</div>
				{/if}

				{#if slide.productSrc && !hasBg}
					<div class="absolute inset-x-0 top-6 flex h-[42%] justify-center md:inset-y-0 md:left-auto md:right-[6%] md:top-0 md:h-full md:w-[42%] md:items-center">
						<div class="relative aspect-square h-full max-h-[420px] rounded-[2rem] bg-white/95 p-6 shadow-2xl md:h-auto md:w-full {isActive && cycle > 0 ? 'animate-fade-up' : ''}">
							<img src={slide.productSrc} alt="" class="product-shot size-full" loading={i === 0 ? 'eager' : 'lazy'} />
						</div>
					</div>
				{/if}

				<div class="wrap relative flex h-full items-end pb-24 md:items-center md:pb-0">
					<div class="max-w-xl {slide.productSrc && !hasBg ? 'md:max-w-[48%]' : ''}">
						{#if slide.eyebrow}
							<p class="mb-4 inline-flex items-center gap-1.5 rounded-full bg-sun px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-ink {reveal(isActive)}">
								<Icon name="bolt-solid" class="size-3" />
								{slide.eyebrow}
							</p>
						{/if}
						<h2 class="h-display {reveal(isActive)}" style="animation-delay: 80ms;">{slide.title}</h2>
						{#if slide.subtitle}
							<p class="mt-4 max-w-md text-base leading-relaxed opacity-85 sm:text-lg {reveal(isActive)}" style="animation-delay: 160ms;">
								{slide.subtitle}
							</p>
						{/if}
						<div class="mt-7 {reveal(isActive)}" style="animation-delay: 240ms;">
							<a href={slide.ctaLink} class="cta cta-light cta-lg group/cta" tabindex={isActive ? 0 : -1}>
								{slide.ctaText}
								<Icon name="arrow-right" class="size-[18px] transition group-hover/cta:translate-x-1" stroke={2.25} />
							</a>
						</div>
					</div>
				</div>
			</div>
		{/each}

		{#if slides.length > 1}
			<div class="absolute inset-x-0 bottom-6 z-20" style="color: {activeText};">
				<div class="wrap flex items-center gap-3">
					<div class="flex items-center gap-1.5">
						{#each slides as _, i}
							<button
								onclick={() => go(i)}
								class="group/dot relative h-6 w-8 sm:w-12"
								aria-label="Go to slide {i + 1}"
								aria-current={i === current}
							>
								<span class="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-current/30">
									{#if i === current}
										{#if autoplay}
											{#key cycle}
												<span class="absolute inset-0 origin-left rounded-full bg-current" style="animation: slide-progress {DURATION}ms linear both;"></span>
											{/key}
										{:else}
											<span class="absolute inset-0 rounded-full bg-current"></span>
										{/if}
									{/if}
								</span>
							</button>
						{/each}
					</div>
					<button
						onclick={togglePause}
						class="grid size-8 place-items-center rounded-full bg-current/15 backdrop-blur transition hover:bg-current/25"
						aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
					>
						{#if paused}
							<svg class="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" /></svg>
						{:else}
							<svg class="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
						{/if}
					</button>
					<div class="ml-auto hidden gap-2 sm:flex">
						<button onclick={() => go(current - 1)} class="grid size-11 place-items-center rounded-full bg-current/15 backdrop-blur transition hover:bg-current/25" aria-label="Previous slide">
							<Icon name="chevron-left" class="size-5" stroke={2.25} />
						</button>
						<button onclick={() => go(current + 1)} class="grid size-11 place-items-center rounded-full bg-current/15 backdrop-blur transition hover:bg-current/25" aria-label="Next slide">
							<Icon name="chevron-right" class="size-5" stroke={2.25} />
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>
