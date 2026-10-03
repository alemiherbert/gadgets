<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import type { Category, Product } from '$lib/types';
	import { getImageUrl } from '$lib/r2';
	import { formatPrice, discountPercent } from '$lib/utils';
	import { markdownExcerpt } from '$lib/markdown';
	import { cart } from '$lib/cart.svelte';
	import { ui } from '$lib/ui.svelte';
	import { perks } from '$lib/site';
	import { loadRecent, type RecentItem } from '$lib/recent';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import HeroCarousel, { type HeroSlide } from '$lib/components/HeroCarousel.svelte';
	import Rail from '$lib/components/Rail.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { data }: { data: PageData } = $props();

	function categoryImage(cat: Category) {
		return cat.image_key ? getImageUrl(cat.image_key) : cat.icon || '/img/placeholder.svg';
	}

	// ── Hero: admin slides, else one slide per top category ──
	const heroSlides = $derived.by((): HeroSlide[] => {
		if (data.slides.length > 0) {
			return data.slides.map((s) => ({
				id: s.id,
				title: s.title,
				subtitle: s.subtitle,
				ctaText: s.cta_text || 'Shop now',
				ctaLink: s.cta_link || '/shop',
				bgColor: s.bg_color || '#0a66ff',
				textColor: s.text_color || '#ffffff',
				desktopSrc: s.bg_image_desktop_key ? getImageUrl(s.bg_image_desktop_key) : null,
				mobileSrc: s.bg_image_mobile_key ? getImageUrl(s.bg_image_mobile_key) : null,
				position: s.bg_image_position || 'center center',
				overlay: s.overlay_opacity ?? 0.4,
				productSrc: s.image_key ? getImageUrl(s.image_key) : null
			}));
		}
		const palette = ['#0a66ff', '#0b1220', '#e0122b'];
		const cats = data.categories.slice(0, 3);
		if (cats.length > 0) {
			return cats.map((c, i) => ({
				id: `cat-${c.id}`,
				eyebrow: i === 0 ? 'Pay on delivery' : undefined,
				title: c.name,
				subtitle: c.description,
				ctaText: `Shop ${c.name}`,
				ctaLink: `/shop?category=${c.slug}`,
				bgColor: palette[i % palette.length],
				textColor: '#ffffff',
				desktopSrc: categoryImage(c),
				mobileSrc: null,
				position: 'center center',
				overlay: 0.5,
				productSrc: null
			}));
		}
		return [
			{
				id: 'default',
				eyebrow: 'Pay on delivery',
				title: 'Genuine gadgets, delivered.',
				subtitle: 'Phones, audio, power and accessories — pay when it arrives.',
				ctaText: 'Shop all products',
				ctaLink: '/shop',
				bgColor: '#0a66ff',
				textColor: '#ffffff',
				desktopSrc: null,
				mobileSrc: null,
				position: 'center center',
				overlay: 0.4,
				productSrc: null
			}
		];
	});

	// ── Deals ──
	const maxDiscount = $derived(
		data.deals.reduce((max, p) => Math.max(max, discountPercent(p.price, p.compare_at_price)), 0)
	);

	// ── Tabbed showcase ──
	type TabKey = 'best' | 'new' | 'featured';
	const tabs = $derived(
		(
			[
				{ key: 'best', label: 'Best sellers', href: '/shop?sort=popular', products: data.bestSellers },
				{ key: 'new', label: 'New arrivals', href: '/shop?sort=newest', products: data.newArrivals },
				{ key: 'featured', label: 'Staff picks', href: '/shop', products: data.featuredProducts }
			] as { key: TabKey; label: string; href: string; products: Product[] }[]
		).filter((t) => t.products.length > 0)
	);
	let activeTabKey = $state<TabKey>('best');
	const activeTab = $derived(tabs.find((t) => t.key === activeTabKey) ?? tabs[0]);

	// ── Spotlight ──
	const spotlight = $derived(data.featuredProducts[0] ?? null);
	const spotlightDiscount = $derived(spotlight ? discountPercent(spotlight.price, spotlight.compare_at_price) : 0);
	const spotlightInCart = $derived(spotlight ? cart.getItemQuantity(spotlight.id) : 0);

	function addSpotlight() {
		if (!spotlight || spotlight.stock <= spotlightInCart) return;
		cart.addItem({
			id: spotlight.id,
			slug: spotlight.slug,
			name: spotlight.name,
			price: spotlight.price,
			imageUrl: getImageUrl(spotlight.image_key),
			stock: spotlight.stock
		});
		ui.openCart(spotlight.name);
	}

	// ── Recently viewed ──
	let recent = $state<RecentItem[]>([]);
	onMount(() => {
		recent = loadRecent();
	});
</script>

<svelte:head>
	<title>Gadgeteria | Phones, Audio, Power & Tech Accessories in Uganda | Pay on Delivery</title>
	<meta
		name="description"
		content="Shop the latest smartphones, earbuds, power banks, laptops and tech accessories in Uganda. Great prices, Kampala delivery and pay on delivery."
	/>
	<meta
		name="keywords"
		content="gadgeteria, electronics, smartphones, wireless earbuds, smartwatch, tech accessories, buy electronics online, uganda"
	/>
	<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
	<link rel="canonical" href="https://gadgeteria.net/" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://gadgeteria.net/" />
	<meta property="og:title" content="Gadgeteria | Premium Tech & Electronics" />
	<meta
		property="og:description"
		content="Shop premium smartphones, wireless earbuds, power banks and tech accessories. Fast delivery across Uganda, pay on delivery."
	/>
	<meta property="og:image" content="https://gadgeteria.net/img/og-home.jpg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:site_name" content="Gadgeteria" />
	<meta property="og:locale" content="en_UG" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@gadgeteria" />
	<meta name="twitter:creator" content="@gadgeteria" />
	<meta name="twitter:title" content="Gadgeteria | Premium Tech & Electronics" />
	<meta
		name="twitter:description"
		content="Shop premium smartphones, wireless earbuds, power banks and tech accessories. Fast delivery across Uganda."
	/>
	<meta name="twitter:image" content="https://gadgeteria.net/img/og-home.jpg" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
</svelte:head>

<h1 class="sr-only">Gadgeteria — phones, audio, power and tech accessories in Uganda</h1>

<!-- ── Hero ── -->
<HeroCarousel slides={heroSlides} />

<!-- ── Perks ── -->
<section class="border-b border-line" aria-label="Why shop with us">
	<div class="wrap">
		<ul class="rail auto-cols-[76%] gap-3 py-4 sm:auto-cols-[44%] lg:grid-flow-row lg:grid-cols-4">
			{#each perks as perk}
				<li class="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5">
					<span class="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-sm">
						<Icon name={perk.icon} class="size-5" />
					</span>
					<span class="leading-tight">
						<span class="block text-sm font-bold">{perk.title}</span>
						<span class="mt-0.5 block text-xs text-slate-500">{perk.text}</span>
					</span>
				</li>
			{/each}
		</ul>
	</div>
</section>

<!-- ── Shop by category ── -->
{#if data.categories.length > 0}
	<section class="wrap pt-12 lg:pt-16">
		<div class="mb-6 flex items-end justify-between gap-4">
			<div>
				<p class="eyebrow">Shop by category</p>
				<h2 class="h-section mt-2">What are you looking for?</h2>
			</div>
			<a href="/shop" class="link-arrow max-sm:hidden">All products <Icon name="arrow-right" class="size-4" stroke={2} /></a>
		</div>
		<Rail label="Categories" class="auto-cols-[38%] gap-3 sm:auto-cols-[23%] lg:auto-cols-[calc((100%-5*1rem)/6)] lg:gap-4">
			{#each data.categories as cat}
				<a href="/shop?category={cat.slug}" class="group flex flex-col">
					<span class="relative aspect-[4/5] overflow-hidden rounded-[1.375rem] bg-surface">
						<img
							src={categoryImage(cat)}
							alt=""
							loading="lazy"
							decoding="async"
							class="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
						/>
						<span class="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent"></span>
						<span class="absolute inset-x-0 bottom-0 p-3.5 text-white">
							<span class="block text-[15px] font-extrabold leading-tight tracking-tight">{cat.name}</span>
							{#if cat.product_count}
								<span class="mt-1 block text-xs font-medium text-white/70">{cat.product_count} products</span>
							{/if}
						</span>
						<span class="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-ink opacity-0 transition group-hover:opacity-100">
							<Icon name="arrow-right" class="size-4" stroke={2.25} />
						</span>
					</span>
				</a>
			{/each}
		</Rail>
	</section>
{/if}

<!-- ── Deals ── -->
{#if data.deals.length > 0}
	<section class="relative mt-14 overflow-hidden bg-ink text-white lg:mt-20">
		<div class="pointer-events-none absolute inset-0" aria-hidden="true">
			<div class="absolute -left-40 -top-40 size-[34rem] rounded-full bg-brand/40 blur-[120px]"></div>
			<div class="absolute -bottom-48 right-0 size-[30rem] rounded-full bg-deal/30 blur-[120px]"></div>
		</div>
		<div class="wrap relative py-12 lg:py-16">
			<div class="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:pr-44 lg:pr-56">
				<div class="max-w-xl">
					<p class="eyebrow text-volt"><Icon name="fire" class="size-4" /> Hot deals</p>
					<h2 class="h-section mt-3">
						{#if maxDiscount > 0}Save up to <span class="text-volt">{maxDiscount}%</span> on top gadgets{:else}Top deals on top gadgets{/if}
					</h2>
					<p class="mt-3 max-w-md text-sm leading-relaxed text-white/60">Marked-down prices on stock we have right now. Pay when it arrives.</p>
				</div>
				<a href="/shop?sort=discount" class="cta cta-volt shrink-0 self-start sm:self-auto">
					Shop all deals
					<Icon name="arrow-right" class="size-4" stroke={2.25} />
				</a>
				<img
					src="/img/great-deals.webp"
					alt=""
					width="600"
					height="771"
					loading="lazy"
					decoding="async"
					class="pointer-events-none absolute -bottom-8 right-0 hidden h-48 w-auto select-none sm:block lg:h-56"
				/>
			</div>
			<Rail label="Deals" tone="dark" class="relative -mx-4 mt-8 auto-cols-[47%] gap-3 px-4 scroll-px-4 sm:auto-cols-[31%] lg:mx-0 lg:auto-cols-[calc((100%-3*0.75rem)/4)] lg:px-0 xl:auto-cols-[calc((100%-4*0.75rem)/5)]">
				{#each data.deals as product (product.id)}
					<ProductCard {product} variant="panel" />
				{/each}
			</Rail>
		</div>
	</section>
{/if}

<!-- ── Tabbed showcase ── -->
{#if tabs.length > 0 && activeTab}
	<section id="products" class="wrap scroll-mt-32 py-14 lg:py-20">
		<div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="eyebrow">Trending now</p>
				<h2 class="h-section mt-2">Shop what Uganda is buying</h2>
			</div>
			<div class="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-hide md:mx-0 md:px-0" role="tablist" aria-label="Product collections">
				{#each tabs as tab}
					<button
						role="tab"
						id="tab-{tab.key}"
						aria-selected={activeTab.key === tab.key}
						aria-controls="panel-{tab.key}"
						class="chip h-10 px-5"
						onclick={() => (activeTabKey = tab.key)}
					>
						{tab.label}
					</button>
				{/each}
			</div>
		</div>

		{#key activeTab.key}
			<div
				id="panel-{activeTab.key}"
				role="tabpanel"
				aria-labelledby="tab-{activeTab.key}"
				class="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5 animate-fade-in"
			>
				{#each activeTab.products.slice(0, 8) as product, i (product.id)}
					<ProductCard {product} rank={activeTab.key === 'best' ? i + 1 : undefined} />
				{/each}
			</div>
		{/key}

		<div class="mt-10 flex justify-center">
			<a href={activeTab.href} class="cta cta-line">
				View all {activeTab.label.toLowerCase()}
				<Icon name="arrow-right" class="size-4" stroke={2.25} />
			</a>
		</div>
	</section>
{/if}

<!-- ── Spotlight ── -->
{#if spotlight}
	<section class="wrap pb-14 lg:pb-20">
		<div class="relative grid items-center overflow-hidden rounded-[2rem] bg-brand text-white lg:grid-cols-2">
			<div class="pointer-events-none absolute inset-0" aria-hidden="true">
				<div class="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-2xl"></div>
				<div class="absolute -bottom-32 left-10 size-80 rounded-full bg-volt/25 blur-3xl"></div>
			</div>
			<div class="relative order-2 p-6 pt-2 sm:p-10 lg:order-1 lg:p-14">
				<p class="eyebrow text-volt"><Icon name="star" class="size-4" /> Editor's pick</p>
				<h2 class="h-section mt-3">{spotlight.name}</h2>
				{#if spotlight.description}
					<p class="mt-4 line-clamp-3 max-w-lg leading-relaxed text-white/80">{markdownExcerpt(spotlight.description, 220)}</p>
				{/if}
				<div class="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<span class="text-3xl font-extrabold tracking-tight tabular-nums">{formatPrice(spotlight.price)}</span>
					{#if spotlightDiscount > 0 && spotlight.compare_at_price}
						<span class="text-base text-white/60 line-through tabular-nums">{formatPrice(spotlight.compare_at_price)}</span>
						<span class="tag tag-new">Save {formatPrice(spotlight.compare_at_price - spotlight.price)}</span>
					{/if}
				</div>
				<div class="mt-7 flex flex-wrap gap-3">
					{#if spotlight.stock > 0}
						<button onclick={addSpotlight} disabled={spotlightInCart >= spotlight.stock} class="cta cta-volt cta-lg">
							<Icon name="bag" class="size-[18px]" stroke={2} />
							{spotlightInCart >= spotlight.stock ? 'All stock in cart' : 'Add to cart'}
						</button>
					{/if}
					<a href="/products/{spotlight.slug}" class="cta cta-lg border-white/40 text-white hover:bg-white hover:text-ink">View details</a>
				</div>
			</div>
			<div class="relative order-1 p-6 pb-0 sm:p-10 sm:pb-0 lg:order-2 lg:p-12">
				<a href="/products/{spotlight.slug}" class="group mx-auto block aspect-square max-w-md overflow-hidden rounded-[1.75rem] bg-white p-8 shadow-2xl" tabindex="-1" aria-hidden="true">
					<img src={getImageUrl(spotlight.image_key)} alt="" loading="lazy" decoding="async" class="product-shot size-full transition duration-500 group-hover:scale-105" />
				</a>
			</div>
		</div>
	</section>
{/if}

<!-- ── Brands ── -->
{#if data.brands.length > 0}
	<section class="border-t border-line bg-surface py-14 lg:py-16">
		<div class="wrap">
			<div class="mb-6 flex items-end justify-between gap-4">
				<div>
					<p class="eyebrow">Top brands</p>
					<h2 class="h-section mt-2">The names you trust</h2>
				</div>
				<a href="/shop" class="link-arrow max-sm:hidden">Browse all <Icon name="arrow-right" class="size-4" stroke={2} /></a>
			</div>
			<ul class="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
				{#each data.brands as brand}
					<li>
						<a
							href="/shop?brand={brand.slug}"
							class="group relative flex h-20 items-center justify-center overflow-hidden rounded-2xl bg-ink px-3 text-center transition hover:-translate-y-0.5 hover:shadow-xl sm:h-24"
							aria-label="Shop {brand.name}"
						>
							{#if brand.logo_key}
								<img src={getImageUrl(brand.logo_key)} alt={brand.name} loading="lazy" decoding="async" class="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-105" />
							{:else}
								<span class="text-base font-extrabold tracking-tight text-white sm:text-lg">{brand.name}</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</section>
{/if}

<!-- ── Recently viewed ── -->
{#if recent.length > 1}
	<section class="wrap py-14 lg:py-16">
		<div class="mb-6 flex items-end justify-between">
			<div>
				<p class="eyebrow">Pick up where you left off</p>
				<h2 class="h-section mt-2">Recently viewed</h2>
			</div>
		</div>
		<Rail label="Recently viewed" class="auto-cols-[40%] gap-3 sm:auto-cols-[24%] lg:auto-cols-[calc((100%-5*1rem)/6)] lg:gap-4">
			{#each recent as item (item.id)}
				<a href="/products/{item.slug}" class="group block">
					<span class="relative block aspect-square overflow-hidden rounded-2xl bg-surface">
						<img src={getImageUrl(item.image_key)} alt="" loading="lazy" decoding="async" class="product-shot absolute inset-0 size-full p-[10%] transition duration-500 group-hover:scale-105" />
					</span>
					<span class="mt-2.5 line-clamp-2 text-[13px] font-semibold leading-snug group-hover:text-brand">{item.name}</span>
					<span class="mt-1 block text-sm font-extrabold tabular-nums">{formatPrice(item.price)}</span>
				</a>
			{/each}
		</Rail>
	</section>
{/if}
