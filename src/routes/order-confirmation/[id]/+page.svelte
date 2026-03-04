<script lang="ts">
import type { PageData } from './$types';
import { formatPrice } from '$lib/utils';
import { getImageUrl } from '$lib/r2';
import { cart } from '$lib/cart.svelte';
import { onMount } from 'svelte';

let { data }: { data: PageData } = $props();

onMount(() => {
cart.clear();
});
</script>

<svelte:head>
<title>Order Confirmed — Gadgets Store</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
<div class="text-center mb-10">
<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-5">
<svg class="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
</svg>
</div>
<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-2">Order Confirmed!</h1>
<p class="text-sm text-zinc-500">Order #{data.order.id} — We've sent a confirmation email to your inbox.</p>
</div>

<div class="card">
<div class="p-6 border-b border-zinc-200">
<div class="flex items-center justify-between">
<div>
<p class="text-xs text-zinc-500 mb-0.5">Order Number</p>
<p class="text-sm font-semibold text-zinc-900">#{data.order.id}</p>
</div>
<span class="badge badge-warning">
{data.order.status.charAt(0).toUpperCase() + data.order.status.slice(1)}
</span>
</div>
</div>

<div class="divide-y divide-zinc-100">
{#each data.items as item}
<div class="flex gap-4 p-6">
<div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 border border-zinc-200">
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

<div class="bg-zinc-50 px-6 py-4 rounded-b-xl">
<div class="flex justify-between text-base font-bold text-zinc-900">
<span>Total</span>
<span>{formatPrice(data.order.total)}</span>
</div>
<p class="text-xs text-zinc-500 mt-1">Payment: Cash on Delivery</p>
</div>
</div>

<div class="card p-6 mt-6">
<h2 class="text-sm font-semibold text-zinc-900 mb-3">Delivery Address</h2>
<p class="text-sm text-zinc-600 leading-relaxed">
{data.order.name}<br>
{data.address.street}<br>
{data.address.city}, {data.address.state}<br>
{data.order.phone}
</p>
</div>

<div class="flex flex-col sm:flex-row gap-3 mt-8">
{#if data.order.customer_id}
<a href="/account" class="btn btn-primary flex-1">View My Orders</a>
{/if}
<a href="/" class="btn btn-outline flex-1">Continue Shopping</a>
</div>
</div>
