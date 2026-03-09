<script lang="ts">
import type { PageData } from './$types';
import { formatPrice } from '$lib/utils';

let { data }: { data: PageData } = $props();
</script>

<svelte:head>
<title>My Account — Gadgets Store</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
<div class="flex items-center justify-between mb-8">
<div>
<h1 class="text-2xl font-bold tracking-tight text-zinc-900">My Account</h1>
<p class="text-sm text-zinc-500 mt-1">Welcome back, {data.customer.name}</p>
</div>
<form method="POST" action="/auth/logout">
<button type="submit" class="btn btn-sm bg-orange-500 hover:bg-orange-600 text-white border-none rounded-sm">Sign Out</button>
</form>
</div>

<!-- Account Info -->
<div class="card p-6 mb-8">
<h2 class="text-sm font-semibold text-zinc-900 mb-3">Account Details</h2>
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
<div>
<p class="text-zinc-500">Name</p>
<p class="font-medium text-zinc-900">{data.customer.name}</p>
</div>
<div>
<p class="text-zinc-500">Email</p>
<p class="font-medium text-zinc-900">{data.customer.email}</p>
</div>

<div class="mt-4">
<a href="/account/wishlist" class="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-500 transition-colors">
	<svg class="h-4 w-4" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" fill="none">
		<path stroke-linecap="round" stroke-linejoin="round" d="m12 21-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"/>
	</svg>
	View Wishlist
</a>
</div>
</div>
</div>

<!-- Order History -->
<h2 class="text-lg font-semibold text-zinc-900 mb-4">Order History</h2>

{#if data.orders.length === 0}
<div class="card p-8 text-center">
<p class="text-sm text-zinc-500">You haven't placed any orders yet.</p>
<a href="/shop" class="btn bg-orange-500 hover:bg-orange-600 text-white border-none rounded-sm mt-4">Start Shopping</a>
</div>
{:else}
<div class="space-y-4">
{#each data.orders as order}
<a href="/order-confirmation/{order.id}" class="card block p-5 hover:shadow-md transition-shadow">
<div class="flex flex-wrap items-center justify-between gap-4">
<div class="flex items-center gap-4">
<div>
<p class="text-sm font-semibold text-zinc-900">Order #{order.id}</p>
<p class="text-xs text-zinc-500 mt-0.5">{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
</div>
</div>
<div class="flex items-center gap-4">
<span class="badge {order.status === 'delivered' ? 'badge-success' : order.status === 'shipped' ? 'badge-info' : order.status === 'cancelled' ? 'badge-destructive' : 'badge-warning'}">
{order.status.charAt(0).toUpperCase() + order.status.slice(1)}
</span>
<p class="text-sm font-bold text-zinc-900">{formatPrice(order.total)}</p>
<svg class="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
</svg>
</div>
</div>
</a>
{/each}
</div>
{/if}
</div>
