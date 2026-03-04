<script lang="ts">
import type { PageData, ActionData } from './$types';
import { formatPrice } from '$lib/utils';
import { getImageUrl } from '$lib/r2';
import { enhance } from '$app/forms';

let { data, form }: { data: PageData; form: ActionData } = $props();

const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
</script>

<svelte:head>
<title>Order #{data.order.id} — Admin</title>
</svelte:head>

<div class="p-6 lg:p-8">
<div class="flex items-center gap-3 mb-6">
<a href="/admin/orders" aria-label="Back to orders" class="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 hover:bg-zinc-50 transition-colors">
<svg class="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
</svg>
</a>
<h1 class="text-xl font-bold tracking-tight text-zinc-900">Order #{data.order.id}</h1>
<span class="badge {data.order.status === 'delivered' ? 'badge-success' : data.order.status === 'shipped' ? 'badge-info' : data.order.status === 'cancelled' ? 'badge-destructive' : 'badge-warning'}">
{data.order.status.charAt(0).toUpperCase() + data.order.status.slice(1)}
</span>
</div>

{#if form?.success}
<div class="alert alert-success mb-6">Status updated successfully.</div>
{/if}

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
<!-- Left column -->
<div class="lg:col-span-2 space-y-6">
<!-- Items -->
<div class="card">
<div class="px-5 py-4 border-b border-zinc-200">
<h2 class="text-sm font-semibold text-zinc-900">Order Items</h2>
</div>
<div class="divide-y divide-zinc-100">
{#each data.items as item}
<div class="flex gap-4 p-5">
<div class="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 border border-zinc-200">
{#if item.product_image_key}
<img src={getImageUrl(item.product_image_key)} alt={item.product_name} class="h-full w-full object-cover" />
{:else}
<div class="h-full w-full bg-zinc-100"></div>
{/if}
</div>
<div class="flex-1 min-w-0">
<p class="text-sm font-medium text-zinc-900">{item.product_name}</p>
<p class="text-xs text-zinc-500 mt-0.5">Qty: {item.quantity} × {formatPrice(item.price_at_purchase)}</p>
</div>
<p class="text-sm font-semibold text-zinc-900">{formatPrice(item.price_at_purchase * item.quantity)}</p>
</div>
{/each}
</div>
<div class="bg-zinc-50 px-5 py-3 rounded-b-xl flex justify-between text-sm font-bold text-zinc-900">
<span>Total</span>
<span>{formatPrice(data.order.total)}</span>
</div>
</div>

<!-- Customer Info -->
<div class="card p-5">
<h2 class="text-sm font-semibold text-zinc-900 mb-3">Customer</h2>
<div class="grid grid-cols-2 gap-4 text-sm">
<div>
<p class="text-zinc-500">Name</p>
<p class="font-medium text-zinc-900">{data.order.name}</p>
</div>
<div>
<p class="text-zinc-500">Email</p>
<p class="font-medium text-zinc-900">{data.order.email}</p>
</div>
<div>
<p class="text-zinc-500">Phone</p>
<p class="font-medium text-zinc-900">{data.order.phone}</p>
</div>
<div>
<p class="text-zinc-500">Address</p>
<p class="font-medium text-zinc-900">{data.address.street}, {data.address.city}, {data.address.state}</p>
</div>
</div>
</div>
</div>

<!-- Right column -->
<div class="space-y-6">
<!-- Update Status -->
<div class="card p-5">
<h2 class="text-sm font-semibold text-zinc-900 mb-3">Update Status</h2>
<form method="POST" action="?/updateStatus" use:enhance>
<div class="space-y-3">
<select name="status" class="select-input w-full">
{#each statuses as s}
<option value={s} selected={data.order.status === s}>
{s.charAt(0).toUpperCase() + s.slice(1)}
</option>
{/each}
</select>
<button type="submit" class="btn btn-primary w-full">Update Status</button>
</div>
</form>
</div>

<!-- Order Info -->
<div class="card p-5">
<h2 class="text-sm font-semibold text-zinc-900 mb-3">Order Info</h2>
<div class="space-y-2.5 text-sm">
<div class="flex justify-between">
<span class="text-zinc-500">Order ID</span>
<span class="font-medium text-zinc-900">#{data.order.id}</span>
</div>
<div class="flex justify-between">
<span class="text-zinc-500">Date</span>
<span class="font-medium text-zinc-900">{new Date(data.order.created_at).toLocaleDateString()}</span>
</div>
<div class="flex justify-between">
<span class="text-zinc-500">Payment</span>
<span class="font-medium text-zinc-900">Cash on Delivery</span>
</div>
{#if data.order.notes}
<div class="separator"></div>
<div>
<p class="text-zinc-500 mb-1">Notes</p>
<p class="text-zinc-900">{data.order.notes}</p>
</div>
{/if}
</div>
</div>
</div>
</div>
</div>
