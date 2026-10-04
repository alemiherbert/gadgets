<script lang="ts">
	import { ui } from '$lib/ui.svelte';
	import { cart } from '$lib/cart.svelte';
	import Icon from './Icon.svelte';
</script>

<div class="wrap pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] flex justify-center" aria-live="polite">
	{#if ui.toast}
		{#key ui.toast.id}
			<div class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-ink p-3 pl-4 text-white shadow-float animate-toast-down motion-reduce:animate-fade-in" role="status">
				<span class="grid size-8 shrink-0 place-items-center rounded-full bg-ok animate-pop">
					<Icon name="check" class="size-4" stroke={3} />
				</span>
				<div class="min-w-0 flex-1">
					<p class="text-sm font-bold">Added to cart</p>
					<p class="truncate text-xs text-white/70">{ui.toast.name}</p>
				</div>
				<button onclick={() => ui.openCart()} class="cta cta-sm cta-sun shrink-0">
					View cart ({cart.count})
				</button>
				<button onclick={() => ui.dismissToast()} class="grid size-8 shrink-0 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white" aria-label="Dismiss">
					<Icon name="close" class="size-4" stroke={2} />
				</button>
			</div>
		{/key}
	{/if}
</div>
