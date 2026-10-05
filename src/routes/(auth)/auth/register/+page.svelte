<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { enhance } from '$app/forms';
	import AuthGoogleButton from '$lib/components/AuthGoogleButton.svelte';
	import AuthSwitchLink from '$lib/components/AuthSwitchLink.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<Seo title="Create account" noindex />

<div class="mb-8">
	<h1 class="h-page">Create your account</h1>
	<p class="mt-2 text-sm text-ink-muted">Optional — it saves your details for next time and keeps your order history</p>
</div>

{#if form?.error}
	<div class="notice notice-error mb-6">
		{form.error}
	</div>
{/if}

<form
	method="POST"
	class="space-y-4"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			submitting = false;
			await update();
		};
	}}
>
	<div>
		<label for="name" class="field-label">Your name</label>
		<input
			id="name"
			name="name"
			type="text"
			required
			value={form?.name ?? ''}
			class="field"
			placeholder="e.g. Sarah Namuli" autocomplete="name"
		/>
	</div>

	<div>
		<label for="phone" class="field-label">Phone number</label>
		<input
			id="phone"
			name="phone"
			type="tel"
			inputmode="tel"
			required
			autocomplete="tel"
			value={form?.phone ?? ''}
			class="field"
			placeholder="0706 512 313"
		/>
		<p class="field-hint">You'll sign in with this. We use it to confirm orders on WhatsApp.</p>
	</div>

	<div>
		<label for="email" class="field-label">Email <span class="font-normal text-ink-subtle">(optional)</span></label>
		<input
			id="email"
			name="email"
			type="email"
			autocomplete="email"
			value={form?.email ?? ''}
			class="field"
			placeholder="you@example.com"
		/>
		<p class="field-hint">Add one if you'd like order emails and password reset links.</p>
	</div>

	<div>
		<label for="password" class="field-label">Password</label>
		<input
			id="password"
			name="password"
			type="password"
			required
			minlength="8"
			maxlength="128"
			autocomplete="new-password"
			class="field"
			placeholder="At least 8 characters"
		/>
	</div>

	<button
		type="submit"
		disabled={submitting}
		class="cta cta-brand cta-lg w-full"
	>
		{submitting ? 'Creating account…' : 'Create account'}
	</button>
</form>

<AuthGoogleButton context="signup" href="/auth/google?redirect=/account" />

<AuthSwitchLink mode="signup" />
