<script lang="ts">
	let { tone = 'dark', class: className = '' }: { tone?: 'dark' | 'light'; class?: string } = $props();
</script>

<span class="inline-flex items-center gap-2 {className}">
	<span class="relative grid size-8 place-items-center rounded-[10px] bg-brand text-[17px] font-extrabold text-white">
		G
		<span class="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-volt ring-2 {tone === 'dark' ? 'ring-white' : 'ring-ink'}"></span>
	</span>
	<span class="text-[19px] font-extrabold tracking-[-0.04em] {tone === 'dark' ? 'text-ink' : 'text-white'}">Gadgeteria</span>
</span>
