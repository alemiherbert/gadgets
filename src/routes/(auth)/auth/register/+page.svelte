<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Create Account — Gadgets Store</title>
</svelte:head>

<div class="mb-8">
	<h1 class="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
	<p class="text-sm text-slate-500 mt-1">Sign up to track orders and checkout faster</p>
</div>

{#if form?.error}
	<div class="rounded-sm bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">
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
		<label for="name" class="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
		<input
			id="name"
			name="name"
			type="text"
			required
			value={form?.name ?? ''}
			class="block w-full rounded-sm border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-200 focus:ring-2 focus:ring-slate-200 outline-none transition"
			placeholder="John Doe"
		/>
	</div>

	<div>
		<label for="email" class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
		<input
			id="email"
			name="email"
			type="email"
			required
			autocomplete="email"
			value={form?.email ?? ''}
			class="block w-full rounded-sm border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-200 focus:ring-2 focus:ring-slate-200 outline-none transition"
			placeholder="you@example.com"
		/>
	</div>

	<div>
		<label for="phone" class="block text-sm font-medium text-slate-700 mb-1.5">Phone <span class="text-slate-400 font-normal">(optional)</span></label>
		<input
			id="phone"
			name="phone"
			type="tel"
			value={form?.phone ?? ''}
			pattern="^(\+?256|0)[3-9]\d{8}$"
			title="Ugandan phone number, e.g. 0771234567 or +256771234567"
			class="block w-full rounded-sm border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-200 focus:ring-2 focus:ring-slate-200 outline-none transition"
			placeholder="0771234567"
		/>
		<p class="text-xs text-slate-400 mt-1">Format: 07XXXXXXXX or +2567XXXXXXXX</p>
	</div>

	<div>
		<label for="password" class="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
		<input
			id="password"
			name="password"
			type="password"
			required
			minlength="8"
			autocomplete="new-password"
			class="block w-full rounded-sm border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-200 focus:ring-2 focus:ring-slate-200 outline-none transition"
			placeholder="Min 8 characters"
		/>
	</div>

	<div>
		<label for="confirmPassword" class="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
		<input
			id="confirmPassword"
			name="confirmPassword"
			type="password"
			required
			minlength="8"
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
		{submitting ? 'Creating account…' : 'Create Account'}
	</button>
</form>

<p class="text-center text-sm text-slate-500 mt-8">
	Already have an account?
	<a href="/auth/login" class="font-medium text-orange-600 hover:text-orange-500 transition-colors">Sign in</a>
</p>
