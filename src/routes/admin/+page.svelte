<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Admin Dashboard — Gadgets Store</title>
</svelte:head>

<h1 class="mb-2">Dashboard</h1>

<div class="grid grid-4">
	<div class="stat-card">
		<div class="stat-value">{data.counts.total}</div>
		<div class="stat-label">Total Orders</div>
	</div>
	<div class="stat-card">
		<div class="stat-value">{data.counts.pending}</div>
		<div class="stat-label">Pending</div>
	</div>
	<div class="stat-card">
		<div class="stat-value">{data.counts.confirmed}</div>
		<div class="stat-label">Confirmed</div>
	</div>
	<div class="stat-card">
		<div class="stat-value">{data.counts.today}</div>
		<div class="stat-label">Today's Orders</div>
	</div>
</div>

{#if data.lowStock.length > 0}
	<div class="mt-3">
		<h2 class="mb-1">⚠ Low Stock Products</h2>
		<div class="table-wrapper card" style="padding:0">
			<table>
				<thead>
					<tr>
						<th>Product</th>
						<th>Stock</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					{#each data.lowStock as product}
						<tr>
							<td>{product.name}</td>
							<td>
								<span class="badge" class:badge-cancelled={product.stock === 0} class:badge-pending={product.stock > 0}>
									{product.stock} left
								</span>
							</td>
							<td>
								<a href="/admin/products/{product.id}/edit" class="btn btn-sm btn-secondary">Edit</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}

<div class="mt-3">
	<h2 class="mb-1">Quick Links</h2>
	<div class="flex gap-2" style="flex-wrap:wrap">
		<a href="/admin/orders" class="btn btn-secondary">View All Orders</a>
		<a href="/admin/orders?status=pending" class="btn btn-secondary">Pending Orders ({data.counts.pending})</a>
		<a href="/admin/products/new" class="btn btn-primary">Add New Product</a>
	</div>
</div>
