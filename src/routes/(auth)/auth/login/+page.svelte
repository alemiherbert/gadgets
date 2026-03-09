<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
	const resetSuccess = $derived(page.url.searchParams.get('reset') === 'success');
</script>

<svelte:head>
	<title>Sign In — Gadgets Store</title>
</svelte:head>

<div class="mb-8">
	<h1 class="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
	<p class="text-sm text-slate-500 mt-1">Sign in to track orders and manage your profile</p>
</div>

{#if resetSuccess}
	<div class="rounded-sm bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 mb-6">
		Your password has been reset successfully. Please sign in with your new password.
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
			value={form?.email ?? ''}
			class="block w-full rounded-sm border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-200 focus:ring-2 focus:ring-slate-200 outline-none transition"
			placeholder="you@example.com"
		/>
	</div>

	<div>
		<div class="flex items-center justify-between mb-1.5">
			<label for="password" class="block text-sm font-medium text-slate-700">Password</label>
			<a href="/auth/forgot-password" class="text-xs font-medium text-orange-600 hover:text-orange-500 transition-colors">
				Forgot password?
			</a>
		</div>
		<input
			id="password"
			name="password"
			type="password"
			required
			autocomplete="current-password"
			class="block w-full rounded-sm border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-200 focus:ring-2 focus:ring-slate-200 outline-none transition"
			placeholder="••••••••"
		/>
	</div>

	<button
		type="submit"
		disabled={submitting}
		class="w-full rounded-sm bg-orange-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-50 transition cursor-pointer"
	>
		{submitting ? 'Signing in…' : 'Sign In'}
	</button>
</form>

<div class="relative my-6">
	<div class="absolute inset-0 flex items-center">
		<div class="w-full border-t border-slate-200"></div>
	</div>
	<div class="relative flex justify-center text-sm">
		<span class="bg-white px-4 text-slate-500">Or continue with</span>
	</div>
</div>

<a
	href="/auth/google"
	class="w-full flex items-center justify-center gap-3 rounded-sm border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
>
	<svg class="h-5 w-5" viewBox="0 0 24 24">
		<path
			fill="#4285F4"
			d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
		/>
		<path
			fill="#34A853"
			d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
		/>
		<path
			fill="#FBBC05"
			d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
		/>
		<path
			fill="#EA4335"
			d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
		/>
		<path fill="none" d="M1 1h22v22H1z" />
	</svg>
	Sign in with Google
</a>

<p class="text-center text-sm text-slate-500 mt-8">
	Don't have an account?
	<a href="/auth/register" class="font-medium text-orange-600 hover:text-orange-500 transition-colors">Create one</a>
</p>
