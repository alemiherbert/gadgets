<script lang="ts">
import { enhance } from '$app/forms';
import type { ActionData } from './$types';

let { form }: { form: ActionData } = $props();
let submitting = $state(false);
</script>

<svelte:head>
<title>Admin Login — Gadgets Store</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
<div class="w-full max-w-sm">
<div class="text-center mb-8">
<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 mb-4">
<span class="text-lg font-bold text-white">G</span>
</div>
<h1 class="text-xl font-bold tracking-tight text-zinc-900">Admin Login</h1>
<p class="text-sm text-zinc-500 mt-1">Sign in to the admin panel</p>
</div>

{#if form?.error}
<div class="alert alert-error mb-6">{form.error}</div>
{/if}

<form method="POST" use:enhance={() => { submitting = true; return async ({ update }) => { submitting = false; await update(); }; }}>
<div class="card p-6 space-y-4">
<div class="form-group">
<label for="email" class="label">Email</label>
<input id="email" name="email" type="email" required value={form?.email ?? ''} class="input" placeholder="admin@store.com" />
</div>
<div class="form-group">
<label for="password" class="label">Password</label>
<input id="password" name="password" type="password" required class="input" placeholder="••••••••" />
</div>
<button type="submit" disabled={submitting} class="btn btn-primary w-full h-10 font-semibold">
{submitting ? 'Signing in…' : 'Sign In'}
</button>
</div>
</form>
</div>
</div>
