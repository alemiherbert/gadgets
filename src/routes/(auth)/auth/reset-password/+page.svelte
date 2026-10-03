<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let submitting = $state(false);
</script>

<Seo title="Set a new password" noindex />

{#if data.invalid}
	<div class="mb-8">
		<h1 class="text-3xl font-extrabold tracking-tight">Link expired</h1>
		<p class="mt-2 text-sm text-slate-500">This reset link is invalid or has expired.</p>
	</div>

	<a
		href="/auth/forgot-password"
		class="cta cta-brand cta-lg w-full"
	>
		Request a new link
	</a>

	<p class="mt-8 text-center text-sm text-slate-500">
		Remember your password?
		<a href="/auth/login" class="font-bold text-brand hover:underline">Sign in</a>
	</p>
{:else}
	<div class="mb-8">
		<h1 class="text-3xl font-extrabold tracking-tight">Set a new password</h1>
		<p class="mt-2 text-sm text-slate-500">Enter a new password for <span class="font-medium text-slate-700">{data.email}</span></p>
	</div>

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
		<input type="hidden" name="token" value={data.token} />

		<div>
			<label for="password" class="field-label">New Password</label>
			<input
				id="password"
				name="password"
				type="password"
				required
				minlength="6"
				autocomplete="new-password"
				class="field"
				placeholder="Min 6 characters"
			/>
		</div>

		<div>
			<label for="confirmPassword" class="field-label">Confirm Password</label>
			<input
				id="confirmPassword"
				name="confirmPassword"
				type="password"
				required
				minlength="6"
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
			{submitting ? 'Resetting…' : 'Reset Password'}
		</button>
	</form>

	<p class="mt-8 text-center text-sm text-slate-500">
		Remember your password?
		<a href="/auth/login" class="font-bold text-brand hover:underline">Sign in</a>
	</p>
{/if}
