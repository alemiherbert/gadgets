<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import type { Category, Product } from '$lib/types';
	import { getImageUrl } from '$lib/r2';
	import { formatPrice, discountPercent } from '$lib/utils';
	import { markdownExcerpt } from '$lib/markdown';
	import { cart } from '$lib/cart.svelte';
	import { ui } from '$lib/ui.svelte';
	import { perks, site, absoluteUrl } from '$lib/site';
	import Seo from '$lib/components/Seo.svelte';
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
				bgColor: s.bg_color || '#007c9e',
				textColor: s.text_color || '#ffffff',
				desktopSrc: s.bg_image_desktop_key ? getImageUrl(s.bg_image_desktop_key) : null,
				mobileSrc: s.bg_image_mobile_key ? getImageUrl(s.bg_image_mobile_key) : null,
				position: s.bg_image_position || 'center center',
				overlay: s.overlay_opacity ?? 0.4,
				productSrc: s.image_key ? getImageUrl(s.image_key) : null
			}));
		}
		const palette = ['#007c9e', '#0e1012', '#e0122b'];
		const cats = data.categories.slice(0, 3);
		if (cats.length > 0) {
			return cats.map((c, i) => ({
				id: `cat-${c.id}`,
				eyebrow: i === 0 ? site.tagline : undefined,
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
				eyebrow: site.tagline,
				title: 'Phones, laptops & gadgets, delivered.',
				subtitle: 'Phones, audio, power and accessories — pay when it arrives.',
				ctaText: 'Shop all products',
				ctaLink: '/shop',
				bgColor: '#007c9e',
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
		ui.added(spotlight.name);
	}

	// ── Structured data: the store + sitelinks search box ──
	const schema = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'OnlineStore',
				'@id': `${site.url}/#store`,
				name: site.name,
				alternateName: site.shortName,
				slogan: site.tagline,
				description: site.description,
				url: `${site.url}/`,
				logo: { '@type': 'ImageObject', url: absoluteUrl(site.logo), width: 512, height: 512 },
				image: absoluteUrl(site.ogImage),
				email: site.email,
				telephone: site.phoneHref.replace('tel:', ''),
				contactPoint: {
					'@type': 'ContactPoint',
					contactType: 'customer service',
					telephone: site.phoneHref.replace('tel:', ''),
					email: site.email,
					areaServed: site.country,
					availableLanguage: ['en']
				},
				address: { '@type': 'PostalAddress', addressLocality: site.city, addressCountry: site.country },
				areaServed: { '@type': 'Country', name: 'Uganda' },
				...(site.social.length ? { sameAs: site.social } : {})
			},
			{
				'@type': 'WebSite',
				'@id': `${site.url}/#website`,
				url: `${site.url}/`,
				name: site.name,
				inLanguage: 'en-UG',
				publisher: { '@id': `${site.url}/#store` },
				potentialAction: {
					'@type': 'SearchAction',
					target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/shop?q={search_term_string}` },
					'query-input': 'required name=search_term_string'
				}
			}
		]
	};

	// ── Recently viewed ──
	let recent = $state<RecentItem[]>([]);
	onMount(() => {
		recent = loadRecent();
	});
</script>

<Seo
	rawTitle="{site.name} — Phones, Laptops & Gadgets in Uganda"
	description={site.description}
	canonical="/"
	imageAlt="{site.name} — {site.tagline}"
	{schema}
/>

<!-- ── Hero ── -->
<HeroCarousel slides={heroSlides} />

<!-- ── Perks ── -->
<section class="border-b border-line" aria-label="Why shop with us">
	<div class="wrap">
		<ul class="rail auto-cols-[76%] gap-3 py-4 sm:auto-cols-[44%] lg:grid-flow-row lg:grid-cols-4">
			{#each perks as perk}
				<li class="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5">
					<span class="icon-tile bg-white text-brand shadow-sm">
						<Icon name={perk.icon} class="size-5" />
					</span>
					<span class="leading-tight">
						<span class="block text-sm font-bold">{perk.title}</span>
						<span class="mt-0.5 block text-xs text-ink-muted">{perk.text}</span>
					</span>
				</li>
			{/each}
		</ul>
	</div>
</section>

<!-- ── Shop by category ── -->
<section class="wrap pt-14 lg:pt-20">
		<div class="mb-8 flex items-end justify-between gap-4">
			<div>
				<p class="eyebrow">{site.tagline}</p>
				<h1 class="h-section mt-2">Shop phones, laptops & gadgets online in Uganda</h1>
			</div>
			<a href="/shop" class="link-arrow max-sm:hidden">All products <Icon name="arrow-right" class="size-4" stroke={2} /></a>
		</div>
		{#if data.categories.length > 0}
		<Rail label="Categories" class="auto-cols-[38%] gap-3 sm:auto-cols-[23%] lg:auto-cols-[calc((100%-5*1rem)/6)] lg:gap-4">
			{#each data.categories as cat}
				<a href="/shop?category={cat.slug}" class="group flex flex-col">
					<span class="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface">
						<img
							src={categoryImage(cat)}
							alt=""
							loading="lazy"
							decoding="async"
							class="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
						/>
						<span class="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent"></span>
						<span class="absolute inset-x-0 bottom-0 p-3.5 text-white">
							<span class="block text-base font-extrabold leading-tight tracking-tight">{cat.name}</span>
							{#if cat.product_count}
								<span class="mt-1 block text-xs text-white/70">{cat.product_count} products</span>
							{/if}
						</span>
						<span class="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-ink opacity-0 transition group-hover:opacity-100">
							<Icon name="arrow-right" class="size-4" stroke={2.25} />
						</span>
					</span>
				</a>
			{/each}
		</Rail>
		{/if}
	</section>

<!-- ── Deals ── -->
{#if data.deals.length > 0}
	<section class="relative mt-14 overflow-hidden bg-ink text-white lg:mt-20">
		<div class="pointer-events-none absolute inset-0" aria-hidden="true">
			<div class="absolute -left-40 -top-40 size-[34rem] rounded-full bg-brand/40 blur-[120px]"></div>
			<div class="absolute -bottom-48 right-0 size-[30rem] rounded-full bg-deal/30 blur-[120px]"></div>
		</div>
		<div class="wrap relative section-y">
			<div class="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:pr-44 lg:pr-56">
				<div class="max-w-xl">
					<p class="eyebrow text-sun"><Icon name="fire" class="size-4" /> Hot deals</p>
					<h2 class="h-section mt-2">
						{#if maxDiscount > 0}Save up to <span class="text-sun">{maxDiscount}%</span> on top gadgets{:else}Top deals on top gadgets{/if}
					</h2>
					<p class="mt-3 max-w-md text-sm leading-relaxed text-white/70">Marked-down prices on stock we have right now. Pay when it arrives.</p>
				</div>
				<a href="/shop?sort=discount" class="cta cta-sun shrink-0 self-start sm:self-auto">
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
	<section id="products" class="wrap scroll-mt-32 section-y">
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
				class="product-grid mt-8 md:grid-cols-4 animate-fade-in"
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
		<div class="relative grid items-center overflow-hidden rounded-3xl bg-brand text-white lg:grid-cols-2">
			<div class="pointer-events-none absolute inset-0" aria-hidden="true">
				<div class="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-2xl"></div>
				<div class="absolute -bottom-32 left-10 size-80 rounded-full bg-sun/25 blur-3xl"></div>
			</div>
			<div class="relative order-2 p-6 pt-2 sm:p-10 lg:order-1 lg:p-14">
				<p class="eyebrow text-sun"><Icon name="star" class="size-4" /> Editor's pick</p>
				<h2 class="h-section mt-2">{spotlight.name}</h2>
				{#if spotlight.description}
					<p class="mt-4 line-clamp-3 max-w-lg leading-relaxed text-white/70">{markdownExcerpt(spotlight.description, 220)}</p>
				{/if}
				<div class="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<span class="text-3xl font-extrabold tracking-tight tabular-nums">{formatPrice(spotlight.price)}</span>
					{#if spotlightDiscount > 0 && spotlight.compare_at_price}
						<span class="text-base text-white/70 line-through tabular-nums">{formatPrice(spotlight.compare_at_price)}</span>
						<span class="tag tag-new">Save {formatPrice(spotlight.compare_at_price - spotlight.price)}</span>
					{/if}
				</div>
				<div class="mt-7 flex flex-wrap gap-3">
					{#if spotlight.stock > 0}
						<button onclick={addSpotlight} disabled={spotlightInCart >= spotlight.stock} class="cta cta-sun cta-lg">
							<Icon name="bag" class="size-5" stroke={2} />
							{spotlightInCart >= spotlight.stock ? 'All stock in cart' : 'Add to cart'}
						</button>
					{/if}
					<a href="/products/{spotlight.slug}" class="cta cta-lg border-white/50 text-white hover:bg-white hover:text-ink">View details</a>
				</div>
			</div>
			<div class="relative order-1 p-6 pb-0 sm:p-10 sm:pb-0 lg:order-2 lg:p-12">
				<a href="/products/{spotlight.slug}" class="group mx-auto block aspect-square max-w-md overflow-hidden rounded-3xl bg-white p-8 shadow-float" tabindex="-1" aria-hidden="true">
					<img src={getImageUrl(spotlight.image_key)} alt="" loading="lazy" decoding="async" class="product-shot size-full transition duration-500 group-hover:scale-105" />
				</a>
			</div>
		</div>
	</section>
{/if}

<!-- ── Brands ── -->
{#if data.brands.length > 0}
	<section class="border-t border-line bg-surface section-y">
		<div class="wrap">
			<div class="mb-8 flex items-end justify-between gap-4">
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
							class="group relative flex h-20 items-center justify-center overflow-hidden rounded-2xl bg-ink px-3 text-center transition hover:-translate-y-0.5 hover:shadow-md sm:h-24"
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

<!-- ── About (helps shoppers and search engines understand the store) ── -->
<section class="border-t border-line">
	<div class="wrap grid gap-8 section-y lg:grid-cols-12 lg:gap-12">
		<div class="lg:col-span-5">
			<p class="eyebrow">About us</p>
			<h2 class="h-section mt-2">{site.name}: {site.tagline.toLowerCase()}</h2>
		</div>
		<div class="space-y-4 leading-relaxed text-ink-muted lg:col-span-7">
			<p>
				{site.name} is an online shop for phones, tablets, laptops, audio, smart home gear, power banks and everyday tech
				accessories in Uganda. Browse by category, compare prices in Ugandan shillings and order in a few taps.
			</p>
			<p>
				You pay when your order arrives — no card needed. We deliver across Uganda and call you to confirm the delivery
				fee before dispatch. Prefer to talk? Call us on {site.phone}.
			</p>
			{#if data.categories.length > 0}
				<p class="flex flex-wrap gap-2 pt-2">
					{#each data.categories as cat}
						<a href="/shop?category={cat.slug}" class="chip">{cat.name}</a>
					{/each}
				</p>
			{/if}
		</div>
	</div>
</section>

<!-- ── Recently viewed ── -->
{#if recent.length > 1}
	<section class="wrap section-y">
		<div class="mb-8 flex items-end justify-between">
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
					<span class="mt-2.5 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-brand">{item.name}</span>
					<span class="mt-1 block text-sm font-extrabold tabular-nums">{formatPrice(item.price)}</span>
				</a>
			{/each}
		</Rail>
	</section>
{/if}
