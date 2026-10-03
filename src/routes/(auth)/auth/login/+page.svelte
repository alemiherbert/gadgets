<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import AuthGoogleButton from '$lib/components/AuthGoogleButton.svelte';
	import AuthSwitchLink from '$lib/components/AuthSwitchLink.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
	const resetSuccess = $derived(page.url.searchParams.get('reset') === 'success');
</script>

<Seo title="Sign in" noindex />

<div class="mb-8">
	<h1 class="text-3xl font-extrabold tracking-tight">Welcome back</h1>
	<p class="mt-2 text-sm text-slate-500">Sign in to track orders and manage your profile</p>
</div>

{#if resetSuccess}
	<div class="notice notice-ok mb-6">
		Your password has been reset successfully. Please sign in with your new password.
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
			value={form?.email ?? ''}
			class="field"
			placeholder="you@example.com"
		/>
	</div>

	<div>
		<div class="mb-1.5 flex items-center justify-between">
			<label for="password" class="field-label mb-0">Password</label>
			<a href="/auth/forgot-password" class="text-xs font-bold text-brand hover:underline">
				Forgot password?
			</a>
		</div>
		<input
			id="password"
			name="password"
			type="password"
			required
			autocomplete="current-password"
			class="field"
			placeholder="••••••••"
		/>
	</div>

	<button
		type="submit"
		disabled={submitting}
		class="cta cta-brand cta-lg w-full"
	>
		{submitting ? 'Signing in…' : 'Sign In'}
	</button>
</form>

<AuthGoogleButton context="signin" href="/auth/google" />

<AuthSwitchLink mode="signin" />
