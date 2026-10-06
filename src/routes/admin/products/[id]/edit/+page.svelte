<script lang="ts">
import type { PageData, ActionData } from './$types';
import { getImageUrl } from '$lib/r2';
import { enhance } from '$app/forms';
import ProductImagesField from '$lib/components/admin/ProductImagesField.svelte';

let { data, form }: { data: PageData; form: ActionData } = $props();
let submitting = $state(false);

// Parse existing specs into editable rows
function initSpecRows(): { key: string; value: string }[] {
	try {
		const parsed = JSON.parse(data.product.specs || '{}');
		const entries = Object.entries(parsed);
		return entries.length > 0
			? entries.map(([key, value]) => ({ key, value: String(value) }))
			: [{ key: '', value: '' }];
	} catch {
		return [{ key: '', value: '' }];
	}
}

let specRows = $state<{ key: string; value: string }[]>(initSpecRows());

let specsJson = $derived(
	JSON.stringify(
		Object.fromEntries(
			specRows.filter(r => r.key.trim()).map(r => [r.key.trim(), r.value.trim()])
		)
	)
);

function addSpecRow() {
	specRows = [...specRows, { key: '', value: '' }];
}

function removeSpecRow(index: number) {
	specRows = specRows.filter((_, i) => i !== index);
	if (specRows.length === 0) specRows = [{ key: '', value: '' }];
}

function priceToUgx(cents: number): string {
	return (cents / 100).toFixed(0);
}
</script>

<svelte:head>
<title>Edit {data.product.name} — Admin</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<div class="flex items-center gap-3 mb-6">
		<a href="/admin/products" aria-label="Back to products" class="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 hover:bg-zinc-50 transition-colors">
			<svg class="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
			</svg>
		</a>
		<h1 class="text-xl font-bold tracking-tight text-zinc-900">Edit Product</h1>
	</div>

	{#if form?.error}
		<div class="alert alert-error mb-6">{form.error}</div>
	{/if}

	<form
		method="POST"
		enctype="multipart/form-data"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				submitting = false;
				await update();
			};
		}}
		class="max-w-3xl space-y-6"
	>
		<input type="hidden" name="existing_image_key" value={data.product.image_key ?? ''} />

		<!-- Basic info card -->
		<div class="card p-6 space-y-5">
			<h2 class="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Basic Information</h2>

			<div class="form-group">
				<label for="name" class="label">Product Name</label>
				<input id="name" name="name" type="text" required value={data.product.name} class="input" />
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="form-group">
					<label for="sku" class="label">SKU</label>
					<input id="sku" name="sku" type="text" value={data.product.sku} class="input" pattern="[A-Za-z][0-9]{'{5}'}" title="One letter followed by 5 digits (e.g. A12345)" />
					<p class="text-[11px] text-zinc-400 mt-1">Letter prefix + 5 digits (e.g. A12345)</p>
				</div>
				<div class="form-group">
					<label for="slug" class="label">Slug</label>
					<input id="slug" name="slug" type="text" value={data.product.slug} class="input bg-zinc-50 text-zinc-500" readonly />
					<p class="text-[11px] text-zinc-400 mt-1">Auto-generated when name changes</p>
				</div>
			</div>

			<div class="form-group">
				<label for="description" class="label">Description</label>
				<textarea id="description" name="description" rows="4" class="textarea">{data.product.description ?? ''}</textarea>
			</div>

			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
				<div class="form-group">
					<label for="price" class="label">Sale Price (UGX)</label>
					<input id="price" name="price" type="text" required value={priceToUgx(data.product.price)} class="input" />
				</div>
				<div class="form-group">
					<label for="compare_at_price" class="label">Original Price (UGX)</label>
					<input id="compare_at_price" name="compare_at_price" type="text" value={data.product.compare_at_price ? priceToUgx(data.product.compare_at_price) : ''} class="input" />
					<p class="text-[11px] text-zinc-400 mt-1">Leave blank if no discount</p>
				</div>
				<div class="form-group">
					<label for="stock" class="label">Stock</label>
					<input id="stock" name="stock" type="number" required value={data.product.stock} class="input" min="0" />
				</div>
				<div class="form-group flex flex-col justify-end gap-2 pb-1">
					<label class="flex items-center gap-2 cursor-pointer">
						<input name="active" type="checkbox" checked={data.product.active === 1} class="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500" />
						<span class="text-sm font-medium text-zinc-700">Active</span>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input name="featured" type="checkbox" checked={data.product.featured === 1} class="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500" />
						<span class="text-sm font-medium text-zinc-700">Featured</span>
					</label>
				</div>
			</div>
		</div>

		<!-- Categories & Subcategory card -->
		<div class="card p-6 space-y-5">
			<h2 class="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Categorization</h2>

			{#if data.categories.length > 0}
				<div class="form-group">
				<p class="label mb-2">Categories</p>
					<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
						{#each data.categories as cat}
							<label class="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 hover:bg-zinc-50 cursor-pointer transition-colors">
								<input type="checkbox" name="category_ids" value={cat.id} checked={data.productCategoryIds.includes(cat.id)} class="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500" />
								<span class="text-sm text-zinc-700">{cat.name}</span>
							</label>
						{/each}
					</div>
				</div>
			{/if}

			<div class="form-group">
				<label for="subcategory_id" class="label">Subcategory</label>
				<select id="subcategory_id" name="subcategory_id" class="input">
					<option value="">— None —</option>
					{#each Object.entries(data.subcategoriesGrouped) as [catSlug, subs]}
						<optgroup label={catSlug}>
							{#each subs as sub}
								<option value={sub.id} selected={data.product.subcategory_id === sub.id}>{sub.name}</option>
							{/each}
						</optgroup>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label for="brand_id" class="label">Brand</label>
				<select id="brand_id" name="brand_id" class="input">
					<option value="">— None —</option>
					{#each data.brands as brand}
						<option value={brand.id} selected={data.product.brand_id === brand.id}>{brand.name}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Images card -->
		<div class="card p-6 space-y-5">
			<h2 class="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Images</h2>

			<ProductImagesField mainKey={data.product.image_key} existing={data.images} />
		</div>

		<!-- Specifications card -->
		<div class="card p-6 space-y-5">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Specifications</h2>
					<p class="text-xs text-zinc-400 mt-1">Add key-value pairs (e.g. "Battery" → "5000 mAh")</p>
				</div>
				<button type="button" onclick={addSpecRow} class="btn btn-outline btn-sm gap-1">
					<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
					Add Spec
				</button>
			</div>

			<input type="hidden" name="specs_json" value={specsJson} />

			<div class="space-y-2">
				{#each specRows as row, i}
					<div class="flex items-center gap-2">
						<input
							type="text"
							bind:value={row.key}
							placeholder="Key (e.g. Battery)"
							class="input flex-1"
						/>
						<input
							type="text"
							bind:value={row.value}
							placeholder="Value (e.g. 5000 mAh)"
							class="input flex-1"
						/>
						<button
							type="button"
							onclick={() => removeSpecRow(i)}
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors"
							title="Remove"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				{/each}
			</div>
		</div>

		<!-- Submit -->
		<div class="flex gap-3">
			<button type="submit" disabled={submitting} class="btn btn-primary h-10 px-6 font-semibold">
				{submitting ? 'Saving…' : 'Save Changes'}
			</button>
			<a href="/admin/products" class="btn btn-outline h-10">Cancel</a>
		</div>
	</form>
</div>
