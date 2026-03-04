<script lang="ts">
import { enhance } from '$app/forms';
import type { ActionData } from './$types';

let { form }: { form: ActionData } = $props();
let submitting = $state(false);
</script>

<svelte:head>
<title>Admin Setup — Gadgets Store</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
<div class="w-full max-w-sm">
<div class="text-center mb-8">
<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 mb-4">
<span class="text-lg font-bold text-white">G</span>
</div>
<h1 class="text-xl font-bold tracking-tight text-zinc-900">Initial Setup</h1>
<p class="text-sm text-zinc-500 mt-1">Create the first admin account</p>
</div>

{#if form?.error}
<div class="alert alert-error mb-6">{form.error}</div>
{/if}

<form method="POST" use:enhance={() => { submitting = true; return async ({ update }) => { submitting = false; await update(); }; }}>
<div class="card p-6 space-y-4">
<div class="rounded-lg bg-zinc-50 border border-zinc-200 p-4">
<p class="text-sm text-zinc-600">This will create a default admin account:</p>
<div class="mt-2 space-y-1 text-sm">
<p class="text-zinc-900 font-medium">Email: admin@store.com</p>
<p class="text-zinc-900 font-medium">Password: admin123</p>
</div>
<p class="text-xs text-zinc-500 mt-2">Change these credentials after first login.</p>
</div>
<button type="submit" disabled={submitting} class="btn btn-primary w-full h-10 font-semibold">
{submitting ? 'Creating…' : 'Create Admin Account'}
</button>
</div>
</form>
</div>
</div>
