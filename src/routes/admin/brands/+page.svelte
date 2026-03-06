<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { getImageUrl } from '$lib/r2';

	let { data, form }: { data: PageData; form: any } = $props();

	let showForm = $state(false);
	let editingId = $state<number | null>(null);
	let brandName = $state('');
	let brandSortOrder = $state(0);
	let existingLogoKey = $state<string | null>(null);

	function startEdit(brand: typeof data.brands[0]) {
		editingId = brand.id;
		brandName = brand.name;
		brandSortOrder = brand.sort_order;
		existingLogoKey = brand.logo_key;
		showForm = true;
	}

	function resetForm() {
		editingId = null;
		brandName = '';
		brandSortOrder = 0;
		existingLogoKey = null;
		showForm = false;
	}
</script>

<svelte:head>
	<title>Brands — Admin</title>
</svelte:head>

<div class="p-4 lg:p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-zinc-900">Brands</h1>
			<p class="text-sm text-zinc-500 mt-1">Manage product brands</p>
		</div>
		<button
			onclick={() => { resetForm(); showForm = true; }}
			class="btn btn-primary btn-sm gap-1.5"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			Add Brand
		</button>
	</div>

	{#if form?.error}
		<div class="alert alert-error">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="alert alert-success">Brand saved successfully.</div>
	{/if}

	<!-- Brand form (create / edit) -->
	{#if showForm}
		<div class="card p-6">
			<h2 class="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">
				{editingId ? 'Edit Brand' : 'New Brand'}
			</h2>

			<form
				method="POST"
				action={editingId ? '?/update' : '?/create'}
				enctype="multipart/form-data"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						if (!form?.error) resetForm();
					};
				}}
				class="space-y-4"
			>
				{#if editingId}
					<input type="hidden" name="id" value={editingId} />
					<input type="hidden" name="existing_logo_key" value={existingLogoKey ?? ''} />
				{/if}

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="form-group">
						<label for="brand-name" class="label">Brand Name</label>
						<input id="brand-name" name="name" type="text" required bind:value={brandName} class="input" placeholder="e.g. Samsung" />
					</div>
					<div class="form-group">
						<label for="brand-sort" class="label">Sort Order</label>
						<input id="brand-sort" name="sort_order" type="number" bind:value={brandSortOrder} class="input" />
					</div>
				</div>

				<div class="form-group">
					<label for="brand-logo" class="label">Logo Image</label>
					<div class="flex items-center gap-4">
						{#if existingLogoKey}
							<div class="h-16 w-16 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
								<img src={getImageUrl(existingLogoKey)} alt="Logo" class="h-full w-full object-contain" />
							</div>
						{/if}
						<input id="brand-logo" name="logo" type="file" accept="image/*" class="text-sm text-zinc-500 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200" />
					</div>
					{#if editingId && existingLogoKey}
						<label class="flex items-center gap-2 mt-2 cursor-pointer">
							<input type="checkbox" name="remove_logo" value="1" class="h-4 w-4 rounded border-zinc-300" />
							<span class="text-sm text-zinc-500">Remove existing logo</span>
						</label>
					{/if}
				</div>

				<div class="flex gap-2">
					<button type="submit" class="btn btn-primary btn-sm">{editingId ? 'Update' : 'Create'} Brand</button>
					<button type="button" onclick={resetForm} class="btn btn-outline btn-sm">Cancel</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Brands list -->
	<div class="card overflow-hidden">
		<table class="table w-full">
			<thead>
				<tr class="bg-zinc-50/80 text-zinc-500 text-xs uppercase tracking-wider">
					<th class="font-semibold py-3 px-4 text-left">Logo</th>
					<th class="font-semibold py-3 px-4 text-left">Name</th>
					<th class="font-semibold py-3 px-4 text-left">Slug</th>
					<th class="font-semibold py-3 px-4 text-center">Products</th>
					<th class="font-semibold py-3 px-4 text-center">Order</th>
					<th class="font-semibold py-3 px-4 text-right">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.brands as brand (brand.id)}
					<tr class="border-t border-zinc-100 hover:bg-zinc-50/50 transition-colors">
						<td class="py-3 px-4">
							{#if brand.logo_key}
								<div class="h-10 w-10 overflow-hidden rounded-lg border border-zinc-200 bg-white">
									<img src={getImageUrl(brand.logo_key)} alt={brand.name} class="h-full w-full object-contain" />
								</div>
							{:else}
								<div class="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm font-bold">
									{brand.name.charAt(0)}
								</div>
							{/if}
						</td>
						<td class="py-3 px-4 font-medium text-zinc-900">{brand.name}</td>
						<td class="py-3 px-4 text-sm text-zinc-500">{brand.slug}</td>
						<td class="py-3 px-4 text-center text-sm text-zinc-600">{brand.product_count ?? 0}</td>
						<td class="py-3 px-4 text-center text-sm text-zinc-600">{brand.sort_order}</td>
						<td class="py-3 px-4 text-right">
							<div class="flex items-center justify-end gap-1">
								<button
									onclick={() => startEdit(brand)}
									class="btn btn-ghost btn-xs"
								>
									Edit
								</button>
								<form
									method="POST"
									action="?/delete"
									use:enhance={() => {
										if (!confirm(`Delete brand "${brand.name}"?`)) {
											return ({ cancel }: { cancel: () => void }) => cancel();
										}
										return async ({ update }) => { await update(); };
									}}
								>
									<input type="hidden" name="id" value={brand.id} />
									<input type="hidden" name="logo_key" value={brand.logo_key ?? ''} />
									<button type="submit" class="btn btn-ghost btn-xs text-red-500 hover:text-red-700">Delete</button>
								</form>
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="py-12 text-center text-zinc-400">
							No brands yet. Add your first brand.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
