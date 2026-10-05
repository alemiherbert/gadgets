<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import type { PageData } from './$types';
	import { formatPrice, orderStatusBadge, formatAddress } from '$lib/utils';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { getImageUrl } from '$lib/r2';
	import { cart } from '$lib/cart.svelte';
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { data }: { data: PageData } = $props();

	const firstName = $derived(data.order.name.split(' ')[0]);

	let opened = $state(false);

	onMount(() => {
		cart.clear();
		// Straight after checkout: hand the order to WhatsApp. Drop ?send so a refresh doesn't reopen it.
		if (page.url.searchParams.has('send') && data.whatsappUrl) {
			const url = new URL(page.url);
			url.searchParams.delete('send');
			replaceState(url, {});
			opened = true;
			window.location.href = data.whatsappUrl;
		}
	});
</script>

<Seo title="Order confirmed" noindex />

<div class="wrap max-w-3xl py-8 lg:py-12">
	<div class="text-center">
		<div class="mx-auto grid size-20 place-items-center rounded-full bg-ok-soft">
			<span class="grid size-14 place-items-center rounded-full bg-ok text-white animate-pop">
				<Icon name="check" class="size-7" stroke={3} />
			</span>
		</div>
		<h1 class="mt-6 h-page">Thanks, {firstName}! One last step</h1>
		<p class="mt-2 text-ink-muted">
			Order <span class="font-bold text-ink">#{data.order.id}</span> is saved. Send it to us on WhatsApp and we'll confirm the delivery fee.
		</p>
		{#if data.whatsappUrl}
			<a href={data.whatsappUrl} target="_blank" rel="noopener" class="cta cta-lg mt-6 w-full cta-whatsapp sm:w-auto sm:px-10">
				<Icon name="whatsapp" class="size-5" />
				{opened ? 'Didn’t open? Send on WhatsApp' : 'Send order on WhatsApp'}
			</a>
		{/if}
	</div>

	<ol class="mt-10 grid gap-3 sm:grid-cols-3">
		<li class="rounded-2xl bg-ok-soft p-4">
			<span class="grid size-8 place-items-center rounded-full bg-ok text-white"><Icon name="check" class="size-4" stroke={3} /></span>
			<p class="mt-3 text-sm font-bold">Order saved</p>
			<p class="text-xs text-ink-muted">Your items are reserved for you.</p>
		</li>
		<li class="rounded-2xl bg-surface p-4">
			<span class="grid size-8 place-items-center rounded-full bg-white text-whatsapp-ink"><Icon name="whatsapp" class="size-4" /></span>
			<p class="mt-3 text-sm font-bold">Send it on WhatsApp</p>
			<p class="text-xs text-ink-muted">We reply with your delivery fee and time.</p>
		</li>
		<li class="rounded-2xl bg-surface p-4">
			<span class="grid size-8 place-items-center rounded-full bg-white text-brand"><Icon name="cash" class="size-4" /></span>
			<p class="mt-3 text-sm font-bold">Pay on delivery</p>
			<p class="text-xs text-ink-muted">Pay when your order arrives.</p>
		</li>
	</ol>

	<div class="panel mt-6 overflow-hidden">
		<div class="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
			<div>
				<p class="text-xs font-semibold text-ink-muted">Order number</p>
				<p class="font-extrabold">#{data.order.id}</p>
			</div>
			<span class="badge {orderStatusBadge(data.order.status)}">{data.order.status}</span>
		</div>
		<ul class="divide-y divide-line">
			{#each data.items as item}
				<li class="flex items-center gap-4 px-5 py-4 sm:px-6">
					<span class="grid size-16 shrink-0 place-items-center rounded-xl bg-surface">
						<img src={getImageUrl(item.product_image_key)} alt={item.product_name} class="product-shot size-full p-1.5" loading="lazy" />
					</span>
					<div class="min-w-0 flex-1">
						<p class="line-clamp-2 text-sm font-semibold">{item.product_name}</p>
						<p class="mt-0.5 text-xs text-ink-muted tabular-nums">{item.quantity} × {formatPrice(item.price_at_purchase)}</p>
					</div>
					<p class="text-sm font-bold tabular-nums">{formatPrice(item.price_at_purchase * item.quantity)}</p>
				</li>
			{/each}
		</ul>
		<div class="flex items-center justify-between bg-surface px-5 py-4 sm:px-6">
			<div>
				<p class="font-bold">Total</p>
				<p class="text-xs text-ink-muted">Payment: cash on delivery</p>
			</div>
			<p class="text-xl font-extrabold tracking-tight tabular-nums">{formatPrice(data.order.total)}</p>
		</div>
	</div>

	<div class="panel mt-4 p-5 sm:p-6">
		<h2 class="flex items-center gap-2 h-card text-base"><Icon name="map" class="size-4 text-brand" /> Delivering to</h2>
		<p class="mt-2 text-sm leading-relaxed text-ink-muted">
			{data.order.name}<br />
			{formatAddress(data.address)}<br />
			{data.order.phone}
		</p>
	</div>

	<div class="mt-8 flex flex-col gap-3 sm:flex-row">
		{#if data.order.customer_id}
			<a href="/account" class="cta cta-dark sm:flex-1">View my orders</a>
		{/if}
		<a href="/shop" class="cta cta-line sm:flex-1">Continue shopping</a>
	</div>
</div>
