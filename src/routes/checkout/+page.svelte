<script lang="ts">
import type { PageData, ActionData } from './$types';
import { cart } from '$lib/cart.svelte';
import { formatPrice } from '$lib/utils';
import { enhance } from '$app/forms';

let { data, form }: { data: PageData; form: ActionData } = $props();
let submitting = $state(false);
let cityValue = $state('');
let kampalaShipping = $derived(cityValue.trim().toLowerCase() === 'kampala');
</script>

<svelte:head>
<title>Checkout — Gadgets Store</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
<h1 class="text-2xl font-bold tracking-tight text-slate-900 mb-8">Checkout</h1>

{#if form?.error}
<div class="rounded-sm bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">
{form.error}
</div>
{/if}

{#if cart.items.length === 0}
<div class="card p-12 text-center">
<h3 class="text-base font-semibold text-slate-900 mb-1">Your cart is empty</h3>
<p class="text-sm text-slate-500 mb-6">Add items to your cart before checking out.</p>
<a href="/#products" class="btn btn-primary">Browse Products</a>
</div>
{:else}
<form
method="POST"
use:enhance={() => {
submitting = true;
return async ({ update }) => {
submitting = false;
await update();
};
}}
>
<input type="hidden" name="cart" value={JSON.stringify(cart.items.map(i => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity, imageUrl: i.imageUrl })))} />

<div class="lg:grid lg:grid-cols-12 lg:gap-8">
<!-- Form Section -->
<div class="lg:col-span-7 space-y-6">
<!-- Contact Information -->
<div class="card p-6 shadow-none">
<h2 class="text-base font-semibold text-slate-900 mb-4">Contact Information</h2>
{#if data.customer}
<p class="text-sm text-slate-600 mb-3">
Logged in as <span class="font-medium text-slate-900">{data.customer.email}</span>
</p>
{/if}
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
<div class="form-group">
<label for="name" class="label text-orange-600">Full Name</label>
<input id="name" name="name" type="text" required minlength="2" value={data.customer?.name ?? ''} class="input" placeholder="John Doe" />
</div>
<div class="form-group">
<label for="email" class="label text-orange-600">Email</label>
<input id="email" name="email" type="email" required value={data.customer?.email ?? ''} class="input" placeholder="john@example.com" />
</div>
<div class="form-group sm:col-span-2">
<label for="phone" class="label text-orange-600">Phone Number</label>
<input id="phone" name="phone" type="tel" required pattern={"^(\\+?256|0)[3-9]\\d{8}$"} title="Ugandan phone number, e.g. 0771234567 or +256771234567" class="input" placeholder="0771234567" />
<p class="text-xs text-slate-400 mt-1">Format: 07XXXXXXXX or +2567XXXXXXXX</p>
</div>
</div>
</div>

<!-- Delivery Address -->
<div class="card p-6 shadow-none">
<h2 class="text-base font-semibold text-slate-900 mb-4">Delivery Address</h2>
<div class="space-y-4">
<div class="form-group">
<label for="street" class="label text-orange-600">Street Address</label>
<input id="street" name="street" type="text" required minlength="3" class="input" placeholder="Plot 12, Kampala Rd" />
</div>
<div class="grid grid-cols-2 gap-4">
<div class="form-group">
<label for="city" class="label text-orange-600">City / Town</label>
<input id="city" name="city" type="text" required minlength="2" class="input" placeholder="Kampala" bind:value={cityValue} />
</div>
<div class="form-group">
<label for="state" class="label text-orange-600">District</label>
<input id="state" name="state" type="text" required minlength="2" class="input" placeholder="Kampala" />
</div>
</div>
</div>
</div>

<!-- Payment Info -->
<div class="card p-6 shadow-none">
<h2 class="text-base font-semibold text-slate-900 mb-3">Payment Method</h2>
<div class="flex items-center gap-3 rounded-sm border border-slate-200 bg-slate-50 p-4">
<div class="flex h-9 w-9 items-center justify-center rounded-sm bg-emerald-100">
<svg class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
</svg>
</div>
<div>
<p class="text-sm font-medium text-slate-900">Cash on Delivery</p>
<p class="text-xs text-slate-500">Pay when your order arrives. No online payment required.</p>
</div>
</div>
</div>

<!-- Submit (mobile) -->
<div class="lg:hidden">
<button type="submit" disabled={submitting} class="btn text-white border-none bg-orange-500 hover:bg-orange-600 rounded-sm w-full h-12 text-base font-semibold">
{submitting ? 'Placing Order…' : 'Place Order'}
</button>
</div>
</div>

<!-- Order Summary Sidebar -->
<div class="lg:col-span-5 mt-8 lg:mt-0">
<div class="card p-6 sticky top-24 border-none shadow-none bg-gradient-to-r from-orange-50/50 to-orange-50/50">
<h2 class="text-base font-semibold text-slate-900 mb-4">Order Summary</h2>

<div class="max-h-64 overflow-y-auto divide-y divide-slate-100">
{#each cart.items as item (item.productId)}
<div class="flex gap-3 py-3 first:pt-0 last:pb-0">
<div class="h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm bg-slate-100">
{#if item.imageUrl}
<img src={item.imageUrl} alt={item.name} class="h-full w-full object-cover" />
{:else}
<div class="h-full w-full bg-slate-100"></div>
{/if}
</div>
<div class="flex-1 min-w-0">
<p class="text-sm font-medium text-slate-900 truncate">{item.name}</p>
<p class="text-xs text-slate-500 mt-0.5">Qty: {item.quantity}</p>
</div>
<p class="text-sm font-medium text-slate-900 shrink-0">{formatPrice(item.price * item.quantity)}</p>
</div>
{/each}
</div>

<div class="separator my-4"></div>

<div class="space-y-2.5 text-sm">
<div class="flex justify-between text-slate-600">
<span>Subtotal</span>
<span class="font-medium text-slate-900">{formatPrice(cart.total)}</span>
</div>
<div class="flex justify-between text-slate-600">
<span>Shipping</span>
{#if kampalaShipping}
<span class="font-medium text-slate-900">{formatPrice(550000)}</span>
{:else}
<span class="font-medium text-amber-600 text-xs">Confirmed on phone</span>
{/if}
</div>
</div>

<div class="separator my-4"></div>

<div class="flex justify-between text-base font-bold text-slate-900 mb-6">
<span>Total</span>
{#if kampalaShipping}
<span>{formatPrice(cart.total + 550000)}</span>
{:else}
<span>{formatPrice(cart.total)} <span class="text-xs font-normal text-slate-500">+ shipping</span></span>
{/if}
</div>

<!-- Submit (desktop) -->
<div class="hidden lg:block">
<button type="submit" disabled={submitting} class="btn text-white border-none bg-orange-500 hover:bg-orange-600 rounded-sm w-full h-11 font-semibold">
{submitting ? 'Placing Order…' : 'Place Order'}
</button>
</div>
</div>
</div>
</div>
</form>
{/if}
</div>
