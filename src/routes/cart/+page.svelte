<script lang="ts">
import { cart } from '$lib/cart.svelte';
import { formatPrice } from '$lib/utils';
</script>

<svelte:head>
<title>Shopping Cart — Gadgets Store</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
<h1 class="text-2xl font-bold tracking-tight text-zinc-900 mb-8">Shopping Cart</h1>

{#if cart.items.length === 0}
<div class="card p-12 text-center">
<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 mb-4">
<svg class="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
</svg>
</div>
<h3 class="text-base font-semibold text-zinc-900 mb-1">Your cart is empty</h3>
<p class="text-sm text-zinc-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
<a href="/#products" class="btn btn-primary">Continue Shopping</a>
</div>
{:else}
<div class="lg:grid lg:grid-cols-12 lg:gap-8">
<!-- Cart Items -->
<div class="lg:col-span-8">
<div class="card divide-y divide-zinc-200 shadow-none">
{#each cart.items as item (item.productId)}
<div class="flex gap-4 p-4 sm:p-6">
<div class="h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 overflow-hidden rounded-sm bg-zinc-100">
{#if item.imageUrl}
<img src={item.imageUrl} alt={item.name} class="h-full w-full object-cover" />
{:else}
<div class="flex h-full w-full items-center justify-center">
<svg class="h-8 w-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5Z" />
</svg>
</div>
{/if}
</div>

<div class="flex flex-1 flex-col justify-between">
<div class="flex justify-between">
<div>
<a href="/products/{item.productId}" class="text-sm font-medium text-zinc-900 hover:text-orange-500 transition-colors">
{item.name}
</a>
<p class="mt-1 text-sm font-semibold text-zinc-900">{formatPrice(item.price)}</p>
</div>
<p class="text-sm font-bold text-zinc-900">{formatPrice(item.price * item.quantity)}</p>
</div>

<div class="mt-3 flex items-center justify-between">
<div class="flex items-center rounded-sm border border-zinc-200">
<button
onclick={() => cart.updateQuantity(item.productId, item.quantity - 1)}
class="flex h-8 w-8 items-center justify-center text-zinc-500 hover:text-orange-600 hover:bg-orange-50 rounded-l-lg transition-colors"
aria-label="Decrease quantity"
>
<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" /></svg>
</button>
<span class="flex h-8 w-8 items-center justify-center border-x border-zinc-200 text-sm font-medium text-zinc-900">{item.quantity}</span>
<button
onclick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
class="flex h-8 w-8 items-center justify-center text-zinc-500 hover:text-orange-600 hover:bg-orange-50 rounded-r-lg transition-colors"
aria-label="Increase quantity"
>
<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
</button>
</div>

<button
onclick={() => cart.removeItem(item.productId)}
class="text-sm text-zinc-400 hover:text-red-500 transition-colors"
>
Remove
</button>
</div>
</div>
</div>
{/each}
</div>
</div>

<!-- Order Summary -->
<div class="lg:col-span-4 mt-8 lg:mt-0">
<div class="card p-6 sticky top-24 border-none shadow-none bg-gradient-to-r from-orange-50/50 to-orange-50/50">
<h2 class="text-base font-semibold text-zinc-900 mb-4">Order Summary</h2>

<div class="space-y-3 text-sm">
<div class="flex justify-between text-zinc-600">
<span>Subtotal ({cart.count} items)</span>
<span class="font-medium text-zinc-900">{formatPrice(cart.total)}</span>
</div>
<div class="flex justify-between text-zinc-600">
<span>Shipping</span>
<span class="font-medium text-zinc-900">{cart.total >= 7500 ? 'Free' : formatPrice(500)}</span>
</div>
</div>

<div class="separator my-4"></div>

<div class="flex justify-between text-base font-bold text-zinc-900 mb-6">
<span>Total</span>
<span>{formatPrice(cart.total >= 7500 ? cart.total : cart.total + 500)}</span>
</div>

<a href="/checkout" class="btn text-white border-none bg-orange-500 hover:bg-orange-600 rounded-sm w-full h-11 font-semibold">
Proceed to Checkout
</a>

<a href="/#products" class="btn btn-ghost  w-full mt-2 rounded-sm text-orange-500 hover:text-orange-600 text-sm">
Continue Shopping
</a>
</div>
</div>
</div>
{/if}
</div>
