<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import { whatsappLink, site } from '$lib/site';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
	const whatsapp = whatsappLink(`Hi ${site.name}, I signed up with my phone number and forgot my password. My number is: `);
</script>

<Seo title="Reset password" noindex />

<div class="mb-8">
	<h1 class="h-page">Reset your password</h1>
	<p class="mt-2 text-sm text-ink-muted">Enter your email and we'll send you a reset link</p>
</div>

{#if form?.success}
	<div class="notice notice-ok mb-6">
		If an account with that email exists, we've sent a password reset link.
	</div>
{/if}

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
	<div>
		<label for="email" class="field-label">Email</label>
		<input
			id="email"
			name="email"
			type="email"
			required
			autocomplete="email"
			class="field"
			placeholder="you@example.com"
		/>
	</div>

	<button
		type="submit"
		disabled={submitting}
		class="cta cta-brand cta-lg w-full"
	>
		{submitting ? 'Sending…' : 'Send reset link'}
	</button>
</form>

{#if whatsapp}
	<div class="mt-6 rounded-2xl bg-surface p-4 text-sm">
		<p class="font-semibold">Signed up with only a phone number?</p>
		<p class="mt-1 text-ink-muted">Message us from that number and we'll reset it for you.</p>
		<a href={whatsapp} target="_blank" rel="noopener" class="cta cta-sm mt-3 cta-brand">
			<Icon name="whatsapp" class="size-4" /> Reset on WhatsApp
		</a>
	</div>
{/if}

<p class="mt-8 text-center text-sm text-ink-muted">
	Remember your password?
	<a href="/auth/login" class="font-bold text-brand hover:underline">Sign in</a>
</p>
