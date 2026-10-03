<script lang="ts">
import type { PageData } from './$types';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { formatPrice } from '$lib/utils';
import { getImageUrl } from '$lib/r2';
import ProductCard from '$lib/components/ProductCard.svelte';
import RangeSlider from '$lib/components/RangeSlider.svelte';
import Breadcrumb from '$lib/components/Breadcrumb.svelte';
import Icon from '$lib/components/Icon.svelte';

let { data }: { data: PageData } = $props();

let mobileFiltersOpen = $state(false);

// Collapsible filter sections
let openSections = $state<Record<string, boolean>>({
	categories: true,
	brands: true,
	price: true,
});

// Initialize spec sections as open
$effect(() => {
	for (const key of Object.keys(data.availableSpecs)) {
		if (!(key in openSections)) {
			openSections[key] = true;
		}
	}
});

$effect(() => {
	if (!mobileFiltersOpen) return;
	const previous = document.body.style.overflow;
	document.body.style.overflow = 'hidden';
	const onKey = (e: KeyboardEvent) => {
		if (e.key === 'Escape') mobileFiltersOpen = false;
	};
	window.addEventListener('keydown', onKey);
	return () => {
		document.body.style.overflow = previous;
		window.removeEventListener('keydown', onKey);
	};
});

function toggleSection(key: string) {
	openSections[key] = !openSections[key];
}

const activeCategoryObj = $derived(data.categories.find((c) => c.slug === data.activeCategory) ?? null);
const activeSubcategoryObj = $derived(data.subcategories.find((s) => s.slug === data.activeSubcategory) ?? null);
const activeBrandObj = $derived(data.brands.find((b) => b.slug === data.activeBrand) ?? null);

// Price range state (local, for slider interaction)
let localMinPrice = $state(0);
let localMaxPrice = $state(0);

// Sync local price when data changes
$effect(() => {
	localMinPrice = data.activeMinPrice ?? data.priceRange.min;
	localMaxPrice = data.activeMaxPrice ?? data.priceRange.max;
});

// Build URL with updated params
function buildUrl(params: Record<string, string | null>) {
	const u = new URL($page.url);
	for (const [key, val] of Object.entries(params)) {
		if (val === null || val === '') {
			u.searchParams.delete(key);
		} else {
			u.searchParams.set(key, val);
		}
	}
	// Reset to page 1 when changing filters (unless we're explicitly setting page)
	if (!('page' in params)) {
		u.searchParams.delete('page');
	}
	return u.pathname + u.search;
}

function setCategory(slug: string | null) {
	// When changing category, clear spec filters, subcategory, and search
	const u = new URL($page.url);
	for (const key of [...u.searchParams.keys()]) {
		if (key.startsWith('spec_')) u.searchParams.delete(key);
	}
	u.searchParams.delete('subcategory');
	u.searchParams.delete('q');
	if (slug) {
		u.searchParams.set('category', slug);
	} else {
		u.searchParams.delete('category');
	}
	u.searchParams.delete('page');
	goto(u.pathname + u.search, { invalidateAll: true });
	mobileFiltersOpen = false;
}

function categoryImageSrc(cat: { image_key: string | null; icon: string }) {
	if (cat.image_key) return getImageUrl(cat.image_key);
	return cat.icon || '/img/placeholder.svg';
}

function setSubcategory(slug: string | null) {
	// When changing subcategory, clear spec filters and search
	const u = new URL($page.url);
	for (const key of [...u.searchParams.keys()]) {
		if (key.startsWith('spec_')) u.searchParams.delete(key);
	}
	u.searchParams.delete('q');
	if (slug) {
		u.searchParams.set('subcategory', slug);
	} else {
		u.searchParams.delete('subcategory');
	}
	u.searchParams.delete('page');
	goto(u.pathname + u.search, { invalidateAll: true });
	mobileFiltersOpen = false;
}

function setBrand(slug: string | null) {
	const u = new URL($page.url);
	if (slug) {
		u.searchParams.set('brand', slug);
	} else {
		u.searchParams.delete('brand');
	}
	u.searchParams.delete('page');
	goto(u.pathname + u.search, { invalidateAll: true });
	mobileFiltersOpen = false;
}

function setSort(sort: string) {
	goto(buildUrl({ sort }), { invalidateAll: true });
}

function goToPage(p: number) {
	goto(buildUrl({ page: p > 1 ? String(p) : null }), { invalidateAll: true });
	window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearSearch() {
	goto(buildUrl({ q: null }), { invalidateAll: true });
}

function applyPriceRange(_min?: number, _max?: number) {
	const lo = _min ?? localMinPrice;
	const hi = _max ?? localMaxPrice;
	const minParam = lo > data.priceRange.min ? String(lo) : null;
	const maxParam = hi < data.priceRange.max ? String(hi) : null;
	goto(buildUrl({ minPrice: minParam, maxPrice: maxParam }), { invalidateAll: true });
}

function toggleSpecFilter(specKey: string, value: string) {
	const u = new URL($page.url);
	const paramKey = `spec_${specKey}`;
	const existing = u.searchParams.getAll(paramKey);

	// Clear all existing values for this key first
	u.searchParams.delete(paramKey);

	if (existing.includes(value)) {
		// Remove this value
		for (const v of existing) {
			if (v !== value) u.searchParams.append(paramKey, v);
		}
	} else {
		// Add this value
		for (const v of existing) {
			u.searchParams.append(paramKey, v);
		}
		u.searchParams.append(paramKey, value);
	}
	u.searchParams.delete('page');
	goto(u.pathname + u.search, { invalidateAll: true });
}

function clearAllFilters() {
	goto('/shop', { invalidateAll: true });
	mobileFiltersOpen = false;
}

function isSpecActive(specKey: string, value: string): boolean {
	return (data.activeSpecFilters[specKey] ?? []).includes(value);
}

// Breadcrumb items
let crumbs = $derived.by(() => {
	if (data.activeSearch) {
		return [
			{ label: 'Home', href: '/' },
			{ label: 'Shop', href: '/shop' },
			{ label: 'Search' },
		];
	}
	if (data.activeSubcategory) {
		return [
			{ label: 'Home', href: '/' },
			{ label: 'Shop', href: '/shop' },
			{ label: activeCategoryObj?.name ?? '', href: `/shop?category=${data.activeCategory}` },
			{ label: activeSubcategoryObj?.name ?? '' },
		];
	}
	if (data.activeCategory) {
		return [
			{ label: 'Home', href: '/' },
			{ label: 'Shop', href: '/shop' },
			{ label: activeCategoryObj?.name ?? '' },
		];
	}
	if (data.activeBrand) {
		return [
			{ label: 'Home', href: '/' },
			{ label: 'Shop', href: '/shop' },
			{ label: activeBrandObj?.name ?? '' },
		];
	}
	return [
		{ label: 'Home', href: '/' },
		{ label: 'Shop' },
	];
});

let heading = $derived(
	activeSubcategoryObj?.name ??
		activeCategoryObj?.name ??
		activeBrandObj?.name ??
		({ discount: 'Deals', newest: 'New arrivals', popular: 'Best sellers' } as Record<string, string>)[data.activeSort] ??
		'All products'
);

let activeFilterCount = $derived.by(() => {
	let count = 0;
	if (data.activeCategory) count++;
	if (data.activeSubcategory) count++;
	if (data.activeBrand) count++;
	if (data.activeMinPrice !== null || data.activeMaxPrice !== null) count++;
	count += Object.values(data.activeSpecFilters).reduce((sum, v) => sum + v.length, 0);
	return count;
});

// Generate page numbers for pagination
function getPageNumbers(current: number, total: number): (number | '...')[] {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
	const pages: (number | '...')[] = [];
	if (current <= 3) {
		pages.push(1, 2, 3, 4, '...', total);
	} else if (current >= total - 2) {
		pages.push(1, '...', total - 3, total - 2, total - 1, total);
	} else {
		pages.push(1, '...', current - 1, current, current + 1, '...', total);
	}
	return pages;
}

const sortOptions = [
	{ value: 'newest', label: 'Newest' },
	{ value: 'popular', label: 'Most popular' },
	{ value: 'price-asc', label: 'Price: low to high' },
	{ value: 'price-desc', label: 'Price: high to low' },
	{ value: 'discount', label: 'Biggest discount' },
];

// Dynamic SEO content
const pageTitle = $derived(() => {
	const parts = [];
	if (data.activeSearch) return `Search: ${data.activeSearch} | Gadgeteria`;
	if (data.activeSubcategory) {
		const sub = data.subcategories.find(s => s.slug === data.activeSubcategory);
		if (sub) parts.push(sub.name);
	}
	if (data.activeCategory) {
		const cat = data.categories.find(c => c.slug === data.activeCategory);
		if (cat) parts.push(cat.name);
	}
	parts.push('Shop', 'Gadgeteria');
	return parts.join(' | ');
});

const pageDescription = $derived(() => {
	if (data.activeSearch) {
		return `Found ${data.total} results for "${data.activeSearch}". Browse premium electronics and tech accessories with fast delivery across Uganda.`;
	}
	const cat = data.activeCategory ? data.categories.find(c => c.slug === data.activeCategory) : null;
	const sub = data.activeSubcategory ? data.subcategories.find(s => s.slug === data.activeSubcategory) : null;
	if (sub) {
		return `Shop ${sub.name} in Uganda. ${data.total} products available. Premium quality, competitive prices, fast nationwide delivery.`;
	}
	if (cat) {
		return `Browse ${data.total} ${cat.name.toLowerCase()} products. Premium quality electronics with fast delivery across Uganda. Shop now!`;
	}
	return `Browse ${data.total} premium tech products. Shop smartphones, audio gear, wearables, and accessories. Fast delivery across Uganda.`;
});

const canonicalUrl = $derived(() => {
	const base = 'https://gadgeteria.net/shop';
	const params = new URLSearchParams();
	if (data.activeCategory) params.set('category', data.activeCategory);
	if (data.activeSubcategory) params.set('subcategory', data.activeSubcategory);
	if (data.activeBrand) params.set('brand', data.activeBrand);
	if (data.activeSearch) params.set('q', data.activeSearch);
	const query = params.toString();
	return query ? `${base}?${query}` : base;
});

// Pagination URLs for SEO
const prevPageUrl = $derived(() => {
	if (data.page <= 1) return null;
	const base = 'https://gadgeteria.net/shop';
	const params = new URLSearchParams($page.url.searchParams);
	params.set('page', String(data.page - 1));
	return `${base}?${params.toString()}`;
});

const nextPageUrl = $derived(() => {
	if (data.page >= data.totalPages) return null;
	const base = 'https://gadgeteria.net/shop';
	const params = new URLSearchParams($page.url.searchParams);
	params.set('page', String(data.page + 1));
	return `${base}?${params.toString()}`;
});
</script>

<svelte:head>
<title>{pageTitle()}</title>
<meta name="description" content={pageDescription()} />
<meta name="robots" content="index, follow" />
<link rel="canonical" href={canonicalUrl()} />

<!-- Pagination links for SEO -->
{#if prevPageUrl()}
<link rel="prev" href={prevPageUrl()} />
{/if}
{#if nextPageUrl()}
<link rel="next" href={nextPageUrl()} />
{/if}

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content={canonicalUrl()} />
<meta property="og:title" content={pageTitle()} />
<meta property="og:description" content={pageDescription()} />
<meta property="og:image" content="https://gadgeteria.net/img/og-shop.jpg" />
<meta property="og:site_name" content="Gadgeteria" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={pageTitle()} />
<meta name="twitter:description" content={pageDescription()} />
<meta name="twitter:image" content="https://gadgeteria.net/img/og-shop.jpg" />

<!-- Structured Data for Product Listing -->
{@html `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "${pageTitle().replace(/"/g, '\\"')}",
  "description": "${pageDescription().replace(/"/g, '\\"')}",
  "url": "${canonicalUrl()}",
  "numberOfItems": ${data.total}
}
</script>`}
</svelte:head>

{#snippet filterHeading(key: string, label: string)}
	<button onclick={() => toggleSection(key)} class="flex w-full items-center justify-between py-1 text-left" aria-expanded={openSections[key]}>
		<h3 class="text-sm font-extrabold tracking-tight">{label}</h3>
		<Icon name="chevron-down" class="size-4 text-slate-400 transition {openSections[key] ? 'rotate-180' : ''}" stroke={2} />
	</button>
{/snippet}

{#snippet filterOption(label: string, count: number | undefined, active: boolean, onclick: () => void, image?: string)}
	<button
		{onclick}
		class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors {active ? 'bg-brand-soft font-bold text-brand-dark' : 'text-slate-600 hover:bg-surface hover:text-ink'}"
		aria-pressed={active}
	>
		{#if image}
			<img src={image} alt="" class="size-7 shrink-0 rounded-lg object-cover" loading="lazy" />
		{/if}
		<span class="flex-1 truncate">{label}</span>
		{#if count !== undefined}
			<span class="text-xs tabular-nums {active ? 'text-brand' : 'text-slate-400'}">{count}</span>
		{/if}
	</button>
{/snippet}

{#snippet filters()}
	<div class="divide-y divide-line">
		<!-- Categories -->
		<div class="pb-4">
			{@render filterHeading('categories', 'Category')}
			{#if openSections.categories}
				<div class="mt-2 space-y-0.5">
					{@render filterOption('All products', undefined, data.activeCategory === null, () => setCategory(null))}
					{#each data.categories as cat}
						{@render filterOption(cat.name, cat.product_count, data.activeCategory === cat.slug, () => setCategory(cat.slug), categoryImageSrc(cat))}
					{/each}
				</div>
			{/if}
		</div>

		<!-- Subcategories -->
		{#if data.activeCategory && data.subcategories.length > 0}
			<div class="py-4">
				<h3 class="py-1 text-sm font-extrabold tracking-tight">Type</h3>
				<div class="mt-2 space-y-0.5">
					{@render filterOption(`All ${activeCategoryObj?.name ?? ''}`, undefined, data.activeSubcategory === null, () => setSubcategory(null))}
					{#each data.subcategories as sub}
						{@render filterOption(sub.name, sub.product_count, data.activeSubcategory === sub.slug, () => setSubcategory(sub.slug))}
					{/each}
				</div>
			</div>
		{/if}

		<!-- Brands -->
		{#if data.brands.length > 0}
			<div class="py-4">
				{@render filterHeading('brands', 'Brand')}
				{#if openSections.brands}
					<div class="mt-3 flex flex-wrap gap-2">
						<button class="chip h-8 px-3 text-xs {data.activeBrand === null ? 'is-active' : ''}" onclick={() => setBrand(null)}>All</button>
						{#each data.brands as brand}
							<button class="chip h-8 px-3 text-xs {data.activeBrand === brand.slug ? 'is-active' : ''}" onclick={() => setBrand(brand.slug)}>
								{brand.name}
								{#if brand.product_count !== undefined}<span class="opacity-60">{brand.product_count}</span>{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Price -->
		{#if data.priceRange.max > data.priceRange.min}
			<div class="py-4">
				{@render filterHeading('price', 'Price')}
				{#if openSections.price}
					<div class="mt-4 px-1">
						<RangeSlider
							min={data.priceRange.min}
							max={data.priceRange.max}
							step={100}
							bind:minValue={localMinPrice}
							bind:maxValue={localMaxPrice}
							onchange={applyPriceRange}
						/>
						<div class="mt-3 grid grid-cols-2 gap-2 text-xs">
							<div class="rounded-xl bg-surface px-3 py-2">
								<p class="text-slate-500">Min</p>
								<p class="font-bold tabular-nums">{formatPrice(localMinPrice)}</p>
							</div>
							<div class="rounded-xl bg-surface px-3 py-2 text-right">
								<p class="text-slate-500">Max</p>
								<p class="font-bold tabular-nums">{formatPrice(localMaxPrice)}</p>
							</div>
						</div>
						{#if data.activeMinPrice !== null || data.activeMaxPrice !== null}
							<button
								onclick={() => goto(buildUrl({ minPrice: null, maxPrice: null }), { invalidateAll: true })}
								class="mt-2 text-xs font-bold text-brand hover:underline"
							>
								Reset price
							</button>
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Spec filters -->
		{#each Object.entries(data.availableSpecs) as [specKey, specValues]}
			<div class="py-4">
				{@render filterHeading(specKey, specKey)}
				{#if openSections[specKey]}
					<div class="mt-2 space-y-0.5">
						{#each specValues as val}
							<label class="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-surface {isSpecActive(specKey, val) ? 'font-bold text-ink' : 'text-slate-600'}">
								<input
									type="checkbox"
									checked={isSpecActive(specKey, val)}
									onchange={() => toggleSpecFilter(specKey, val)}
									class="size-4 rounded accent-brand"
								/>
								<span class="truncate">{val}</span>
							</label>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/snippet}

<!-- Header band -->
<section class="border-b border-line bg-surface">
	<div class="wrap pb-5 pt-5 lg:pb-7 lg:pt-7">
		<Breadcrumb items={crumbs} />
		{#if data.activeSearch}
			<div class="mt-3 flex flex-wrap items-end justify-between gap-3">
				<h1 class="text-2xl font-extrabold tracking-tight sm:text-4xl">
					Results for <span class="text-brand">“{data.activeSearch}”</span>
				</h1>
				<button onclick={clearSearch} class="chip h-9">
					<Icon name="close" class="size-3.5" stroke={2.5} />
					Clear search
				</button>
			</div>
			<p class="mt-1 text-sm text-slate-500">{data.total} product{data.total !== 1 ? 's' : ''} found</p>
		{:else}
			<h1 class="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{heading}</h1>
			<p class="mt-1 text-sm text-slate-500">
				{#if activeCategoryObj?.description && !activeSubcategoryObj}{activeCategoryObj.description} · {/if}{data.total} product{data.total !== 1 ? 's' : ''}
			</p>
		{/if}

		<!-- Quick chips -->
		<div class="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:px-0">
			{#if data.activeCategory && data.subcategories.length > 0}
				<button class="chip {data.activeSubcategory === null ? 'is-active' : ''}" onclick={() => setSubcategory(null)}>All</button>
				{#each data.subcategories as sub}
					<button class="chip {data.activeSubcategory === sub.slug ? 'is-active' : ''}" onclick={() => setSubcategory(sub.slug)}>{sub.name}</button>
				{/each}
			{:else}
				<button class="chip {data.activeCategory === null ? 'is-active' : ''}" onclick={() => setCategory(null)}>All</button>
				{#each data.categories as cat}
					<button class="chip {data.activeCategory === cat.slug ? 'is-active' : ''}" onclick={() => setCategory(cat.slug)}>{cat.name}</button>
				{/each}
			{/if}
		</div>
	</div>
</section>

<div class="wrap py-6 lg:py-8">
	<div class="flex gap-10">
		<!-- Desktop sidebar -->
		<aside class="hidden w-64 shrink-0 lg:block" aria-label="Filters">
			<div class="sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto pb-6 pr-2 scrollbar-hide">
				{@render filters()}
			</div>
		</aside>

		<div class="min-w-0 flex-1">
			<!-- Toolbar -->
			<div class="flex items-center gap-2">
				<button onclick={() => (mobileFiltersOpen = true)} class="chip h-10 lg:hidden">
					<Icon name="filter" class="size-4" stroke={2} />
					Filters
					{#if activeFilterCount > 0}
						<span class="grid size-5 place-items-center rounded-full bg-brand text-[10px] font-extrabold text-white">{activeFilterCount}</span>
					{/if}
				</button>
				<p class="hidden text-sm text-slate-500 lg:block">
					Showing <span class="font-bold text-ink">{data.total}</span> product{data.total !== 1 ? 's' : ''}
				</p>
				<div class="relative ml-auto">
					<label for="sort-select" class="sr-only">Sort by</label>
					<select
						id="sort-select"
						value={data.activeSort}
						onchange={(e) => setSort((e.target as HTMLSelectElement).value)}
						class="h-10 cursor-pointer appearance-none rounded-full border-[1.5px] border-line bg-white pl-4 pr-10 text-[13px] font-bold transition hover:border-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
					>
						{#each sortOptions as opt}
							<option value={opt.value}>Sort: {opt.label}</option>
						{/each}
					</select>
					<Icon name="chevron-down" class="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" stroke={2} />
				</div>
			</div>

			<!-- Active filters -->
			{#if activeFilterCount > 0}
				<div class="mt-4 flex flex-wrap items-center gap-2">
					{#if activeCategoryObj}
						<button onclick={() => setCategory(null)} class="tag tag-soft h-8 gap-1.5 px-3 text-xs">
							{activeCategoryObj.name}<Icon name="close" class="size-3.5" stroke={2.5} />
						</button>
					{/if}
					{#if activeSubcategoryObj}
						<button onclick={() => setSubcategory(null)} class="tag tag-soft h-8 gap-1.5 px-3 text-xs">
							{activeSubcategoryObj.name}<Icon name="close" class="size-3.5" stroke={2.5} />
						</button>
					{/if}
					{#if activeBrandObj}
						<button onclick={() => setBrand(null)} class="tag tag-soft h-8 gap-1.5 px-3 text-xs">
							{activeBrandObj.name}<Icon name="close" class="size-3.5" stroke={2.5} />
						</button>
					{/if}
					{#if data.activeMinPrice !== null || data.activeMaxPrice !== null}
						<button
							onclick={() => goto(buildUrl({ minPrice: null, maxPrice: null }), { invalidateAll: true })}
							class="tag tag-soft h-8 gap-1.5 px-3 text-xs"
						>
							{formatPrice(data.activeMinPrice ?? data.priceRange.min)} – {formatPrice(data.activeMaxPrice ?? data.priceRange.max)}
							<Icon name="close" class="size-3.5" stroke={2.5} />
						</button>
					{/if}
					{#each Object.entries(data.activeSpecFilters) as [specKey, values]}
						{#each values as val}
							<button onclick={() => toggleSpecFilter(specKey, val)} class="tag tag-soft h-8 gap-1.5 px-3 text-xs">
								{specKey}: {val}<Icon name="close" class="size-3.5" stroke={2.5} />
							</button>
						{/each}
					{/each}
					<button onclick={clearAllFilters} class="px-2 text-xs font-bold text-slate-500 underline-offset-2 hover:text-ink hover:underline">Clear all</button>
				</div>
			{/if}

			<!-- Grid -->
			{#if data.products.length === 0}
				<div class="mt-6 rounded-[1.5rem] bg-surface px-6 py-16 text-center">
					<div class="mx-auto grid size-16 place-items-center rounded-full bg-white">
						<Icon name="search" class="size-7 text-slate-400" />
					</div>
					<h2 class="mt-5 text-xl font-extrabold tracking-tight">No products match that</h2>
					<p class="mt-1 text-sm text-slate-500">Try removing a filter, or browse a category below.</p>
					<button onclick={clearAllFilters} class="cta cta-brand mt-6">Clear all filters</button>
					<div class="mt-8 flex flex-wrap justify-center gap-2">
						{#each data.categories as cat}
							<a href="/shop?category={cat.slug}" class="chip">{cat.name}</a>
						{/each}
					</div>
				</div>
			{:else}
				<div class="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 xl:grid-cols-4">
					{#each data.products as product, i (product.id)}
						<ProductCard {product} eager={i < 4} />
					{/each}
				</div>

				<!-- Pagination -->
				{#if data.totalPages > 1}
					<nav class="mt-12 flex items-center justify-center gap-1.5" aria-label="Pagination">
						<button
							onclick={() => goToPage(data.page - 1)}
							disabled={data.page <= 1}
							class="grid size-10 place-items-center rounded-full border-[1.5px] border-line bg-white transition hover:border-ink disabled:pointer-events-none disabled:opacity-40"
							aria-label="Previous page"
						>
							<Icon name="chevron-left" class="size-4" stroke={2.25} />
						</button>
						{#each getPageNumbers(data.page, data.totalPages) as pg}
							{#if pg === '...'}
								<span class="grid size-10 place-items-center text-sm text-slate-400">&hellip;</span>
							{:else}
								<button
									onclick={() => goToPage(pg as number)}
									class="grid size-10 place-items-center rounded-full text-sm font-bold transition {data.page === pg ? 'bg-ink text-white' : 'hover:bg-surface'}"
									aria-current={data.page === pg ? 'page' : undefined}
								>
									{pg}
								</button>
							{/if}
						{/each}
						<button
							onclick={() => goToPage(data.page + 1)}
							disabled={data.page >= data.totalPages}
							class="grid size-10 place-items-center rounded-full border-[1.5px] border-line bg-white transition hover:border-ink disabled:pointer-events-none disabled:opacity-40"
							aria-label="Next page"
						>
							<Icon name="chevron-right" class="size-4" stroke={2.25} />
						</button>
					</nav>
					<p class="mt-3 text-center text-xs text-slate-500">
						Showing {(data.page - 1) * 48 + 1}–{Math.min(data.page * 48, data.total)} of {data.total}
					</p>
				{/if}
			{/if}
		</div>
	</div>
</div>

<!-- Mobile filter drawer -->
{#if mobileFiltersOpen}
	<div class="fixed inset-0 z-[70] lg:hidden">
		<button class="absolute inset-0 bg-ink/50 animate-fade-in" aria-label="Close filters" tabindex="-1" onclick={() => (mobileFiltersOpen = false)}></button>
		<div role="dialog" aria-modal="true" aria-labelledby="filters-title" class="absolute inset-y-0 right-0 flex w-[90%] max-w-sm flex-col bg-white shadow-2xl animate-drawer-right">
			<div class="flex items-center justify-between border-b border-line px-5 py-4">
				<h2 id="filters-title" class="text-lg font-extrabold tracking-tight">Filters</h2>
				<button onclick={() => (mobileFiltersOpen = false)} class="icon-btn -mr-2" aria-label="Close filters">
					<Icon name="close" stroke={2} />
				</button>
			</div>
			<div class="flex-1 overflow-y-auto px-5 py-4">
				{@render filters()}
			</div>
			<div class="flex gap-3 border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
				<button onclick={clearAllFilters} class="cta cta-line flex-1">Clear all</button>
				<button onclick={() => (mobileFiltersOpen = false)} class="cta cta-brand flex-1">Show {data.total} result{data.total !== 1 ? 's' : ''}</button>
			</div>
		</div>
	</div>
{/if}
