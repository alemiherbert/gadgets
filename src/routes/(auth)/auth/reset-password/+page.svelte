<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Reset Password — Gadgets Store</title>
</svelte:head>

{#if data.invalid}
	<div class="mb-8">
		<h1 class="text-2xl font-bold tracking-tight text-slate-900">Link expired</h1>
		<p class="text-sm text-slate-500 mt-1">This reset link is invalid or has expired.</p>
	</div>

	<a
		href="/auth/forgot-password"
		class="inline-flex w-full justify-center rounded-sm bg-orange-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 transition"
	>
		Request a new link
	</a>

	<p class="text-center text-sm text-slate-500 mt-8">
		Remember your password?
		<a href="/auth/login" class="font-medium text-orange-600 hover:text-orange-500 transition-colors">Sign in</a>
	</p>
{:else}
	<div class="mb-8">
		<h1 class="text-2xl font-bold tracking-tight text-slate-900">Set a new password</h1>
		<p class="text-sm text-slate-500 mt-1">Enter a new password for <span class="font-medium text-slate-700">{data.email}</span></p>
	</div>

	{#if form?.error}
		<div class="rounded-sm bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">
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
			<label for="password" class="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
			<input
				id="password"
				name="password"
				type="password"
				required
				minlength="6"
				autocomplete="new-password"
				class="block w-full rounded-sm border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-200 focus:ring-2 focus:ring-slate-200 outline-none transition"
				placeholder="Min 6 characters"
			/>
		</div>

		<div>
			<label for="confirmPassword" class="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
			<input
				id="confirmPassword"
				name="confirmPassword"
				type="password"
				required
				minlength="6"
				autocomplete="new-password"
				class="block w-full rounded-sm border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-200 focus:ring-2 focus:ring-slate-200 outline-none transition"
				placeholder="Repeat your password"
			/>
		</div>

		<button
			type="submit"
			disabled={submitting}
			class="w-full rounded-sm bg-orange-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-50 transition cursor-pointer"
		>
			{submitting ? 'Resetting…' : 'Reset Password'}
		</button>
	</form>

	<p class="text-center text-sm text-slate-500 mt-8">
		Remember your password?
		<a href="/auth/login" class="font-medium text-orange-600 hover:text-orange-500 transition-colors">Sign in</a>
	</p>
{/if}
