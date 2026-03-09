<script lang="ts">
	type AuthSwitchMode = 'signin' | 'signup';

	let { mode }: { mode: AuthSwitchMode } = $props();

	const promptText = $derived(mode === 'signin' ? "Don't have an account?" : 'Already have an account?');
	const linkHref = $derived(mode === 'signin' ? '/auth/register' : '/auth/login');
	const linkText = $derived(mode === 'signin' ? 'Create one' : 'Sign in');
</script>

<p class="text-center text-sm text-slate-500 mt-8">
	{promptText}
	<a href={linkHref} class="font-medium text-orange-600 hover:text-orange-500 transition-colors">{linkText}</a>
</p>
