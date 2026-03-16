<script lang="ts">
	import type { PageData } from "./$types";
	import { getImageUrl } from "$lib/r2";
	import ProductCard from "$lib/components/ProductCard.svelte";

	let { data }: { data: PageData } = $props();

	// Carousel state
	let currentSlide = $state(0);
	let carouselTimer: ReturnType<typeof setInterval>;

	const slides = $derived(
		data.slides.length > 0
			? data.slides
			: [
					{
						id: 0,
						title: "Premium Audio",
						subtitle:
							"Immerse yourself in crystal-clear sound with our noise-cancelling earbuds.",
						cta_text: "Shop Audio",
						cta_link: "/#products",
						bg_color: "#2563eb",
						text_color: "#ffffff",
						image_key: null,
						bg_image_desktop_key: null,
						bg_image_mobile_key: null,
						bg_image_position: "center center",
						overlay_opacity: 0.4,
						product_id: null,
						sort_order: 0,
						active: 1,
						created_at: "",
					},
					{
						id: 1,
						title: "Smart Wearables",
						subtitle:
							"Track your fitness goals with style. Water-resistant and GPS-enabled.",
						cta_text: "Explore Wearables",
						cta_link: "/#products",
						bg_color: "#0891b2",
						text_color: "#ffffff",
						image_key: null,
						bg_image_desktop_key: null,
						bg_image_mobile_key: null,
						bg_image_position: "center center",
						overlay_opacity: 0.4,
						product_id: null,
						sort_order: 1,
						active: 1,
						created_at: "",
					},
					{
						id: 2,
						title: "Desk Essentials",
						subtitle:
							"Upgrade your workspace with premium keyboards, hubs, and accessories.",
						cta_text: "Browse Accessories",
						cta_link: "/#products",
						bg_color: "#7c3aed",
						text_color: "#ffffff",
						image_key: null,
						bg_image_desktop_key: null,
						bg_image_mobile_key: null,
						bg_image_position: "center center",
						overlay_opacity: 0.4,
						product_id: null,
						sort_order: 2,
						active: 1,
						created_at: "",
					},
				],
	);

	function nextSlide() {
		currentSlide = (currentSlide + 1) % slides.length;
	}
	function prevSlide() {
		currentSlide = (currentSlide - 1 + slides.length) % slides.length;
	}
	function goToSlide(i: number) {
		currentSlide = i;
		resetTimer();
	}
	function resetTimer() {
		clearInterval(carouselTimer);
		carouselTimer = setInterval(nextSlide, 5000);
	}

	$effect(() => {
		carouselTimer = setInterval(nextSlide, 5000);
		return () => clearInterval(carouselTimer);
	});

	// Horizontal scroll helpers for product carousels
	function scrollCarousel(id: string, dir: "left" | "right") {
		const el = document.getElementById(id);
		if (!el) return;
		const half = el.scrollWidth / 2;
		const scrollAmount = el.clientWidth * 0.8;
		if (dir === "right") {
			if (el.scrollLeft >= half - 2) {
				el.style.scrollBehavior = "auto";
				el.scrollLeft = el.scrollLeft - half;
				void el.offsetWidth;
				el.style.scrollBehavior = "";
			}
			el.scrollBy({ left: scrollAmount, behavior: "smooth" });
		} else {
			if (el.scrollLeft <= 2) {
				el.style.scrollBehavior = "auto";
				el.scrollLeft = el.scrollLeft + half;
				void el.offsetWidth;
				el.style.scrollBehavior = "";
			}
			el.scrollBy({ left: -scrollAmount, behavior: "smooth" });
		}
	}

	// Infinite-loop auto-scroll using duplicated content.
	function startCarouselAutoScroll(id: string): () => void {
		const timer = setInterval(() => {
			const el = document.getElementById(id);
			if (!el) return;
			const half = el.scrollWidth / 2;
			// If we've scrolled past the first set, silently reset
			if (el.scrollLeft >= half - 2) {
				el.style.scrollBehavior = "auto";
				el.scrollLeft = el.scrollLeft - half;
				void el.offsetWidth;
				el.style.scrollBehavior = "";
			}
			el.scrollBy({ left: el.clientWidth * 0.2, behavior: "smooth" });
		}, 6000);
		return () => clearInterval(timer);
	}

	$effect(() => startCarouselAutoScroll("carousel-flash"));
	$effect(() => startCarouselAutoScroll("carousel-new"));
	$effect(() => startCarouselAutoScroll("carousel-featured"));
	$effect(() => startCarouselAutoScroll("carousel-best"));
</script>

<svelte:head>
	<title
		>Gadgeteria | Premium Electronics, Audio & Wearables | Fast Delivery</title
	>
	<meta
		name="description"
		content="Shop the latest smartphones, wireless earbuds, smartwatches, and tech accessories in Uganda. Premium quality, competitive prices, and fast delivery nationwide. Free shipping on orders over UGX 200,000."
	/>
	<meta
		name="keywords"
		content="gadgeteria, electronics, smartphones, wireless earbuds, smartwatch, tech accessories, buy electronics online"
	/>
	<meta
		name="robots"
		content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
	/>
	<link rel="canonical" href="https://gadgeteria.net/" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://gadgeteria.net/" />
	<meta
		property="og:title"
		content="Gadgeteria | Premium Tech & Electronics"
	/>
	<meta
		property="og:description"
		content="Shop premium smartphones, wireless earbuds, smartwatches, and tech accessories. Fast delivery across Uganda. Quality guaranteed."
	/>
	<meta
		property="og:image"
		content="https://gadgeteria.net/img/og-home.jpg"
	/>
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:site_name" content="Gadgeteria" />
	<meta property="og:locale" content="en_UG" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@gadgeteria" />
	<meta name="twitter:creator" content="@gadgeteria" />
	<meta
		name="twitter:title"
		content="Gadgeteria | Premium Tech & Electronics"
	/>
	<meta
		name="twitter:description"
		content="Shop premium smartphones, wireless earbuds, smartwatches, and tech accessories. Fast delivery across Uganda."
	/>
	<meta
		name="twitter:image"
		content="https://gadgeteria.net/img/og-home.jpg"
	/>

	<!-- Additional SEO -->
	<meta name="theme-color" content="#ea580c" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta
		name="apple-mobile-web-app-status-bar-style"
		content="black-translucent"
	/>
</svelte:head>

<!-- ── Hero Carousel ────────────────────────────────────────────────── -->
{#if slides.length > 0}
	<section class="relative overflow-hidden">
		<div class="relative h-[440px] sm:h-[480px] lg:h-[520px]">
			{#each slides as slide, i}
				<div
					class="absolute inset-0 flex transition-opacity duration-700 ease-in-out"
					style="opacity: {i === currentSlide
						? 1
						: 0}; z-index: {i === currentSlide
						? 1
						: 0}; background: linear-gradient(135deg, {slide.bg_color} 0%, {slide.bg_color}dd 50%, {slide.bg_color}99 100%); color: {slide.text_color};"
				>
					{#if slide.bg_image_desktop_key || slide.bg_image_mobile_key}
						<!-- Mobile background -->
						{#if slide.bg_image_mobile_key}
							<img
								src={getImageUrl(slide.bg_image_mobile_key)}
								alt=""
								class="absolute inset-0 w-full h-full object-cover lg:hidden"
								style="object-position: {slide.bg_image_position};"
							/>
						{:else if slide.bg_image_desktop_key}
							<img
								src={getImageUrl(slide.bg_image_desktop_key)}
								alt=""
								class="absolute inset-0 w-full h-full object-cover lg:hidden"
								style="object-position: {slide.bg_image_position};"
							/>
						{/if}
						<!-- Desktop background -->
						{#if slide.bg_image_desktop_key}
							<img
								src={getImageUrl(slide.bg_image_desktop_key)}
								alt=""
								class="absolute inset-0 w-full h-full object-cover hidden lg:block"
								style="object-position: {slide.bg_image_position};"
							/>
						{:else if slide.bg_image_mobile_key}
							<img
								src={getImageUrl(slide.bg_image_mobile_key)}
								alt=""
								class="absolute inset-0 w-full h-full object-cover hidden lg:block"
								style="object-position: {slide.bg_image_position};"
							/>
						{/if}
						<!-- Dark overlay for text readability -->
						<div
							class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"
							style="opacity: {slide.overlay_opacity / 0.4};"
						></div>
					{:else}
						<div class="absolute inset-0 overflow-hidden">
							<div
								class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl"
							></div>
							<div
								class="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-white/5 blur-2xl"
							></div>
						</div>
					{/if}
					<div
						class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-end pb-24 sm:pb-0 sm:items-center h-full"
					>
						<div class={slide.image_key ? "max-w-xl" : "max-w-3xl"}>
							<h1
								class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4"
							>
								{slide.title}
							</h1>
							<p
								class="text-lg sm:text-xl opacity-90 text-orange-50/70 leading-relaxed mb-6 sm:mb-8 {slide.image_key
									? 'max-w-lg'
									: 'max-w-2xl'}"
							>
								{slide.subtitle}
							</p>
							<a
								href={slide.cta_link}
								class="inline-flex items-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-3 sm:py-3 rounded-sm bg-white text-slate-900 font-semibold text-sm sm:text-base hover:bg-white/90 transition-all hover:shadow-lg hover:scale-105 active:scale-100"
							>
								{slide.cta_text}
								<svg
									class="h-4 w-4 sm:h-5 sm:w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="2"
									stroke="currentColor"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
									/></svg
								>
							</a>
						</div>
					</div>
				</div>
			{/each}

			<button
				onclick={prevSlide}
				class="absolute left-4 top-1/2 -translate-y-1/2 h-20 w-20 text-white hidden sm:flex items-center justify-center z-10"
				aria-label="Previous slide"
			>
				<svg
					class="h-10 w-"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15.75 19.5 8.25 12l7.5-7.5"
					/></svg
				>
			</button>
			<button
				onclick={nextSlide}
				class="absolute right-4 top-1/2 -translate-y-1/2 h-20 w-20 text-white hidden sm:flex items-center justify-center z-10"
				aria-label="Next slide"
			>
				<svg
					class="h-10 w-"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m8.25 4.5 7.5 7.5-7.5 7.5"
					/></svg
				>
			</button>

			<div
				class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10"
			>
				{#each slides as _, i}
					<button
						onclick={() => goToSlide(i)}
						class="h-2.5 rounded-full transition-all duration-300 {i ===
						currentSlide
							? 'w-8 bg-white'
							: 'w-2.5 bg-white/50 hover:bg-white/70'}"
						aria-label="Go to slide {i + 1}"
					></button>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- ── Flash Sale ─────────────────────────────────────────────────────── -->
{#if data.deals && data.deals.length > 0}
	<section class="py-8 bg-slate-100">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex items-end justify-between mb-8">
				<div>
					<p
						class="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2"
					>
						Flash Sale
					</p>
					<h2
						class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
					>
						Save Big Today
					</h2>
				</div>
				<div class="flex items-center gap-2">
					<button
						onclick={() => scrollCarousel("carousel-flash", "left")}
						class="h-9 w-9 rounded-full border border-orange-200 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
						aria-label="Scroll left"
					>
						<svg
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15.75 19.5 8.25 12l7.5-7.5"
							/></svg
						>
					</button>
					<button
						onclick={() =>
							scrollCarousel("carousel-flash", "right")}
						class="h-9 w-9 rounded-full border border-orange-200 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
						aria-label="Scroll right"
					>
						<svg
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="m8.25 4.5 7.5 7.5-7.5 7.5"
							/></svg
						>
					</button>
					<a
						href="/shop?sort=discount"
						class="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors ml-2"
					>
						View all deals
						<svg
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
							/></svg
						>
					</a>
				</div>
			</div>
			<div
				id="carousel-flash"
				class="flex gap-2.5 lg:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4"
			>
				{#each [...data.deals, ...data.deals] as product}
					<div
						class="w-[180px] sm:w-[200px] lg:w-[220px] snap-start shrink-0"
					>
						<ProductCard {product} />
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- ── Shop by Category ──────────────────────────────────────────────── -->
{#if data.categories.length > 0}
	<section class="py-8 bg-slate-50">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-10">
				<p
					class="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-2"
				>
					Browse Collections
				</p>
				<h2
					class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
				>
					Shop by Category
				</h2>
			</div>
			<div class="grid grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-4">
				{#each data.categories as cat}
					<a
						href="/shop?category={cat.slug}"
						class="group relative flex flex-col items-end justify-end rounded-sm overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 aspect-[4/3]"
					>
						<img
							src={cat.icon}
							alt={cat.name}
							class="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
						/>
						<div
							class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
						></div>
						<div class="relative z-10 p-3 w-full">
							<h3 class="text-xs font-semibold text-white mb-0.5">
								{cat.name}
							</h3>
						</div>
						<div
							class="absolute inset-0 ring-2 ring-orange-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
						></div>
					</a>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- Divider -->
<section>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<hr class="mx-auto border-t border-slate-200 dark:border-slate-700" />
	</div>
</section>

<!-- ── New Arrivals (scrollable carousel) ────────────────────────────── -->
{#if data.newArrivals.length > 0}
	<section class="py-8 bg-white">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex items-end justify-between mb-8">
				<div>
					<p
						class="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-2"
					>
						Just Landed
					</p>
					<h2
						class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
					>
						New Arrivals
					</h2>
				</div>
				<div class="flex items-center gap-2">
					<button
						onclick={() => scrollCarousel("carousel-new", "left")}
						class="h-9 w-9 rounded-full border border-orange-200 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
						aria-label="Scroll left"
					>
						<svg
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15.75 19.5 8.25 12l7.5-7.5"
							/></svg
						>
					</button>
					<button
						onclick={() => scrollCarousel("carousel-new", "right")}
						class="h-9 w-9 rounded-full border border-orange-200 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
						aria-label="Scroll right"
					>
						<svg
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="m8.25 4.5 7.5 7.5-7.5 7.5"
							/></svg
						>
					</button>
					<a
						href="/shop?sort=newest"
						class="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors ml-2"
					>
						View all
						<svg
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
							/></svg
						>
					</a>
				</div>
			</div>
			<div
				id="carousel-new"
				class="flex gap-2.5 lg:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4"
			>
				{#each [...data.newArrivals, ...data.newArrivals] as product, i}
					<div
						class="w-[180px] sm:w-[200px] lg:w-[220px] snap-start shrink-0"
					>
						<ProductCard {product} />
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- ── Best Sellers (scrollable) ─────────────────────────────────────── -->
{#if data.bestSellers.length > 0}
	<section class="py-8">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex items-end justify-between mb-8">
				<div>
					<p
						class="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-2"
					>
						Most Popular
					</p>
					<h2
						class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
					>
						Our Best Sellers
					</h2>
				</div>
				<div class="flex items-center gap-2">
					<button
						onclick={() => scrollCarousel("carousel-best", "left")}
						class="h-9 w-9 rounded-full border border-orange-200 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
						aria-label="Scroll left"
					>
						<svg
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15.75 19.5 8.25 12l7.5-7.5"
							/></svg
						>
					</button>
					<button
						onclick={() => scrollCarousel("carousel-best", "right")}
						class="h-9 w-9 rounded-full border border-orange-200 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
						aria-label="Scroll right"
					>
						<svg
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="m8.25 4.5 7.5 7.5-7.5 7.5"
							/></svg
						>
					</button>
					<a
						href="/shop?sort=popular"
						class="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors ml-2"
					>
						View all
						<svg
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
							/></svg
						>
					</a>
				</div>
			</div>
			<div
				id="carousel-best"
				class="flex gap-2.5 lg:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4"
			>
				{#each [...data.bestSellers, ...data.bestSellers] as product, i}
					<div
						class="w-[180px] sm:w-[200px] lg:w-[220px] snap-start shrink-0"
					>
						<ProductCard {product} />
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- ── Featured Products (scrollable carousel) ───────────────────────── -->
{#if data.featuredProducts.length > 0}
	<section class="py-8 bg-gradient-to-b from-orange-50/50 to-orange-50/50">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex items-end justify-between mb-8">
				<div>
					<p
						class="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-2"
					>
						Curated for you
					</p>
					<h2
						class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
					>
						Featured Products
					</h2>
				</div>
				<div class="flex items-center gap-2">
					<button
						onclick={() =>
							scrollCarousel("carousel-featured", "left")}
						class="h-9 w-9 rounded-full border border-orange-200 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
						aria-label="Scroll left"
					>
						<svg
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15.75 19.5 8.25 12l7.5-7.5"
							/></svg
						>
					</button>
					<button
						onclick={() =>
							scrollCarousel("carousel-featured", "right")}
						class="h-9 w-9 rounded-full border border-orange-200 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
						aria-label="Scroll right"
					>
						<svg
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="m8.25 4.5 7.5 7.5-7.5 7.5"
							/></svg
						>
					</button>
				</div>
			</div>
			<div
				id="carousel-featured"
				class="flex gap-2.5 lg:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4"
			>
				{#each [...data.featuredProducts, ...data.featuredProducts] as product, i}
					<div
						class="w-[180px] sm:w-[200px] lg:w-[220px] snap-start shrink-0"
					>
						<ProductCard {product} />
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- Divider -->
<section>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<hr class="mx-auto border-t border-slate-200 dark:border-slate-700" />
	</div>
</section>

<!-- ── Great Deals ───────────────────────────────────────────────────── -->
{#if data.deals.length > 0}
	<section id="products" class="py-16 bg-white">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex items-end justify-between mb-8">
				<div>
					<p
						class="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2"
					>
						Save big today
					</p>
					<h2
						class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
					>
						Great Deals
					</h2>
				</div>
				<a
					href="/shop?sort=discount"
					class="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
				>
					View all deals
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
						/></svg
					>
				</a>
			</div>
			<div
				class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6"
			>
				{#each data.deals as product, i}
					<div class={i >= 6 ? "hidden lg:block" : ""}>
						<ProductCard {product} />
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- Divider -->
<section>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<hr class="mx-auto border-t border-slate-200 dark:border-slate-700" />
	</div>
</section>

<!-- ── Shop by Brand ─────────────────────────────────────────────────── -->
{#if data.brands.length > 0}
	<section class="py-10 bg-white">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between mb-6">
				<div>
					<p
						class="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-1"
					>
						Top Brands
					</p>
					<h2
						class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900"
					>
						Shop by Brand
					</h2>
				</div>
				<a
					href="/shop"
					class="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
				>
					View all
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
						/></svg
					>
				</a>
			</div>
			<div class="flex flex-wrap gap-3">
				{#each data.brands as brand}
					<a
						href="/shop?brand={brand.slug}"
						aria-label={brand.name}
						class="group relative h-10 w-32 sm:h-12 sm:w-36 rounded-sm overflow-hidden border border-slate-200 bg-slate-800 hover:shadow-lg hover:border-orange-400 transition-all duration-200"
					>
						<!-- Background image -->
						{#if brand.logo_key}
							<img
								src={getImageUrl(brand.logo_key)}
								alt={brand.name}
								class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							/>
						{/if}
					</a>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- ── Customer Testimonials ─────────────────────────────────────────── -->
<section class="py-8 bg-gradient-to-b from-slate-50 to-white">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-12">
			<p
				class="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-2"
			>
				Don't just take our word for it
			</p>
			<h2
				class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
			>
				What Our Customers Say
			</h2>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			{#each [{ name: "Sarah N.", location: "Kampala", rating: 5, text: "Amazing quality earbuds! Delivered same day and the customer service was excellent. Will definitely shop again." }, { name: "James K.", location: "Entebbe", rating: 5, text: "Best tech store in Uganda. Got my smartwatch at a great price with warranty. Highly recommend!" }, { name: "Grace M.", location: "Jinja", rating: 5, text: "Pay on delivery made it so easy. No risk, no stress. The phone case I ordered was exactly as shown." }] as review}
				<div
					class="bg-white rounded-sm p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
				>
					<div class="flex items-center gap-1 mb-3">
						{#each Array(review.rating) as _}
							<svg
								class="h-5 w-5 text-amber-400 fill-current"
								viewBox="0 0 20 20"
								><path
									d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
								/></svg
							>
						{/each}
					</div>
					<p class="text-slate-600 mb-4 text-sm leading-relaxed">
						"{review.text}"
					</p>
					<div class="flex items-center gap-3">
						<div
							class="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm"
						>
							{review.name.charAt(0)}
						</div>
						<div>
							<p class="font-medium text-slate-900 text-sm">
								{review.name}
							</p>
							<p class="text-xs text-slate-500">
								{review.location}, Uganda
							</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
		<div class="text-center mt-8">
			<a
				href="/reviews"
				class="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
			>
				Read more reviews
				<svg
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
					/></svg
				>
			</a>
		</div>
	</div>
</section>
