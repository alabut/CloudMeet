<script lang="ts">
	import { formatSelectedDate } from '$lib/utils/dateFormatters';

	interface TimeSlot {
		start: string;
		end: string;
	}

	interface Props {
		selectedDate: string;
		availableSlots: TimeSlot[];
		selectedSlot: TimeSlot | null;
		loading: boolean;
		brandColor: string;
		formatTime: (isoStr: string) => string;
		onSelectSlot: (slot: TimeSlot) => void;
		onConfirm: () => void;
	}

	let {
		selectedDate,
		availableSlots,
		selectedSlot,
		loading,
		brandColor,
		formatTime,
		onSelectSlot,
		onConfirm
	}: Props = $props();
</script>

<!-- ===== USER STYLE ANCHOR: availability-slot-picker (time slots) ===== -->
<div class="w-52 ml-6 border-l border-border pl-6 flex flex-col min-h-0" style="max-height: 400px;">
	<h3 class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-4 flex-shrink-0">
		{formatSelectedDate(selectedDate).split(',')[0]}
	</h3>

	{#if loading}
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style="border-color: {brandColor}; border-top-color: transparent"></div>
		</div>
	{:else if availableSlots.length === 0}
		<p class="text-sm text-text-secondary py-4">No available times</p>
	{:else}
		<div class="space-y-2 overflow-y-auto flex-1 min-h-0 pr-2 scrollbar-thin">
			{#each availableSlots as slot}
				<button
					type="button"
					onclick={() => onSelectSlot(slot)}
					class="w-full py-2.5 px-3 border-2 rounded-lg text-sm font-semibold transition"
					class:border-accent={selectedSlot === slot}
					class:bg-accent={selectedSlot === slot}
					class:text-white={selectedSlot === slot}
					style={selectedSlot === slot ? '' : `border-color: ${brandColor}; color: ${brandColor}`}
				>
					{formatTime(slot.start)}
				</button>
			{/each}
		</div>

		{#if selectedSlot}
			<div class="flex-shrink-0 pt-3 mt-2 border-t border-border">
				<div class="flex gap-2">
					<button
						type="button"
						class="flex-1 py-2.5 px-3 border-2 border-accent bg-accent text-white rounded-lg text-sm font-semibold"
					>
						{formatTime(selectedSlot.start)}
					</button>
					<button
						type="button"
						onclick={onConfirm}
						class="flex-1 py-2.5 px-3 text-white rounded-lg text-sm font-semibold transition hover:opacity-90"
						style="background-color: {brandColor}"
					>
						Next
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>
