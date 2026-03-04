<script lang="ts">
import type { PageData } from './$types';
import { formatPrice } from '$lib/utils';

let { data }: { data: PageData } = $props();
</script>

<svelte:head>
<title>Dashboard — Admin</title>
</svelte:head>

<div class="p-4 lg:p-6 space-y-6">
	<!-- Page header -->
	<div>
		<h1 class="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
		<p class="text-sm text-zinc-500 mt-1">Welcome to your admin dashboard</p>
	</div>

	<!-- Stats grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
		<!-- Pending -->
		<div class="rounded-xs border border-zinc-200 bg-white p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<p class="text-sm font-medium text-zinc-500">Pending Orders</p>
				<div class="flex h-9 w-9 items-center justify-center rounded-xs bg-amber-50">
					<svg class="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
					</svg>
				</div>
			</div>
			<p class="mt-3 text-3xl font-bold text-zinc-900">{data.counts.pending}</p>
			<div class="mt-2 flex items-center gap-1.5">
				<span class="inline-flex items-center rounded-xs bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">Needs action</span>
			</div>
		</div>

		<!-- Confirmed -->
		<div class="rounded-xs border border-zinc-200 bg-white p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<p class="text-sm font-medium text-zinc-500">Confirmed</p>
				<div class="flex h-9 w-9 items-center justify-center rounded-xs bg-blue-50">
					<svg class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
					</svg>
				</div>
			</div>
			<p class="mt-3 text-3xl font-bold text-zinc-900">{data.counts.confirmed}</p>
			<div class="mt-2 flex items-center gap-1.5">
				<span class="inline-flex items-center rounded-xs bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700">Processing</span>
			</div>
		</div>

		<!-- Shipped -->
		<div class="rounded-xs border border-zinc-200 bg-white p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<p class="text-sm font-medium text-zinc-500">Shipped</p>
				<div class="flex h-9 w-9 items-center justify-center rounded-xs bg-purple-50">
					<svg class="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
					</svg>
				</div>
			</div>
			<p class="mt-3 text-3xl font-bold text-zinc-900">{data.counts.shipped}</p>
			<div class="mt-2 flex items-center gap-1.5">
				<span class="inline-flex items-center rounded-xs bg-purple-50 px-1.5 py-0.5 text-xs font-medium text-purple-700">In transit</span>
			</div>
		</div>

		<!-- Today -->
		<div class="rounded-xs border border-zinc-200 bg-white p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<p class="text-sm font-medium text-zinc-500">Today's Orders</p>
				<div class="flex h-9 w-9 items-center justify-center rounded-xs bg-emerald-50">
					<svg class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
					</svg>
				</div>
			</div>
			<p class="mt-3 text-3xl font-bold text-zinc-900">{data.counts.today}</p>
			<div class="mt-2 flex items-center gap-1.5">
				<span class="inline-flex items-center rounded-xs bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">Live</span>
			</div>
		</div>

		<!-- Customers -->
		<a href="/admin/customers" class="rounded-xs border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300 transition-colors group">
			<div class="flex items-center justify-between">
				<p class="text-sm font-medium text-zinc-500">Customers</p>
				<div class="flex h-9 w-9 items-center justify-center rounded-xs bg-indigo-50">
					<svg class="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
					</svg>
				</div>
			</div>
			<p class="mt-3 text-3xl font-bold text-zinc-900">{data.customerCount}</p>
			<div class="mt-2 flex items-center gap-1.5">
				<span class="inline-flex items-center rounded-xs bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-700">Registered</span>
				<span class="text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors">View &rarr;</span>
			</div>
		</a>

		<!-- Reviews -->
		<a href="/admin/reviews" class="rounded-xs border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300 transition-colors group">
			<div class="flex items-center justify-between">
				<p class="text-sm font-medium text-zinc-500">Reviews</p>
				<div class="flex h-9 w-9 items-center justify-center rounded-xs bg-orange-50">
					<svg class="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
					</svg>
				</div>
			</div>
			<p class="mt-3 text-3xl font-bold text-zinc-900">{data.reviewCount}</p>
			<div class="mt-2 flex items-center gap-1.5">
				<span class="inline-flex items-center rounded-xs bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-700">Total</span>
				<span class="text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors">Moderate &rarr;</span>
			</div>
		</a>
	</div>

	<!-- Two-column layout -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Low stock alerts -->
		<div class="lg:col-span-2 rounded-xs border border-zinc-200 bg-white shadow-sm">
			<div class="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
				<div>
					<h2 class="text-sm font-semibold text-zinc-900">Low Stock Alerts</h2>
					<p class="text-xs text-zinc-500 mt-0.5">{data.lowStock.length} products need attention</p>
				</div>
				<a href="/admin/products" class="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors">View all &rarr;</a>
			</div>
			{#if data.lowStock.length > 0}
				<div class="divide-y divide-zinc-50">
					{#each data.lowStock as product}
						<div class="flex items-center justify-between px-5 py-3 hover:bg-zinc-50/50 transition-colors">
							<div class="flex items-center gap-3">
								<div class="flex h-8 w-8 items-center justify-center rounded-xs {product.stock === 0 ? 'bg-red-50' : 'bg-amber-50'}">
									<svg class="h-4 w-4 {product.stock === 0 ? 'text-red-500' : 'text-amber-500'}" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
									</svg>
								</div>
								<a href="/admin/products/{product.id}/edit" class="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors">
									{product.name}
								</a>
							</div>
							<span class="inline-flex items-center rounded-xs px-2 py-0.5 text-xs font-semibold {product.stock === 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}">
								{product.stock === 0 ? 'Out of stock' : product.stock + ' left'}
							</span>
						</div>
					{/each}
				</div>
			{:else}
				<div class="p-8 text-center">
					<div class="flex h-10 w-10 items-center justify-center rounded-xsll bg-emerald-50 mx-auto mb-3">
						<svg class="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
						</svg>
					</div>
					<p class="text-sm text-zinc-500">All products are well stocked.</p>
				</div>
			{/if}
		</div>

		<!-- Quick actions card -->
		<div class="rounded-xs border border-zinc-200 bg-white shadow-sm">
			<div class="px-5 py-4 border-b border-zinc-100">
				<h2 class="text-sm font-semibold text-zinc-900">Quick Actions</h2>
				<p class="text-xs text-zinc-500 mt-0.5">Common tasks</p>
			</div>
			<div class="p-3 space-y-1">
				<a href="/admin/orders" class="flex items-center gap-3 rounded-xs px-3 py-3 hover:bg-zinc-50 transition-colors group">
					<div class="flex h-9 w-9 items-center justify-center rounded-xs bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
						<svg class="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium text-zinc-900">Manage Orders</p>
						<p class="text-xs text-zinc-500">View and update statuses</p>
					</div>
				</a>
				<a href="/admin/products/new" class="flex items-center gap-3 rounded-xs px-3 py-3 hover:bg-zinc-50 transition-colors group">
					<div class="flex h-9 w-9 items-center justify-center rounded-xs bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
						<svg class="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium text-zinc-900">Add Product</p>
						<p class="text-xs text-zinc-500">Create a new listing</p>
					</div>
				</a>
				<a href="/admin/products" class="flex items-center gap-3 rounded-xs px-3 py-3 hover:bg-zinc-50 transition-colors group">
					<div class="flex h-9 w-9 items-center justify-center rounded-xs bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
						<svg class="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium text-zinc-900">All Products</p>
						<p class="text-xs text-zinc-500">Manage your catalog</p>
					</div>
				</a>
				<a href="/admin/customers" class="flex items-center gap-3 rounded-xs px-3 py-3 hover:bg-zinc-50 transition-colors group">
					<div class="flex h-9 w-9 items-center justify-center rounded-xs bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
						<svg class="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium text-zinc-900">Customers <span class="text-zinc-400 font-normal">({data.customerCount})</span></p>
						<p class="text-xs text-zinc-500">View registered users</p>
					</div>
				</a>
				<a href="/admin/reviews" class="flex items-center gap-3 rounded-xs px-3 py-3 hover:bg-zinc-50 transition-colors group">
					<div class="flex h-9 w-9 items-center justify-center rounded-xs bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
						<svg class="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium text-zinc-900">Reviews <span class="text-zinc-400 font-normal">({data.reviewCount})</span></p>
						<p class="text-xs text-zinc-500">Moderate product reviews</p>
					</div>
				</a>
				<a href="/" target="_blank" class="flex items-center gap-3 rounded-xs px-3 py-3 hover:bg-zinc-50 transition-colors group">
					<div class="flex h-9 w-9 items-center justify-center rounded-xs bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
						<svg class="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium text-zinc-900">View Store</p>
						<p class="text-xs text-zinc-500">Open storefront</p>
					</div>
				</a>
			</div>
		</div>
	</div>
</div>
