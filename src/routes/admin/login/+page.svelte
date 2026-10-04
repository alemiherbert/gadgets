<script lang="ts">
import { enhance } from '$app/forms';
import AuthShell from '$lib/components/admin/AuthShell.svelte';
import { page } from '$app/state';
import type { ActionData } from './$types';

let { form }: { form: ActionData } = $props();
let submitting = $state(false);
</script>

<svelte:head>
<title>Admin Login — OJ's Online Store</title>
</svelte:head>

<AuthShell title="Sign in" subtitle="Manage orders, products and customers">

{#if page.url.searchParams.get('setup') === 'done' && !form?.error}
<div class="alert alert-success mb-6">Admin account created. Sign in to continue.</div>
{:else if page.url.searchParams.get('reset') === 'success' && !form?.error}
<div class="alert alert-success mb-6">Password updated. Sign in with your new password.</div>
{/if}

{#if form?.error}
<div class="alert alert-error mb-6">{form.error}</div>
{/if}

<form method="POST" use:enhance={() => { submitting = true; return async ({ update }) => { submitting = false; await update(); }; }}>
<div class="card p-6 space-y-4">
<div class="form-group">
<label for="email" class="label">Email</label>
<input id="email" name="email" type="email" required value={form?.email ?? ''} class="input" placeholder="support@ojsonlinestore.com" />
</div>
<div class="form-group">
<div class="flex items-center justify-between">
<label for="password" class="label">Password</label>
<a href="/admin/forgot-password" class="text-xs font-semibold text-ink-muted hover:text-brand">Forgot password?</a>
</div>
<input id="password" name="password" type="password" required class="input" placeholder="••••••••" />
</div>
<button type="submit" disabled={submitting} class="btn btn-primary w-full h-10 font-semibold">
{submitting ? 'Signing in…' : 'Sign In'}
</button>
</div>
</form>
</AuthShell>
