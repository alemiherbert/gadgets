<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<Seo title="Reset password" noindex />

<div class="mb-8">
	<h1 class="text-3xl font-extrabold tracking-tight">Reset your password</h1>
	<p class="mt-2 text-sm text-slate-500">Enter your email and we'll send you a reset link</p>
</div>

{#if form?.success}
	<div class="notice notice-ok mb-6">
		If an account with that email exists, we've sent a password reset link.
	</div>
{/if}

{#if form?.error}
	<div class="notice notice-error mb-6">
		{form.error}
	</div>
{/if}

<form
	method="POST"
	class="space-y-5"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			submitting = false;
			await update();
		};
	}}
>
	<div>
		<label for="email" class="field-label">Email</label>
		<input
			id="email"
			name="email"
			type="email"
			required
			autocomplete="email"
			class="field"
			placeholder="you@example.com"
		/>
	</div>

	<button
		type="submit"
		disabled={submitting}
		class="cta cta-brand cta-lg w-full"
	>
		{submitting ? 'Sending…' : 'Send Reset Link'}
	</button>
</form>

<p class="mt-8 text-center text-sm text-slate-500">
	Remember your password?
	<a href="/auth/login" class="font-bold text-brand hover:underline">Sign in</a>
</p>
