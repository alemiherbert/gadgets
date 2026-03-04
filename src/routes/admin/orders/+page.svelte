<script lang="ts">
import type { PageData } from './$types';
import { formatPrice } from '$lib/utils';

let { data }: { data: PageData } = $props();

const statuses = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
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
href="/admin/orders{s === 'all' ? '' : '?status=' + s}"
class="badge cursor-pointer transition-colors
{data.currentStatus === s ? 'bg-zinc-900 text-white border-zinc-900' : 'badge-outline hover:bg-zinc-50'}"
>
{s.charAt(0).toUpperCase() + s.slice(1)}
</a>
{/each}
</div>

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
{/if}
</div>
