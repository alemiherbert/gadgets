<script lang="ts">
import '../../app.css';
import type { LayoutData } from './$types';
import { page } from '$app/state';

let { data, children }: { data: LayoutData; children: any } = $props();

let sidebarCollapsed = $state(false);
let mobileSidebarOpen = $state(false);

const mainNav = [
	{ href: '/admin', label: 'Dashboard', icon: 'grid', match: (p: string) => p === '/admin' },
	{ href: '/admin/orders', label: 'Orders', icon: 'shopping-bag', match: (p: string) => p.startsWith('/admin/orders') },
	{ href: '/admin/products', label: 'Products', icon: 'package', match: (p: string) => p.startsWith('/admin/products') },
	{ href: '/admin/categories', label: 'Categories', icon: 'tag', match: (p: string) => p.startsWith('/admin/categories') },
	{ href: '/admin/customers', label: 'Customers', icon: 'users', match: (p: string) => p.startsWith('/admin/customers') },
	{ href: '/admin/reviews', label: 'Reviews', icon: 'star', match: (p: string) => p.startsWith('/admin/reviews') },
	{ href: '/admin/slides', label: 'Slides', icon: 'slides', match: (p: string) => p.startsWith('/admin/slides') },
];

function isActive(item: typeof mainNav[0]) {
	return item.match(page.url.pathname);
}

// Breadcrumb from URL
const breadcrumbs = $derived.by(() => {
	const parts = page.url.pathname.replace('/admin', '').split('/').filter(Boolean);
	const crumbs = [{ label: 'Dashboard', href: '/admin' }];
	let path = '/admin';
	for (const part of parts) {
		path += '/' + part;
		crumbs.push({ label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '), href: path });
	}
	return crumbs;
});
</script>

{#if data.admin}
<div class="flex min-h-screen bg-zinc-50/50">
	<!-- Desktop sidebar -->
	<aside
		class="hidden lg:flex flex-col fixed inset-y-0 z-40 border-r border-zinc-200/80 bg-white transition-all duration-300 {sidebarCollapsed ? 'w-16' : 'w-60'}"
	>
		<!-- Logo area -->
		<div class="flex h-14 items-center gap-2.5 px-4 border-b border-zinc-100">
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-sm">
				<span class="text-sm font-bold text-white">G</span>
			</div>
			{#if !sidebarCollapsed}
				<div class="flex flex-col min-w-0">
					<span class="text-sm font-semibold text-zinc-900 truncate">Gadgets</span>
					<span class="text-[10px] text-zinc-400 leading-none">Admin Panel</span>
				</div>
			{/if}
		</div>

		<!-- Collapse toggle -->
		<button
			onclick={() => sidebarCollapsed = !sidebarCollapsed}
			class="absolute -right-3 top-18 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 transition-colors cursor-pointer"
			aria-label="Toggle sidebar"
		>
			<svg class="h-3 w-3 text-zinc-500 transition-transform {sidebarCollapsed ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
			</svg>
		</button>

		<!-- Navigation -->
		<nav class="flex-1 overflow-y-auto px-3 py-4">
			{#if !sidebarCollapsed}
				<p class="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Main</p>
			{/if}
			<ul class="space-y-0.5">
				{#each mainNav as item}
					<li>
						<a
							href={item.href}
							class="group flex items-center gap-3 rounded-xs px-3 py-2 text-sm font-medium transition-all duration-150
								{isActive(item)
									? 'bg-zinc-900 text-white shadow-sm'
									: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}"
							title={sidebarCollapsed ? item.label : undefined}
						>
							{#if item.icon === 'grid'}
								<svg class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
								</svg>
							{:else if item.icon === 'shopping-bag'}
								<svg class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
								</svg>
							{:else if item.icon === 'package'}
								<svg class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
								</svg>
							{:else if item.icon === 'tag'}
								<svg class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
								</svg>
							{:else if item.icon === 'slides'}
								<svg class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
								</svg>
							{:else if item.icon === 'users'}
								<svg class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
								</svg>
							{:else if item.icon === 'star'}
								<svg class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
								</svg>
							{/if}
							{#if !sidebarCollapsed}
								<span>{item.label}</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>

			{#if !sidebarCollapsed}
				<div class="my-4 h-px bg-zinc-100"></div>
				<p class="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Quick Actions</p>
			{/if}
			<ul class="space-y-0.5">
				<li>
					<a
						href="/admin/products/new"
						class="group flex items-center gap-3 rounded-xs px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all duration-150"
						title={sidebarCollapsed ? 'Add Product' : undefined}
					>
						<svg class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
						</svg>
						{#if !sidebarCollapsed}<span>Add Product</span>{/if}
					</a>
				</li>
				<li>
					<a
						href="/"
						target="_blank"
						class="group flex items-center gap-3 rounded-xs px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all duration-150"
						title={sidebarCollapsed ? 'View Store' : undefined}
					>
						<svg class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
						</svg>
						{#if !sidebarCollapsed}<span>View Store</span>{/if}
					</a>
				</li>
			</ul>
		</nav>

		<!-- User footer -->
		<div class="border-t border-zinc-100 p-3">
			<div class="flex items-center gap-3 rounded-xs px-2 py-2 {sidebarCollapsed ? 'justify-center' : ''}">
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 text-xs font-semibold text-zinc-700">
					{data.admin.email.charAt(0).toUpperCase()}
				</div>
				{#if !sidebarCollapsed}
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-zinc-900 truncate">{data.admin.email}</p>
						<p class="text-[10px] text-zinc-400">Administrator</p>
					</div>
					<form action="/admin/logout" method="POST">
						<button type="submit" class="flex h-7 w-7 items-center justify-center rounded-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer" aria-label="Sign out" title="Sign out">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
							</svg>
						</button>
					</form>
				{/if}
			</div>
		</div>
	</aside>

	<!-- Mobile overlay -->
	{#if mobileSidebarOpen}
		<div class="fixed inset-0 bg-black/40 z-40 lg:hidden" onclick={() => mobileSidebarOpen = false} aria-hidden="true"></div>
	{/if}

	<!-- Mobile sidebar -->
	<aside
		class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 shadow-xl transform transition-transform duration-300 lg:hidden
			{mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
	>
		<div class="flex h-14 items-center justify-between px-4 border-b border-zinc-100">
			<div class="flex items-center gap-2.5">
				<div class="flex h-8 w-8 items-center justify-center rounded-xs bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-sm">
					<span class="text-sm font-bold text-white">G</span>
				</div>
				<div class="flex flex-col">
					<span class="text-sm font-semibold text-zinc-900">Gadgets</span>
					<span class="text-[10px] text-zinc-400 leading-none">Admin Panel</span>
				</div>
			</div>
			<button onclick={() => mobileSidebarOpen = false} class="flex h-8 w-8 items-center justify-center rounded-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer" aria-label="Close sidebar">
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
		<nav class="flex-1 overflow-y-auto px-3 py-4">
			<p class="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Main</p>
			<ul class="space-y-0.5">
				{#each mainNav as item}
					<li>
						<a
							href={item.href}
							onclick={() => mobileSidebarOpen = false}
							class="group flex items-center gap-3 rounded-xs px-3 py-2.5 text-sm font-medium transition-all
								{isActive(item)
									? 'bg-zinc-900 text-white shadow-sm'
									: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}"
						>
							{#if item.icon === 'grid'}
								<svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
								</svg>
							{:else if item.icon === 'shopping-bag'}
								<svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
								</svg>
							{:else if item.icon === 'package'}
								<svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
								</svg>
							{:else if item.icon === 'tag'}
								<svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
								</svg>
							{:else if item.icon === 'slides'}
								<svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
								</svg>
							{:else if item.icon === 'users'}
								<svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
								</svg>
							{:else if item.icon === 'star'}
								<svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
								</svg>
							{/if}
							<span>{item.label}</span>
						</a>
					</li>
				{/each}
			</ul>
			<div class="my-4 h-px bg-zinc-100"></div>
			<p class="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Quick Actions</p>
			<ul class="space-y-0.5">
				<li>
					<a href="/admin/products/new" onclick={() => mobileSidebarOpen = false} class="group flex items-center gap-3 rounded-xs px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all">
						<svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
						</svg>
						<span>Add Product</span>
					</a>
				</li>
				<li>
					<a href="/" target="_blank" class="group flex items-center gap-3 rounded-xs px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all">
						<svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
						</svg>
						<span>View Store</span>
					</a>
				</li>
			</ul>
		</nav>
		<div class="border-t border-zinc-100 p-3">
			<div class="flex items-center gap-3 px-2 py-2">
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 text-xs font-semibold text-zinc-700">
					{data.admin.email.charAt(0).toUpperCase()}
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-zinc-900 truncate">{data.admin.email}</p>
					<p class="text-[10px] text-zinc-400">Administrator</p>
				</div>
				<form action="/admin/logout" method="POST">
					<button type="submit" class="flex h-7 w-7 items-center justify-center rounded-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer" aria-label="Sign out">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
						</svg>
					</button>
				</form>
			</div>
		</div>
	</aside>

	<!-- Main content area -->
	<div class="flex-1 flex flex-col min-h-screen {sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-60'} transition-all duration-300">
		<!-- Top header bar -->
		<header class="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-4 lg:px-6">
			<!-- Mobile hamburger -->
			<button
				onclick={() => mobileSidebarOpen = true}
				class="flex h-8 w-8 items-center justify-center rounded-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 lg:hidden cursor-pointer"
				aria-label="Open menu"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
				</svg>
			</button>

			<!-- Breadcrumbs -->
			<nav class="hidden sm:flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
				{#each breadcrumbs as crumb, i}
					{#if i > 0}
						<svg class="h-3.5 w-3.5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
						</svg>
					{/if}
					{#if i === breadcrumbs.length - 1}
						<span class="font-medium text-zinc-900">{crumb.label}</span>
					{:else}
						<a href={crumb.href} class="text-zinc-500 hover:text-zinc-700 transition-colors">{crumb.label}</a>
					{/if}
				{/each}
			</nav>

			<div class="flex-1"></div>

			<!-- Header right actions -->
			<a
				href="/"
				target="_blank"
				class="hidden sm:inline-flex items-center gap-1.5 rounded-xs border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
			>
				<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
				</svg>
				View Store
			</a>

			<!-- User avatar menu -->
			<div class="flex items-center gap-2 pl-2 border-l border-zinc-200">
				<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 text-xs font-semibold text-zinc-700">
					{data.admin.email.charAt(0).toUpperCase()}
				</div>
			</div>
		</header>

		<!-- Page content -->
		<main class="flex-1">
			{@render children()}
		</main>

		<!-- Footer -->
		<footer class="border-t border-zinc-100 px-6 py-3">
			<p class="text-[11px] text-zinc-400">Gadgets Admin &middot; &copy; {new Date().getFullYear()}</p>
		</footer>
	</div>
</div>
{:else}
{@render children()}
{/if}
