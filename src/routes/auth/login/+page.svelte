<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Login — Gadgets Store</title>
</svelte:head>

<div class="container">
	<div class="auth-card card">
		<h1>Login</h1>

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

		<p class="mt-2 text-center text-light">
			Don't have an account? <a href="/auth/register">Register</a>
		</p>
	</div>
</div>

<style>
	.auth-card {
		max-width: 420px;
		margin: 2rem auto;
		padding: 2rem;
	}
	h1 {
		text-align: center;
		margin-bottom: 1.5rem;
	}
</style>
