<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { getImageUrl } from '$lib/r2';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let product = $derived(data.product);
</script>

<svelte:head>
	<title>Edit {product.name} — Admin</title>
</svelte:head>

<a href="/admin/products" class="text-light" style="font-size:0.85rem">&larr; Back to Products</a>
<h1 class="mt-1 mb-2">Edit Product</h1>

{#if form?.error}
	<div class="alert alert-error">{form.error}</div>
{/if}

<div class="card" style="max-width:600px">
	<form method="POST" enctype="multipart/form-data" use:enhance>
		<input type="hidden" name="existing_image_key" value={product.image_key ?? ''} />

		<div class="form-group">
			<label for="name">Product Name</label>
			<input type="text" id="name" name="name" required value={product.name} />
		</div>
		<div class="form-group">
			<label for="description">Description</label>
			<textarea id="description" name="description" rows="4">{product.description}</textarea>
		</div>
		<div class="form-row">
			<div class="form-group">
				<label for="price">Price ($)</label>
				<input type="number" id="price" name="price" step="0.01" min="0.01" required value={(product.price / 100).toFixed(2)} />
			</div>
			<div class="form-group">
				<label for="stock">Stock</label>
				<input type="number" id="stock" name="stock" min="0" required value={product.stock} />
			</div>
		</div>

		{#if product.image_key}
			<div class="form-group">
				<label for="current-img">Current Image</label>
				<img src={getImageUrl(product.image_key)} alt="" class="current-image" />
			</div>
		{/if}

		<div class="form-group">
			<label for="image">{product.image_key ? 'Replace Image' : 'Product Image'}</label>
			<input type="file" id="image" name="image" accept="image/*" />
		</div>

		<div class="form-group">
			<label class="checkbox-label">
				<input type="checkbox" name="active" checked={product.active === 1} />
				Active (visible to customers)
			</label>
		</div>

		<button type="submit" class="btn btn-primary">Save Changes</button>
	</form>
</div>

<style>
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	.current-image {
		width: 120px;
		height: 120px;
		object-fit: cover;
		border-radius: var(--radius);
		border: 1px solid var(--color-border);
	}
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}
	.checkbox-label input {
		width: auto;
	}
</style>
