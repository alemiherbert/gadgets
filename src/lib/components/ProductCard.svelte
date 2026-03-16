<script lang="ts">
    import type { Product } from '$lib/types';
    import { formatPrice, discountPercent } from '$lib/utils';
    import { getImageUrl } from '$lib/r2';
    import { cart } from '$lib/cart.svelte';

    let { product }: { product: Product } = $props();

    const discount = $derived(discountPercent(product.price, product.compare_at_price));

    let existingQty = $derived(cart.getItemQuantity(product.id));
    let canAdd = $derived(product.stock > existingQty);

    // Prepare badges for the slideshow
    const badges = $derived(() => {
        const items: { text: string; style: string }[] = [];

        // 1. Stock Status
        if (product.stock <= 0) {
            items.push({ text: 'Sold Out', style: 'bg-red-500 text-white' });
        } else if (product.stock < 10) {
            items.push({ text: `${product.stock} left`, style: 'bg-orange-100 text-orange-600' });
        }

        // 2. Discount
        if (discount > 0) {
            items.push({ text: `-${discount}%`, style: 'bg-orange-400 text-white' });
        }

        // 3. Condition (New/Refurbished)
        const condition = (product as any).condition || (product as any).tags?.find((t: string) => t.toLowerCase() === 'refurbished' ? 'Refurbished' : 'New');
        
        if (condition === 'refurbished') {
            items.push({ text: 'Refurbished', style: 'bg-slate-600 text-white' });
        } else if (condition === 'new') {
            items.push({ text: 'New', style: 'bg-blue-500 text-white' });
        }

        return items;
    });

    // Slideshow Animation Logic
    let badgeIndex = $state(0);
    let visibleBadges = $derived(badges());

    let displayList = $derived(
        visibleBadges.length > 1 ? [...visibleBadges, visibleBadges[0]] : visibleBadges
    );

    $effect(() => {
        if (visibleBadges.length <= 1) return;

        const interval = setInterval(() => {
            badgeIndex += 1;

            if (badgeIndex === visibleBadges.length) {
                setTimeout(() => {
                    badgeIndex = 0;
                }, 500);
            }
        }, 3000);

        return () => clearInterval(interval);
    });

    function quickAdd(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (!canAdd) return;
        cart.addItem({
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            imageUrl: getImageUrl(product.image_key),
            stock: product.stock
        });
    }
</script>

<a
    href="/products/{product.slug}"
    class="group relative flex flex-col h-full transition-all duration-200 overflow-hidden"
>
    <!-- Image -->
    <div class="relative w-full aspect-square rounded-sm bg-slate-50 overflow-hidden shrink-0">
        {#if product.image_key}
            <img
                src={getImageUrl(product.image_key)}
                alt={product.name}
                loading="lazy"
                decoding="async"
                class="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
        {:else}
            <div class="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-50">
                <svg class="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
            </div>
        {/if}

        <!-- Top Right Badge Slideshow -->
        {#if visibleBadges.length > 0}
            <div class="absolute top-2 right-2 z-10 h-5 overflow-hidden rounded-xs pointer-events-none">
                <div 
                    class="flex flex-col transition-transform duration-500 ease-in-out"
                    style="transform: translateY(-{badgeIndex * 20}px)"
                >
                    {#each displayList as badge}
                        <span class="flex items-center justify-center h-5 text-[10px] font-bold px-1.5 whitespace-nowrap {badge.style}">
                            {badge.text}
                        </span>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Bottom Left: Rating Badge -->
        {#if product.rating !== undefined}
            <div class="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-white text-slate-700 text-[10px] font-bold px-1.5 h-5 rounded-xs pointer-events-none border border-slate-100">
                <span>{product.rating?.toFixed(1)}</span>
                <svg class="w-2.5 h-2.5 text-amber-400 fill-current" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span class="text-slate-500 font-medium">({product.review_count || 0})</span>
            </div>
        {/if}

        <!-- Bottom Right: Quick add button (Always Visible) -->
        {#if product.stock > 0}
            {#if canAdd}
                <button
                    onclick={quickAdd}
                    class="absolute bottom-2 right-2 bg-orange-500 hover:bg-orange-600 text-white rounded-sm p-2 shadow-lg transition-colors duration-200 z-10"
                    aria-label="Add {product.name} to cart"
                >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                    </svg>
                </button>
            {:else}
                <div class="absolute bottom-2 right-2 bg-orange-400 text-white rounded-sm p-2 shadow-lg z-10 pointer-events-none">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </div>
            {/if}
        {/if}
    </div>

    <!-- Info -->
    <div class="flex flex-col px-2 pt-3">
        <h3 class="text-sm font-medium text-slate-900 line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors">
            {product.name}
        </h3>
        <div class="flex flex-col gap-1">
            <div class="flex flex-col gap-0.5">
                <span class="text-base font-bold text-slate-800">{formatPrice(product.price)}</span>
                {#if product.compare_at_price && product.compare_at_price > product.price}
                    <span class="text-xs text-slate-400 line-through">{formatPrice(product.compare_at_price)}</span>
                {/if}
            </div>
        </div>
    </div>
</a>
