<script lang="ts">
	import { getImageUrl } from '$lib/r2';
	import { MAX_GALLERY_IMAGES, shrinkImage } from '$lib/product-images';
	import Icon from '../Icon.svelte';

	type Existing = { id: number; image_key: string };

	let {
		mainKey = null,
		existing = []
	}: {
		/** Current main image (edit page) */
		mainKey?: string | null;
		/** Gallery photos already saved (edit page) */
		existing?: Existing[];
	} = $props();

	let mainInput = $state<HTMLInputElement>();
	let galleryInput = $state<HTMLInputElement>();
	let mainFile = $state<File | null>(null);
	let newFiles = $state<File[]>([]);
	let removedIds = $state<number[]>([]);
	let busy = $state(false);

	const kept = $derived(existing.filter((e) => !removedIds.includes(e.id)));
	const room = $derived(Math.max(0, MAX_GALLERY_IMAGES - kept.length - newFiles.length));

	// Object URLs for previews; revoked when the list changes
	const mainPreview = $derived(mainFile ? URL.createObjectURL(mainFile) : null);
	const newPreviews = $derived(newFiles.map((f) => URL.createObjectURL(f)));
	$effect(() => () => newPreviews.forEach((u) => URL.revokeObjectURL(u)));
	$effect(() => () => {
		if (mainPreview) URL.revokeObjectURL(mainPreview);
	});

	/** A real <input type=file> only submits what's in its own file list, so mirror ours into it */
	function syncInput(input: HTMLInputElement | undefined, files: File[]) {
		if (!input) return;
		const dt = new DataTransfer();
		files.forEach((f) => dt.items.add(f));
		input.files = dt.files;
	}

	async function pickMain(e: Event) {
		const input = e.target as HTMLInputElement;
		const picked = input.files?.[0];
		if (!picked) return;
		busy = true;
		mainFile = await shrinkImage(picked);
		syncInput(mainInput, [mainFile]);
		busy = false;
	}

	async function pickGallery(e: Event) {
		const input = e.target as HTMLInputElement;
		const picked = Array.from(input.files ?? []).slice(0, room);
		if (picked.length === 0) {
			syncInput(galleryInput, newFiles);
			return;
		}
		busy = true;
		const shrunk = await Promise.all(picked.map(shrinkImage));
		newFiles = [...newFiles, ...shrunk];
		syncInput(galleryInput, newFiles);
		busy = false;
	}

	function removeNew(i: number) {
		newFiles = newFiles.filter((_, idx) => idx !== i);
		syncInput(galleryInput, newFiles);
	}

	function toggleExisting(id: number) {
		removedIds = removedIds.includes(id) ? removedIds.filter((x) => x !== id) : [...removedIds, id];
	}
</script>

<div class="space-y-6">
	<!-- Main photo -->
	<div>
		<p class="label">Main photo</p>
		<p class="mb-2 text-xs text-zinc-400">Shown in the shop and in link previews. A square photo on a plain background works best.</p>
		<div class="flex items-center gap-4">
			<div class="grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-surface">
				{#if mainPreview}
					<img src={mainPreview} alt="New main" class="size-full object-cover" />
				{:else if mainKey}
					<img src={getImageUrl(mainKey)} alt="Current main" class="size-full object-cover" />
				{:else}
					<Icon name="image" class="size-8 text-ink-faint" stroke={1.5} />
				{/if}
			</div>
			<label class="btn btn-outline btn-sm cursor-pointer">
				{mainKey || mainFile ? 'Change photo' : 'Choose photo'}
				<input bind:this={mainInput} name="image" type="file" accept="image/*" onchange={pickMain} class="sr-only" />
			</label>
		</div>
	</div>

	<!-- Gallery -->
	<div>
		<div class="flex items-baseline justify-between">
			<p class="label">More photos</p>
			<p class="text-xs text-zinc-400">{kept.length + newFiles.length} of {MAX_GALLERY_IMAGES}</p>
		</div>
		<p class="mb-3 text-xs text-zinc-400">Select several at once. Shoppers can swipe through them on the product page.</p>

		<div class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
			{#each existing as img (img.id)}
				{@const gone = removedIds.includes(img.id)}
				<div class="relative aspect-square overflow-hidden rounded-xl border-2 bg-surface {gone ? 'border-deal-line' : 'border-line'}">
					<img src={getImageUrl(img.image_key)} alt="Gallery" class="size-full object-cover {gone ? 'opacity-30' : ''}" />
					<button
						type="button"
						onclick={() => toggleExisting(img.id)}
						class="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full text-sm font-bold shadow {gone ? 'bg-zinc-700 text-white' : 'bg-white text-deal hover:bg-deal-soft'}"
						aria-label={gone ? 'Keep this photo' : 'Remove this photo'}
					>{gone ? '↩' : '×'}</button>
					{#if gone}<span class="absolute inset-x-0 bottom-0 bg-deal/90 py-0.5 text-center text-2xs font-bold text-white">Removed on save</span>{/if}
				</div>
				{#if gone}<input type="hidden" name="delete_image_ids" value={img.id} />{/if}
			{/each}

			{#each newFiles as file, i (file.name + file.size + i)}
				<div class="relative aspect-square overflow-hidden rounded-xl border-2 border-brand/40 bg-surface">
					<img src={newPreviews[i]} alt="New {i + 1}" class="size-full object-cover" />
					<button
						type="button"
						onclick={() => removeNew(i)}
						class="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-white text-sm font-bold text-deal shadow hover:bg-deal-soft"
						aria-label="Remove this photo"
					>×</button>
					<span class="absolute inset-x-0 bottom-0 bg-brand/90 py-0.5 text-center text-2xs font-bold text-white">New</span>
				</div>
			{/each}

			{#if room > 0}
				<label for="gallery-input" class="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-center text-zinc-500 transition hover:border-brand hover:text-brand">
					<span class="flex flex-col items-center gap-1 text-xs font-semibold">
						<Icon name="plus" class="size-6" stroke={2} />
						{busy ? 'Preparing…' : 'Add photos'}
					</span>
				</label>
			{/if}
		</div>
		<!-- Always rendered: its file list is what gets submitted -->
		<input id="gallery-input" bind:this={galleryInput} name="additional_images" type="file" accept="image/*" multiple onchange={pickGallery} class="sr-only" />
		{#if room === 0}
			<p class="mt-2 text-xs text-warn-ink">That's the maximum. Remove a photo to add another.</p>
		{/if}
	</div>
</div>
