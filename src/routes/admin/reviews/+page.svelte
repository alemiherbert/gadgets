<script lang="ts">
import type { PageData } from './$types';
import { enhance } from '$app/forms';

let { data }: { data: PageData } = $props();
</script>

<svelte:head>
<title>Reviews — Admin</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold tracking-tight text-zinc-900">Reviews</h1>
			<p class="text-sm text-zinc-500 mt-1">{data.reviews.length} review{data.reviews.length !== 1 ? 's' : ''} total</p>
		</div>
	</div>

	{#if data.reviews.length === 0}
		<div class="card p-8 text-center">
			<svg class="mx-auto h-10 w-10 text-zinc-200 mb-3" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
			</svg>
			<p class="text-sm text-zinc-500">No reviews have been submitted yet.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each data.reviews as review}
				<div class="card p-5 hover:border-zinc-200 transition-colors">
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-3 mb-2 flex-wrap">
								<div class="flex gap-0.5">
									{#each [1,2,3,4,5] as s}
										<svg class="h-4 w-4 {s <= review.rating ? 'text-amber-400' : 'text-zinc-200'}" fill="currentColor" viewBox="0 0 20 20">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
										</svg>
									{/each}
								</div>
								{#if review.title}
									<span class="font-semibold text-zinc-900 text-sm">{review.title}</span>
								{/if}
							</div>

							<div class="flex items-center gap-2 mb-2 text-xs text-zinc-500">
								<span class="font-medium text-zinc-700">{review.customer_name}</span>
								<span>&middot;</span>
								<a href="/admin/products/{review.product_id}/edit" class="text-zinc-500 hover:text-zinc-900 underline decoration-zinc-300 hover:decoration-zinc-500 transition-colors">
									{review.product_name}
								</a>
								<span>&middot;</span>
								<span>{new Date(review.created_at).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
							</div>

							{#if review.body}
								<p class="text-sm text-zinc-600 leading-relaxed">{review.body}</p>
							{/if}
						</div>

						<form method="POST" action="?/delete" use:enhance onsubmit={(e) => { if (!confirm('Delete this review?')) e.preventDefault(); }}>
							<input type="hidden" name="id" value={review.id} />
							<button type="submit" class="flex h-8 w-8 items-center justify-center rounded-xs text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Delete review">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
								</svg>
							</button>
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
