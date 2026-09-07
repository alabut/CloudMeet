<script lang="ts">
	import { createFormatters } from '$lib/utils/dateFormatters';
	import DashboardDialog from '$lib/components/dashboard/primitives/DashboardDialog.svelte';
	import DashboardField from '$lib/components/dashboard/primitives/DashboardField.svelte';
	import DashboardButton from '$lib/components/dashboard/primitives/DashboardButton.svelte';
	import DashboardNotice from '$lib/components/dashboard/primitives/DashboardNotice.svelte';
	import DashboardSpinner from '$lib/components/dashboard/primitives/DashboardSpinner.svelte';
	import DashboardIconButton from '$lib/components/dashboard/primitives/DashboardIconButton.svelte';

	interface Booking {
		id: string;
		event_type_name: string;
		event_type_slug: string;
		attendee_name: string;
		attendee_email: string;
		start_time: string;
		end_time: string;
		event_type_id: string;
		duration_minutes: number;
	}

	interface Slot {
		start: string;
		end: string;
	}

	interface Props {
		booking: Booking | null;
		onClose: () => void;
		onSubmit: (bookingId: string, newStartTime: string, newEndTime: string, message: string) => Promise<void>;
		inert?: boolean;
		previewSlots?: Slot[] | null;
		previewLoadingSlots?: boolean;
		previewSelectedDate?: string | null;
		previewSelectedTime?: string | null;
	}

	let {
		booking,
		onClose,
		onSubmit,
		inert = false,
		previewSlots = null,
		previewLoadingSlots = false,
		previewSelectedDate = null,
		previewSelectedTime = null
	}: Props = $props();

	const { formatCompactDateTime } = createFormatters();

	let selectedDate = $state<string | null>(null);
	let selectedTime = $state<string | null>(null);
	let message = $state('');
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let availableSlots = $state<Slot[]>([]);
	let loadingSlots = $state(false);

	let currentMonth = $state(new Date());

	const monthName = $derived(currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' }));

	const calendarDays = $derived(() => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const startPadding = firstDay.getDay();

		const days: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean; isPast: boolean }> = [];

		for (let i = startPadding - 1; i >= 0; i--) {
			const date = new Date(year, month, -i);
			days.push({ date, isCurrentMonth: false, isToday: false, isPast: true });
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (let day = 1; day <= lastDay.getDate(); day++) {
			const date = new Date(year, month, day);
			const isToday = date.toDateString() === today.toDateString();
			const isPast = date < today;
			days.push({ date, isCurrentMonth: true, isToday, isPast });
		}

		const remaining = 42 - days.length;
		for (let i = 1; i <= remaining; i++) {
			const date = new Date(year, month + 1, i);
			days.push({ date, isCurrentMonth: false, isToday: false, isPast: false });
		}

		return days;
	});

	$effect(() => {
		if (inert) {
			selectedDate = previewSelectedDate;
			selectedTime = previewSelectedTime;
			availableSlots = previewSlots ?? [];
			loadingSlots = previewLoadingSlots;
		}
	});

	function prevMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
	}

	function nextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
	}

	function formatDateKey(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	function slotsForDate(dateKey: string, slots: Slot[]): Slot[] {
		return slots.filter((slot) => slot.start.startsWith(dateKey));
	}

	async function selectDate(date: Date) {
		const dateKey = formatDateKey(date);
		selectedDate = dateKey;
		selectedTime = null;
		availableSlots = [];
		loadingSlots = true;
		error = null;

		if (inert) {
			availableSlots = slotsForDate(dateKey, previewSlots ?? []);
			loadingSlots = false;
			return;
		}

		try {
			const response = await fetch(`/api/availability?date=${dateKey}&event=${booking?.event_type_slug}`);
			if (response.ok) {
				const data = await response.json();
				availableSlots = data.slots || [];
			} else {
				error = 'Failed to load available times';
			}
		} catch {
			error = 'Failed to load available times';
		} finally {
			loadingSlots = false;
		}
	}

	function selectSlot(slot: Slot) {
		selectedTime = slot.start;
	}

	function formatSlotTime(isoString: string): string {
		const date = new Date(isoString);
		return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
	}

	async function handleSubmit() {
		if (!booking || !selectedDate || !selectedTime) return;

		if (inert) return;

		submitting = true;
		error = null;

		try {
			const slot = availableSlots.find((s) => s.start === selectedTime);
			if (!slot) {
				error = 'Please select a time slot';
				return;
			}

			await onSubmit(booking.id, slot.start, slot.end, message);
			onClose();
		} catch (err: any) {
			error = err.message || 'Failed to send reschedule proposal';
		} finally {
			submitting = false;
		}
	}

	let open = $state(false);

	$effect(() => {
		open = booking !== null;
	});
</script>

<DashboardDialog
	bind:open
	title="Propose New Time"
	class="max-w-2xl"
	onclose={onClose}
>
	{#if booking}
		<div class="space-y-4">
			<div class="bg-[var(--dash-field)] rounded-lg p-3 border border-dash-border">
				<p class="text-xs text-dash-text-secondary mb-0.5">Current time</p>
				<p class="text-sm font-medium text-dash-text">
					{formatCompactDateTime(new Date(booking.start_time))}
				</p>
				<p class="text-xs text-dash-text-secondary mt-1">
					{booking.event_type_name} · with {booking.attendee_name}
				</p>
			</div>

			{#if error}
				<DashboardNotice variant="danger">{error}</DashboardNotice>
			{/if}

			<div class="flex flex-col lg:flex-row gap-4">
				<div class="flex-1 min-w-0">
					<div class="flex items-center justify-between mb-3">
						<DashboardIconButton
							aria-label="Previous month"
							size="sm"
							onclick={prevMonth}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
							</svg>
						</DashboardIconButton>
						<span class="text-sm font-medium text-dash-text">{monthName}</span>
						<DashboardIconButton
							aria-label="Next month"
							size="sm"
							onclick={nextMonth}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</DashboardIconButton>
					</div>

					<div class="grid grid-cols-7 gap-0.5 text-center text-xs text-dash-text-secondary mb-1.5">
						<div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
					</div>

					<div class="grid grid-cols-7 gap-0.5">
						{#each calendarDays() as day}
							<button
								type="button"
								disabled={day.isPast || !day.isCurrentMonth}
								onclick={() => selectDate(day.date)}
								class="aspect-square flex items-center justify-center text-xs rounded-md transition
									{!day.isCurrentMonth || day.isPast ? 'text-dash-text-secondary/30 cursor-not-allowed' : 'hover:bg-dash-surface-raised text-dash-text'}
									{day.isToday ? 'font-bold' : ''}
									{selectedDate === formatDateKey(day.date) ? 'bg-dash-accent text-white hover:bg-dash-accent-hover' : ''}"
							>
								{day.date.getDate()}
							</button>
						{/each}
					</div>
				</div>

				<div class="flex-1 min-w-0">
					<h3 class="text-sm font-medium text-dash-text mb-3">
						{selectedDate ? 'Available times' : 'Select a date first'}
					</h3>

					{#if loadingSlots}
						<div class="flex items-center justify-center py-8">
							<DashboardSpinner size="md" />
						</div>
					{:else if selectedDate && availableSlots.length === 0}
						<p class="text-sm text-dash-text-secondary text-center py-8">No available times</p>
					{:else if selectedDate}
						<div class="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto">
							{#each availableSlots as slot}
								<button
									type="button"
									onclick={() => selectSlot(slot)}
									class="px-2 py-1.5 text-xs border rounded-md transition text-center
										{selectedTime === slot.start
											? 'bg-dash-accent text-white border-dash-accent'
											: 'border-dash-border text-dash-text hover:border-dash-accent hover:bg-dash-surface-raised'}"
								>
									{formatSlotTime(slot.start)}
								</button>
							{/each}
						</div>
					{:else}
						<div class="flex flex-col items-center justify-center py-8 text-dash-text-secondary">
							<svg class="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<p class="text-sm">Pick a date to see times</p>
						</div>
					{/if}
				</div>
			</div>

			<DashboardField
				id="reschedule-message"
				label="Message to attendee (optional)"
				kind="textarea"
				bind:value={message}
				rows={3}
				placeholder="Let them know why you need to reschedule…"
			/>

			<div class="flex gap-3 justify-end pt-2">
				<DashboardButton variant="ghost" onclick={onClose} disabled={submitting}>
					Cancel
				</DashboardButton>
				<DashboardButton
					variant="primary"
					onclick={handleSubmit}
					disabled={!selectedDate || !selectedTime || submitting || inert}
				>
					{#if submitting}
						<DashboardSpinner size="sm" label="Sending…" />
						<span>Sending…</span>
					{:else}
						Send Proposal
					{/if}
				</DashboardButton>
			</div>
		</div>
	{/if}
</DashboardDialog>
