<script lang="ts">
import type { PageData } from './$types';
import { formatPrice } from '$lib/utils';
import { getImageUrl } from '$lib/r2';
import { enhance } from '$app/forms';

let { data }: { data: PageData } = $props();
</script>

<svelte:head>
<title>Products — Admin</title>
</svelte:head>

<div class="p-6 lg:p-8">
<div class="flex items-center justify-between mb-6">
<h1 class="text-xl font-bold tracking-tight text-zinc-900">Products</h1>
<a href="/admin/products/new" class="btn btn-primary btn-sm gap-1">
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
</svg>
Add Product
</a>
</div>

{#if data.products.length === 0}
<div class="card p-8 text-center">
<p class="text-sm text-zinc-500 mb-4">No products yet.</p>
<a href="/admin/products/new" class="btn btn-primary">Add Your First Product</a>
</div>
{:else}
<div class="card overflow-hidden">
<div class="overflow-x-auto">
<table class="w-full text-sm">
<thead>
<tr class="border-b border-zinc-200 bg-zinc-50">
<th class="px-4 py-3 text-left font-medium text-zinc-500">Product</th>
<th class="px-4 py-3 text-left font-medium text-zinc-500">SKU</th>
<th class="px-4 py-3 text-right font-medium text-zinc-500">Price</th>
<th class="px-4 py-3 text-right font-medium text-zinc-500">Stock</th>
<th class="px-4 py-3 text-center font-medium text-zinc-500">Status</th>
<th class="px-4 py-3"></th>
</tr>
</thead>
<tbody class="divide-y divide-zinc-100">
{#each data.products as product}
<tr class="hover:bg-zinc-50 transition-colors">
<td class="px-4 py-3">
<div class="flex items-center gap-3">
<div class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 border border-zinc-200">
{#if product.image_key}
<img src={getImageUrl(product.image_key)} alt={product.name} class="h-full w-full object-cover" />
{:else}
<div class="h-full w-full bg-zinc-100"></div>
{/if}
</div>
<span class="font-medium text-zinc-900">{product.name}</span>
</div>
</td>
<td class="px-4 py-3 text-left font-mono text-xs text-zinc-500">{product.sku}</td>
<td class="px-4 py-3 text-right">{formatPrice(product.price)}</td>
<td class="px-4 py-3 text-right">
<span class="{product.stock === 0 ? 'text-red-500 font-medium' : product.stock < 5 ? 'text-amber-600' : 'text-zinc-900'}">
{product.stock}
</span>
</td>
<td class="px-4 py-3 text-center">
<span class="badge {product.active ? 'badge-success' : 'badge-secondary'}">
{product.active ? 'Active' : 'Inactive'}
</span>
</td>
<td class="px-4 py-3">
<div class="flex items-center justify-end gap-2">
<a href="/admin/products/{product.id}/edit" class="btn btn-ghost btn-sm text-zinc-500">
Edit
</a>
<form method="POST" action="?/delete" use:enhance onsubmit={(e) => { if (!confirm('Delete this product?')) e.preventDefault(); }}>
<input type="hidden" name="id" value={product.id} />
<input type="hidden" name="image_key" value={product.image_key ?? ''} />
<button type="submit" class="btn btn-ghost btn-sm text-red-500 hover:text-red-700">
Delete
</button>
</form>
</div>
</td>
</tr>
{/each}
</tbody>
</table>
</div>
</div>
{/if}
</div>
