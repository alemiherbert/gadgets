<script lang="ts">
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Stars from '$lib/components/Stars.svelte';
	import Rail from '$lib/components/Rail.svelte';
	import type { PageData, ActionData } from './$types';
	import { getImageUrl } from '$lib/r2';
	import { formatPrice, discountPercent } from '$lib/utils';
	import { renderMarkdown, markdownExcerpt } from '$lib/markdown';
	import Seo from '$lib/components/Seo.svelte';
	import { cart } from '$lib/cart.svelte';
	import { wishlist } from '$lib/wishlist.svelte';
	import { ui } from '$lib/ui.svelte';
	import { site, absoluteUrl } from '$lib/site';
	import { recordRecent, type RecentItem } from '$lib/recent';
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let quantity = $state(1);
	let selectedRating = $state(0);
	let hoverRating = $state(0);
	let selectedImage = $state(0);
	let descriptionExpanded = $state(false);
	let specsExpanded = $state(false);
	let showStickyBar = $state(false);
	let gallery = $state<HTMLElement>();
	let mainCta = $state<HTMLElement>();

	const SPECS_PREVIEW = 8;

	let existingCartQty = $derived(cart.getItemQuantity(data.product.id));
	let maxAddable = $derived(Math.max(0, data.product.stock - existingCartQty));

	let allImages = $derived(
		[data.product.image_key, ...data.images.map((img) => img.image_key)].filter(Boolean) as string[]
	);

	let specs = $derived.by(() => {
		try {
			return Object.entries(JSON.parse(data.product.specs ?? '{}')) as [string, string][];
		} catch {
			return [];
		}
	});

	let keySpecs = $derived(specs.slice(0, 4));
	let visibleSpecs = $derived(specsExpanded ? specs : specs.slice(0, SPECS_PREVIEW));
	let hasMoreSpecs = $derived(specs.length > SPECS_PREVIEW);

	let discount = $derived(discountPercent(data.product.price, data.product.compare_at_price));
	let savings = $derived(discount > 0 && data.product.compare_at_price ? data.product.compare_at_price - data.product.price : 0);

	let descriptionHtml = $derived(renderMarkdown(data.product.description ?? ''));
	let descriptionLong = $derived((data.product.description?.length ?? 0) > 700);

	let avgRating = $derived(
		data.reviews.length > 0 ? data.reviews.reduce((s, r) => s + r.rating, 0) / data.reviews.length : 0
	);
	let ratingBreakdown = $derived(
		[5, 4, 3, 2, 1].map((star) => ({ star, count: data.reviews.filter((r) => r.rating === star).length }))
	);

	let isWishlisted = $derived(data.customer ? data.isWishlisted : wishlist.isInWishlist(data.product.id));

	// ── Recently viewed + reset per product ──
	let recentlyViewed = $state<RecentItem[]>([]);

	afterNavigate(() => {
		selectedImage = 0;
		quantity = 1;
		descriptionExpanded = false;
		specsExpanded = false;
		gallery?.scrollTo({ left: 0 });
		const p = data.product;
		recentlyViewed = recordRecent({ id: p.id, slug: p.slug, name: p.name, image_key: p.image_key, price: p.price }).filter(
			(item) => item.id !== p.id
		);
	});

	// ── Sticky mobile CTA once the main button scrolls away ──
	$effect(() => {
		if (!mainCta) {
			showStickyBar = false;
			return;
		}
		// Root extends far below the viewport, so "not intersecting" means the
		// button has scrolled above the top edge — even after a fast jump.
		const observer = new IntersectionObserver(
			([entry]) => {
				showStickyBar = !entry.isIntersecting;
			},
			{ rootMargin: '0px 0px 100000px 0px' }
		);
		observer.observe(mainCta);
		return () => observer.disconnect();
	});

	// ── Gallery ──
	function onGalleryScroll() {
		if (!gallery) return;
		selectedImage = Math.round(gallery.scrollLeft / gallery.clientWidth);
	}

	function showImage(i: number) {
		selectedImage = i;
		gallery?.scrollTo({ left: i * gallery.clientWidth, behavior: 'smooth' });
	}

	// ── Cart ──
	function addToCart(openDrawer = true) {
		if (maxAddable <= 0) return;
		const qty = Math.min(Math.max(1, Math.floor(Number(quantity) || 1)), maxAddable);
		cart.addItem(
			{
				id: data.product.id,
				slug: data.product.slug,
				name: data.product.name,
				price: data.product.price,
				imageUrl: getImageUrl(data.product.image_key),
				stock: data.product.stock
			},
			qty
		);
		quantity = 1;
		if (openDrawer) ui.added(data.product.name);
	}

	function toggleLocalWishlist() {
		wishlist.toggleItem({
			id: data.product.id,
			slug: data.product.slug,
			name: data.product.name,
			price: data.product.price,
			imageKey: data.product.image_key
		});
	}

	// ── SEO ──
	function clip(text: string, max: number) {
		const clean = text.replace(/\s+/g, ' ').trim();
		if (clean.length <= max) return clean;
		return clean.slice(0, clean.lastIndexOf(' ', max - 1)).replace(/[,.;:\s]+$/, '') + '…';
	}

	let productPath = $derived(`/products/${data.product.slug}`);

	let seoDescription = $derived.by(() => {
		const p = data.product;
		const lead = `${p.name} — ${formatPrice(p.price)}${discount > 0 ? ` (save ${discount}%)` : ''} at ${site.name}.`;
		const stock = p.stock > 0 ? 'In stock with pay on delivery in Uganda.' : 'Currently out of stock.';
		const excerpt = p.description ? markdownExcerpt(p.description, 220) : '';
		return clip(`${lead} ${stock} ${excerpt}`, 158);
	});

	let schema = $derived.by(() => {
		const p = data.product;
		const url = absoluteUrl(productPath);

		const product: Record<string, any> = {
			'@type': 'Product',
			'@id': `${url}#product`,
			name: p.name,
			description: p.description ? markdownExcerpt(p.description, 5000) : p.name,
			image: allImages.map((k) => absoluteUrl(getImageUrl(k))),
			sku: p.sku || String(p.id),
			url,
			offers: {
				'@type': 'Offer',
				url,
				priceCurrency: site.currency,
				price: String(Math.round(p.price / 100)),
				availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
				itemCondition: 'https://schema.org/NewCondition',
				seller: { '@type': 'Organization', '@id': `${site.url}/#store`, name: site.name },
				...(discount > 0 ? { priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] } : {})
			}
		};

		if (data.reviews.length > 0) {
			product.aggregateRating = {
				'@type': 'AggregateRating',
				ratingValue: avgRating.toFixed(1),
				reviewCount: data.reviews.length,
				bestRating: 5,
				worstRating: 1
			};
			product.review = data.reviews.slice(0, 5).map((r) => ({
				'@type': 'Review',
				author: { '@type': 'Person', name: r.customer_name },
				datePublished: r.created_at,
				reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
				reviewBody: r.body ?? '',
				...(r.title ? { name: r.title } : {})
			}));
		}

		const breadcrumbs = {
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
				{ '@type': 'ListItem', position: 2, name: 'Shop', item: absoluteUrl('/shop') },
				{ '@type': 'ListItem', position: 3, name: p.name, item: url }
			]
		};

		return { '@context': 'https://schema.org', '@graph': [product, breadcrumbs] };
	});
</script>

<Seo
	title="{data.product.name} Price in Uganda"
	description={seoDescription}
	canonical={productPath}
	type="product"
	image={getImageUrl(data.product.image_key)}
	imageAlt={data.product.name}
	{schema}
>
	<meta property="product:price:amount" content={String(Math.round(data.product.price / 100))} />
	<meta property="product:price:currency" content={site.currency} />
	<meta property="product:availability" content={data.product.stock > 0 ? 'in stock' : 'out of stock'} />
</Seo>

{#snippet wishlistButton(classes: string)}
	{#if data.customer}
		<form method="POST" action={data.isWishlisted ? '?/removeFromWishlist' : '?/addToWishlist'} use:enhance class="contents">
			<button type="submit" class={classes} aria-label={data.isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'} aria-pressed={isWishlisted}>
				<Icon name={isWishlisted ? 'heart-solid' : 'heart'} class="size-5 {isWishlisted ? 'text-deal' : ''}" />
			</button>
		</form>
	{:else}
		<button type="button" onclick={toggleLocalWishlist} class={classes} aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'} aria-pressed={isWishlisted}>
			<Icon name={isWishlisted ? 'heart-solid' : 'heart'} class="size-5 {isWishlisted ? 'text-deal' : ''}" />
		</button>
	{/if}
{/snippet}

<div class="wrap pb-16 pt-4 lg:pt-6">
	<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: data.product.name }]} />

	<div class="mt-4 grid gap-8 lg:mt-6 lg:grid-cols-12 lg:gap-12">
		<!-- ── Gallery ── -->
		<div class="lg:col-span-7">
			<div class="lg:sticky lg:top-36">
				<div class="relative -mx-4 sm:mx-0">
					<div
						bind:this={gallery}
						onscroll={onGalleryScroll}
						class="rail auto-cols-[100%] bg-surface sm:rounded-3xl"
						role="region"
						aria-label="Product images"
					>
						{#each allImages as key, i}
							<div class="relative aspect-square">
								<img
									src={getImageUrl(key)}
									alt="{data.product.name}{i > 0 ? ` — view ${i + 1}` : ''}"
									loading={i === 0 ? 'eager' : 'lazy'}
									fetchpriority={i === 0 ? 'high' : 'auto'}
									decoding={i === 0 ? 'sync' : 'async'}
									class="product-shot absolute inset-0 size-full p-[8%]"
								/>
							</div>
						{/each}
					</div>

					<div class="pointer-events-none absolute left-4 top-4 flex flex-col items-start gap-1.5 sm:left-5 sm:top-5">
						{#if data.product.stock <= 0}
							<span class="tag tag-ink h-7 px-3 text-xs">Sold out</span>
						{:else if discount > 0}
							<span class="tag tag-deal h-7 px-3 text-xs">-{discount}% off</span>
						{/if}
					</div>

					{#if allImages.length > 1}
						<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
							{#each allImages as _, i}
								<span class="h-1.5 rounded-full transition-all {i === selectedImage ? 'w-5 bg-ink' : 'w-1.5 bg-ink/25'}"></span>
							{/each}
						</div>
						<button
							onclick={() => showImage(Math.max(0, selectedImage - 1))}
							disabled={selectedImage === 0}
							class="absolute left-4 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white shadow-md transition hover:scale-105 disabled:opacity-0 sm:grid"
							aria-label="Previous image"
						>
							<Icon name="chevron-left" class="size-5" stroke={2.25} />
						</button>
						<button
							onclick={() => showImage(Math.min(allImages.length - 1, selectedImage + 1))}
							disabled={selectedImage === allImages.length - 1}
							class="absolute right-4 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white shadow-md transition hover:scale-105 disabled:opacity-0 sm:grid"
							aria-label="Next image"
						>
							<Icon name="chevron-right" class="size-5" stroke={2.25} />
						</button>
					{/if}
				</div>

				{#if allImages.length > 1}
					<div class="mt-3 hidden gap-2.5 sm:flex">
						{#each allImages as key, i}
							<button
								type="button"
								onclick={() => showImage(i)}
								aria-label="View image {i + 1}"
								aria-current={i === selectedImage}
								class="size-20 overflow-hidden rounded-xl bg-surface ring-2 transition {i === selectedImage ? 'ring-brand' : 'ring-transparent hover:ring-line'}"
							>
								<img src={getImageUrl(key)} alt="" loading="lazy" decoding="async" class="product-shot size-full p-1.5" />
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- ── Buy box ── -->
		<div class="lg:col-span-5">
			<h1 class="h-page text-2xl sm:text-3xl">{data.product.name}</h1>

			<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
				{#if data.reviews.length > 0}
					<a href="#reviews" class="inline-flex items-center gap-1.5">
						<Stars rating={avgRating} />
						<span class="font-bold">{avgRating.toFixed(1)}</span>
						<span class="text-ink-muted underline-offset-2 hover:underline">({data.reviews.length} review{data.reviews.length !== 1 ? 's' : ''})</span>
					</a>
				{/if}
				{#if data.product.sales_count > 0}
					<span class="inline-flex items-center gap-1 font-semibold text-ink-muted">
						<Icon name="fire" class="size-4 text-deal" />
						{data.product.sales_count} sold
					</span>
				{/if}
				{#if data.product.sku}
					<span class="text-xs text-ink-subtle">SKU {data.product.sku}</span>
				{/if}
			</div>

			<!-- Price -->
			<div class="mt-5 rounded-2xl bg-surface p-5">
				<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<span class="text-3xl font-extrabold leading-none tracking-tight tabular-nums {discount > 0 ? 'text-deal' : ''}">{formatPrice(data.product.price)}</span>
					{#if discount > 0 && data.product.compare_at_price}
						<span class="text-base text-ink-subtle line-through tabular-nums">{formatPrice(data.product.compare_at_price)}</span>
					{/if}
				</div>
				{#if savings > 0}
					<p class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-deal px-3 py-1 text-xs font-extrabold text-white">
						You save {formatPrice(savings)} ({discount}%)
					</p>
				{/if}
				<div class="mt-4 flex items-center gap-2 text-sm font-semibold">
					{#if data.product.stock > 10}
						<span class="size-2 rounded-full bg-ok ring-4 ring-ok/15"></span>
						<span class="text-ok-ink">In stock — ready to deliver</span>
					{:else if data.product.stock > 0}
						<span class="size-2 rounded-full bg-warn ring-4 ring-warn/15"></span>
						<span class="text-warn-ink">Only {data.product.stock} left — order soon</span>
					{:else}
						<span class="size-2 rounded-full bg-deal ring-4 ring-deal/15"></span>
						<span class="text-deal">Out of stock</span>
					{/if}
				</div>
			</div>

			<!-- Key specs -->
			{#if keySpecs.length > 0}
				<dl class="mt-4 grid grid-cols-2 gap-2">
					{#each keySpecs as [key, val]}
						<div class="rounded-xl border border-line px-3.5 py-2.5">
							<dt class="label-caps">{key}</dt>
							<dd class="mt-0.5 truncate text-sm font-bold" title={String(val)}>{val}</dd>
						</div>
					{/each}
				</dl>
			{/if}

			<!-- Purchase -->
			<div class="mt-6">
				{#if data.product.stock > 0}
					{#if maxAddable > 0}
						<div class="flex gap-2.5" bind:this={mainCta}>
							<div class="flex h-14 shrink-0 items-center rounded-full border-control border-line">
								<button
									onclick={() => (quantity = Math.max(1, quantity - 1))}
									class="grid h-full w-11 place-items-center rounded-l-full text-ink-muted hover:bg-surface disabled:opacity-30"
									aria-label="Decrease quantity"
									disabled={quantity <= 1}
								>
									<Icon name="minus" class="size-4" stroke={2.5} />
								</button>
								<input
									type="number"
									bind:value={quantity}
									min="1"
									max={maxAddable}
									aria-label="Quantity"
									class="h-full w-10 bg-transparent text-center text-base font-extrabold tabular-nums [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
								/>
								<button
									onclick={() => (quantity = Math.min(maxAddable, quantity + 1))}
									class="grid h-full w-11 place-items-center rounded-r-full text-ink-muted hover:bg-surface disabled:opacity-30"
									aria-label="Increase quantity"
									disabled={quantity >= maxAddable}
								>
									<Icon name="plus" class="size-4" stroke={2.5} />
								</button>
							</div>
							<button onclick={() => addToCart()} class="cta cta-brand cta-lg flex-1 px-4">
								<Icon name="bag" class="size-5" stroke={2} />
								Add to cart
							</button>
							{@render wishlistButton('grid size-14 shrink-0 place-items-center rounded-full border-control border-line transition hover:border-ink')}
						</div>
						{#if existingCartQty > 0}
							<p class="mt-3 flex items-center gap-1.5 text-xs font-semibold text-ok-ink">
								<Icon name="check" class="size-3.5" stroke={2.5} />
								{existingCartQty} already in your cart · {maxAddable} more available
							</p>
						{/if}
					{:else}
						<div class="rounded-2xl bg-brand-soft p-4 text-sm font-semibold text-brand-dark">
							You have all {existingCartQty} available in your cart.
						</div>
						<div class="mt-2.5 flex gap-2.5" bind:this={mainCta}>
							<a href="/checkout" class="cta cta-brand cta-lg flex-1">
								Checkout
								<Icon name="arrow-right" class="size-4" stroke={2.25} />
							</a>
							{@render wishlistButton('grid size-14 shrink-0 place-items-center rounded-full border-control border-line transition hover:border-ink')}
						</div>
					{/if}
				{:else}
					<div class="flex gap-2.5">
						<div class="cta cta-lg flex-1 cursor-not-allowed bg-surface text-ink-muted">Sold out</div>
						{@render wishlistButton('grid size-14 shrink-0 place-items-center rounded-full border-control border-line transition hover:border-ink')}
					</div>
					<p class="mt-2 text-xs text-ink-muted">Save it to your wishlist and check back soon.</p>
				{/if}

			</div>

			<!-- Reassurance -->
			<ul class="mt-6 divide-y divide-line rounded-2xl border border-line">
				<li class="flex items-start gap-3 p-4">
					<span class="icon-tile bg-brand-soft text-brand"><Icon name="cash" class="size-5" /></span>
					<span class="text-sm">
						<span class="block font-bold">Pay on delivery</span>
						<span class="block text-ink-muted">Pay when your order arrives — no card needed.</span>
					</span>
				</li>
				<li class="flex items-start gap-3 p-4">
					<span class="icon-tile bg-brand-soft text-brand"><Icon name="truck" class="size-5" /></span>
					<span class="text-sm">
						<span class="block font-bold">Delivery across Uganda</span>
						<span class="block text-ink-muted">We confirm the delivery fee with you before dispatch.</span>
					</span>
				</li>
			</ul>

			{#if data.adjacent.prev || data.adjacent.next}
				<div class="mt-6 grid grid-cols-2 gap-2.5">
					{#if data.adjacent.prev}
						<a href="/products/{data.adjacent.prev.slug}" class="group flex min-w-0 items-center gap-2.5 rounded-2xl p-2 transition hover:bg-surface">
							<img src={getImageUrl(data.adjacent.prev.image_key)} alt="" class="product-shot size-12 shrink-0 rounded-xl bg-surface p-1" loading="lazy" />
							<span class="min-w-0">
								<span class="block text-2xs font-semibold text-ink-subtle">← Previous</span>
								<span class="block truncate text-xs font-bold group-hover:text-brand">{data.adjacent.prev.name}</span>
							</span>
						</a>
					{:else}
						<span></span>
					{/if}
					{#if data.adjacent.next}
						<a href="/products/{data.adjacent.next.slug}" class="group flex min-w-0 items-center justify-end gap-2.5 rounded-2xl p-2 text-right transition hover:bg-surface">
							<span class="min-w-0">
								<span class="block text-2xs font-semibold text-ink-subtle">Next →</span>
								<span class="block truncate text-xs font-bold group-hover:text-brand">{data.adjacent.next.name}</span>
							</span>
							<img src={getImageUrl(data.adjacent.next.image_key)} alt="" class="product-shot size-12 shrink-0 rounded-xl bg-surface p-1" loading="lazy" />
						</a>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- ── Details ── -->
	{#if data.product.description || specs.length > 0}
		<div class="block-sep grid gap-10 lg:grid-cols-12 lg:gap-12">
			{#if data.product.description}
				<section class="{specs.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'}">
					<h2 class="h-block">Overview</h2>
					<div class="relative mt-5">
						<div class="prose-copy text-base {descriptionLong && !descriptionExpanded ? 'max-h-80 overflow-hidden' : ''}">
							{@html descriptionHtml}
						</div>
						{#if descriptionLong && !descriptionExpanded}
							<div class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
						{/if}
					</div>
					{#if descriptionLong}
						<button type="button" onclick={() => (descriptionExpanded = !descriptionExpanded)} class="cta cta-line cta-sm mt-4">
							{descriptionExpanded ? 'Show less' : 'Read more'}
							<Icon name="chevron-down" class="size-4 transition {descriptionExpanded ? 'rotate-180' : ''}" stroke={2.25} />
						</button>
					{/if}
				</section>
			{/if}

			{#if specs.length > 0}
				<section class="{data.product.description ? 'lg:col-span-5' : 'lg:col-span-12'}">
					<h2 class="h-block">Specifications</h2>
					<dl class="mt-5 overflow-hidden rounded-2xl border border-line">
						{#each visibleSpecs as [key, val], i}
							<div class="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-4 py-3 text-sm {i % 2 === 0 ? 'bg-surface/60' : ''}">
								<dt class="text-ink-muted">{key}</dt>
								<dd class="font-semibold">{val}</dd>
							</div>
						{/each}
					</dl>
					{#if hasMoreSpecs}
						<button type="button" onclick={() => (specsExpanded = !specsExpanded)} class="mt-3 text-sm font-bold text-brand hover:underline">
							{specsExpanded ? 'Show fewer specs' : `Show all ${specs.length} specs`}
						</button>
					{/if}
				</section>
			{/if}
		</div>
	{/if}

	<!-- ── Reviews ── -->
	<section id="reviews" class="block-sep scroll-mt-36">
		<div class="grid gap-10 lg:grid-cols-12 lg:gap-12">
			<div class="lg:col-span-4">
				<h2 class="h-block">Customer reviews</h2>
				{#if data.reviews.length > 0}
					<div class="mt-5 flex items-center gap-4">
						<span class="text-5xl font-extrabold tracking-tight">{avgRating.toFixed(1)}</span>
						<div>
							<Stars rating={avgRating} class="size-5" />
							<p class="mt-1 text-sm text-ink-muted">Based on {data.reviews.length} review{data.reviews.length !== 1 ? 's' : ''}</p>
						</div>
					</div>
					<ul class="mt-5 space-y-2">
						{#each ratingBreakdown as row}
							<li class="flex items-center gap-3 text-sm">
								<span class="w-8 font-semibold tabular-nums">{row.star}★</span>
								<span class="h-2 flex-1 overflow-hidden rounded-full bg-surface">
									<span class="block h-full rounded-full bg-sun" style="width: {(row.count / data.reviews.length) * 100}%"></span>
								</span>
								<span class="w-6 text-right tabular-nums text-ink-muted">{row.count}</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-2 text-sm text-ink-muted">No reviews yet. Customers who buy this can share their experience here.</p>
				{/if}

				{#if data.hasReviewed}
					<p class="mt-6 rounded-2xl bg-surface px-4 py-3 text-sm text-ink-muted">You've reviewed this product — thank you!</p>
				{/if}
			</div>

			<div class="lg:col-span-8">
				{#if data.canReview}
					<div class="mb-8 rounded-2xl bg-brand-soft p-5 sm:p-6">
						<h3 class="h-card">Share your experience</h3>
						<p class="mt-1 text-sm text-ink-muted">You bought this — your review helps other shoppers decide.</p>

						{#if form?.error}
							<div class="notice notice-error mt-4">{form.error}</div>
						{/if}
						{#if form?.success}
							<div class="notice notice-ok mt-4">Review submitted! Thank you.</div>
						{/if}

						<form method="POST" action="?/review" use:enhance class="mt-5 space-y-4">
							<fieldset>
								<legend class="field-label">Rating <span class="text-deal">*</span></legend>
								<div class="flex gap-1">
									{#each [1, 2, 3, 4, 5] as s}
										<button
											type="button"
											onclick={() => (selectedRating = s)}
											onmouseenter={() => (hoverRating = s)}
											onmouseleave={() => (hoverRating = 0)}
											aria-label="{s} star{s !== 1 ? 's' : ''}"
											class="transition-transform hover:scale-110"
										>
											<Icon name="star" class="size-8 {s <= (hoverRating || selectedRating) ? 'text-sun' : 'text-white'}" />
										</button>
									{/each}
								</div>
								<input type="hidden" name="rating" value={selectedRating} />
							</fieldset>
							<div>
								<label for="review-title" class="field-label">Title</label>
								<input id="review-title" name="title" type="text" class="field" placeholder="Sum it up in a few words" maxlength="120" />
							</div>
							<div>
								<label for="review-body" class="field-label">Review <span class="text-deal">*</span></label>
								<textarea id="review-body" name="body" class="field" rows="4" placeholder="What did you like or dislike? How's the quality?" required></textarea>
							</div>
							<button type="submit" class="cta cta-brand">Submit review</button>
						</form>
					</div>
				{/if}

				{#if data.reviews.length === 0}
					<div class="rounded-3xl border border-dashed border-line px-6 py-12 text-center">
						<Icon name="chat" class="mx-auto size-10 text-ink-faint" stroke={1.5} />
						<p class="mt-3 font-bold">No reviews yet</p>
						<p class="mt-1 text-sm text-ink-muted">Be the first to share your thoughts after purchasing.</p>
					</div>
				{:else}
					<ul class="space-y-4">
						{#each data.reviews as review}
							<li class="rounded-2xl border border-line p-5">
								<div class="flex items-start justify-between gap-4">
									<div class="flex items-center gap-3">
										<span class="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-sm font-extrabold">{review.customer_name.charAt(0).toUpperCase()}</span>
										<div>
											<p class="text-sm font-bold">{review.customer_name}</p>
											<p class="text-xs text-ink-muted">{new Date(review.created_at).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
										</div>
									</div>
									<Stars rating={review.rating} />
								</div>
								{#if review.title}
									<p class="mt-3 font-bold">{review.title}</p>
								{/if}
								{#if review.body}
									<p class="mt-1 text-sm leading-relaxed text-ink-muted">{review.body}</p>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</section>

	<!-- ── Recommendations ── -->
	{#if data.recommendations && data.recommendations.length > 0}
		<section class="block-sep">
			<p class="eyebrow">Complete your setup</p>
			<h2 class="h-section mt-2">You might also like</h2>
			<div class="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
				{#each data.recommendations as rec (rec.id)}
					<ProductCard product={rec} />
				{/each}
			</div>
		</section>
	{/if}

	<!-- ── Recently viewed ── -->
	{#if recentlyViewed.length > 0}
		<section class="block-sep">
			<h2 class="h-block">Recently viewed</h2>
			<div class="mt-5">
				<Rail label="Recently viewed" class="auto-cols-[40%] gap-3 sm:auto-cols-[24%] lg:auto-cols-[calc((100%-5*1rem)/6)] lg:gap-4">
					{#each recentlyViewed as item (item.id)}
						<a href="/products/{item.slug}" class="group block">
							<span class="relative block aspect-square overflow-hidden rounded-2xl bg-surface">
								<img src={getImageUrl(item.image_key)} alt="" loading="lazy" decoding="async" class="product-shot absolute inset-0 size-full p-[10%] transition duration-500 group-hover:scale-105" />
							</span>
							<span class="mt-2.5 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-brand">{item.name}</span>
							<span class="mt-1 block text-sm font-extrabold tabular-nums">{formatPrice(item.price)}</span>
						</a>
					{/each}
				</Rail>
			</div>
		</section>
	{/if}
</div>

<!-- ── Sticky mobile buy bar ── -->
{#if showStickyBar && data.product.stock > 0}
	<div class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md animate-fade-in lg:hidden">
		<div class="flex items-center gap-3">
			<img src={getImageUrl(data.product.image_key)} alt="" class="product-shot size-12 shrink-0 rounded-xl bg-surface p-1" />
			<div class="min-w-0 flex-1">
				<p class="truncate text-xs font-semibold text-ink-muted">{data.product.name}</p>
				<p class="text-base font-extrabold tabular-nums {discount > 0 ? 'text-deal' : ''}">{formatPrice(data.product.price)}</p>
			</div>
			{#if maxAddable > 0}
				<button onclick={() => addToCart()} class="cta cta-brand shrink-0 px-5">
					<Icon name="bag" class="size-4" stroke={2} />
					Add to cart
				</button>
			{:else}
				<a href="/checkout" class="cta cta-brand shrink-0 px-5">Checkout</a>
			{/if}
		</div>
	</div>
{/if}
{#if data.product.stock > 0}
	<div class="h-20 lg:hidden" aria-hidden="true"></div>
{/if}
