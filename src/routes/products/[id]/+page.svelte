<script lang="ts">
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import type { PageData, ActionData } from './$types';
	import { getImageUrl } from '$lib/r2';
	import { formatPrice, discountPercent } from '$lib/utils';
	import { cart } from '$lib/cart.svelte';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let quantity = $state(1);
	let added = $state(false);
	let selectedRating = $state(0);
	let hoverRating = $state(0);
	let selectedImage = $state(0);

	let allImages = $derived(
		[data.product.image_key, ...data.images.map((img) => img.image_key)].filter(Boolean) as string[]
	);

	let specs = $derived.by(() => {
		try { return Object.entries(JSON.parse(data.product.specs ?? '{}')); }
		catch { return []; }
	});

	let discount = $derived(discountPercent(data.product.price, data.product.compare_at_price));

	let avgRating = $derived(
		data.reviews.length > 0
			? data.reviews.reduce((s, r) => s + r.rating, 0) / data.reviews.length
			: 0
	);

	function addToCart() {
		cart.addItem({
			id: data.product.id,
			name: data.product.name,
			price: data.product.price,
			imageUrl: getImageUrl(data.product.image_key)
		}, quantity);
		added = true;
		setTimeout(() => (added = false), 2000);
	}
</script>

<svelte:head>
	<title>{data.product.name} — Gadgets Store</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
	<link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&display=swap" rel="stylesheet">
</svelte:head>

<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-10" style="font-family: 'Google Sans Flex', sans-serif;">

	<Breadcrumb items={[
		{ label: 'Home', href: '/' },
		{ label: 'Shop', href: '/shop' },
		{ label: data.product.name },
	]} />

	<!-- ── Product Details Grid ──────────────────────────────────── -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3 xl:gap-12 mt-6">

		<!-- ① Info column (left) -->
		<div class="flex flex-col gap-3 xl:gap-4 order-2 lg:order-1 xl:row-span-2">

			<div class="space-y-3">
				<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance leading-tight">
					{data.product.name}
				</h1>

				<div class="flex items-baseline gap-3 flex-wrap">
					<span class="text-2xl font-bold text-slate-900">{formatPrice(data.product.price)}</span>
					{#if data.product.compare_at_price}
						<span class="text-base text-slate-400 line-through">{formatPrice(data.product.compare_at_price)}</span>
					{/if}
				</div>

				{#if data.reviews.length > 0}
					<div class="flex items-center gap-2">
						<div class="flex gap-0.5">
							{#each [1,2,3,4,5] as s}
								<svg class="h-4 w-4 {s <= Math.round(avgRating) ? 'text-amber-400' : 'text-slate-200'}" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
								</svg>
							{/each}
						</div>
						<span class="text-sm text-slate-500">{avgRating.toFixed(1)} ({data.reviews.length} review{data.reviews.length !== 1 ? 's' : ''})</span>
					</div>
				{/if}
			</div>

			{#if data.product.description}
				<p class="text-slate-600 leading-relaxed text-balance whitespace-pre-line">
					{data.product.description}
				</p>
			{/if}

			<div class="">
				{#if data.product.stock > 10}
					<div class="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-full px-3 py-1">
						<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
						In Stock
					</div>
				{:else if data.product.stock > 0}
					<div class="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 bg-amber-50 rounded-full px-3 py-1">
						<span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
						Only {data.product.stock} left
					</div>
				{:else}
					<div class="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 bg-red-50 rounded-full px-3 py-1">
						<span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
						Out of Stock
					</div>
				{/if}
			</div>

			<!-- Product image thumbnails -->
			{#if allImages.length > 1}
			<div class="mt-auto flex gap-2 overflow-x-auto pt-2 border-t border-slate-100 pb-1">
					{#each allImages as key, i}
						<button
							type="button"
							onclick={() => (selectedImage = i)}
							aria-label="View image {i + 1}"
							class="relative shrink-0 h-16 w-16 rounded-sm overflow-hidden filter-blur-xs transition-all duration-150 cursor-pointer
								{i === selectedImage ? 'filter-blur-xs' : 'filter-none hover:border-orange-300 opacity-70 hover:opacity-100'}"
						>
							<img src={getImageUrl(key)} alt="{data.product.name} - view {i + 1}" class="h-full w-full object-cover" />
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- ② Main image -->
		<div class="order-1 lg:order-2 xl:row-span-2">
			<div class="relative aspect-square overflow-hidden rounded-sm bg-slate-100">
				<img
					src={getImageUrl(allImages[selectedImage] ?? data.product.image_key)}
					alt={data.product.name}
					class="h-full w-full object-cover transition-opacity duration-200"
				/>
				{#if discount > 0}
					<span class="absolute top-4 right-4 badge bg-orange-500 text-white border-none">-{discount}%</span>
				{/if}
				{#if data.product.stock <= 0}
					<span class="absolute top-4 left-4 badge border-none bg-red-500 text-white">Sold Out</span>
				{:else if data.product.stock < 5}
					<span class="absolute top-4 left-4 badge border-none bg-amber-100 text-amber-700 border-amber-200">{data.product.stock} left</span>
				{/if}
			</div>
		</div>

		<!-- Specs + actions (right) -->
		<div class="flex flex-col gap-6 order-3">

			{#if specs.length > 0}
				<div>
					<h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Specifications</h3>
					<div class="divide-y divide-slate-100 rounded-sm border border-slate-100 overflow-hidden">
						{#each specs as [key, val]}
							<div class="flex gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 transition-colors">
								<span class="text-sm text-slate-500 min-w-[110px] shrink-0">{key}</span>
								<span class="text-sm font-medium text-slate-800">{val}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if data.product.stock > 0}
				<div class="space-y-3">
					<div class="flex items-center gap-3">
						<span class="text-sm font-medium text-slate-700">Qty</span>
						<div class="flex items-center rounded-sm border border-slate-200 overflow-hidden">
							<button
								onclick={() => quantity = Math.max(1, quantity - 1)}
								class="flex h-10 w-10 items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
								aria-label="Decrease"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14"/>
								</svg>
							</button>
							<input
								type="number"
								bind:value={quantity}
								min="1"
								max={data.product.stock}
								class="h-10 w-14 border-x border-slate-200 text-center text-sm font-semibold text-slate-900 focus:outline-none bg-white"
							/>
							<button
								onclick={() => quantity = Math.min(data.product.stock, quantity + 1)}
								class="flex h-10 w-10 items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
								aria-label="Increase"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
								</svg>
							</button>
						</div>
					</div>

					<button
						onclick={addToCart}
						class="w-full h-12 rounded-sm bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-base flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-orange-200 active:scale-[0.98]"
					>
						{#if added}
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
							</svg>
							Added to Cart!
						{:else}
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/>
							</svg>
							Add to Cart
						{/if}
					</button>
				</div>
			{:else}
				<div class="h-12 rounded-sm bg-slate-200 text-slate-900 font-semibold text-base flex items-center justify-center">
					Sold Out
				</div>
			{/if}
		</div>
	</div>

	<!-- ── Reviews Section ───────────────────────────────────────── -->
	<div class="mt-16 border-t border-slate-100 pt-12">
		<div class="flex items-end justify-between mb-8 gap-4 flex-wrap">
			<div>
				<p class="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-1">Customer Feedback</p>
				<h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
					Reviews
					{#if data.reviews.length > 0}
						<span class="text-slate-400 font-normal text-lg ml-1">({data.reviews.length})</span>
					{/if}
				</h2>
			</div>
			{#if data.reviews.length > 0}
				<div class="flex items-center gap-3">
					<div class="flex gap-0.5">
						{#each [1,2,3,4,5] as s}
							<svg class="h-6 w-6 {s <= Math.round(avgRating) ? 'text-amber-400' : 'text-slate-200'}" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
							</svg>
						{/each}
					</div>
					<span class="text-2xl font-bold text-slate-900">{avgRating.toFixed(1)}</span>
					<span class="text-sm text-slate-500">out of 5</span>
				</div>
			{/if}
		</div>

		<!-- Review form for eligible customers -->
		{#if data.canReview}
			<div class="mb-10 rounded-sm bg-orange-50/50 p-6">
				<h3 class="font-semibold text-slate-900 mb-1">Share your experience</h3>
				<p class="text-sm text-slate-500 mb-5">You've purchased this product — your review helps other shoppers.</p>

				{#if form?.error}
					<div class="alert alert-error mb-4">{form.error}</div>
				{/if}
				{#if form?.success}
					<div class="alert alert-success mb-4">Review submitted! Thank you.</div>
				{/if}

				<form method="POST" action="?/review" use:enhance>
					<fieldset>
						<legend class="label mb-2">Rating <span class="text-red-500">*</span></legend>
						<div class="flex gap-1">
							{#each [1,2,3,4,5] as s}
								<button
									type="button"
									onclick={() => selectedRating = s}
									onmouseenter={() => hoverRating = s}
									onmouseleave={() => hoverRating = 0}
									aria-label="{s} star{s !== 1 ? 's' : ''}"
									class="transition-transform hover:scale-110"
								>
									<svg class="h-8 w-8 {s <= (hoverRating || selectedRating) ? 'text-amber-400' : 'text-slate-300'}" fill="currentColor" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
									</svg>
								</button>
							{/each}
						</div>
						<input type="hidden" name="rating" value={selectedRating} />
					</fieldset>

					<div class="mb-4">
						<label for="review-title" class="label">Title</label>
						<input id="review-title" name="title" type="text" class="input" placeholder="Summarize your experience" maxlength="120" />
					</div>

					<div class="mb-5">
						<label for="review-body" class="label">Review <span class="text-red-500">*</span></label>
						<textarea id="review-body" name="body" class="textarea rounded-sm" rows="4" placeholder="What did you like or dislike? How was the quality?" required></textarea>
					</div>

					<button type="submit" class="btn btn-primary px-6 rounded-sm h-11">Submit Review</button>
				</form>
			</div>
		{:else if data.hasReviewed}
			<div class="mb-8 rounded-sm bg-slate-50 border border-slate-100 px-5 py-4 text-sm text-slate-600">
				You've already reviewed this product — thank you!
			</div>
		{/if}

		<!-- Review list -->
		{#if data.reviews.length === 0}
			<div class="text-center py-12 text-slate-400">
				<svg class="mx-auto h-10 w-10 mb-2 text-slate-200" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/>
				</svg>
				<p class="font-medium text-slate-700">No reviews yet</p>
				<p class="text-sm mt-1">Be the first to share your thoughts after purchasing.</p>
			</div>
		{:else}
			<div class="space-y-5">
				{#each data.reviews as review}
					<div class="rounded-sm bg-white border border-slate-100 p-5 hover:border-orange-100 transition-colors">
						<div class="flex items-start justify-between gap-4 mb-2">
							<div>
								<div class="flex gap-0.5 mb-1">
									{#each [1,2,3,4,5] as s}
										<svg class="h-4 w-4 {s <= review.rating ? 'text-amber-400' : 'text-slate-200'}" fill="currentColor" viewBox="0 0 20 20">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
										</svg>
									{/each}
								</div>
								{#if review.title}
									<p class="font-semibold text-slate-900">{review.title}</p>
								{/if}
							</div>
							<div class="text-right shrink-0">
								<p class="text-sm font-medium text-slate-700">{review.customer_name}</p>
								<p class="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
							</div>
						</div>
						{#if review.body}
							<p class="text-slate-600 text-sm leading-relaxed">{review.body}</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- ── Recommendations ───────────────────────────────────────── -->
	{#if data.recommendations && data.recommendations.length > 0}
		<div class="mt-16 border-t border-slate-100 pt-12">
			<div class="mb-8">
				<p class="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-1">You might also like</p>
				<h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Recommended Products</h2>
			</div>
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
				{#each data.recommendations as rec}
					<ProductCard product={rec} />
				{/each}
			</div>
		</div>
	{/if}
</div>