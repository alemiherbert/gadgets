<script lang="ts">
import type { PageData } from './$types';
import { formatPrice } from '$lib/utils';

let { data }: { data: PageData } = $props();

const statuses = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

function statusHref(status: string) {
	const params = new URLSearchParams();
	if (status !== 'all') params.set('status', status);
	if (data.q) params.set('q', data.q);
	const query = params.toString();
	return `/admin/orders${query ? `?${query}` : ''}`;
}

function pageHref(nextPage: number) {
	const params = new URLSearchParams();
	if (data.currentStatus !== 'all') params.set('status', data.currentStatus);
	if (data.q) params.set('q', data.q);
	if (nextPage > 1) params.set('page', String(nextPage));
	const query = params.toString();
	return `/admin/orders${query ? `?${query}` : ''}`;
}
</script>

<svelte:head>
<title>Orders — Admin</title>
</svelte:head>

<div class="p-6 lg:p-8">
<div class="flex items-center justify-between mb-6">
<h1 class="text-xl font-bold tracking-tight text-zinc-900">Orders</h1>
</div>

<!-- Filters -->
<div class="flex flex-wrap gap-2 mb-6">
{#each statuses as s}
<a
href={statusHref(s)}
class="badge cursor-pointer transition-colors
{data.currentStatus === s ? 'bg-zinc-900 text-white border-zinc-900' : 'badge-outline hover:bg-zinc-50'}"
>
{s.charAt(0).toUpperCase() + s.slice(1)}
</a>
{/each}
</div>

<form method="GET" action="/admin/orders" class="mb-4">
<input type="hidden" name="status" value={data.currentStatus} />
<div class="flex items-center gap-2">
<input name="q" value={data.q} type="search" placeholder="Search by order #, customer, email, or phone" class="input input-sm w-full max-w-md" />
<button type="submit" class="btn btn-sm btn-outline">Search</button>
{#if data.q}
<a href={statusHref(data.currentStatus)} class="btn btn-sm btn-ghost">Clear</a>
{/if}
</div>
</form>

<p class="text-xs text-zinc-500 mb-4">Showing {data.orders.length} of {data.total} result{data.total !== 1 ? 's' : ''}</p>

{#if data.orders.length === 0}
<div class="card p-8 text-center">
<p class="text-sm text-zinc-500">No orders found.</p>
</div>
{:else}
<div class="card overflow-hidden">
<div class="overflow-x-auto">
<table class="w-full text-sm">
<thead>
<tr class="border-b border-zinc-200 bg-zinc-50">
<th class="px-4 py-3 text-left font-medium text-zinc-500">Order</th>
<th class="px-4 py-3 text-left font-medium text-zinc-500">Customer</th>
<th class="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
<th class="px-4 py-3 text-right font-medium text-zinc-500">Total</th>
<th class="px-4 py-3 text-left font-medium text-zinc-500">Date</th>
<th class="px-4 py-3"></th>
</tr>
</thead>
<tbody class="divide-y divide-zinc-100">
{#each data.orders as order}
<tr class="hover:bg-zinc-50 transition-colors">
<td class="px-4 py-3 font-medium text-zinc-900">#{order.id}</td>
<td class="px-4 py-3">
<p class="text-zinc-900">{order.name}</p>
<p class="text-xs text-zinc-500">{order.email}</p>
</td>
<td class="px-4 py-3">
<span class="badge {order.status === 'delivered' ? 'badge-success' : order.status === 'shipped' ? 'badge-info' : order.status === 'cancelled' ? 'badge-destructive' : 'badge-warning'}">
{order.status.charAt(0).toUpperCase() + order.status.slice(1)}
</span>
</td>
<td class="px-4 py-3 text-right font-medium">{formatPrice(order.total)}</td>
<td class="px-4 py-3 text-zinc-500">{new Date(order.created_at).toLocaleDateString()}</td>
<td class="px-4 py-3">
<a href="/admin/orders/{order.id}" class="text-zinc-400 hover:text-zinc-900 transition-colors" aria-label="View order {order.id}">
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
</svg>
</a>
</td>
</tr>
{/each}
</tbody>
</table>
</div>
</div>

{#if data.totalPages > 1}
<div class="mt-4 flex items-center justify-between text-sm">
<span class="text-zinc-500">Page {data.page} of {data.totalPages}</span>
<div class="flex gap-2">
<a href={pageHref(Math.max(1, data.page - 1))} class="btn btn-xs btn-outline" aria-disabled={data.page <= 1}>Previous</a>
<a href={pageHref(Math.min(data.totalPages, data.page + 1))} class="btn btn-xs btn-outline" aria-disabled={data.page >= data.totalPages}>Next</a>
</div>
</div>
{/if}
{/if}
</div>
