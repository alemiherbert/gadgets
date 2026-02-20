<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Register — Gadgets Store</title>
</svelte:head>

<div class="container">
	<div class="auth-card card">
		<h1>Create Account</h1>

		{#if form?.error}
			<div class="alert alert-error">{form.error}</div>
		{/if}

		<form method="POST" use:enhance>
			<div class="form-group">
				<label for="name">Full Name</label>
				<input type="text" id="name" name="name" required value={form?.name ?? ''} />
			</div>
			<div class="form-group">
				<label for="email">Email</label>
				<input type="email" id="email" name="email" required value={form?.email ?? ''} />
			</div>
			<div class="form-group">
				<label for="phone">Phone (optional)</label>
				<input type="tel" id="phone" name="phone" value={form?.phone ?? ''} />
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input type="password" id="password" name="password" required minlength="6" />
			</div>
			<div class="form-group">
				<label for="confirmPassword">Confirm Password</label>
				<input type="password" id="confirmPassword" name="confirmPassword" required />
			</div>
			<button type="submit" class="btn btn-primary" style="width:100%">Create Account</button>
		</form>

		<p class="mt-2 text-center text-light">
			Already have an account? <a href="/auth/login">Login</a>
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
