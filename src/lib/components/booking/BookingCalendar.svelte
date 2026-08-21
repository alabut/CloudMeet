<script lang="ts">
	import { formatDateLocal } from '$lib/utils/dateFormatters';

	interface Props {
		currentMonth: Date;
		selectedDate: string | null;
		availableDates: Set<string>;
		brandColor: string;
		brandLighter: string;
		brandDark: string;
		onDateSelect: (dateStr: string) => void;
		onPrevMonth: () => void;
		onNextMonth: () => void;
		// Opt-in dark/light theme styling for the public booking page (see
		// docs/STYLE-MAP.md). Defaults to false so the reschedule page -- the
		// other call site, out of scope for this restyle and still on a plain
		// white background -- keeps its original untouched appearance.
		themed?: boolean;
	}

	let {
		currentMonth,
		selectedDate,
		availableDates,
		brandColor,
		brandLighter,
		brandDark,
		onDateSelect,
		onPrevMonth,
		onNextMonth,
		themed = false
	}: Props = $props();

	const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	const calendarDays = $derived(() => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const startPadding = (firstDay.getDay() + 6) % 7;
		const days: Array<{ date: Date; isCurrentMonth: boolean; isAvailable: boolean; dateStr: string }> = [];

		for (let i = 0; i < startPadding; i++) {
			const date = new Date(year, month, i - startPadding + 1);
			days.push({
				date,
				isCurrentMonth: false,
				isAvailable: false,
				dateStr: formatDateLocal(date)
			});
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		for (let i = 1; i <= lastDay.getDate(); i++) {
			const date = new Date(year, month, i);
			const dateStr = formatDateLocal(date);
			const isAvailable = date >= today && date <= new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
			days.push({
				date,
				isCurrentMonth: true,
				isAvailable,
				dateStr
			});
		}

		const remaining = 42 - days.length;
		for (let i = 1; i <= remaining; i++) {
			const date = new Date(year, month + 1, i);
			days.push({
				date,
				isCurrentMonth: false,
				isAvailable: false,
				dateStr: formatDateLocal(date)
			});
		}

		return days;
	});

	function formatMonthYear(date: Date) {
		return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
	}
</script>

<!-- ===== USER STYLE ANCHOR: availability-slot-picker (calendar) ===== -->
<div>
	<div class="flex items-center justify-between mb-4">
		<h3 class={themed ? 'font-meta text-extrasmall uppercase tracking-wide text-text-secondary' : 'text-lg font-medium text-gray-900'}>{formatMonthYear(currentMonth)}</h3>
		<div class="flex gap-2">
			<button onclick={onPrevMonth} class="p-2 rounded-full transition {themed ? 'hover:bg-bg-secondary' : 'hover:bg-gray-100'}" aria-label="Previous month">
				<svg class="w-5 h-5 {themed ? 'text-text-secondary' : 'text-gray-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
				</svg>
			</button>
			<button onclick={onNextMonth} class="p-2 rounded-full transition {themed ? 'hover:bg-bg-secondary' : 'hover:bg-gray-100'}" aria-label="Next month">
				<svg class="w-5 h-5 {themed ? 'text-text-secondary' : 'text-gray-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
				</svg>
			</button>
		</div>
	</div>

	<div class="grid grid-cols-7 gap-1 mb-2">
		{#each weekDays as day}
			<div class="text-center py-2 {themed ? 'font-meta text-extrasmall uppercase tracking-wide text-text-secondary' : 'text-xs font-medium text-gray-500'}">{day}</div>
		{/each}
	</div>

	<div class="grid grid-cols-7 gap-1">
		{#each calendarDays() as day}
			{@const hasSlots = availableDates.has(day.dateStr)}
			{@const isClickable = day.isAvailable && hasSlots}
			{@const isSelected = selectedDate === day.dateStr}
			<button
				type="button"
				onclick={() => isClickable && onDateSelect(day.dateStr)}
				disabled={!isClickable}
				class="aspect-square flex items-center justify-center text-sm rounded-full transition relative
					{!day.isCurrentMonth ? (themed ? 'text-text-secondary opacity-40' : 'text-gray-300') : ''}
					{isClickable && !isSelected ? 'font-semibold cursor-pointer' : ''}
					{day.isAvailable && !hasSlots && day.isCurrentMonth ? (themed ? 'text-text-secondary' : 'text-gray-400') : ''}
					{!day.isAvailable && day.isCurrentMonth ? (themed ? 'text-text-secondary opacity-40 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed') : ''}
					{isSelected ? 'text-white' : ''}"
				style="{isClickable && !isSelected ? `background-color: ${brandLighter}; color: ${themed ? 'var(--accent)' : brandDark}` : ''}{isSelected ? `background-color: ${brandColor}` : ''}"
			>
				{day.date.getDate()}
			</button>
		{/each}
	</div>
</div>
