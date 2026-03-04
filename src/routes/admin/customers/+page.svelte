<script lang="ts">
import type { PageData } from './$types';
import { formatPrice } from '$lib/utils';

let { data }: { data: PageData } = $props();
</script>

<svelte:head>
<title>Customers — Admin</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold tracking-tight text-zinc-900">Customers</h1>
			<p class="text-sm text-zinc-500 mt-1">{data.customers.length} registered customer{data.customers.length !== 1 ? 's' : ''}</p>
		</div>
	</div>

	{#if data.customers.length === 0}
		<div class="card p-8 text-center">
			<svg class="mx-auto h-10 w-10 text-zinc-200 mb-3" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
			</svg>
			<p class="text-sm text-zinc-500">No customers have registered yet.</p>
		</div>
	{:else}
		<div class="card overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-zinc-200 bg-zinc-50">
							<th class="px-4 py-3 text-left font-medium text-zinc-500">Customer</th>
							<th class="px-4 py-3 text-left font-medium text-zinc-500">Email</th>
							<th class="px-4 py-3 text-left font-medium text-zinc-500">Phone</th>
							<th class="px-4 py-3 text-right font-medium text-zinc-500">Orders</th>
							<th class="px-4 py-3 text-right font-medium text-zinc-500">Total Spent</th>
							<th class="px-4 py-3 text-right font-medium text-zinc-500">Joined</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-zinc-100">
						{#each data.customers as customer}
							<tr class="hover:bg-zinc-50 transition-colors">
								<td class="px-4 py-3">
									<div class="flex items-center gap-3">
										<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 text-xs font-semibold text-zinc-600">
											{customer.name.charAt(0).toUpperCase()}
										</div>
										<span class="font-medium text-zinc-900">{customer.name}</span>
									</div>
								</td>
								<td class="px-4 py-3 text-zinc-600">{customer.email}</td>
								<td class="px-4 py-3 text-zinc-600">{customer.phone || '—'}</td>
								<td class="px-4 py-3 text-right">
									<span class="inline-flex items-center rounded-xs bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">{customer.order_count}</span>
								</td>
								<td class="px-4 py-3 text-right font-medium text-zinc-900">{formatPrice(customer.total_spent)}</td>
								<td class="px-4 py-3 text-right text-zinc-500 text-xs">
									{new Date(customer.created_at).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' })}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
