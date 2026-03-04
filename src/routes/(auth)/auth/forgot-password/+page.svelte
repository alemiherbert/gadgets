<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Reset Password — Gadgets Store</title>
</svelte:head>

<div class="mb-8">
	<h1 class="text-2xl font-bold tracking-tight text-slate-900">Reset your password</h1>
	<p class="text-sm text-slate-500 mt-1">Enter your email and we'll send you a reset link</p>
</div>

{#if form?.success}
	<div class="rounded-sm bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 mb-6">
		If an account with that email exists, we've sent a password reset link.
	</div>
{/if}

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
	<div>
		<label for="email" class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
		<input
			id="email"
			name="email"
			type="email"
			required
			autocomplete="email"
			class="block w-full rounded-sm border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-200 focus:ring-2 focus:ring-slate-200 outline-none transition"
			placeholder="you@example.com"
		/>
	</div>

	<button
		type="submit"
		disabled={submitting}
		class="w-full rounded-sm bg-orange-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-50 transition cursor-pointer"
	>
		{submitting ? 'Sending…' : 'Send Reset Link'}
	</button>
</form>

<p class="text-center text-sm text-slate-500 mt-8">
	Remember your password?
	<a href="/auth/login" class="font-medium text-orange-600 hover:text-orange-500 transition-colors">Sign in</a>
</p>
