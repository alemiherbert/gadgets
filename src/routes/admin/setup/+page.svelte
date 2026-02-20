<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Admin Setup — Gadgets Store</title>
</svelte:head>

<div class="setup-page">
	<div class="card" style="max-width:400px;width:100%;padding:2rem">
		<h1 style="text-align:center;margin-bottom:1rem">Admin Setup</h1>
		<p class="text-light text-center mb-2">
			No admin account exists yet. Click below to create the default admin user.
		</p>

		{#if form?.error}
			<div class="alert alert-error">{form.error}</div>
		{/if}

		<form method="POST" use:enhance>
			<div class="card" style="background:var(--color-bg-secondary);margin-bottom:1rem">
				<p><strong>Email:</strong> admin@store.com</p>
				<p><strong>Password:</strong> admin123</p>
			</div>
			<button type="submit" class="btn btn-primary" style="width:100%">Create Admin Account</button>
		</form>
	</div>
</div>

<style>
	.setup-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 80vh;
	}
</style>
