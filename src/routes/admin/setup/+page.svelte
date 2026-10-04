<script lang="ts">
import { enhance } from '$app/forms';
import AuthShell from '$lib/components/admin/AuthShell.svelte';
import { ADMIN_PASSWORD_MIN, ADMIN_PASSWORD_MAX } from '$lib/admin-reset';
import type { ActionData, PageData } from './$types';

let { data, form }: { data: PageData; form: ActionData } = $props();
let submitting = $state(false);
</script>

<svelte:head>
<title>Admin Setup — OJ's Online Store</title>
<meta name="robots" content="noindex" />
</svelte:head>

<AuthShell title="Set up your admin" subtitle="Choose a password for the store's admin account">
{#if form?.error}
<div class="alert alert-error mb-6">{form.error}</div>
{/if}

<form method="POST" use:enhance={() => { submitting = true; return async ({ update }) => { submitting = false; await update(); }; }}>
<div class="card p-6 space-y-4">
<div class="form-group">
<span class="label">Admin email</span>
<p class="flex h-10 items-center rounded-lg bg-surface px-3 text-sm font-semibold">{data.email}</p>
<p class="mt-1.5 text-xs text-ink-muted">Order alerts and password resets go here. You can change it later under Account.</p>
</div>
<div class="form-group">
<label for="password" class="label">Password</label>
<input id="password" name="password" type="password" required minlength={ADMIN_PASSWORD_MIN} maxlength={ADMIN_PASSWORD_MAX} autocomplete="new-password" class="input" placeholder="At least {ADMIN_PASSWORD_MIN} characters" />
</div>
<div class="form-group">
<label for="confirmPassword" class="label">Confirm password</label>
<input id="confirmPassword" name="confirmPassword" type="password" required minlength={ADMIN_PASSWORD_MIN} maxlength={ADMIN_PASSWORD_MAX} autocomplete="new-password" class="input" placeholder="Repeat the password" />
</div>
<button type="submit" disabled={submitting} class="btn btn-primary w-full h-10 font-semibold">
{submitting ? 'Creating…' : 'Create admin account'}
</button>
</div>
</form>
</AuthShell>
