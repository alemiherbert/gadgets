<script lang="ts">
	import type { PageData } from './$types';
	import { formatPrice } from '$lib/utils';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>My Orders — Gadgets Store</title>
</svelte:head>

<div class="container">
	<div class="page-header">
		<h1>My Orders</h1>
		<p class="text-light">Welcome, {data.customer.name}</p>
	</div>

	{#if data.orders.length === 0}
		<div class="card text-center" style="padding:3rem 2rem">
			<p class="text-light">You haven't placed any orders yet.</p>
			<a href="/" class="btn btn-primary mt-2">Start Shopping</a>
		</div>
	{:else}
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Order #</th>
						<th>Date</th>
						<th>Total</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{#each data.orders as order}
						<tr>
							<td>
								<a href="/order-confirmation/{order.id}">#{order.id}</a>
							</td>
							<td>{new Date(order.created_at).toLocaleDateString()}</td>
							<td>{formatPrice(order.total)}</td>
							<td>
								<span class="badge badge-{order.status}">{order.status}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
