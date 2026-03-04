<script lang="ts">
	import '../../app.css';
	let { children }: { children: any } = $props();
</script>

<div class="flex min-h-screen">
	<!-- Left column: full-bleed image -->
	<div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
		<img
			src="/img/categories/computing.avif"
			alt="Gadgets collection"
			class="absolute inset-0 h-full w-full object-cover opacity-60"
		/>
		<div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/20"></div>
		<div class="relative z-10 flex flex-col justify-end p-12">
			<a href="/" class="flex items-center gap-2.5 mb-8">
				<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
					<span class="text-sm font-bold text-white">G</span>
				</div>
				<span class="text-lg font-semibold text-white">Gadgets</span>
			</a>
			<h2 class="text-3xl font-bold text-white leading-tight mb-3">
				Premium gadgets,<br />delivered to your door.
			</h2>
			<p class="text-sm text-slate-300 max-w-sm leading-relaxed">
				Shop the latest tech with pay-on-delivery convenience. Free returns within 30 days.
			</p>
		</div>
	</div>

	<!-- Right column: auth form -->
	<div class="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-white">
		<!-- Mobile logo -->
		<div class="lg:hidden mb-10">
			<a href="/" class="flex items-center gap-2">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
					<span class="text-sm font-bold text-white">G</span>
				</div>
				<span class="text-base font-semibold text-slate-900">Gadgets</span>
			</a>
		</div>

		<div class="mx-auto w-full max-w-sm">
			{@render children()}
		</div>
	</div>
</div>
