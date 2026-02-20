<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Admin Login — Gadgets Store</title>
</svelte:head>

<div class="login-page">
	<div class="login-card card">
		<h1>⚙ Admin Login</h1>

		{#if form?.error}
			<div class="alert alert-error">{form.error}</div>
		{/if}

		<form method="POST" use:enhance>
			<div class="form-group">
				<label for="email">Email</label>
				<input type="email" id="email" name="email" required value={form?.email ?? ''} />
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input type="password" id="password" name="password" required />
			</div>
			<button type="submit" class="btn btn-primary" style="width:100%">Login</button>
		</form>
	</div>
</div>

<style>
	.login-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 80vh;
	}
	.login-card {
		max-width: 400px;
		width: 100%;
		padding: 2rem;
	}
	h1 {
		text-align: center;
		margin-bottom: 1.5rem;
		font-size: 1.3rem;
	}
</style>
