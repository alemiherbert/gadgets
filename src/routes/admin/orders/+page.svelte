<script lang="ts">
	import type { PageData } from './$types';
	import { formatPrice } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	const statuses = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
</script>

<svelte:head>
	<title>Orders — Admin</title>
</svelte:head>

<div class="page-header">
	<h1>Orders</h1>
</div>

<div class="filters mb-2">
	{#each statuses as status}
		<a
			href="/admin/orders?status={status}"
			class="filter-btn"
			class:active={data.currentStatus === status}
		>
			{status}
		</a>
	{/each}
</div>

{#if data.orders.length === 0}
	<div class="card text-center" style="padding:3rem">
		<p class="text-light">No orders found.</p>
	</div>
{:else}
	<div class="table-wrapper card" style="padding:0">
		<table>
			<thead>
				<tr>
					<th>Order #</th>
					<th>Customer</th>
					<th>Phone</th>
					<th>Total</th>
					<th>Status</th>
					<th>Date</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.orders as order}
					<tr>
						<td><strong>#{order.id}</strong></td>
						<td>{order.name}</td>
						<td>{order.phone}</td>
						<td>{formatPrice(order.total)}</td>
						<td><span class="badge badge-{order.status}">{order.status}</span></td>
						<td>{new Date(order.created_at).toLocaleDateString()}</td>
						<td>
							<a href="/admin/orders/{order.id}" class="btn btn-sm btn-secondary">View</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.filters {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.filter-btn {
		padding: 0.375rem 0.875rem;
		border-radius: 999px;
		font-size: 0.85rem;
		text-decoration: none;
		color: var(--color-text);
		background: white;
		border: 1px solid var(--color-border);
		text-transform: capitalize;
		transition: all 0.15s;
	}
	.filter-btn:hover {
		text-decoration: none;
		border-color: var(--color-primary);
		color: var(--color-primary);
	}
	.filter-btn.active {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}
</style>
