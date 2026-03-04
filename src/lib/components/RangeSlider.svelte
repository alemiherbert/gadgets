<script lang="ts">
interface Props {
	min: number;
	max: number;
	step?: number;
	minValue: number;
	maxValue: number;
	onchange?: (min: number, max: number) => void;
}

let { min, max, step = 1, minValue = $bindable(), maxValue = $bindable(), onchange }: Props = $props();

let trackEl: HTMLDivElement;

function clamp(val: number, lo: number, hi: number) {
	return Math.min(hi, Math.max(lo, val));
}

function snap(val: number) {
	return Math.round((val - min) / step) * step + min;
}

function posToValue(clientX: number): number {
	const rect = trackEl.getBoundingClientRect();
	const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
	return snap(min + ratio * (max - min));
}

function startDrag(handle: 'min' | 'max') {
	return (e: PointerEvent) => {
		e.preventDefault();

		function onMove(ev: PointerEvent) {
			const val = posToValue(ev.clientX);
			if (handle === 'min') {
				minValue = clamp(val, min, maxValue - step);
			} else {
				maxValue = clamp(val, minValue + step, max);
			}
		}

		function onUp() {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			onchange?.(minValue, maxValue);
		}

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	};
}

let minPct = $derived(((minValue - min) / (max - min)) * 100);
let maxPct = $derived(((maxValue - min) / (max - min)) * 100);
</script>

<!-- Track -->
<div bind:this={trackEl} class="relative h-5 flex items-center select-none">
	<!-- Background track -->
	<div class="absolute inset-x-0 h-1.5 rounded-full bg-slate-200"></div>

	<!-- Orange fill between handles -->
	<div
		class="absolute h-1.5 rounded-full bg-orange-400"
		style="left: {minPct}%; right: {100 - maxPct}%"
	></div>

	<!-- Min handle -->
	<button
		type="button"
		onpointerdown={startDrag('min')}
		class="absolute -translate-x-1/2 w-3 h-3 rounded-full bg-orange-500 shadow-sm hover:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 cursor-grab active:cursor-grabbing touch-none"
		style="left: {minPct}%"
		aria-label="Minimum price"
		role="slider"
		aria-valuemin={min}
		aria-valuemax={maxValue}
		aria-valuenow={minValue}
	></button>

	<!-- Max handle -->
	<button
		type="button"
		onpointerdown={startDrag('max')}
		class="absolute -translate-x-1/2 w-3 h-3 rounded-full bg-orange-500 shadow-sm hover:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 cursor-grab active:cursor-grabbing touch-none"
		style="left: {maxPct}%"
		aria-label="Maximum price"
		role="slider"
		aria-valuemin={minValue}
		aria-valuemax={max}
		aria-valuenow={maxValue}
	></button>
</div>
