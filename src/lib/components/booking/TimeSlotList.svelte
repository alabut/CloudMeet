<script lang="ts">
	interface TimeSlot {
		start: string;
		end: string;
	}

	interface Props {
		availableSlots: TimeSlot[];
		selectedSlot: TimeSlot | null;
		loading: boolean;
		brandColor: string;
		formatTime: (isoStr: string) => string;
		onSelectSlot: (slot: TimeSlot) => void;
		onConfirm: () => void;
	}

	let {
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
<div class="w-64 shrink-0 border-l border-border p-6 flex flex-col min-h-0" style="max-height: 440px;">
	{#if loading}
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style="border-color: {brandColor}; border-top-color: transparent"></div>
		</div>
	{:else if availableSlots.length === 0}
		<div class="py-4">
			<p class="text-sm font-medium text-text">No times available</p>
			<p class="mt-2 text-sm leading-relaxed text-text-secondary">Choose another highlighted date.</p>
		</div>
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
			<div class="mt-2 flex-shrink-0 border-t border-border pt-3">
				<button
					type="button"
					onclick={onConfirm}
					class="w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
					style="background-color: {brandColor}"
				>
					Next
				</button>
			</div>
		{/if}
	{/if}
</div>
