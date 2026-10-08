<script lang="ts">
	import '@fontsource-variable/figtree';
	import fontLatin from '@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2?url';
	import '../app.css';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { cart } from '$lib/cart.svelte';
	import { wishlist } from '$lib/wishlist.svelte';
	import { ui } from '$lib/ui.svelte';
	import { getImageUrl } from '$lib/r2';
	import { site, perks, announcements, whatsappLink } from '$lib/site';
	import Icon from '$lib/components/Icon.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import SearchBox from '$lib/components/SearchBox.svelte';
	import CartDrawer from '$lib/components/CartDrawer.svelte';
	import CartToast from '$lib/components/CartToast.svelte';
	import type { Category } from '$lib/types';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	const subcategories = $derived(data.subcategoriesGrouped ?? {});
	const categories = $derived(data.categories ?? []);

	// Hide chrome on auth and admin pages
	const isAuthRoute = $derived(page.url.pathname.startsWith('/auth'));
	const isAdminRoute = $derived(page.url.pathname.startsWith('/admin'));
	const hideChrome = $derived(isAuthRoute || isAdminRoute);

	const firstName = $derived(data.customer?.name?.split(' ')[0] ?? '');
	const activeCategory = $derived(page.url.pathname === '/shop' ? page.url.searchParams.get('category') : null);
	const whatsapp = whatsappLink(`Hi ${site.name}, I would like to place an order.`);
	// Product pages have their own buy bar, so the chat bubble stays off them.
	const isProductRoute = $derived(page.url.pathname.startsWith('/products/'));
	// Checkout and confirmation already have their own WhatsApp step
	const hideChatBubble = $derived(isProductRoute || page.url.pathname === '/checkout' || page.url.pathname.startsWith('/order-confirmation/'));

	// ── Announcement rotation (mobile shows one at a time) ──
	let announcementIndex = $state(0);
	$effect(() => {
		const t = setInterval(() => (announcementIndex = (announcementIndex + 1) % announcements.length), 4500);
		return () => clearInterval(t);
	});

	// ── Mega menu ──
	let menuSlug = $state<string | null>(null);
	let menuTimer: ReturnType<typeof setTimeout> | undefined;
	const menuCategory = $derived(categories.find((c) => c.slug === menuSlug) ?? null);

	function openMenu(slug: string) {
		clearTimeout(menuTimer);
		menuTimer = setTimeout(() => (menuSlug = slug), menuSlug ? 0 : 120);
	}

	function closeMenu() {
		clearTimeout(menuTimer);
		menuTimer = setTimeout(() => (menuSlug = null), 160);
	}

	// ── Mobile menu + search sheet ──
	let mobileMenuOpen = $state(false);
	let mobileSearchOpen = $state(false);
	let expandedCategory = $state<string | null>(null);

	$effect(() => {
		if (!mobileMenuOpen && !mobileSearchOpen) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				mobileMenuOpen = false;
				mobileSearchOpen = false;
			}
		};
		window.addEventListener('keydown', onKey);
		return () => {
			document.body.style.overflow = previous;
			window.removeEventListener('keydown', onKey);
		};
	});

	afterNavigate(() => {
		menuSlug = null;
		mobileMenuOpen = false;
		mobileSearchOpen = false;
	});

	function categoryImage(cat: Category) {
		return cat.image_key ? getImageUrl(cat.image_key) : cat.icon || '/img/placeholder.svg';
	}

	function openCart(e: MouseEvent) {
		e.preventDefault();
		ui.openCart();
	}
</script>

<svelte:head>
	<link rel="preload" href={fontLatin} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

{#if hideChrome}
	{@render children()}
{:else}
	<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">Skip to content</a>

	<!-- ── Announcement bar ── -->
	<div class="bg-ink text-white">
		<div class="wrap flex h-9 items-center justify-center text-xs font-semibold">
			<p class="flex items-center gap-2 md:hidden" aria-live="polite">
				<Icon name="bolt-solid" class="size-3.5 text-sun" />
				{#key announcementIndex}
					<span class="animate-fade-in">{announcements[announcementIndex]}</span>
				{/key}
			</p>
			<ul class="hidden items-center gap-8 md:flex">
				{#each announcements as message}
					<li class="flex items-center gap-2">
						<Icon name="bolt-solid" class="size-3.5 text-sun" />
						{message}
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<!-- ── Header ── -->
	<header class="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/85">
		<div class="wrap flex h-16 items-center gap-2 lg:h-[72px] lg:gap-6">
			<button class="icon-btn -ml-2 lg:hidden" onclick={() => (mobileMenuOpen = true)} aria-label="Open menu" aria-expanded={mobileMenuOpen}>
				<Icon name="menu" class="size-6" />
			</button>

			<a href="/" class="shrink-0" aria-label="{site.name} home">
				<Logo />
			</a>

			<div class="mx-auto hidden w-full max-w-2xl md:block">
				<SearchBox id="search-desktop" {categories} />
			</div>

			<div class="ml-auto flex items-center gap-0.5 md:ml-0 lg:gap-1">
				<button class="icon-btn md:hidden" onclick={() => (mobileSearchOpen = true)} aria-label="Search">
					<Icon name="search" class="size-6" />
				</button>
				<a
					href={data.customer ? '/account' : '/auth/login'}
					class="hidden items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition hover:bg-surface sm:flex"
				>
					<span class="grid size-8 place-items-center rounded-full bg-surface">
						<Icon name="user" class="size-5" />
					</span>
					<span class="hidden text-left leading-tight lg:block">
						<span class="block text-2xs text-ink-subtle">{data.customer ? `Hi, ${firstName}` : 'Welcome'}</span>
						<span class="block text-sm font-bold">{data.customer ? 'My account' : 'Sign in'}</span>
					</span>
				</a>
				<a href="/account/wishlist" class="icon-btn hidden sm:inline-flex" aria-label="Wishlist">
					<Icon name="heart" class="size-6" />
					{#if !data.customer && wishlist.count > 0}
						<span class="count-dot">{wishlist.count}</span>
					{/if}
				</a>
				<a href="/cart" onclick={openCart} class="icon-btn" aria-label="Cart, {cart.count} item{cart.count === 1 ? '' : 's'}">
					<Icon name="bag" class="size-6" />
					{#if cart.count > 0}
						{#key cart.count}
							<span class="count-dot !bg-brand animate-pop">{cart.count}</span>
						{/key}
					{/if}
				</a>
			</div>
		</div>

		<!-- Desktop category nav -->
		<nav class="hidden border-t border-line lg:block" aria-label="Categories" onmouseleave={closeMenu}>
			<div class="wrap flex h-12 items-center">
				<ul class="flex items-center">
					{#each categories as cat}
						<li onmouseenter={() => openMenu(cat.slug)} class="h-12">
							<a
								href="/shop?category={cat.slug}"
								onfocus={() => openMenu(cat.slug)}
								class="relative flex h-12 items-center px-3 text-sm font-semibold transition-colors hover:text-brand {menuSlug === cat.slug || activeCategory === cat.slug ? 'text-brand' : 'text-ink'}"
								aria-haspopup="true"
								aria-expanded={menuSlug === cat.slug}
							>
								{cat.name}
								{#if menuSlug === cat.slug}
									<span class="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand"></span>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
				<div class="ml-auto hidden items-center gap-1 xl:flex" onmouseenter={closeMenu} role="presentation">
					<a href="/shop?sort=discount" class="flex h-9 items-center gap-1.5 rounded-full bg-deal-soft px-3.5 text-sm font-bold text-deal transition hover:bg-deal hover:text-white">
						<Icon name="fire" class="size-4" />
						Deals
					</a>
					<a href="/shop?sort=newest" class="flex h-9 items-center rounded-full px-3.5 text-sm font-bold hover:bg-surface">New in</a>
					<a href="/shop?sort=popular" class="flex h-9 items-center rounded-full px-3.5 text-sm font-bold hover:bg-surface">Best sellers</a>
				</div>
			</div>

			{#if menuCategory}
				<div
					class="absolute inset-x-0 top-full border-t border-line bg-white shadow-float animate-fade-in"
					onmouseenter={() => clearTimeout(menuTimer)}
					role="presentation"
				>
					<div class="wrap grid grid-cols-12 gap-10 py-8">
						<div class="col-span-8">
							<div class="flex items-baseline justify-between">
								<p class="h-block">{menuCategory.name}</p>
								<a href="/shop?category={menuCategory.slug}" class="link-arrow">
									Shop all {menuCategory.product_count ? `(${menuCategory.product_count})` : ''}
									<Icon name="arrow-right" class="size-4" stroke={2} />
								</a>
							</div>
							{#if menuCategory.description}
								<p class="mt-1 text-sm text-ink-muted">{menuCategory.description}</p>
							{/if}
							{#if subcategories[menuCategory.slug]?.length}
								<ul class="mt-5 grid grid-cols-3 gap-x-4 gap-y-1">
									{#each subcategories[menuCategory.slug] as sub}
										<li>
											<a
												href="/shop?category={menuCategory.slug}&subcategory={sub.slug}"
												class="group flex items-center justify-between rounded-xl px-3 py-2.5 text-base font-semibold transition hover:bg-surface"
											>
												<span class="group-hover:text-brand">{sub.name}</span>
												<Icon name="chevron-right" class="size-4 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-brand" />
											</a>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
						<a href="/shop?category={menuCategory.slug}" class="group relative col-span-4 aspect-[16/10] overflow-hidden rounded-2xl bg-surface">
							<img src={categoryImage(menuCategory)} alt="" class="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105" />
							<div class="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent"></div>
							<div class="absolute inset-x-0 bottom-0 p-5 text-white">
								<p class="h-card">Explore {menuCategory.name}</p>
								<span class="mt-2 inline-flex items-center gap-1 text-sm font-bold text-sun">
									Shop now <Icon name="arrow-right" class="size-4" stroke={2} />
								</span>
							</div>
						</a>
					</div>
				</div>
			{/if}
		</nav>
	</header>

	<!-- Mobile search row (scrolls away; the header search icon opens the sheet) -->
	<div class="border-b border-line bg-white md:hidden">
		<div class="wrap py-3">
			<SearchBox id="search-mobile" {categories} placeholder="Search gadgets…" />
		</div>
	</div>

	{#if mobileSearchOpen}
		<div class="fixed inset-0 z-[70] bg-white animate-fade-in md:hidden" role="dialog" aria-modal="true" aria-label="Search">
			<div class="wrap flex items-center gap-1 border-b border-line py-3">
				<button class="icon-btn -ml-2 shrink-0" onclick={() => (mobileSearchOpen = false)} aria-label="Close search">
					<Icon name="chevron-left" class="size-6" />
				</button>
				<SearchBox id="search-sheet" {categories} placeholder="Search gadgets…" autofocus />
			</div>
		</div>
	{/if}

	<!-- ── Mobile menu ── -->
	{#if mobileMenuOpen}
		<div class="fixed inset-0 z-[70] lg:hidden">
			<button class="absolute inset-0 bg-ink/50 animate-fade-in" aria-label="Close menu" tabindex="-1" onclick={() => (mobileMenuOpen = false)}></button>
			<div role="dialog" aria-modal="true" aria-label="Menu" class="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white shadow-float animate-drawer-left">
				<div class="flex items-center justify-between border-b border-line px-4 py-3">
					<a href="/" onclick={() => (mobileMenuOpen = false)}><Logo /></a>
					<button class="icon-btn -mr-1" onclick={() => (mobileMenuOpen = false)} aria-label="Close menu">
						<Icon name="close" stroke={2} />
					</button>
				</div>

				<div class="flex-1 overflow-y-auto">
					<div class="p-4">
						{#if data.customer}
							<a href="/account" class="flex items-center gap-3 rounded-2xl bg-surface p-3">
								<span class="grid size-10 place-items-center rounded-full bg-brand text-sm font-extrabold text-white">{firstName.charAt(0).toUpperCase()}</span>
								<span class="min-w-0 flex-1">
									<span class="block text-sm font-bold">Hi, {firstName}</span>
									<span class="block text-xs text-ink-muted">Orders, wishlist & account</span>
								</span>
								<Icon name="chevron-right" class="size-4 text-ink-subtle" />
							</a>
						{:else}
							<div class="grid grid-cols-2 gap-2">
								<a href="/auth/login" class="cta cta-dark cta-sm">Sign in</a>
								<a href="/auth/register" class="cta cta-line cta-sm">Create account</a>
							</div>
						{/if}

						<div class="mt-4 grid grid-cols-3 gap-2">
							<a href="/shop?sort=discount" class="flex flex-col items-center gap-1.5 rounded-2xl bg-deal-soft px-2 py-3 text-xs font-bold text-deal">
								<Icon name="fire" class="size-5" />
								Deals
							</a>
							<a href="/shop?sort=newest" class="flex flex-col items-center gap-1.5 rounded-2xl bg-surface px-2 py-3 text-xs font-bold">
								<Icon name="bolt" class="size-5" />
								New in
							</a>
							<a href="/account/wishlist" class="flex flex-col items-center gap-1.5 rounded-2xl bg-surface px-2 py-3 text-xs font-bold">
								<Icon name="heart" class="size-5" />
								Wishlist
							</a>
						</div>
					</div>

					<p class="label-caps px-5 pb-1">Shop by category</p>
					<ul class="px-2 pb-4">
						{#each categories as cat}
							{@const subs = subcategories[cat.slug] ?? []}
							<li>
								<div class="flex items-center">
									<a href="/shop?category={cat.slug}" class="flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5">
										<img src={categoryImage(cat)} alt="" class="size-10 rounded-lg object-cover" loading="lazy" />
										<span class="text-base font-semibold">{cat.name}</span>
									</a>
									{#if subs.length}
										<button
											class="icon-btn mr-1"
											onclick={() => (expandedCategory = expandedCategory === cat.slug ? null : cat.slug)}
											aria-expanded={expandedCategory === cat.slug}
											aria-label="Show {cat.name} subcategories"
										>
											<Icon name="chevron-down" class="size-4 transition {expandedCategory === cat.slug ? 'rotate-180' : ''}" stroke={2} />
										</button>
									{/if}
								</div>
								{#if expandedCategory === cat.slug}
									<ul class="mb-2 ml-[3.75rem] border-l border-line pl-2 animate-fade-in">
										{#each subs as sub}
											<li>
												<a href="/shop?category={cat.slug}&subcategory={sub.slug}" class="block rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-surface hover:text-ink">{sub.name}</a>
											</li>
										{/each}
									</ul>
								{/if}
							</li>
						{/each}
					</ul>
				</div>

				<div class="space-y-2 border-t border-line p-4 text-sm">
					<a href={site.phoneHref} class="flex items-center gap-2 font-semibold"><Icon name="phone" class="size-4 text-brand" /> {site.phone}</a>
					<a href="mailto:{site.email}" class="flex items-center gap-2 font-semibold"><Icon name="mail" class="size-4 text-brand" /> {site.email}</a>
					{#if data.customer}
						<form method="POST" action="/auth/logout">
							<button type="submit" class="flex items-center gap-2 font-semibold text-ink-muted hover:text-deal">
								<Icon name="logout" class="size-4" /> Sign out
							</button>
						</form>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<CartDrawer {categories} />
	<CartToast />

	{#if whatsapp && !hideChrome && !hideChatBubble}
		<a
			href={whatsapp}
			target="_blank"
			rel="noopener"
			aria-label="Chat with us on WhatsApp"
			title="Chat with us on WhatsApp"
			class="fixed right-4 z-40 grid size-14 place-items-center rounded-full bg-whatsapp text-white shadow-float transition-transform hover:scale-105 focus-visible:scale-105 bottom-[max(1rem,env(safe-area-inset-bottom))] sm:right-6 sm:bottom-6"
		>
			<Icon name="whatsapp" class="size-7" />
		</a>
	{/if}

	<main id="main" class="min-h-[60vh]">
		{@render children()}
	</main>

	<!-- ── Footer ── -->
	<footer class="bg-ink text-white">
		<div class="border-b border-white/10">
			<ul class="wrap grid grid-cols-2 gap-x-4 gap-y-6 py-10 lg:grid-cols-4">
				{#each perks as perk}
					<li class="flex items-start gap-3">
						<span class="icon-tile bg-brand-bright text-white">
							<Icon name={perk.icon} class="size-6" />
						</span>
						<span>
							<span class="block text-sm font-bold">{perk.title}</span>
							<span class="block text-xs text-white/70">{perk.text}</span>
						</span>
					</li>
				{/each}
			</ul>
		</div>

		<div class="wrap grid grid-cols-2 gap-x-6 gap-y-10 py-12 lg:grid-cols-12">
			<div class="col-span-2 lg:col-span-4">
				<Logo tone="dark" variant="inline" />
				<p class="mt-4 text-lg font-semibold text-brand-bright">{site.tagline}</p>
				<p class="mt-2 max-w-xs text-sm leading-relaxed text-white/70">Phones, laptops, audio, power and accessories — delivered across Uganda. Shop online, pay when it arrives.</p>
				<ul class="mt-6 space-y-2.5 text-sm">
					<li><a href={site.phoneHref} class="inline-flex items-center gap-2 font-semibold hover:text-brand-bright"><Icon name="phone" class="size-4 text-brand-bright" /> {site.phone}</a></li>
					<li><a href="mailto:{site.email}" class="inline-flex items-center gap-2 font-semibold hover:text-brand-bright"><Icon name="mail" class="size-4 text-brand-bright" /> {site.email}</a></li>
					{#if whatsapp}
						<li><a href={whatsapp} target="_blank" rel="noopener" class="inline-flex items-center gap-2 font-semibold hover:text-brand-bright"><Icon name="whatsapp" class="size-4 text-brand-bright" /> Chat on WhatsApp</a></li>
					{/if}
				</ul>
			</div>

			<div class="lg:col-span-3">
				<h3 class="label-caps text-white/50">Shop</h3>
				<ul class="mt-4 space-y-2.5 text-sm">
					{#each categories as cat}
						<li><a href="/shop?category={cat.slug}" class="text-white/70 hover:text-white">{cat.name}</a></li>
					{/each}
				</ul>
			</div>

			<div class="lg:col-span-2">
				<h3 class="label-caps text-white/50">Discover</h3>
				<ul class="mt-4 space-y-2.5 text-sm">
					<li><a href="/shop?sort=discount" class="text-white/70 hover:text-white">Deals</a></li>
					<li><a href="/shop?sort=newest" class="text-white/70 hover:text-white">New arrivals</a></li>
					<li><a href="/shop?sort=popular" class="text-white/70 hover:text-white">Best sellers</a></li>
					<li><a href="/shop" class="text-white/70 hover:text-white">All products</a></li>
				</ul>
			</div>

			<div class="lg:col-span-3">
				<h3 class="label-caps text-white/50">Account</h3>
				<ul class="mt-4 space-y-2.5 text-sm">
					{#if data.customer}
						<li><a href="/account" class="text-white/70 hover:text-white">My account</a></li>
					{:else}
						<li><a href="/auth/login" class="text-white/70 hover:text-white">Sign in</a></li>
						<li><a href="/auth/register" class="text-white/70 hover:text-white">Create account</a></li>
					{/if}
					<li><a href="/account" class="text-white/70 hover:text-white">Track my orders</a></li>
					<li><a href="/account/wishlist" class="text-white/70 hover:text-white">Wishlist</a></li>
					<li><a href="/cart" class="text-white/70 hover:text-white">Cart</a></li>
				</ul>
			</div>
		</div>

		<div class="border-t border-white/10">
			<div class="wrap flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/50 sm:flex-row">
				<p>&copy; {new Date().getFullYear()} {site.name}. All rights reserved. Prices in Ugandan shillings (UGX).</p>
				<p class="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 font-semibold text-white/70">
					<Icon name="cash" class="size-4 text-brand-bright" />
					Cash on delivery
				</p>
			</div>
		</div>
	</footer>
{/if}
