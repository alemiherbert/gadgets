<script lang="ts">
import type { PageData } from './$types';
import { getImageUrl } from '$lib/r2';
import ProductCard from '$lib/components/ProductCard.svelte';

let { data }: { data: PageData } = $props();

// Carousel state
let currentSlide = $state(0);
let carouselTimer: ReturnType<typeof setInterval>;

const slides = $derived(
data.slides.length > 0
? data.slides
: [
{
id: 0, title: 'Premium Audio',
subtitle: 'Immerse yourself in crystal-clear sound with our noise-cancelling earbuds.',
cta_text: 'Shop Audio', cta_link: '/#products',
bg_color: '#2563eb', text_color: '#ffffff',
image_key: null, bg_image_desktop_key: null, bg_image_mobile_key: null,
bg_image_position: 'center center', overlay_opacity: 0.4,
product_id: null, sort_order: 0, active: 1, created_at: ''
},
{
id: 1, title: 'Smart Wearables',
subtitle: 'Track your fitness goals with style. Water-resistant and GPS-enabled.',
cta_text: 'Explore Wearables', cta_link: '/#products',
bg_color: '#0891b2', text_color: '#ffffff',
image_key: null, bg_image_desktop_key: null, bg_image_mobile_key: null,
bg_image_position: 'center center', overlay_opacity: 0.4,
product_id: null, sort_order: 1, active: 1, created_at: ''
},
{
id: 2, title: 'Desk Essentials',
subtitle: 'Upgrade your workspace with premium keyboards, hubs, and accessories.',
cta_text: 'Browse Accessories', cta_link: '/#products',
bg_color: '#7c3aed', text_color: '#ffffff',
image_key: null, bg_image_desktop_key: null, bg_image_mobile_key: null,
bg_image_position: 'center center', overlay_opacity: 0.4,
product_id: null, sort_order: 2, active: 1, created_at: ''
},
]
);

function nextSlide() { currentSlide = (currentSlide + 1) % slides.length; }
function prevSlide() { currentSlide = (currentSlide - 1 + slides.length) % slides.length; }
function goToSlide(i: number) { currentSlide = i; resetTimer(); }
function resetTimer() { clearInterval(carouselTimer); carouselTimer = setInterval(nextSlide, 5000); }

$effect(() => {
carouselTimer = setInterval(nextSlide, 5000);
return () => clearInterval(carouselTimer);
});

// Horizontal scroll helpers for product carousels
function scrollCarousel(id: string, dir: 'left' | 'right') {
const el = document.getElementById(id);
if (!el) return;
const half = el.scrollWidth / 2;
const scrollAmount = el.clientWidth * 0.8;
if (dir === 'right') {
if (el.scrollLeft >= half - 2) {
el.style.scrollBehavior = 'auto';
el.scrollLeft = el.scrollLeft - half;
void el.offsetWidth;
el.style.scrollBehavior = '';
}
el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
} else {
if (el.scrollLeft <= 2) {
el.style.scrollBehavior = 'auto';
el.scrollLeft = el.scrollLeft + half;
void el.offsetWidth;
el.style.scrollBehavior = '';
}
el.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
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
el.style.scrollBehavior = 'auto';
el.scrollLeft = el.scrollLeft - half;
void el.offsetWidth;
el.style.scrollBehavior = '';
}
el.scrollBy({ left: el.clientWidth * 0.2, behavior: 'smooth' });
}, 6000);
return () => clearInterval(timer);
}

$effect(() => startCarouselAutoScroll('carousel-new'));
$effect(() => startCarouselAutoScroll('carousel-featured'));
$effect(() => startCarouselAutoScroll('carousel-best'));
</script>

<svelte:head>
<title>Gadgets Store — Premium Tech, Delivered</title>
</svelte:head>

<!-- ── Hero Carousel ────────────────────────────────────────────────── -->
{#if slides.length > 0}
<section class="relative overflow-hidden">
<div class="relative h-[460px] sm:h-[500px] lg:h-[550px]">
{#each slides as slide, i}
<div
class="absolute inset-0 flex transition-opacity duration-700 ease-in-out"
style="opacity: {i === currentSlide ? 1 : 0}; z-index: {i === currentSlide ? 1 : 0}; background: linear-gradient(135deg, {slide.bg_color} 0%, {slide.bg_color}dd 50%, {slide.bg_color}99 100%); color: {slide.text_color};"
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
<div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" style="opacity: {slide.overlay_opacity / 0.4};"></div>
{:else}
<div class="absolute inset-0 overflow-hidden">
<div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>
<div class="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-white/5 blur-2xl"></div>
</div>
{/if}
	<div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-end pb-24 sm:pb-0 sm:items-center h-full">
<div class="{slide.image_key ? 'max-w-xl' : 'max-w-3xl'}">
<div class="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-sm font-medium mb-4">
<span class="flex h-2 w-2 rounded-full bg-white animate-pulse"></span>
New Collection
</div>
<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4">{slide.title}</h1>
<p class="text-lg sm:text-xl opacity-90 text-orange-50/70 leading-relaxed mb-6 sm:mb-8 {slide.image_key ? 'max-w-lg' : 'max-w-2xl'}">{slide.subtitle}</p>
<a href={slide.cta_link} class="inline-flex items-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-3 sm:py-3 rounded-sm bg-white text-slate-900 font-semibold text-sm sm:text-base hover:bg-white/90 transition-all hover:shadow-lg hover:scale-105 active:scale-100">
{slide.cta_text}
<svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
</a>
</div>
<!--
{#if slide.image_key}
<div class="hidden lg:flex flex-1 justify-end items-center">
<img src={getImageUrl(slide.image_key)} alt={slide.title} class="max-h-80 object-contain drop-shadow-2xl" />
</div>
{/if}
-->
</div>
</div>
{/each}

<button onclick={prevSlide} class="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all hidden sm:flex items-center justify-center z-10" aria-label="Previous slide">
<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
</button>
<button onclick={nextSlide} class="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all hidden sm:flex items-center justify-center z-10" aria-label="Next slide">
<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
</button>

<div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
{#each slides as _, i}
<button onclick={() => goToSlide(i)} class="h-2.5 rounded-full transition-all duration-300 {i === currentSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/70'}" aria-label="Go to slide {i + 1}"></button>
{/each}
</div>
</div>
</section>
{/if}

<!-- ── New Arrivals (scrollable carousel) ────────────────────────────── -->
{#if data.newArrivals.length > 0}
<section class="py-16 bg-white">
<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
<div class="flex items-end justify-between mb-8">
<div>
<p class="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-2">Just Landed</p>
<h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">New Arrivals</h2>
</div>
<div class="flex items-center gap-2">
<button onclick={() => scrollCarousel('carousel-new', 'left')} class="h-9 w-9 rounded-full border border-orange-200 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors" aria-label="Scroll left">
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
</button>
<button onclick={() => scrollCarousel('carousel-new', 'right')} class="h-9 w-9 rounded-full border border-orange-200 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors" aria-label="Scroll right">
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
</button>
<a href="/shop?sort=newest" class="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors ml-2">
View all
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
</a>
</div>
</div>
<div id="carousel-new" class="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4">
{#each [...data.newArrivals, ...data.newArrivals] as product, i}
<div class="w-[200px] sm:w-[220px] lg:w-[240px] snap-start shrink-0">
<ProductCard {product} />
</div>
{/each}
</div>
</div>
</section>
{/if}


<!-- ── Shop by Category ──────────────────────────────────────────────── -->
{#if data.categories.length > 0}
<section class="py-16 bg-gradient-to-r from-orange-50/50 to-orange-50/50">
<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
<div class="text-center mb-10">
<p class="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-2">Browse Collections</p>
<h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Shop by Category</h2>
</div>
<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
{#each data.categories as cat}
<a
href="/shop?category={cat.slug}"
class="group relative flex flex-col items-end justify-end rounded-sm overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 aspect-[4/3]"
>
<img src={cat.icon} alt={cat.name} class="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
<div class="relative z-10 p-4 w-full">
<h3 class="text-sm font-semibold text-white mb-0.5">{cat.name}</h3>
<p class="text-xs text-white/70">{cat.product_count ?? 0} items</p>
</div>
<div class="absolute inset-0 ring-2 ring-orange-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
</a>
{/each}
</div>
</div>
</section>
{/if}

<!-- ── Best Sellers (scrollable) ─────────────────────────────────────── -->
{#if data.bestSellers.length > 0}
<section class="py-16">
<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
<div class="flex items-end justify-between mb-8">
<div>
<p class="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-2">Most Popular</p>
<h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Best Sellers</h2>
</div>
<div class="flex items-center gap-2">
<button onclick={() => scrollCarousel('carousel-best', 'left')} class="h-9 w-9 rounded-full border border-orange-200 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors" aria-label="Scroll left">
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
</button>
<button onclick={() => scrollCarousel('carousel-best', 'right')} class="h-9 w-9 rounded-full border border-orange-200 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors" aria-label="Scroll right">
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
</button>
<a href="/shop?sort=popular" class="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors ml-2">
View all
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
</a>
</div>
</div>
<div id="carousel-best" class="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4">
{#each [...data.bestSellers, ...data.bestSellers] as product, i}
<div class="w-[200px] sm:w-[220px] lg:w-[240px] snap-start shrink-0">
<ProductCard {product} />
</div>
{/each}
</div>
</div>
</section>
{/if}

<!-- ── Featured Products (scrollable carousel) ───────────────────────── -->
{#if data.featuredProducts.length > 0}
<section class="py-16 bg-gradient-to-b from-orange-50/50 to-orange-50/50">
<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
<div class="flex items-end justify-between mb-8">
<div>
<p class="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-2">Curated for you</p>
<h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Featured Products</h2>
</div>
<div class="flex items-center gap-2">
<button onclick={() => scrollCarousel('carousel-featured', 'left')} class="h-9 w-9 rounded-full border border-orange-200 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors" aria-label="Scroll left">
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
</button>
<button onclick={() => scrollCarousel('carousel-featured', 'right')} class="h-9 w-9 rounded-full border border-orange-200 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors" aria-label="Scroll right">
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
</button>
</div>
</div>
<div id="carousel-featured" class="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4">
{#each [...data.featuredProducts, ...data.featuredProducts] as product, i}
<div class="w-[200px] sm:w-[220px] lg:w-[240px] snap-start shrink-0">
<ProductCard {product} />
</div>
{/each}
</div>
</div>
</section>
{/if}

<!-- ── Great Deals ───────────────────────────────────────────────────── -->
{#if data.deals.length > 0}
<section id="products" class="py-16 bg-white">
<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
<div class="flex items-end justify-between mb-8">
<div>
<p class="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2">Save big today</p>
<h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Great Deals</h2>
</div>
<a href="/shop?sort=discount" class="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
View all deals
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
</a>
</div>
<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
{#each data.deals as product}
<ProductCard {product} />
{/each}
</div>
</div>
</section>
{/if}

<!-- ── CTA Banner ────────────────────────────────────────────────────── -->
<section class="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 py-20 relative overflow-hidden">
<div class="absolute inset-0">
<div class="absolute -top-24 -right-32 w-96 h-96 rounded-full bg-white/5 blur-3xl"></div>
<div class="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-white/5 blur-2xl"></div>
</div>
<div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
<h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">Ready to upgrade your tech?</h2>
<p class="text-orange-100 mb-8 max-w-lg mx-auto">Browse our full collection with advanced filters. Pay on delivery — no risk, no hassle.</p>
<a href="/shop" class="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-orange-600 font-semibold text-base hover:bg-orange-50 transition-all hover:shadow-lg hover:scale-105 active:scale-100">
Shop All Products
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
</a>
</div>
</section>

<style>
.scrollbar-hide {
-ms-overflow-style: none;
scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
display: none;
}
</style>
