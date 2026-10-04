<script lang="ts">
import { enhance } from '$app/forms';
import { ADMIN_PASSWORD_MIN, ADMIN_PASSWORD_MAX } from '$lib/admin-reset';
import type { ActionData, PageData } from './$types';

let { data, form }: { data: PageData; form: ActionData } = $props();
let submitting = $state(false);
</script>

<svelte:head>
<title>Set Admin Password — OJ's Online Store</title>
<meta name="robots" content="noindex" />
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
<div class="w-full max-w-sm">
<div class="text-center mb-8">
<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 mb-4">
<span class="text-lg font-bold text-white">G</span>
</div>
{#if data.invalid}
<h1 class="text-xl font-bold tracking-tight text-zinc-900">Link expired</h1>
<p class="text-sm text-zinc-500 mt-1">This reset link is invalid, expired or already used.</p>
{:else}
<h1 class="text-xl font-bold tracking-tight text-zinc-900">Set a new password</h1>
<p class="text-sm text-zinc-500 mt-1">For <span class="font-semibold text-zinc-900">{data.email}</span></p>
{/if}
</div>

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
</div>
</div>
