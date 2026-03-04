<script lang="ts">
import type { PageData } from './$types';
import { getImageUrl } from '$lib/r2';
import { enhance } from '$app/forms';

let { data }: { data: PageData } = $props();
</script>

<svelte:head>
<title>Slides — Admin</title>
</svelte:head>

<div class="p-6 lg:p-8">
<div class="flex items-center justify-between mb-6">
<h1 class="text-xl font-bold tracking-tight text-zinc-900">Carousel Slides</h1>
<a href="/admin/slides/new" class="btn btn-primary btn-sm gap-1">
<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
</svg>
Add Slide
</a>
</div>

{#if data.slides.length === 0}
<div class="card p-8 text-center">
<p class="text-sm text-zinc-500 mb-4">No carousel slides yet.</p>
<a href="/admin/slides/new" class="btn btn-primary">Add Your First Slide</a>
</div>
{:else}
<div class="grid gap-4">
{#each data.slides as slide}
<div class="card overflow-hidden">
<div class="flex flex-col sm:flex-row">
<!-- Preview -->
<div
class="relative h-32 sm:h-auto sm:w-64 flex-shrink-0 overflow-hidden"
style="background: linear-gradient(135deg, {slide.bg_color} 0%, {slide.bg_color}dd 50%, {slide.bg_color}99 100%);"
>
{#if slide.bg_image_desktop_key}
<img src={getImageUrl(slide.bg_image_desktop_key)} alt="" class="absolute inset-0 w-full h-full object-cover" />
<div class="absolute inset-0" style="background: rgba(0,0,0,{slide.overlay_opacity});"></div>
{/if}
<div class="relative flex items-center justify-center h-full p-4">
<span class="text-sm font-semibold text-center" style="color: {slide.text_color};">{slide.title}</span>
</div>
</div>
<!-- Details -->
<div class="flex-1 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
<div class="min-w-0">
<div class="flex items-center gap-2 mb-1">
<h3 class="text-sm font-semibold text-zinc-900 truncate">{slide.title}</h3>
<span class="badge {slide.active ? 'badge-default' : 'badge-secondary'} text-[10px]">
{slide.active ? 'Active' : 'Inactive'}
</span>
</div>
<p class="text-xs text-zinc-500 truncate mb-1">{slide.subtitle}</p>
<div class="flex items-center gap-3 text-[11px] text-zinc-400">
<span>Order: {slide.sort_order}</span>
<span>CTA: {slide.cta_text}</span>
<span>Link: {slide.cta_link}</span>
{#if slide.bg_image_desktop_key}
<span class="text-green-600">Desktop bg ✓</span>
{/if}
{#if slide.bg_image_mobile_key}
<span class="text-green-600">Mobile bg ✓</span>
{/if}
</div>
</div>
<div class="flex items-center gap-2 sm:flex-shrink-0">
<a href="/admin/slides/{slide.id}/edit" class="btn btn-ghost btn-sm text-zinc-500">Edit</a>
<form method="POST" action="?/delete" use:enhance onsubmit={(e) => { if (!confirm('Delete this slide?')) e.preventDefault(); }}>
<input type="hidden" name="id" value={slide.id} />
<button type="submit" class="btn btn-ghost btn-sm text-red-500 hover:text-red-700">Delete</button>
</form>
</div>
</div>
</div>
</div>
{/each}
</div>
{/if}
</div>
