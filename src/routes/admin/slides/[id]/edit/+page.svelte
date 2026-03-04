<script lang="ts">
import type { PageData, ActionData } from './$types';
import { getImageUrl } from '$lib/r2';
import { enhance } from '$app/forms';

let { data, form }: { data: PageData; form: ActionData } = $props();

let bgColor = $state('');
let textColor = $state('');
let overlayOpacity = $state(0.4);

$effect(() => {
	bgColor = data.slide.bg_color;
	textColor = data.slide.text_color;
	overlayOpacity = data.slide.overlay_opacity;
});

let removeImage = $state(false);
let removeBgDesktop = $state(false);
let removeBgMobile = $state(false);
</script>

<svelte:head>
<title>Edit Slide — Admin</title>
</svelte:head>

<div class="p-6 lg:p-8">
<div class="mb-6">
<a href="/admin/slides" class="text-sm text-zinc-500 hover:text-zinc-700 transition-colors">← Back to Slides</a>
<h1 class="text-xl font-bold tracking-tight text-zinc-900 mt-2">Edit Slide: {data.slide.title}</h1>
</div>

{#if form?.error}
<div class="alert alert-error mb-4">{form.error}</div>
{/if}

<form method="POST" enctype="multipart/form-data" use:enhance class="card p-6 space-y-6 max-w-2xl">
<!-- Hidden existing keys -->
<input type="hidden" name="existing_image_key" value={data.slide.image_key ?? ''} />
<input type="hidden" name="existing_bg_desktop_key" value={data.slide.bg_image_desktop_key ?? ''} />
<input type="hidden" name="existing_bg_mobile_key" value={data.slide.bg_image_mobile_key ?? ''} />
{#if removeImage}<input type="hidden" name="remove_image" value="1" />{/if}
{#if removeBgDesktop}<input type="hidden" name="remove_bg_desktop" value="1" />{/if}
{#if removeBgMobile}<input type="hidden" name="remove_bg_mobile" value="1" />{/if}

<!-- Title & Subtitle -->
<div class="grid gap-4 sm:grid-cols-2">
<div>
<label for="title" class="block text-sm font-medium text-zinc-700 mb-1">Title *</label>
<input type="text" id="title" name="title" required value={data.slide.title} class="input" />
</div>
<div>
<label for="sort_order" class="block text-sm font-medium text-zinc-700 mb-1">Sort Order</label>
<input type="number" id="sort_order" name="sort_order" value={data.slide.sort_order} class="input" />
</div>
</div>

<div>
<label for="subtitle" class="block text-sm font-medium text-zinc-700 mb-1">Subtitle</label>
<textarea id="subtitle" name="subtitle" rows="2" class="input !h-auto">{data.slide.subtitle}</textarea>
</div>

<!-- CTA -->
<div class="grid gap-4 sm:grid-cols-2">
<div>
<label for="cta_text" class="block text-sm font-medium text-zinc-700 mb-1">Button Text</label>
<input type="text" id="cta_text" name="cta_text" value={data.slide.cta_text} class="input" />
</div>
<div>
<label for="cta_link" class="block text-sm font-medium text-zinc-700 mb-1">Button Link</label>
<input type="text" id="cta_link" name="cta_link" value={data.slide.cta_link} class="input" />
</div>
</div>

<!-- Colors -->
<div class="grid gap-4 sm:grid-cols-2">
<div>
<label for="bg_color" class="block text-sm font-medium text-zinc-700 mb-1">Background Color</label>
<div class="flex items-center gap-2">
<input type="color" id="bg_color" name="bg_color" bind:value={bgColor} class="h-10 w-14 rounded border border-zinc-200 cursor-pointer" />
<input type="text" value={bgColor} readonly class="input flex-1 text-sm text-zinc-500" />
</div>
</div>
<div>
<label for="text_color" class="block text-sm font-medium text-zinc-700 mb-1">Text Color</label>
<div class="flex items-center gap-2">
<input type="color" id="text_color" name="text_color" bind:value={textColor} class="h-10 w-14 rounded border border-zinc-200 cursor-pointer" />
<input type="text" value={textColor} readonly class="input flex-1 text-sm text-zinc-500" />
</div>
</div>
</div>

<!-- Background Images -->
<fieldset class="border border-zinc-200 rounded-lg p-4 space-y-4">
<legend class="text-sm font-semibold text-zinc-700 px-2">Background Images</legend>
<p class="text-xs text-zinc-500 -mt-2">Upload separate images for desktop and mobile viewports. If no background images are set, the solid background color is used.</p>

<div class="grid gap-4 sm:grid-cols-2">
<!-- Desktop -->
<div>
<label for="bg_image_desktop" class="block text-sm font-medium text-zinc-700 mb-1">Desktop Background</label>
{#if data.slide.bg_image_desktop_key && !removeBgDesktop}
<div class="relative mb-2 rounded-lg overflow-hidden border border-zinc-200">
<img src={getImageUrl(data.slide.bg_image_desktop_key)} alt="Desktop bg" class="w-full h-20 object-cover" />
<button type="button" onclick={() => removeBgDesktop = true} class="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600" title="Remove">✕</button>
</div>
{/if}
<input type="file" id="bg_image_desktop" name="bg_image_desktop" accept="image/*" class="input !h-auto py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1 file:text-xs file:font-medium" />
<p class="text-[11px] text-zinc-400 mt-1">Wide image, ≥1920×520px recommended</p>
</div>
<!-- Mobile -->
<div>
<label for="bg_image_mobile" class="block text-sm font-medium text-zinc-700 mb-1">Mobile Background</label>
{#if data.slide.bg_image_mobile_key && !removeBgMobile}
<div class="relative mb-2 rounded-lg overflow-hidden border border-zinc-200">
<img src={getImageUrl(data.slide.bg_image_mobile_key)} alt="Mobile bg" class="w-full h-20 object-cover" />
<button type="button" onclick={() => removeBgMobile = true} class="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600" title="Remove">✕</button>
</div>
{/if}
<input type="file" id="bg_image_mobile" name="bg_image_mobile" accept="image/*" class="input !h-auto py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1 file:text-xs file:font-medium" />
<p class="text-[11px] text-zinc-400 mt-1">Tall image, ≥768×480px recommended</p>
</div>
</div>

<div class="grid gap-4 sm:grid-cols-2">
<div>
<label for="bg_image_position" class="block text-sm font-medium text-zinc-700 mb-1">Image Position</label>
<select id="bg_image_position" name="bg_image_position" class="input" value={data.slide.bg_image_position}>
<option value="center center">Center</option>
<option value="center top">Top</option>
<option value="center 25%">Upper quarter</option>
<option value="center 40%">Upper third</option>
<option value="center 60%">Lower third</option>
<option value="center 75%">Lower quarter</option>
<option value="center bottom">Bottom</option>
</select>
<p class="text-[11px] text-zinc-400 mt-1">Controls which part of the image is shown when cropped</p>
</div>
<div>
<label for="overlay_opacity" class="block text-sm font-medium text-zinc-700 mb-1">Overlay Darkness: {Math.round(overlayOpacity * 100)}%</label>
<input type="range" id="overlay_opacity" name="overlay_opacity" min="0" max="1" step="0.05" bind:value={overlayOpacity} class="w-full mt-2" />
<p class="text-[11px] text-zinc-400 mt-1">Darkens the background so text stays readable</p>
</div>
</div>
</fieldset>

<!-- Product overlay image -->
<div>
<label for="image" class="block text-sm font-medium text-zinc-700 mb-1">Product Overlay Image (optional)</label>
{#if data.slide.image_key && !removeImage}
<div class="relative mb-2 w-24 h-24 rounded-lg overflow-hidden border border-zinc-200">
<img src={getImageUrl(data.slide.image_key)} alt="Product overlay" class="w-full h-full object-contain bg-zinc-50" />
<button type="button" onclick={() => removeImage = true} class="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center hover:bg-red-600" title="Remove">✕</button>
</div>
{/if}
<input type="file" id="image" name="image" accept="image/*" class="input !h-auto py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1 file:text-xs file:font-medium" />
<p class="text-[11px] text-zinc-400 mt-1">Shown on the right side on desktop. Transparent PNG works best.</p>
</div>

<!-- Active toggle -->
<div class="flex items-center gap-2">
<input type="checkbox" id="active" name="active" checked={data.slide.active === 1} class="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
<label for="active" class="text-sm font-medium text-zinc-700">Active</label>
</div>

<!-- Preview -->
<div>
<p class="text-sm font-medium text-zinc-700 mb-2">Preview</p>
<div class="relative h-32 rounded-lg overflow-hidden" style="background: linear-gradient(135deg, {bgColor} 0%, {bgColor}dd 50%, {bgColor}99 100%);">
{#if data.slide.bg_image_desktop_key && !removeBgDesktop}
<img src={getImageUrl(data.slide.bg_image_desktop_key)} alt="" class="absolute inset-0 w-full h-full object-cover" style="object-position: {data.slide.bg_image_position};" />
{/if}
<div class="absolute inset-0" style="background: rgba(0,0,0,{overlayOpacity});"></div>
<div class="relative flex items-center h-full px-6">
<p class="text-sm font-bold" style="color: {textColor};">{data.slide.title}</p>
</div>
</div>
</div>

<div class="flex items-center gap-3 pt-2">
<button type="submit" class="btn btn-primary">Save Changes</button>
<a href="/admin/slides" class="btn btn-ghost text-zinc-500">Cancel</a>
</div>
</form>
</div>
