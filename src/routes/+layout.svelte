<script lang="ts">
import '../app.css';
import { cart } from '$lib/cart.svelte';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import type { LayoutData } from './$types';

let { children, data }: { children: any; data: LayoutData } = $props();

let mobileMenuOpen = $state(false);
let searchOpen = $state(false);
let searchQuery = $state('');
let megaMenuOpen = $state(false);
let megaMenuTimeout: ReturnType<typeof setTimeout> | null = null;
let mobileCategoriesOpen = $state(false);

// Subcategories grouped by category slug (loaded from DB)
const subcategories = $derived(data.subcategoriesGrouped ?? {});

// Hide chrome on auth and admin pages
const isAuthRoute = $derived(page.url.pathname.startsWith('/auth'));
const isAdminRoute = $derived(page.url.pathname.startsWith('/admin'));
const hideChrome = $derived(isAuthRoute || isAdminRoute);

function openMegaMenu() {
	if (megaMenuTimeout) clearTimeout(megaMenuTimeout);
	megaMenuOpen = true;
}

function closeMegaMenu() {
	megaMenuTimeout = setTimeout(() => { megaMenuOpen = false; }, 200);
}

function handleSearch(e: Event) {
	e.preventDefault();
	if (searchQuery.trim()) {
		goto(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
		searchOpen = false;
		searchQuery = '';
	}
}

function toggleSearch() {
	searchOpen = !searchOpen;
	if (searchOpen) {
		setTimeout(() => {
			const input = document.getElementById('nav-search-input');
			if (input) input.focus();
		}, 100);
	}
}
</script>

<svelte:head>
<title>Gadgets Store</title>
</svelte:head>

{#if !hideChrome}

<!-- Navigation -->
<header class="sticky top-0 z-50 w-full bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 backdrop-blur">
<div class="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">

<!-- Mobile hamburger -->
<button
onclick={() => mobileMenuOpen = !mobileMenuOpen}
class="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-orange-500/20 hover:text-orange-400 lg:hidden"
aria-label="Toggle menu"
>
<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
</svg>
</button>

<!-- Logo -->
<a href="/" class="flex items-center gap-2 mr-6">
<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
<span class="text-sm font-bold text-white">G</span>
</div>
<span class="text-base font-semibold tracking-tight text-white hidden sm:inline">Gadgets</span>
</a>

<!-- Desktop nav links -->
<nav class="hidden lg:flex items-center gap-6">
<a href="/" class="text-sm font-medium text-white hover:text-orange-400 transition-colors">Home</a>
<a href="/shop" class="text-sm font-medium text-white hover:text-orange-400 transition-colors">Shop</a>
<!-- Categories mega menu trigger -->
<div class="relative" role="navigation" aria-label="Categories" onmouseenter={openMegaMenu} onmouseleave={closeMegaMenu}>
<button
	class="text-sm font-medium text-white hover:text-orange-400 transition-colors inline-flex items-center gap-1 bg-transparent border-none cursor-pointer font-[inherit] p-0"
	onclick={() => megaMenuOpen = !megaMenuOpen}
>
	Categories
	<svg class="h-3.5 w-3.5 transition-transform {megaMenuOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
		<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
	</svg>
</button>
</div>
</nav>

<!-- Spacer -->
<div class="flex-1"></div>

<!-- Desktop search bar -->
<form onsubmit={handleSearch} class="hidden md:flex items-center mr-3">
<div class="relative">
<svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
	<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
</svg>
<input
	type="text"
	bind:value={searchQuery}
	placeholder="Search gadgets..."
	class="h-9 w-48 lg:w-64 pl-9 pr-3 rounded-sm  bg-white/95 text-sm focus:outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-400 focus:w-80 transition-all"
/>
</div>
</form>

<!-- Right actions -->
<div class="flex items-center gap-1">

<!-- Mobile search toggle -->
<button
onclick={toggleSearch}
class="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-orange-500/20 hover:text-orange-400 transition-colors md:hidden"
aria-label="Search"
>
<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
</svg>
</button>

<!-- Account -->
{#if data.customer}
<a href="/account" class="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-orange-500/20 hover:text-orange-400 transition-colors" aria-label="Account">
<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
</svg>
</a>
<form method="POST" action="/auth/logout" class="hidden sm:block">
<button type="submit" class="text-[14px] text-slate-300 hover:text-orange-400 transition-colors cursor-pointer bg-transparent border-none font-[inherit] px-2 py-1">
Sign out
</button>
</form>
{:else}
<a href="/auth/login" class="hidden sm:inline-flex text-base font-medium text-[14px] text-white hover:text-orange-500 transition-colors px-3 py-1.5">Sign in</a>
<a href="/auth/register" class="hidden sm:inline-flex btn border-none rounded-sm text-white bg-orange-500">Create account</a>
{/if}

<!-- Cart -->
<a
href="/cart"
class="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-white hover:text-orange-400 transition-colors ml-1"
aria-label="Shopping cart"
>
<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
</svg>
{#if cart.count > 0}
<span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-400 text-[10px] font-semibold text-white">
{cart.count}
</span>
{/if}
</a>
</div>
</div>

<!-- Mobile search bar (slides down) -->
{#if searchOpen}
<div class="border-t border-orange-500/30 px-4 py-3 md:hidden">
<form onsubmit={handleSearch} class="relative">
<svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
	<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
</svg>
<input
	id="nav-search-input"
	type="text"
	bind:value={searchQuery}
	placeholder="Search gadgets..."
	class="w-full h-10 pl-10 pr-4 rounded-sm border border-orange-300 bg-orange-50/50 text-sm focus:outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
/>
</form>
</div>
{/if}

<!-- Desktop mega menu dropdown -->
{#if megaMenuOpen}
<div
	class="absolute left-0 right-0 z-40 hidden lg:block"
	role="menu"
	tabindex="-1"
	onmouseenter={openMegaMenu}
	onmouseleave={closeMegaMenu}
>
<div class="border-b border-orange-100 bg-white shadow-xl">
<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
	<div class="grid grid-cols-3 gap-x-8 gap-y-6">
		{#each data.categories as cat}
			<div class="group">
				<a
					href="/shop?category={cat.slug}"
					class="flex items-center gap-3 mb-3"
					onclick={() => megaMenuOpen = false}
				>
					<div>
						<h3 class="text-base font-bold text-slate-900 group-hover:text-orange-500 transition-colors">{cat.name}</h3>
					</div>
				</a>
				{#if subcategories[cat.slug]?.length}
					<ul class="grid grid-cols-2 gap-x-4 gap-y-1">
						{#each subcategories[cat.slug] as sub}
							<li>
								<a
									href="/shop?category={cat.slug}&subcategory={sub.slug}"
									class="text-sm text-slate-500 hover:text-orange-500 transition-colors py-0.5 block"
									onclick={() => megaMenuOpen = false}
								>{sub.name}</a>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/each}
	</div>
</div>
</div>
</div>
{/if}
</header>
{/if}

{#if !hideChrome}
<!-- Mobile menu -->
{#if mobileMenuOpen}
<div class="fixed inset-0 bg-black/50 z-50 lg:hidden" onclick={() => mobileMenuOpen = false} aria-hidden="true"></div>
<div class="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl lg:hidden flex flex-col">
<div class="flex items-center justify-between px-4 h-16 border-b border-orange-100">
<a href="/" class="flex items-center gap-2" onclick={() => mobileMenuOpen = false}>
<div class="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-orange-600">
<span class="text-xs font-bold text-white">G</span>
</div>
<span class="text-sm font-semibold text-slate-900">Gadgets</span>
</a>
<button onclick={() => mobileMenuOpen = false} class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-orange-50 hover:text-orange-500" aria-label="Close">
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
</svg>
</button>
</div>
<nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
<a href="/" onclick={() => mobileMenuOpen = false} class="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600">Home</a>
<a href="/shop" onclick={() => mobileMenuOpen = false} class="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600">Shop</a>
<!-- Mobile categories accordion -->
<div>
<button
	onclick={() => mobileCategoriesOpen = !mobileCategoriesOpen}
	class="flex items-center justify-between w-full rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600 bg-transparent border-none cursor-pointer font-[inherit] text-left"
>
	Categories
	<svg class="h-4 w-4 transition-transform {mobileCategoriesOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
		<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
	</svg>
</button>
{#if mobileCategoriesOpen}
<div class="pl-3 space-y-0.5 mt-1">
	{#each data.categories as cat}
	<a href="/shop?category={cat.slug}" onclick={() => mobileMenuOpen = false} class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-orange-50 hover:text-orange-600">
				<div class="h-7 w-7 rounded-md overflow-hidden bg-orange-50 shrink-0">
				<img src={cat.icon} alt={cat.name} class="h-full w-full object-cover" />
			</div>
			{cat.name}
		</a>
		{#if subcategories[cat.slug]?.length}
			<div class="pl-10 space-y-0.5">
				{#each subcategories[cat.slug] as sub}
					<a href="/shop?category={cat.slug}&subcategory={sub.slug}" onclick={() => mobileMenuOpen = false} class="block rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-orange-50 hover:text-orange-600">
						{sub.name}
					</a>
				{/each}
			</div>
		{/if}
	{/each}
</div>
{/if}
</div>
<a href="/shop" onclick={() => mobileMenuOpen = false} class="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600">Search</a>
<a href="/cart" onclick={() => mobileMenuOpen = false} class="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600">Cart ({cart.count})</a>
<a href="/account" onclick={() => mobileMenuOpen = false} class="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600">My Orders</a>
</nav>
<div class="border-t border-orange-100 px-4 py-4">
{#if data.customer}
<p class="text-sm font-medium text-slate-900 mb-2">{data.customer.name}</p>
<form method="POST" action="/auth/logout">
<button type="submit" class="text-sm text-slate-500 hover:text-orange-600 bg-transparent border-none cursor-pointer font-[inherit]">Sign out</button>
</form>
{:else}
<a href="/auth/login" onclick={() => mobileMenuOpen = false} class="block w-full text-center text-white btn bg-orange-400 mb-2">Sign in</a>
<a href="/auth/register" onclick={() => mobileMenuOpen = false} class="block w-full text-center text-orange-400 btn btn-outline">Create account</a>
{/if}
</div>
</div>
{/if}
{/if}

<!-- Main content -->
{#if hideChrome}
{@render children()}
{:else}
<main class="min-h-[calc(100vh-3.75rem)]">
{@render children()}
</main>
{/if}

{#if !hideChrome}
<!-- Footer -->
<footer class="bg-slate-800">
<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
<div class="grid grid-cols-2 gap-8 lg:grid-cols-4">
<!-- Brand -->
<div class="col-span-2 lg:col-span-1">
<a href="/" class="flex items-center gap-2 mb-4">
<div class="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-orange-600">
<span class="text-xs font-bold text-white">G</span>
</div>
<span class="text-sm font-semibold text-white">Gadgets</span>
</a>
<p class="text-sm text-slate-400 leading-relaxed">Premium gadgets delivered to your door. Pay on delivery, no hassle.</p>
</div>
<!-- Shop -->
<div>
<h4 class="text-sm font-semibold text-slate-100 mb-3">Shop</h4>
<ul class="space-y-2.5">
<li><a href="/shop" class="text-sm text-slate-400 hover:text-orange-400 transition-colors">All Products</a></li>
<li><a href="/shop" class="text-sm text-slate-400 hover:text-orange-400 transition-colors">Browse & Search</a></li>
<li><a href="/cart" class="text-sm text-slate-400 hover:text-orange-400 transition-colors">Shopping Cart</a></li>
<li><a href="/account" class="text-sm text-slate-400 hover:text-orange-400 transition-colors">My Orders</a></li>
</ul>
</div>
<!-- Account -->
<div>
<h4 class="text-sm font-semibold text-slate-100 mb-3">Account</h4>
<ul class="space-y-2.5">
<li><a href="/auth/login" class="text-sm text-slate-400 hover:text-orange-400 transition-colors">Sign In</a></li>
<li><a href="/auth/register" class="text-sm text-slate-400 hover:text-orange-400 transition-colors">Create Account</a></li>
<li><a href="/account" class="text-sm text-slate-400 hover:text-orange-400 transition-colors">My Account</a></li>
</ul>
</div>
<!-- Support -->
<div>
<h4 class="text-sm font-semibold text-slate-100 mb-3">Support</h4>
<ul class="space-y-2.5">
<li><a href="mailto:support@gadgets.co.ug" class="text-sm text-slate-400 hover:text-orange-400 transition-colors">support@gadgets.co.ug</a></li>
<li><a href="tel:+256700000000" class="text-sm text-slate-400 hover:text-orange-400 transition-colors">+256 700 000 000</a></li>
<li><span class="text-sm text-slate-400">Cash on Delivery</span></li>
<li><span class="text-sm text-slate-400">Free returns within 14 days</span></li>
</ul>
</div>
</div>
<div class="mt-10  pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
<p class="text-xs text-slate-500">&copy; {new Date().getFullYear()} Gadgets Store. All rights reserved.</p>
</div>
</div>
</footer>
{/if}
