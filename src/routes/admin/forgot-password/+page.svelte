<script lang="ts">
import { enhance } from '$app/forms';
import AuthShell from '$lib/components/admin/AuthShell.svelte';
import type { ActionData } from './$types';

let { form }: { form: ActionData } = $props();
let submitting = $state(false);
</script>

<svelte:head>
<title>Reset Admin Password — OJ's Online Store</title>
<meta name="robots" content="noindex" />
</svelte:head>

<AuthShell title="Reset admin password" subtitle="We'll email a one-time reset link to the admin address">

{#if form?.success}
<div class="alert alert-success mb-6">If that email belongs to an admin, a reset link is on its way. It expires in 30 minutes.</div>
{/if}

{#if form?.error}
<div class="alert alert-error mb-6">{form.error}</div>
{/if}

<form method="POST" use:enhance={() => { submitting = true; return async ({ update }) => { submitting = false; await update(); }; }}>
<div class="card p-6 space-y-4">
<div class="form-group">
<label for="email" class="label">Admin email</label>
<input id="email" name="email" type="email" required autocomplete="email" value={form?.email ?? ''} class="input" placeholder="support@ojsonlinestore.com" />
</div>
<button type="submit" disabled={submitting} class="btn btn-primary w-full h-10 font-semibold">
{submitting ? 'Sending…' : 'Send reset link'}
</button>
</div>
</form>

<p class="mt-6 text-center text-sm text-zinc-500">
<a href="/admin/login" class="font-semibold text-zinc-900 hover:underline">Back to sign in</a>
</p>
</AuthShell>
