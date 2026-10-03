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
	<h1 class="text-3xl font-extrabold tracking-tight">Create your account</h1>
	<p class="mt-2 text-sm text-slate-500">Sign up to track orders and checkout faster</p>
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
		<label for="name" class="field-label">Full Name</label>
		<input
			id="name"
			name="name"
			type="text"
			required
			value={form?.name ?? ''}
			class="field"
			placeholder="John Doe"
		/>
	</div>

	<div>
		<label for="email" class="field-label">Email</label>
		<input
			id="email"
			name="email"
			type="email"
			required
			autocomplete="email"
			value={form?.email ?? ''}
			class="field"
			placeholder="you@example.com"
		/>
	</div>

	<div>
		<label for="phone" class="field-label">Phone <span class="font-normal text-slate-400">(optional)</span></label>
		<input
			id="phone"
			name="phone"
			type="tel"
			value={form?.phone ?? ''}
			pattern="^(\+?256|0)[3-9]\d{8}$"
			title="Ugandan phone number, e.g. 0771234567 or +256771234567"
			class="field"
			placeholder="0771234567"
		/>
		<p class="field-hint">Format: 07XXXXXXXX or +2567XXXXXXXX</p>
	</div>

	<div>
		<label for="password" class="field-label">Password</label>
		<input
			id="password"
			name="password"
			type="password"
			required
			minlength="8"
			autocomplete="new-password"
			class="field"
			placeholder="Min 8 characters"
		/>
	</div>

	<div>
		<label for="confirmPassword" class="field-label">Confirm Password</label>
		<input
			id="confirmPassword"
			name="confirmPassword"
			type="password"
			required
			minlength="8"
			autocomplete="new-password"
			class="field"
			placeholder="Repeat your password"
		/>
	</div>

	<button
		type="submit"
		disabled={submitting}
		class="cta cta-brand cta-lg w-full"
	>
		{submitting ? 'Creating account…' : 'Create Account'}
	</button>
</form>

<AuthGoogleButton context="signup" href="/auth/google?redirect=/account" />

<AuthSwitchLink mode="signup" />
