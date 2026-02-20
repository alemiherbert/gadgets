<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { formatPrice } from '$lib/utils';
	import { getImageUrl } from '$lib/r2';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Products — Admin</title>
</svelte:head>

<div class="page-header">
	<h1>Products</h1>
	<a href="/admin/products/new" class="btn btn-primary">+ Add Product</a>
</div>

{#if form?.deleted}
	<div class="alert alert-success">Product deleted.</div>
{/if}

{#if data.products.length === 0}
	<div class="card text-center" style="padding:3rem">
		<p class="text-light">No products yet.</p>
		<a href="/admin/products/new" class="btn btn-primary mt-2">Add First Product</a>
	</div>
{:else}
	<div class="table-wrapper card" style="padding:0">
		<table>
			<thead>
				<tr>
					<th>Image</th>
					<th>Name</th>
					<th>Price</th>
					<th>Stock</th>
					<th>Status</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.products as product}
					<tr>
						<td>
							<img src={getImageUrl(product.image_key)} alt="" style="width:48px;height:48px;object-fit:cover;border-radius:4px" />
						</td>
						<td><strong>{product.name}</strong></td>
						<td>{formatPrice(product.price)}</td>
						<td>
							{#if product.stock === 0}
								<span class="badge badge-cancelled">Out of stock</span>
							{:else if product.stock < 5}
								<span class="badge badge-pending">{product.stock}</span>
							{:else}
								{product.stock}
							{/if}
						</td>
						<td>
							{#if product.active}
								<span class="badge badge-delivered">Active</span>
							{:else}
								<span class="badge badge-cancelled">Inactive</span>
							{/if}
						</td>
						<td>
							<div class="flex gap-1">
								<a href="/admin/products/{product.id}/edit" class="btn btn-sm btn-secondary">Edit</a>
								<form method="POST" action="?/delete" use:enhance onsubmit={(e) => { if (!confirm('Delete this product?')) e.preventDefault(); }}>
									<input type="hidden" name="id" value={product.id} />
									<input type="hidden" name="image_key" value={product.image_key ?? ''} />
									<button type="submit" class="btn btn-sm btn-danger">Delete</button>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
