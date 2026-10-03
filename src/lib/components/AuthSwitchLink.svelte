<script lang="ts">
	type AuthSwitchMode = 'signin' | 'signup';

	let { mode }: { mode: AuthSwitchMode } = $props();

	const promptText = $derived(mode === 'signin' ? "Don't have an account?" : 'Already have an account?');
	const linkHref = $derived(mode === 'signin' ? '/auth/register' : '/auth/login');
	const linkText = $derived(mode === 'signin' ? 'Create one' : 'Sign in');
</script>

<p class="mt-8 text-center text-sm text-ink-muted">
	{promptText}
	<a href={linkHref} class="font-bold text-brand hover:underline">{linkText}</a>
</p>
