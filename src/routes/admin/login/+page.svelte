<script lang="ts">
import { enhance } from '$app/forms';
import AuthShell from '$lib/components/admin/AuthShell.svelte';
import { page } from '$app/state';
import type { ActionData, PageData } from './$types';

let { data, form }: { data: PageData; form: ActionData } = $props();
let submitting = $state(false);
let recovering = $state(false);
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

{#if data.recovery && page.url.searchParams.get('reset') !== 'success'}
<form method="POST" action="?/recover" class="mb-6" use:enhance={() => { recovering = true; return async ({ update }) => { recovering = false; await update(); }; }}>
<div class="card p-6 space-y-4">
<div>
<h2 class="font-semibold">Set a new password</h2>
<p class="text-xs text-ink-muted mt-1">Enter the recovery code you were given and choose a new admin password.</p>
</div>
{#if form?.recoverError}
<div class="alert alert-error">{form.recoverError}</div>
{/if}
<div class="form-group">
<label for="recover-email" class="label">Admin email</label>
<input id="recover-email" name="email" type="email" required value={form?.recoverEmail ?? data.recoveryEmail} class="input" />
</div>
<div class="form-group">
<label for="recover-code" class="label">Recovery code</label>
<input id="recover-code" name="code" type="text" required autocomplete="off" spellcheck="false" class="input font-mono uppercase" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" />
</div>
<div class="form-group">
<label for="recover-password" class="label">New password</label>
<input id="recover-password" name="password" type="password" required minlength="12" maxlength="128" autocomplete="new-password" class="input" />
</div>
<div class="form-group">
<label for="recover-confirm" class="label">Confirm new password</label>
<input id="recover-confirm" name="confirmPassword" type="password" required minlength="12" maxlength="128" autocomplete="new-password" class="input" />
</div>
<button type="submit" disabled={recovering} class="btn btn-primary w-full h-10 font-semibold">
{recovering ? 'Saving…' : 'Set new password'}
</button>
</div>
</form>
{/if}

{#if form?.error}
<div class="alert alert-error mb-6">{form.error}</div>
{/if}

<form method="POST" action="?/login" use:enhance={() => { submitting = true; return async ({ update }) => { submitting = false; await update(); }; }}>
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
