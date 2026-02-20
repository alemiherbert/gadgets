<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>New Product — Admin</title>
</svelte:head>

<a href="/admin/products" class="text-light" style="font-size:0.85rem">&larr; Back to Products</a>
<h1 class="mt-1 mb-2">Add New Product</h1>

{#if form?.error}
	<div class="alert alert-error">{form.error}</div>
{/if}

<div class="card" style="max-width:600px">
	<form method="POST" enctype="multipart/form-data" use:enhance>
		<div class="form-group">
			<label for="name">Product Name</label>
			<input type="text" id="name" name="name" required value={form?.name ?? ''} />
		</div>
		<div class="form-group">
			<label for="description">Description</label>
			<textarea id="description" name="description" rows="4">{form?.description ?? ''}</textarea>
		</div>
		<div class="form-row">
			<div class="form-group">
				<label for="price">Price ($)</label>
				<input type="number" id="price" name="price" step="0.01" min="0.01" required value={form?.price ?? ''} />
			</div>
			<div class="form-group">
				<label for="stock">Stock</label>
				<input type="number" id="stock" name="stock" min="0" required value={form?.stock ?? '0'} />
			</div>
		</div>
		<div class="form-group">
			<label for="image">Product Image</label>
			<input type="file" id="image" name="image" accept="image/*" />
		</div>
		<button type="submit" class="btn btn-primary">Create Product</button>
	</form>
</div>

<style>
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
</style>
