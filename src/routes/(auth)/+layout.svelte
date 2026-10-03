<script lang="ts">
	import '../../app.css';
	import Logo from '$lib/components/Logo.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { perks } from '$lib/site';

	let { children }: { children: any } = $props();
</script>

<div class="flex min-h-screen">
	<!-- Brand panel -->
	<div class="relative hidden overflow-hidden bg-ink text-white lg:flex lg:w-[46%] lg:flex-col">
		<img src="/img/categories/computing.avif" alt="" class="absolute inset-0 size-full object-cover opacity-35" />
		<div class="absolute inset-0 bg-gradient-to-br from-brand/70 via-ink/80 to-ink"></div>
		<div class="absolute -bottom-40 -left-24 size-[28rem] rounded-full bg-volt/20 blur-3xl"></div>

		<div class="relative flex flex-1 flex-col justify-between p-12">
			<a href="/" aria-label="Gadgeteria home"><Logo tone="light" /></a>
			<div>
				<h2 class="h-display max-w-md text-[3.25rem]">Genuine gadgets, delivered to your door.</h2>
				<ul class="mt-10 grid max-w-md grid-cols-2 gap-x-6 gap-y-5">
					{#each perks as perk}
						<li class="flex items-start gap-3">
							<span class="grid size-10 shrink-0 place-items-center rounded-xl bg-volt text-ink">
								<Icon name={perk.icon} class="size-5" />
							</span>
							<span>
								<span class="block text-sm font-bold">{perk.title}</span>
								<span class="block text-xs text-white/60">{perk.text}</span>
							</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>

	<!-- Form -->
	<div class="flex flex-1 flex-col bg-white px-5 py-8 sm:px-12 lg:px-16">
		<div class="flex items-center justify-between">
			<a href="/" class="lg:hidden" aria-label="Gadgeteria home"><Logo /></a>
			<a href="/" class="ml-auto inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-ink">
				<Icon name="chevron-left" class="size-4" stroke={2.25} />
				Back to shop
			</a>
		</div>
		<div class="flex flex-1 items-center justify-center py-10">
			<div class="w-full max-w-sm">
				{@render children()}
			</div>
		</div>
	</div>
</div>
