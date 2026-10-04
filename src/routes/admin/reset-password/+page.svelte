<script lang="ts">
import { enhance } from '$app/forms';
import AuthShell from '$lib/components/admin/AuthShell.svelte';
import { ADMIN_PASSWORD_MIN, ADMIN_PASSWORD_MAX } from '$lib/admin-reset';
import type { ActionData, PageData } from './$types';

let { data, form }: { data: PageData; form: ActionData } = $props();
let submitting = $state(false);
</script>

<svelte:head>
<title>Set Admin Password — OJ's Online Store</title>
<meta name="robots" content="noindex" />
</svelte:head>

<AuthShell
	title={data.invalid ? 'Link expired' : 'Set a new password'}
	subtitle={data.invalid ? 'This reset link is invalid, expired or already used.' : `For ${data.email}`}
>

{#if data.invalid}
<a href="/admin/forgot-password" class="btn btn-primary w-full h-10 font-semibold">Request a new link</a>
{:else}
{#if form?.error}
<div class="alert alert-error mb-6">{form.error}</div>
{/if}

<form method="POST" use:enhance={() => { submitting = true; return async ({ update }) => { submitting = false; await update(); }; }}>
<div class="card p-6 space-y-4">
<div class="form-group">
<label for="password" class="label">New password</label>
<input id="password" name="password" type="password" required minlength={ADMIN_PASSWORD_MIN} maxlength={ADMIN_PASSWORD_MAX} autocomplete="new-password" class="input" placeholder="At least {ADMIN_PASSWORD_MIN} characters" />
</div>
<div class="form-group">
<label for="confirmPassword" class="label">Confirm password</label>
<input id="confirmPassword" name="confirmPassword" type="password" required minlength={ADMIN_PASSWORD_MIN} maxlength={ADMIN_PASSWORD_MAX} autocomplete="new-password" class="input" placeholder="Repeat the password" />
</div>
<p class="text-xs text-zinc-500">Saving signs out every admin session, including this browser's.</p>
<button type="submit" disabled={submitting} class="btn btn-primary w-full h-10 font-semibold">
{submitting ? 'Saving…' : 'Set password'}
</button>
</div>
</form>
{/if}

<p class="mt-6 text-center text-sm text-zinc-500">
<a href="/admin/login" class="font-semibold text-zinc-900 hover:underline">Back to sign in</a>
</p>
</AuthShell>
