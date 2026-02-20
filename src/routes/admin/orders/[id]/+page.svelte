<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { formatPrice } from '$lib/utils';
	import { enhance } from '$app/forms';
	import { getImageUrl } from '$lib/r2';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
</script>

<svelte:head>
	<title>Order #{data.order.id} — Admin</title>
</svelte:head>

<div class="page-header">
	<div>
		<a href="/admin/orders" class="text-light" style="font-size:0.85rem">&larr; Back to Orders</a>
		<h1>Order #{data.order.id}</h1>
	</div>
	<span class="badge badge-{data.order.status}" style="font-size:0.9rem;padding:0.4rem 1rem">
		{data.order.status}
	</span>
</div>

{#if form?.success}
	<div class="alert alert-success">Status updated successfully.</div>
{/if}

<div class="order-grid">
	<div class="card">
		<h2>Customer Info</h2>
		<dl>
			<dt>Name</dt>
			<dd>{data.order.name}</dd>
			<dt>Email</dt>
			<dd>{data.order.email}</dd>
			<dt>Phone</dt>
			<dd>{data.order.phone}</dd>
		</dl>
	</div>

	<div class="card">
		<h2>Delivery Address</h2>
		<p>{data.address.street}</p>
		<p>{data.address.city}, {data.address.state}</p>

		{#if data.order.notes}
			<h3 class="mt-2">Notes</h3>
			<p class="text-light">{data.order.notes}</p>
		{/if}
	</div>

	<div class="card">
		<h2>Update Status</h2>
		<form method="POST" action="?/updateStatus" use:enhance>
			<div class="flex gap-1">
				<select name="status" class="status-select">
					{#each statuses as s}
						<option value={s} selected={data.order.status === s}>{s}</option>
					{/each}
				</select>
				<button type="submit" class="btn btn-primary btn-sm">Update</button>
			</div>
		</form>
	</div>

	<div class="card">
		<h2>Order Date</h2>
		<p>{new Date(data.order.created_at).toLocaleString()}</p>
		{#if data.order.customer_id}
			<p class="mt-1 text-light">Customer ID: {data.order.customer_id}</p>
		{:else}
			<p class="mt-1 text-light">Guest order</p>
		{/if}
	</div>
</div>

<div class="card mt-2">
	<h2>Order Items</h2>
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>Product</th>
					<th>Qty</th>
					<th>Unit Price</th>
					<th>Subtotal</th>
				</tr>
			</thead>
			<tbody>
				{#each data.items as item}
					<tr>
						<td class="flex gap-1" style="align-items:center">
							<img src={getImageUrl(item.product_image_key)} alt="" style="width:40px;height:40px;object-fit:cover;border-radius:4px" />
							{item.product_name}
						</td>
						<td>{item.quantity}</td>
						<td>{formatPrice(item.price_at_purchase)}</td>
						<td>{formatPrice(item.price_at_purchase * item.quantity)}</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr>
					<td colspan="3" class="text-right"><strong>Total</strong></td>
					<td><strong>{formatPrice(data.order.total)}</strong></td>
				</tr>
			</tfoot>
		</table>
	</div>
</div>

<style>
	.order-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	@media (max-width: 768px) {
		.order-grid {
			grid-template-columns: 1fr;
		}
	}
	h2 {
		font-size: 1rem;
		margin-bottom: 0.75rem;
	}
	h3 {
		font-size: 0.9rem;
	}
	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.375rem 1rem;
	}
	dt {
		font-weight: 600;
		font-size: 0.85rem;
		color: var(--color-text-light);
	}
	dd {
		font-size: 0.9rem;
	}
	.status-select {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: 0.9rem;
		text-transform: capitalize;
	}
	tfoot td {
		font-size: 1rem;
		border-top: 2px solid var(--color-border);
	}
</style>
