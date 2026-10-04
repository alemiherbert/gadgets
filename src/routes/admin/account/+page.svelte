<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import { ADMIN_PASSWORD_MIN, ADMIN_PASSWORD_MAX } from '$lib/admin-reset';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let busy = $state<'email' | 'password' | null>(null);

	function submit(section: 'email' | 'password') {
		return () => {
			busy = section;
			return async ({ update }: { update: (opts?: { reset?: boolean }) => Promise<void> }) => {
				busy = null;
				await update({ reset: section === 'password' });
			};
		};
	}
</script>

<svelte:head>
	<title>Account — Admin</title>
</svelte:head>

<div class="max-w-3xl space-y-6 p-4 lg:p-6">
	<div>
		<h1 class="h-page">Account</h1>
		<p class="mt-1 text-sm text-ink-muted">Your sign-in details for the admin panel.</p>
	</div>

	<section class="card p-5 sm:p-6">
		<div class="flex items-start gap-3">
			<span class="icon-tile size-10 bg-brand-soft text-brand"><Icon name="mail" class="size-5" /></span>
			<div>
				<h2 class="h-card">Sign-in email</h2>
				<p class="mt-0.5 text-sm text-ink-muted">
					Password reset links are sent here. New-order alerts always go to <span class="font-semibold text-ink">{data.supportEmail}</span>.
				</p>
			</div>
		</div>

		{#if form?.section === 'email' && form.error}
			<div class="alert alert-error mt-5">{form.error}</div>
		{:else if form?.section === 'email' && form.success}
			<div class="alert alert-success mt-5">{form.success}</div>
		{/if}

		<form method="POST" action="?/email" use:enhance={submit('email')} class="mt-5 grid gap-4 sm:grid-cols-2">
			<div class="sm:col-span-2">
				<label for="email" class="label">Email</label>
				<input id="email" name="email" type="email" required autocomplete="email" class="input" value={form?.section === 'email' && 'email' in form ? form.email : data.email} />
			</div>
			<div>
				<label for="email-current" class="label">Current password</label>
				<input id="email-current" name="currentPassword" type="password" required autocomplete="current-password" class="input" />
			</div>
			<div class="flex items-end">
				<button type="submit" disabled={busy !== null} class="btn btn-primary h-10 w-full sm:w-auto">
					{busy === 'email' ? 'Saving…' : 'Update email'}
				</button>
			</div>
		</form>
	</section>

	<section class="card p-5 sm:p-6">
		<div class="flex items-start gap-3">
			<span class="icon-tile size-10 bg-brand-soft text-brand"><Icon name="key" class="size-5" /></span>
			<div>
				<h2 class="h-card">Password</h2>
				<p class="mt-0.5 text-sm text-ink-muted">At least {ADMIN_PASSWORD_MIN} characters. Changing it signs out your other devices.</p>
			</div>
		</div>

		{#if form?.section === 'password' && form.error}
			<div class="alert alert-error mt-5">{form.error}</div>
		{:else if form?.section === 'password' && form.success}
			<div class="alert alert-success mt-5">{form.success}</div>
		{/if}

		<form method="POST" action="?/password" use:enhance={submit('password')} class="mt-5 grid gap-4 sm:grid-cols-2">
			<div class="sm:col-span-2">
				<label for="pw-current" class="label">Current password</label>
				<input id="pw-current" name="currentPassword" type="password" required autocomplete="current-password" class="input" />
			</div>
			<div>
				<label for="pw-new" class="label">New password</label>
				<input id="pw-new" name="password" type="password" required minlength={ADMIN_PASSWORD_MIN} maxlength={ADMIN_PASSWORD_MAX} autocomplete="new-password" class="input" />
			</div>
			<div>
				<label for="pw-confirm" class="label">Confirm new password</label>
				<input id="pw-confirm" name="confirmPassword" type="password" required minlength={ADMIN_PASSWORD_MIN} maxlength={ADMIN_PASSWORD_MAX} autocomplete="new-password" class="input" />
			</div>
			<div class="sm:col-span-2">
				<button type="submit" disabled={busy !== null} class="btn btn-primary h-10 w-full sm:w-auto">
					{busy === 'password' ? 'Saving…' : 'Change password'}
				</button>
			</div>
		</form>
	</section>
</div>
