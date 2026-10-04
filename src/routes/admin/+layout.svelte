<script lang="ts">
	import '../../app.css';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import Icon, { type IconName } from '$lib/components/Icon.svelte';
	import Logo from '$lib/components/Logo.svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let mobileNavOpen = $state(false);
	afterNavigate(() => (mobileNavOpen = false));

	type NavItem = { href: string; label: string; icon: IconName; badge?: number };

	const sections = $derived<{ title: string; items: NavItem[] }[]>([
		{
			title: 'Sell',
			items: [
				{ href: '/admin', label: 'Dashboard', icon: 'grid' },
				{ href: '/admin/orders', label: 'Orders', icon: 'bag', badge: data.pendingOrders },
				{ href: '/admin/customers', label: 'Customers', icon: 'users' },
				{ href: '/admin/reviews', label: 'Reviews', icon: 'star' }
			]
		},
		{
			title: 'Catalogue',
			items: [
				{ href: '/admin/products', label: 'Products', icon: 'package' },
				{ href: '/admin/categories', label: 'Categories', icon: 'tag' },
				{ href: '/admin/brands', label: 'Brands', icon: 'building' },
				{ href: '/admin/slides', label: 'Homepage slides', icon: 'image' }
			]
		},
		{
			title: 'Settings',
			items: [
				{ href: '/admin/account', label: 'Account', icon: 'user' },
				{ href: '/admin/security', label: 'Security log', icon: 'shield' }
			]
		}
	]);

	const allItems = $derived(sections.flatMap((s) => s.items));

	function isActive(href: string) {
		const p = page.url.pathname;
		return href === '/admin' ? p === '/admin' : p === href || p.startsWith(href + '/');
	}

	const current = $derived(allItems.find((i) => isActive(i.href)));

	// Breadcrumb from URL, using nav labels where we have them
	const breadcrumbs = $derived.by(() => {
		const parts = page.url.pathname.replace(/^\/admin/, '').split('/').filter(Boolean);
		const crumbs = [{ label: 'Dashboard', href: '/admin' }];
		let path = '/admin';
		for (const part of parts) {
			path += '/' + part;
			const known = allItems.find((i) => i.href === path);
			crumbs.push({ label: known?.label ?? part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '), href: path });
		}
		return crumbs;
	});

	const initial = $derived(data.admin?.email.charAt(0).toUpperCase() ?? '');
</script>

{#snippet nav()}
	<nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
		{#each sections as section}
			<p class="mb-1.5 mt-5 px-3 label-caps text-ink-subtle first:mt-0">{section.title}</p>
			<ul class="space-y-0.5">
				{#each section.items as item}
					{@const active = isActive(item.href)}
					<li>
						<a
							href={item.href}
							aria-current={active ? 'page' : undefined}
							class="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors
								{active ? 'bg-brand-soft text-brand-dark' : 'text-ink-muted hover:bg-surface hover:text-ink'}"
						>
							<Icon name={item.icon} class="size-[18px] shrink-0 {active ? 'text-brand' : ''}" stroke={active ? 2 : 1.75} />
							<span class="flex-1 truncate">{item.label}</span>
							{#if item.badge}
								<span class="rounded-full bg-deal px-1.5 py-px text-2xs font-bold tabular-nums text-white">{item.badge}</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{/each}

		<a href="/admin/products/new" class="cta cta-sm cta-brand mt-6 w-full shadow-none">
			<Icon name="plus" class="size-4" stroke={2.25} />
			Add product
		</a>
	</nav>

	<div class="border-t border-line p-3">
		<div class="flex items-center gap-3 rounded-lg px-2 py-1.5">
			<span class="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">{initial}</span>
			<a href="/admin/account" class="min-w-0 flex-1">
				<span class="block truncate text-sm font-semibold">{data.admin?.email}</span>
				<span class="block text-2xs text-ink-subtle">Administrator</span>
			</a>
			<form action="/admin/logout" method="POST">
				<button type="submit" class="icon-btn size-9 text-ink-subtle hover:text-deal" aria-label="Sign out" title="Sign out">
					<Icon name="logout" class="size-[18px]" />
				</button>
			</form>
		</div>
	</div>
{/snippet}

{#if data.admin}
	<div class="admin-ui min-h-screen bg-surface">
		<!-- Desktop sidebar -->
		<aside class="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-white lg:flex">
			<div class="flex h-16 items-center gap-2 border-b border-line px-5">
				<a href="/admin" aria-label="Admin dashboard"><Logo variant="stacked" /></a>
				<span class="ml-auto rounded-full bg-ink px-2 py-0.5 text-2xs font-bold uppercase tracking-[0.12em] text-white">Admin</span>
			</div>
			{@render nav()}
		</aside>

		<!-- Mobile drawer -->
		{#if mobileNavOpen}
			<div class="fixed inset-0 z-50 lg:hidden">
				<button class="absolute inset-0 bg-ink/50 backdrop-blur-[2px] animate-fade-in" aria-label="Close menu" tabindex="-1" onclick={() => (mobileNavOpen = false)}></button>
				<aside class="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-float">
					<div class="flex h-16 items-center justify-between border-b border-line px-4">
						<Logo variant="stacked" />
						<button class="icon-btn" onclick={() => (mobileNavOpen = false)} aria-label="Close menu">
							<Icon name="close" stroke={2} />
						</button>
					</div>
					{@render nav()}
				</aside>
			</div>
		{/if}

		<div class="flex min-h-screen flex-col lg:pl-64">
			<header class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-md lg:px-6">
				<button class="icon-btn -ml-2 lg:hidden" onclick={() => (mobileNavOpen = true)} aria-label="Open menu">
					<Icon name="menu" stroke={2} />
				</button>

				<span class="text-sm font-bold sm:hidden">{current?.label ?? 'Admin'}</span>

				<nav class="hidden items-center gap-1.5 text-sm sm:flex" aria-label="Breadcrumb">
					{#each breadcrumbs as crumb, i}
						{#if i > 0}<Icon name="chevron-right" class="size-3.5 text-ink-faint" stroke={2} />{/if}
						{#if i === breadcrumbs.length - 1}
							<span class="font-semibold">{crumb.label}</span>
						{:else}
							<a href={crumb.href} class="text-ink-muted hover:text-brand">{crumb.label}</a>
						{/if}
					{/each}
				</nav>

				<div class="flex-1"></div>

				{#if data.pendingOrders > 0}
					<a href="/admin/orders?status=pending" class="hidden items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1.5 text-xs font-bold text-warn-ink hover:bg-warn/20 md:inline-flex">
						<Icon name="clock" class="size-4" stroke={2} />
						{data.pendingOrders} to confirm
					</a>
				{/if}
				<a href="/" target="_blank" rel="noopener" class="cta cta-sm cta-line">
					<span class="hidden sm:inline">View store</span>
					<Icon name="external" class="size-4" stroke={2} />
				</a>
			</header>

			<main class="flex-1">
				{@render children()}
			</main>

			<footer class="px-6 py-4 text-2xs text-ink-subtle">OJ's Online Store admin · © {new Date().getFullYear()}</footer>
		</div>
	</div>
{:else}
	{@render children()}
{/if}
