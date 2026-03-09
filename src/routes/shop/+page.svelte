<script lang="ts">
import type { PageData } from './$types';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { formatPrice } from '$lib/utils';
import { getImageUrl } from '$lib/r2';
import ProductCard from '$lib/components/ProductCard.svelte';
import RangeSlider from '$lib/components/RangeSlider.svelte';
import Breadcrumb from '$lib/components/Breadcrumb.svelte';

let { data }: { data: PageData } = $props();

let mobileFiltersOpen = $state(false);
let shopSearchQuery = $state('');

// Collapsible filter sections
let openSections = $state<Record<string, boolean>>({
categories: true,
brands: false,
price: true,
sort: false,
});

// Initialize spec sections as open + sync search/price from data
$effect(() => {
for (const key of Object.keys(data.availableSpecs)) {
if (!(key in openSections)) {
openSections[key] = true;
}
}
});

$effect(() => {
shopSearchQuery = data.activeSearch;
});

function toggleSection(key: string) {
openSections[key] = !openSections[key];
}

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
	shopSearchQuery = '';
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
return cat.icon || '';
}

function setSubcategory(slug: string | null) {
	// When changing subcategory, clear spec filters and search
	const u = new URL($page.url);
	for (const key of [...u.searchParams.keys()]) {
		if (key.startsWith('spec_')) u.searchParams.delete(key);
	}
	u.searchParams.delete('q');
	shopSearchQuery = '';
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
// Scroll to top
window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applySearch(e?: Event) {
if (e) e.preventDefault();
goto(buildUrl({ q: shopSearchQuery.trim() || null }), { invalidateAll: true });
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
shopSearchQuery = '';
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
			{ label: data.categories.find(c => c.slug === data.activeCategory)?.name ?? '', href: `/shop?category=${data.activeCategory}` },
			{ label: data.subcategories.find(s => s.slug === data.activeSubcategory)?.name ?? '' },
		];
	}
	if (data.activeCategory) {
		return [
			{ label: 'Home', href: '/' },
			{ label: 'Shop', href: '/shop' },
			{ label: data.categories.find(c => c.slug === data.activeCategory)?.name ?? '' },
		];
	}
	if (data.activeBrand) {
		return [
			{ label: 'Home', href: '/' },
			{ label: 'Shop', href: '/shop' },
			{ label: data.brands.find(b => b.slug === data.activeBrand)?.name ?? '' },
		];
	}
	return [
		{ label: 'Home', href: '/' },
		{ label: 'Shop' },
	];
});

// Heading for non-search state
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
{ value: 'popular', label: 'Most Popular' },
{ value: 'price-asc', label: 'Price: Low to High' },
{ value: 'price-desc', label: 'Price: High to Low' },
{ value: 'discount', label: 'Biggest Discount' },
];

// Dynamic SEO content
const pageTitle = $derived(() => {
	const parts = [];
	if (data.activeSearch) return `Search: ${data.activeSearch} | Gadgets Store Uganda`;
	if (data.activeSubcategory) {
		const sub = data.subcategories.find(s => s.slug === data.activeSubcategory);
		if (sub) parts.push(sub.name);
	}
	if (data.activeCategory) {
		const cat = data.categories.find(c => c.slug === data.activeCategory);
		if (cat) parts.push(cat.name);
	}
	parts.push('Shop', 'Gadgets Store Uganda');
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
	const base = 'https://gadgets.co.ug/shop';
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
	const base = 'https://gadgets.co.ug/shop';
	const params = new URLSearchParams($page.url.searchParams);
	params.set('page', String(data.page - 1));
	return `${base}?${params.toString()}`;
});

const nextPageUrl = $derived(() => {
	if (data.page >= data.totalPages) return null;
	const base = 'https://gadgets.co.ug/shop';
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
<meta property="og:image" content="https://gadgets.co.ug/img/og-shop.jpg" />
<meta property="og:site_name" content="Gadgets Store Uganda" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={pageTitle()} />
<meta name="twitter:description" content={pageDescription()} />
<meta name="twitter:image" content="https://gadgets.co.ug/img/og-shop.jpg" />

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

<div class="bg-white min-h-screen">
<!-- Header / Breadcrumb -->
<div class="border-b border-slate-200 bg-slate-50">
<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
<div class="mb-2">
<Breadcrumb items={crumbs} />
</div>
{#if data.activeSearch}
<div class="flex items-center justify-between gap-4">
<h1 class="text-lg sm:text-2xl font-bold text-slate-900">Showing results for <span class="text-orange-500">"{data.activeSearch}"</span></h1>
<div class="flex items-center gap-3 shrink-0">
<p class="text-sm text-slate-500">{data.total} result{data.total !== 1 ? 's' : ''}</p>
<button
onclick={() => { shopSearchQuery = ''; goto(buildUrl({ q: null }), { invalidateAll: true }); }}
class="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
>
Clear search
</button>
</div>
</div>
{:else}
<div class="flex items-center justify-between gap-4">
<h1 class="text-lg sm:text-2xl font-bold text-slate-900">
{#if data.activeSubcategory}
{data.subcategories.find(s => s.slug === data.activeSubcategory)?.name}
{:else if data.activeCategory}
{data.categories.find(c => c.slug === data.activeCategory)?.name}
{:else}
All Products
{/if}
</h1>
<p class="text-sm text-slate-500 shrink-0">{data.total} product{data.total !== 1 ? 's' : ''}</p>
</div>
{/if}
</div>
</div>

<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">

<!-- Toolbar: search bar + sort + mobile filter toggle -->
<div class="flex flex-col gap-4 mb-6">

<!-- Mobile toolbar: filter + sort -->
<div class="flex items-center gap-2 md:hidden">
<button
onclick={() => mobileFiltersOpen = true}
class="h-10 inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
>
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
</svg>
Filters
{#if activeFilterCount > 0}
<span class="bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>
{/if}
</button>
<div class="relative flex-1 shrink-0">
<label for="sort-select-mobile" class="sr-only">Sort by</label>
<select
id="sort-select-mobile"
value={data.activeSort}
onchange={(e) => setSort((e.target as HTMLSelectElement).value)}
class="h-10 w-full appearance-none rounded-sm border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 cursor-pointer"
>
{#each sortOptions as opt}
<option value={opt.value}>{opt.label}</option>
{/each}
</select>
<svg class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
</svg>
</div>
</div>

<!-- Mobile search bar -->
<form onsubmit={applySearch} class="relative md:hidden">
<svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
</svg>
<input
type="text"
bind:value={shopSearchQuery}
placeholder="Search products..."
class="w-full h-10 pl-10 pr-20 rounded-sm border border-slate-200 bg-white text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
/>
{#if shopSearchQuery}
<button
type="button"
onclick={() => { shopSearchQuery = ''; applySearch(); }}
class="absolute right-14 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
aria-label="Clear search"
>
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
</svg>
</button>
{/if}
<button
type="submit"
class="absolute right-1 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 py-1.5 rounded-sm transition-colors"
>
Search
</button>
</form>

<!-- Desktop: search bar + sort -->
<div class="hidden md:flex items-center gap-3">
<!-- Search bar (grows to fill) -->
<form onsubmit={applySearch} class="relative flex-1 min-w-0">
<svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
</svg>
<input
type="text"
bind:value={shopSearchQuery}
placeholder="Search products..."
class="w-full h-10 pl-10 pr-20 rounded-sm border border-slate-200 bg-white text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
/>
{#if shopSearchQuery}
<button
type="button"
onclick={() => { shopSearchQuery = ''; applySearch(); }}
class="absolute right-14 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
aria-label="Clear search"
>
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
</svg>
</button>
{/if}
<button
type="submit"
class="absolute right-1 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 py-1.5 rounded-sm transition-colors"
>
Search
</button>
</form>

<!-- Sort dropdown -->
<div class="relative shrink-0">
<label for="sort-select" class="sr-only">Sort by</label>
<select
id="sort-select"
value={data.activeSort}
onchange={(e) => setSort((e.target as HTMLSelectElement).value)}
class="h-10 appearance-none rounded-sm border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 cursor-pointer"
>
{#each sortOptions as opt}
<option value={opt.value}>{opt.label}</option>
{/each}
</select>
<svg class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
</svg>

</div>

</div>

<!-- Active filter tags -->
{#if activeFilterCount > 0}
<div class="flex flex-wrap items-center gap-2">
<span class="text-sm text-slate-500">Filters:</span>

{#if data.activeCategory}
<button
onclick={() => setCategory(null)}
class="inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-700 px-3 py-1 text-sm font-medium hover:bg-orange-100 transition-colors"
>
{data.categories.find(c => c.slug === data.activeCategory)?.name}
<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
</button>
{/if}

{#if data.activeSubcategory}
<button
onclick={() => setSubcategory(null)}
class="inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-700 px-3 py-1 text-sm font-medium hover:bg-orange-100 transition-colors"
>
{data.subcategories.find(s => s.slug === data.activeSubcategory)?.name}
<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
</button>
{/if}

{#if data.activeBrand}
<button
onclick={() => setBrand(null)}
class="inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-700 px-3 py-1 text-sm font-medium hover:bg-orange-100 transition-colors"
>
{data.brands.find(b => b.slug === data.activeBrand)?.name}
<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
</button>
{/if}

{#if data.activeMinPrice !== null || data.activeMaxPrice !== null}
<button
onclick={() => goto(buildUrl({ minPrice: null, maxPrice: null }), { invalidateAll: true })}
class="inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-700 px-3 py-1 text-sm font-medium hover:bg-orange-100 transition-colors"
>
Price: {formatPrice(data.activeMinPrice ?? data.priceRange.min)} – {formatPrice(data.activeMaxPrice ?? data.priceRange.max)}
<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
</button>
{/if}

{#each Object.entries(data.activeSpecFilters) as [specKey, values]}
{#each values as val}
<button
onclick={() => toggleSpecFilter(specKey, val)}
class="inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-700 px-3 py-1 text-sm font-medium hover:bg-orange-100 transition-colors"
>
{specKey}: {val}
<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
</button>
{/each}
{/each}

<button
onclick={clearAllFilters}
class="text-sm text-slate-500 hover:text-slate-700 underline"
>
Clear all
</button>
</div>
{/if}
</div>

<!-- Main grid: sidebar + products -->
<div class="flex gap-8">

<!-- Desktop sidebar -->
<aside class="hidden lg:block w-64 shrink-0">
<div class="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-4 pr-2 -mr-2">

<!-- Categories filter -->
<div class="mb-4 border-b border-slate-100 pb-4">
<button onclick={() => toggleSection('categories')} class="flex items-center justify-between w-full text-left mb-2">
<h3 class="text-sm font-semibold text-slate-900 uppercase tracking-wide">Categories</h3>
<svg class="h-4 w-4 text-slate-400 transition-transform {openSections.categories ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
</svg>
</button>
{#if openSections.categories}
<div class="space-y-0.5">
<button
onclick={() => setCategory(null)}
class="w-full text-left flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors {data.activeCategory === null ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
>
<span>All Products</span>
</button>
{#each data.categories as cat}
<button
onclick={() => setCategory(cat.slug)}
class="w-full text-left flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors {data.activeCategory === cat.slug ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
>
<div class="h-6 w-6 rounded-sm overflow-hidden bg-slate-100 shrink-0">
<img src={categoryImageSrc(cat)} alt="" class="h-full w-full object-cover" />
</div>
<span class="flex-1 truncate">{cat.name}</span>
{#if cat.product_count !== undefined}
<span class="text-xs {data.activeCategory === cat.slug ? 'text-orange-500' : 'text-slate-400'}">{cat.product_count}</span>
{/if}
</button>
{/each}
</div>
{/if}
</div>

<!-- Subcategories filter (shows when a category is selected) -->
{#if data.activeCategory && data.subcategories.length > 0}
<div class="mb-4 border-b border-slate-100 pb-4">
<h3 class="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2">Subcategories</h3>
<div class="space-y-0.5">
<button
onclick={() => setSubcategory(null)}
class="w-full text-left flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors {data.activeSubcategory === null ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
>
<span>All {data.categories.find(c => c.slug === data.activeCategory)?.name}</span>
</button>
{#each data.subcategories as sub}
<button
onclick={() => setSubcategory(sub.slug)}
class="w-full text-left flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors {data.activeSubcategory === sub.slug ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
>
<span class="truncate">{sub.name}</span>
{#if sub.product_count !== undefined}
<span class="text-xs {data.activeSubcategory === sub.slug ? 'text-orange-500' : 'text-slate-400'}">{sub.product_count}</span>
{/if}
</button>
{/each}
</div>
</div>
{/if}

<!-- Brands filter -->
{#if data.brands.length > 0}
<div class="mb-4 border-b border-slate-100 pb-4">
<button onclick={() => toggleSection('brands')} class="flex items-center justify-between w-full text-left mb-2">
<h3 class="text-sm font-semibold text-slate-900 uppercase tracking-wide">Brands</h3>
<svg class="h-4 w-4 text-slate-400 transition-transform {openSections.brands ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
</svg>
</button>
{#if openSections.brands}
<div class="space-y-0.5">
<button
onclick={() => setBrand(null)}
class="w-full text-left flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors {data.activeBrand === null ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
>
<span>All Brands</span>
</button>
{#each data.brands as brand}
<button
onclick={() => setBrand(brand.slug)}
class="w-full text-left flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors {data.activeBrand === brand.slug ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
>
<span class="truncate">{brand.name}</span>
{#if brand.product_count !== undefined}
<span class="text-xs {data.activeBrand === brand.slug ? 'text-orange-500' : 'text-slate-400'}">{brand.product_count}</span>
{/if}
</button>
{/each}
</div>
{/if}
</div>
{/if}

<!-- Price range filter -->
<div class="mb-4 border-b border-slate-100 pb-4">
<button onclick={() => toggleSection('price')} class="flex items-center justify-between w-full text-left mb-2">
<h3 class="text-sm font-semibold text-slate-900 uppercase tracking-wide">Price Range</h3>
<svg class="h-4 w-4 text-slate-400 transition-transform {openSections.price ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
</svg>
</button>
{#if openSections.price}
<div class="px-1">
<RangeSlider
min={data.priceRange.min}
max={data.priceRange.max}
step={100}
bind:minValue={localMinPrice}
bind:maxValue={localMaxPrice}
onchange={applyPriceRange}
/>
<div class="flex items-center justify-between text-xs text-slate-500 mt-2">
<span>{formatPrice(localMinPrice)}</span>
<span>{formatPrice(localMaxPrice)}</span>
</div>
{#if data.activeMinPrice !== null || data.activeMaxPrice !== null}
<button
onclick={() => goto(buildUrl({ minPrice: null, maxPrice: null }), { invalidateAll: true })}
class="text-xs text-orange-500 hover:text-orange-600 mt-1"
>
Reset price
</button>
{/if}
</div>
{/if}
</div>

<!-- Dynamic spec filters -->
{#each Object.entries(data.availableSpecs) as [specKey, specValues]}
<div class="mb-4 border-b border-slate-100 pb-4">
<button onclick={() => toggleSection(specKey)} class="flex items-center justify-between w-full text-left mb-2">
<h3 class="text-sm font-semibold text-slate-900 uppercase tracking-wide">{specKey}</h3>
<svg class="h-4 w-4 text-slate-400 transition-transform {openSections[specKey] ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
</svg>
</button>
{#if openSections[specKey]}
<div class="space-y-1">
{#each specValues as val}
<label class="flex items-center gap-2.5 rounded-sm px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50 transition-colors {isSpecActive(specKey, val) ? 'bg-orange-50 text-orange-700' : 'text-slate-600'}">
<input
type="checkbox"
checked={isSpecActive(specKey, val)}
onchange={() => toggleSpecFilter(specKey, val)}
class="h-3.5 w-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
/>
<span class="truncate">{val}</span>
</label>
{/each}
</div>
{/if}
</div>
{/each}

</div>
</aside>

<!-- Product grid -->
<div class="flex-1 min-w-0">
{#if data.products.length === 0}
<div class="text-center py-20">
<svg class="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
</svg>
<h3 class="mt-4 text-lg font-semibold text-slate-900">No products found</h3>
<p class="mt-1 text-sm text-slate-500">Try removing some filters or browse all products.</p>
<button
onclick={clearAllFilters}
class="mt-4 inline-flex items-center rounded-sm bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
>
Clear all filters
</button>
</div>
{:else}
<div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
{#each data.products as product (product.id)}
<ProductCard {product} />
{/each}
</div>

<!-- Pagination -->
{#if data.totalPages > 1}
<nav class="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
<!-- Previous -->
<button
onclick={() => goToPage(data.page - 1)}
disabled={data.page <= 1}
class="inline-flex items-center justify-center rounded-sm border border-slate-200 bg-white h-9 w-9 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
aria-label="Previous page"
>
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
</svg>
</button>

{#each getPageNumbers(data.page, data.totalPages) as pg}
{#if pg === '...'}
<span class="inline-flex items-center justify-center h-9 w-9 text-sm text-slate-400">&hellip;</span>
{:else}
<button
onclick={() => goToPage(pg as number)}
class="inline-flex items-center justify-center rounded-sm h-9 w-9 text-sm font-medium transition-colors {data.page === pg ? 'bg-orange-500 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}"
aria-current={data.page === pg ? 'page' : undefined}
>
{pg}
</button>
{/if}
{/each}

<!-- Next -->
<button
onclick={() => goToPage(data.page + 1)}
disabled={data.page >= data.totalPages}
class="inline-flex items-center justify-center rounded-sm border border-slate-200 bg-white h-9 w-9 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
aria-label="Next page"
>
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
</svg>
</button>
</nav>

<p class="text-center text-sm text-slate-500 mt-3">
Page {data.page} of {data.totalPages} &middot; Showing {((data.page - 1) * 48) + 1}–{Math.min(data.page * 48, data.total)} of {data.total}
</p>
{/if}
{/if}
</div>
</div>
</div>
</div>

<!-- Mobile filter drawer -->
{#if mobileFiltersOpen}
<!-- Backdrop -->
<div
class="fixed inset-0 bg-black/40 z-50 lg:hidden"
onclick={() => mobileFiltersOpen = false}
aria-hidden="true"
></div>

<!-- Drawer -->
<div class="fixed inset-y-0 right-0 z-50 w-80 max-w-full bg-white shadow-2xl lg:hidden flex flex-col">
<!-- Header -->
<div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
<h2 class="text-base font-semibold text-slate-900">Filters</h2>
<button
onclick={() => mobileFiltersOpen = false}
class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
aria-label="Close filters"
>
<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
</svg>
</button>
</div>

<!-- Body -->
<div class="flex-1 overflow-y-auto px-4 py-4">
<!-- Search in mobile -->
<div class="mb-5">
<h3 class="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Search</h3>
<form onsubmit={(e) => { e.preventDefault(); applySearch(); mobileFiltersOpen = false; }} class="relative">
<input
type="text"
bind:value={shopSearchQuery}
placeholder="Search products..."
class="w-full h-9 pl-3 pr-9 rounded-sm border border-slate-200 bg-white text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
/>
<button type="submit" class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500" aria-label="Search">
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
</svg>
</button>
</form>
</div>

<!-- Categories -->
<div class="mb-5">
<h3 class="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Categories</h3>
<div class="space-y-0.5">
<button
onclick={() => setCategory(null)}
class="w-full text-left flex items-center justify-between rounded-sm px-3 py-2.5 text-sm transition-colors {data.activeCategory === null ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}"
>
<span>All Products</span>
</button>
{#each data.categories as cat}
<button
onclick={() => setCategory(cat.slug)}
class="w-full text-left flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm transition-colors {data.activeCategory === cat.slug ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}"
>
<div class="h-6 w-6 rounded overflow-hidden bg-slate-100 shrink-0">
<img src={categoryImageSrc(cat)} alt="" class="h-full w-full object-cover" />
</div>
<span class="flex-1 truncate">{cat.name}</span>
{#if cat.product_count !== undefined}
<span class="text-xs text-slate-400">{cat.product_count}</span>
{/if}
</button>
{/each}
</div>
</div>

<!-- Subcategories (mobile) -->
{#if data.activeCategory && data.subcategories.length > 0}
<div class="mb-5">
<h3 class="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Subcategories</h3>
<div class="space-y-0.5">
<button
onclick={() => setSubcategory(null)}
class="w-full text-left flex items-center justify-between rounded-sm px-3 py-2.5 text-sm transition-colors {data.activeSubcategory === null ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}"
>
<span>All {data.categories.find(c => c.slug === data.activeCategory)?.name}</span>
</button>
{#each data.subcategories as sub}
<button
onclick={() => setSubcategory(sub.slug)}
class="w-full text-left flex items-center justify-between rounded-sm px-3 py-2.5 text-sm transition-colors {data.activeSubcategory === sub.slug ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}"
>
<span class="truncate">{sub.name}</span>
{#if sub.product_count !== undefined}
<span class="text-xs text-slate-400">{sub.product_count}</span>
{/if}
</button>
{/each}
</div>
</div>
{/if}

<!-- Brands (mobile) -->
{#if data.brands.length > 0}
<div class="mb-5">
<h3 class="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Brands</h3>
<div class="space-y-0.5">
<button
onclick={() => setBrand(null)}
class="w-full text-left flex items-center justify-between rounded-sm px-3 py-2.5 text-sm transition-colors {data.activeBrand === null ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}"
>
<span>All Brands</span>
</button>
{#each data.brands as brand}
<button
onclick={() => setBrand(brand.slug)}
class="w-full text-left flex items-center justify-between rounded-sm px-3 py-2.5 text-sm transition-colors {data.activeBrand === brand.slug ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}"
>
<span class="truncate">{brand.name}</span>
{#if brand.product_count !== undefined}
<span class="text-xs text-slate-400">{brand.product_count}</span>
{/if}
</button>
{/each}
</div>
</div>
{/if}

<!-- Price range -->
<div class="mb-5">
<h3 class="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Price Range</h3>
<RangeSlider
min={data.priceRange.min}
max={data.priceRange.max}
step={100}
bind:minValue={localMinPrice}
bind:maxValue={localMaxPrice}
onchange={applyPriceRange}
/>
<div class="flex items-center justify-between text-xs text-slate-500 mt-2">
<span>{formatPrice(localMinPrice)}</span>
<span>{formatPrice(localMaxPrice)}</span>
</div>
</div>

<!-- Spec filters (mobile) -->
{#each Object.entries(data.availableSpecs) as [specKey, specValues]}
<div class="mb-5">
<h3 class="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">{specKey}</h3>
<div class="space-y-1">
{#each specValues as val}
<label class="flex items-center gap-2.5 rounded-sm px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50 transition-colors {isSpecActive(specKey, val) ? 'bg-orange-50 text-orange-700' : 'text-slate-600'}">
<input
type="checkbox"
checked={isSpecActive(specKey, val)}
onchange={() => toggleSpecFilter(specKey, val)}
class="h-3.5 w-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
/>
<span class="truncate">{val}</span>
</label>
{/each}
</div>
</div>
{/each}

<!-- Sort -->
<div class="mb-5">
<h3 class="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Sort By</h3>
<div class="space-y-0.5">
{#each sortOptions as opt}
<button
onclick={() => { setSort(opt.value); mobileFiltersOpen = false; }}
class="w-full text-left rounded-sm px-3 py-2.5 text-sm transition-colors {data.activeSort === opt.value ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}"
>
{opt.label}
</button>
{/each}
</div>
</div>
</div>

<!-- Footer -->
<div class="border-t border-slate-200 px-4 py-3 flex gap-3">
<button
onclick={() => { clearAllFilters(); }}
class="flex-1 rounded-sm border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
>
Clear all
</button>
<button
onclick={() => { applyPriceRange(); mobileFiltersOpen = false; }}
class="flex-1 rounded-sm bg-orange-500 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
>
Apply filters
</button>
</div>
</div>
{/if}
