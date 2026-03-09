<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { getImageUrl } from '$lib/r2';

	let { data, form }: { data: PageData; form: any } = $props();

	// ── Category state ──
	let showCatForm = $state(false);
	let editingCat = $state<number | null>(null);
	let catName = $state('');
	let catDescription = $state('');
	let catIcon = $state('');
	let catSortOrder = $state(0);
	let catExistingImageKey = $state<string | null>(null);

	// ── Subcategory state ──
	let showSubForm = $state(false);
	let editingSub = $state<number | null>(null);
	let subName = $state('');
	let subCategoryId = $state<number | null>(null);
	let subSortOrder = $state(0);

	function startEditCat(cat: typeof data.categories[0]) {
		editingCat = cat.id;
		catName = cat.name;
		catDescription = cat.description;
		catIcon = cat.icon;
		catSortOrder = cat.sort_order;
		catExistingImageKey = cat.image_key;
		showCatForm = true;
	}

	function resetCatForm() {
		editingCat = null;
		catName = '';
		catDescription = '';
		catIcon = '';
		catSortOrder = 0;
		catExistingImageKey = null;
		showCatForm = false;
	}

	function startEditSub(sub: typeof data.subcategories[0]) {
		editingSub = sub.id;
		subName = sub.name;
		subCategoryId = sub.category_id;
		subSortOrder = sub.sort_order;
		showSubForm = true;
	}

	function resetSubForm() {
		editingSub = null;
		subName = '';
		subCategoryId = null;
		subSortOrder = 0;
		showSubForm = false;
	}

	// Group subcategories by category for display
	let subcategoriesByCategory = $derived.by(() => {
		const grouped: Record<number, typeof data.subcategories> = {};
		for (const sub of data.subcategories) {
			if (!grouped[sub.category_id]) grouped[sub.category_id] = [];
			grouped[sub.category_id].push(sub);
		}
		return grouped;
	});
</script>

<svelte:head>
	<title>Categories — Admin</title>
</svelte:head>

<div class="p-4 lg:p-6 space-y-6">
	<!-- Page header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-zinc-900">Categories</h1>
			<p class="text-sm text-zinc-500 mt-1">Manage product categories and subcategories</p>
		</div>
		<div class="flex gap-2">
			<button onclick={() => { resetSubForm(); showSubForm = !showSubForm; }} class="inline-flex items-center gap-1.5 rounded-xs border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
				Subcategory
			</button>
			<button onclick={() => { resetCatForm(); showCatForm = !showCatForm; }} class="inline-flex items-center gap-1.5 rounded-xs bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors cursor-pointer">
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
				Category
			</button>
		</div>
	</div>

	<!-- Error messages -->
	{#if form?.error}
		<div class="rounded-xs border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form.error}</div>
	{/if}
	{#if form?.subError}
		<div class="rounded-xs border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form.subError}</div>
	{/if}

	<!-- Category form (create / edit) -->
	{#if showCatForm}
		<div class="rounded-xs border border-zinc-200 bg-white shadow-sm">
			<div class="px-5 py-4 border-b border-zinc-100">
				<h2 class="text-sm font-semibold text-zinc-900">{editingCat ? 'Edit Category' : 'New Category'}</h2>
			</div>
			<form
				method="POST"
				action={editingCat ? '?/updateCategory' : '?/createCategory'}
				enctype="multipart/form-data"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						if (!form?.error) resetCatForm();
					};
				}}
				class="p-5 space-y-4"
			>
				{#if editingCat}
					<input type="hidden" name="id" value={editingCat} />
					{#if catExistingImageKey}
						<input type="hidden" name="existing_image_key" value={catExistingImageKey} />
					{/if}
				{/if}

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="cat-name" class="block text-sm font-medium text-zinc-700 mb-1">Name <span class="text-red-400">*</span></label>
						<input id="cat-name" name="name" type="text" required bind:value={catName}
							class="w-full rounded-xs border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none" placeholder="e.g. Phones" />
					</div>
					<div>
						<label for="cat-sort" class="block text-sm font-medium text-zinc-700 mb-1">Sort Order</label>
						<input id="cat-sort" name="sort_order" type="number" bind:value={catSortOrder}
							class="w-full rounded-xs border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none" />
					</div>
				</div>

				<div>
					<label for="cat-desc" class="block text-sm font-medium text-zinc-700 mb-1">Description</label>
					<textarea id="cat-desc" name="description" rows="2" bind:value={catDescription}
						class="w-full rounded-xs border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none resize-y" placeholder="Brief description…"></textarea>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="cat-icon" class="block text-sm font-medium text-zinc-700 mb-1">Icon Path</label>
						<input id="cat-icon" name="icon" type="text" bind:value={catIcon}
							class="w-full rounded-xs border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none" placeholder="/img/categories/phones.avif" />
					</div>
					<div>
						<label for="cat-image" class="block text-sm font-medium text-zinc-700 mb-1">Image {editingCat && catExistingImageKey ? '(replace)' : ''}</label>
						<input id="cat-image" name="image" type="file" accept="image/*"
							class="w-full rounded-xs border border-zinc-300 px-3 py-1.5 text-sm shadow-sm file:mr-3 file:rounded-xs file:border-0 file:bg-zinc-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200" />
						{#if editingCat && catExistingImageKey}
							<div class="mt-2 flex items-center gap-3">
								<img src={getImageUrl(catExistingImageKey)} alt="Current category" class="h-10 w-10 rounded-xs object-cover border border-zinc-200" />
								<div class="min-w-0">
									<p class="text-xs text-zinc-400 truncate">Current: {catExistingImageKey}</p>
									<label class="mt-1 inline-flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
										<input type="checkbox" name="remove_image" value="1" class="h-3.5 w-3.5 rounded border-zinc-300" />
										Remove current image
									</label>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-2 pt-2">
					<button type="submit" class="inline-flex items-center gap-1.5 rounded-xs bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors cursor-pointer">
						{editingCat ? 'Update Category' : 'Create Category'}
					</button>
					<button type="button" onclick={resetCatForm} class="inline-flex items-center rounded-xs border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">
						Cancel
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Subcategory form (create / edit) -->
	{#if showSubForm}
		<div class="rounded-xs border border-zinc-200 bg-white shadow-sm">
			<div class="px-5 py-4 border-b border-zinc-100">
				<h2 class="text-sm font-semibold text-zinc-900">{editingSub ? 'Edit Subcategory' : 'New Subcategory'}</h2>
			</div>
			<form
				method="POST"
				action={editingSub ? '?/updateSubcategory' : '?/createSubcategory'}
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						if (!form?.subError) resetSubForm();
					};
				}}
				class="p-5 space-y-4"
			>
				{#if editingSub}
					<input type="hidden" name="id" value={editingSub} />
				{/if}

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div>
						<label for="sub-name" class="block text-sm font-medium text-zinc-700 mb-1">Name <span class="text-red-400">*</span></label>
						<input id="sub-name" name="name" type="text" required bind:value={subName}
							class="w-full rounded-xs border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none" placeholder="e.g. Smartphones" />
					</div>
					<div>
						<label for="sub-cat" class="block text-sm font-medium text-zinc-700 mb-1">Parent Category <span class="text-red-400">*</span></label>
						<select id="sub-cat" name="category_id" required bind:value={subCategoryId}
							class="w-full rounded-xs border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none">
							<option value="">— Select —</option>
							{#each data.categories as cat}
								<option value={cat.id}>{cat.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="sub-sort" class="block text-sm font-medium text-zinc-700 mb-1">Sort Order</label>
						<input id="sub-sort" name="sort_order" type="number" bind:value={subSortOrder}
							class="w-full rounded-xs border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none" />
					</div>
				</div>

				<div class="flex items-center gap-2 pt-2">
					<button type="submit" class="inline-flex items-center gap-1.5 rounded-xs bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors cursor-pointer">
						{editingSub ? 'Update Subcategory' : 'Create Subcategory'}
					</button>
					<button type="button" onclick={resetSubForm} class="inline-flex items-center rounded-xs border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">
						Cancel
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Categories list -->
	<div class="space-y-4">
		{#if data.categories.length === 0}
			<div class="rounded-xs border border-zinc-200 bg-white p-12 text-center shadow-sm">
				<div class="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 mx-auto mb-4">
					<svg class="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
					</svg>
				</div>
				<p class="text-sm font-medium text-zinc-900 mb-1">No categories yet</p>
				<p class="text-xs text-zinc-500">Create your first category to organize products.</p>
			</div>
		{:else}
			{#each data.categories as cat (cat.id)}
				<div class="rounded-xs border border-zinc-200 bg-white shadow-sm">
					<!-- Category header -->
					<div class="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
						<div class="flex items-center gap-3 min-w-0">
							{#if cat.image_key}
								<img src={getImageUrl(cat.image_key)} alt={cat.name} class="h-10 w-10 rounded-xs object-cover" />
							{:else if cat.icon}
								<img src={cat.icon} alt={cat.name} class="h-10 w-10 rounded-xs object-cover" />
							{:else}
								<div class="flex h-10 w-10 items-center justify-center rounded-xs bg-zinc-100">
									<svg class="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
									</svg>
								</div>
							{/if}
							<div class="min-w-0">
								<h3 class="text-sm font-semibold text-zinc-900 truncate">{cat.name}</h3>
								<div class="flex items-center gap-2 mt-0.5">
									<span class="text-xs text-zinc-400">/{cat.slug}</span>
									{#if cat.description}
										<span class="text-xs text-zinc-300">·</span>
										<span class="text-xs text-zinc-500 truncate max-w-48">{cat.description}</span>
									{/if}
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2 shrink-0 ml-4">
							<span class="inline-flex items-center rounded-xs bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
								{cat.product_count ?? 0} product{(cat.product_count ?? 0) !== 1 ? 's' : ''}
							</span>
							<span class="inline-flex items-center rounded-xs bg-zinc-50 px-2 py-0.5 text-xs text-zinc-400">
								#{cat.sort_order}
							</span>
							<button onclick={() => startEditCat(cat)} class="flex h-7 w-7 items-center justify-center rounded-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer" aria-label="Edit {cat.name}">
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
								</svg>
							</button>
							<form method="POST" action="?/deleteCategory" use:enhance class="inline">
								<input type="hidden" name="id" value={cat.id} />
								{#if cat.image_key}
									<input type="hidden" name="image_key" value={cat.image_key} />
								{/if}
								<button
									type="submit"
									onclick={(e) => { if (!confirm(`Delete "${cat.name}" and all its subcategories?`)) e.preventDefault(); }}
									class="flex h-7 w-7 items-center justify-center rounded-xs text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
									aria-label="Delete {cat.name}"
								>
									<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
									</svg>
								</button>
							</form>
						</div>
					</div>

					<!-- Subcategories for this category -->
					{#if subcategoriesByCategory[cat.id]?.length}
						<div class="divide-y divide-zinc-50">
							{#each subcategoriesByCategory[cat.id] as sub (sub.id)}
								<div class="flex items-center justify-between px-5 py-3 pl-14 hover:bg-zinc-50/50 transition-colors">
									<div class="flex items-center gap-2 min-w-0">
										<svg class="h-3.5 w-3.5 text-zinc-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
										</svg>
										<span class="text-sm text-zinc-700">{sub.name}</span>
										<span class="text-xs text-zinc-400">/{sub.slug}</span>
									</div>
									<div class="flex items-center gap-2 shrink-0 ml-4">
										<span class="text-xs text-zinc-400">{sub.product_count ?? 0} product{(sub.product_count ?? 0) !== 1 ? 's' : ''}</span>
										<span class="inline-flex items-center rounded-xs bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-400">#{sub.sort_order}</span>
										<button onclick={() => startEditSub(sub)} class="flex h-6 w-6 items-center justify-center rounded-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer" aria-label="Edit {sub.name}">
											<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
											</svg>
										</button>
										<form method="POST" action="?/deleteSubcategory" use:enhance class="inline">
											<input type="hidden" name="id" value={sub.id} />
											<button
												type="submit"
												onclick={(e) => { if (!confirm(`Delete subcategory "${sub.name}"?`)) e.preventDefault(); }}
												class="flex h-6 w-6 items-center justify-center rounded-xs text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
												aria-label="Delete {sub.name}"
											>
												<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
												</svg>
											</button>
										</form>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="px-5 py-3 pl-14">
							<p class="text-xs text-zinc-400 italic">No subcategories</p>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
