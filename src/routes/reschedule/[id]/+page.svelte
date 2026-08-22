<script lang="ts">
	import type { PageData } from './$types';
	import TimezoneSelector from '$lib/components/TimezoneSelector.svelte';
	import { detectTimezone, getCurrentTime } from '$lib/constants/timezones';
	import { formatDateLocal, formatSelectedDate } from '$lib/utils/dateFormatters';
	import { BookingCalendar } from '$lib/components/booking';

	let { data }: { data: PageData } = $props();

	// Brand colors
	// Page-facing "brand" values resolve through the CSS custom properties
	// defined in app.css, so they automatically track the dark/light theme --
	// see the matching comment in src/routes/[slug]/+page.svelte.
	const brandColor = 'var(--accent)';
	const brandLighter = 'var(--bg-secondary)';
	const brandDark = 'var(--accent-hover)';

	let selectedDate = $state<string | null>(null);
	let selectedSlot = $state<{ start: string; end: string } | null>(null);
	let availableSlots = $state<Array<{ start: string; end: string }>>([]);
	let loading = $state(false);
	let rescheduleStatus = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let rescheduleError = $state('');
	let newMeetingUrl = $state<string | null>(null);

	// Track which dates have available slots
	let availableDates = $state<Set<string>>(new Set());
	let loadingAvailability = $state(false);

	// Timezone state
	let selectedTimezone = $state(detectTimezone());
	let showTimezoneDropdown = $state(false);

	// Calendar state
	let currentMonth = $state(new Date());

	// Date/time formatters
	const use12Hour = data.timeFormat !== '24h';

	function formatTime(isoStr: string) {
		const date = new Date(isoStr);
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: use12Hour,
			timeZone: selectedTimezone
		}).format(date);
	}

	function formatTimeRange(start: string, end: string) {
		return `${formatTime(start)} - ${formatTime(end)}`;
	}

	function formatOriginalDateTime(dateStr: string) {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: use12Hour,
			timeZone: selectedTimezone
		}).format(date);
	}

	function prevMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
		fetchMonthAvailability();
	}

	function nextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
		fetchMonthAvailability();
	}

	async function fetchMonthAvailability() {
		loadingAvailability = true;

		try {
			const year = currentMonth.getFullYear();
			const month = currentMonth.getMonth() + 1;
			const monthStr = `${year}-${String(month).padStart(2, '0')}`;

			const response = await fetch(`/api/availability/month?event=${data.booking.eventSlug}&month=${monthStr}`);
			if (!response.ok) throw new Error('Failed to fetch availability');

			const result = await response.json() as { availableDates?: string[] };
			availableDates = new Set(result.availableDates || []);
		} catch (error) {
			console.error('Error fetching month availability:', error);
			availableDates = new Set();
		} finally {
			loadingAvailability = false;
		}
	}

	$effect(() => {
		fetchMonthAvailability();
	});

	async function handleDateSelect(dateStr: string) {
		selectedDate = dateStr;
		selectedSlot = null;
		loading = true;

		try {
			const response = await fetch(`/api/availability?event=${data.booking.eventSlug}&date=${dateStr}`);
			if (!response.ok) throw new Error('Failed to fetch availability');
			const result = await response.json() as { slots?: Array<{ start: string; end: string }> };
			availableSlots = result.slots || [];
		} catch (error) {
			console.error('Error fetching availability:', error);
			availableSlots = [];
		} finally {
			loading = false;
		}
	}

	function selectSlot(slot: { start: string; end: string }) {
		selectedSlot = slot;
	}

	async function handleReschedule() {
		if (!selectedSlot) return;

		rescheduleStatus = 'submitting';
		rescheduleError = '';

		try {
			const response = await fetch('/api/bookings/reschedule', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bookingId: data.booking.id,
					newStartTime: selectedSlot.start,
					newEndTime: selectedSlot.end,
					timezone: selectedTimezone
				})
			});

			if (!response.ok) {
				const errData = await response.json() as { message?: string };
				throw new Error(errData.message || 'Failed to reschedule booking');
			}

			const result = await response.json() as { meetingUrl?: string };
			newMeetingUrl = result.meetingUrl || null;
			rescheduleStatus = 'success';
		} catch (error: any) {
			console.error('Reschedule error:', error);
			rescheduleError = error.message || 'Failed to reschedule booking';
			rescheduleStatus = 'error';
		}
	}
</script>

<svelte:head>
	<title>Reschedule Meeting</title>
</svelte:head>

<div
	class="public-flow min-h-screen bg-bg text-text font-serif flex flex-col items-center justify-center p-gutter"
>
	{#if rescheduleStatus === 'success'}
		<!-- Success Screen -->
		<div class="bg-surface rounded-large border border-border shadow-lg p-8 max-w-md w-full">
			<div class="text-center">
				<div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style="background-color: var(--bg-secondary)">
					<svg class="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
					</svg>
				</div>
				<h1 class="font-display text-2xl font-medium text-text mb-2">Meeting Rescheduled!</h1>
				<p class="text-text-secondary mb-8">Your meeting has been rescheduled. A calendar update has been sent to your email.</p>

				<div class="rounded-large p-6 text-left mb-6" style="background-color: var(--bg-secondary)">
					<h3 class="font-display text-lg font-medium text-text mb-4">{data.booking.eventName}</h3>
					<div class="space-y-3 text-sm">
						<div class="flex items-start gap-3">
							<svg class="w-5 h-5 text-text-secondary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
							</svg>
							<div>
								<p class="text-text font-medium">New Time</p>
								<p class="text-text-secondary">{selectedSlot ? formatTimeRange(selectedSlot.start, selectedSlot.end) : ''}</p>
								<p class="text-text-secondary">{selectedDate ? formatSelectedDate(selectedDate) : ''}</p>
							</div>
						</div>
						{#if newMeetingUrl}
							<div class="flex items-start gap-3">
								<svg class="w-5 h-5 text-text-secondary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
								</svg>
								<a href={newMeetingUrl} target="_blank" class="break-all pb-[3px] no-underline border-b-2 border-transparent hover:border-current transition-colors text-accent">{data.booking.inviteCalendar === 'outlook' ? 'Join Microsoft Teams Meeting' : 'Join Google Meet'}</a>
							</div>
						{/if}
					</div>
				</div>

				<div class="flex items-center justify-center gap-6 text-sm">
					<a href={`/reschedule/${data.booking.id}`} class="pb-[3px] no-underline border-b-2 border-transparent hover:border-current transition-colors text-accent">Reschedule</a>
					<a href={`/cancel/${data.booking.id}`} class="pb-[3px] no-underline border-b-2 border-transparent hover:border-current transition-colors text-accent">Cancel</a>
				</div>
			</div>
		</div>
	{:else}
		<!-- Reschedule Form - matching main booking page layout -->
		<div
			class="reschedule-card w-full bg-bg border border-border rounded-large shadow-lg overflow-hidden flex flex-col md:flex-row transition-all duration-300 ease-in-out"
			style="--card-width: {selectedDate ? '920px' : '650px'}"
		>
			<!-- Left Sidebar -->
			<div class="w-full md:w-72 border-b md:border-b-0 md:border-r border-border flex flex-col flex-shrink-0">
				{#if data.booking.coverImage}
					<div class="p-6 pb-4 flex justify-center">
						<img src={data.booking.coverImage} alt="" class="max-h-16 w-auto object-contain" />
					</div>
					<div class="border-b border-border mx-6"></div>
				{/if}

				<div class="flex-1 p-6">
					<div class="mb-6">
						{#if data.booking.profileImage}
							<img src={data.booking.profileImage} alt={data.booking.hostName} class="w-12 h-12 rounded-full object-cover mb-3" />
						{:else}
							<div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg mb-3" style="background-color: var(--accent)">
								{data.booking.hostName?.charAt(0) || 'H'}
							</div>
						{/if}
						<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-1">{data.booking.hostName}</p>
						<h1 class="font-display text-2xl font-medium text-text">{data.booking.eventName}</h1>
					</div>

					<div class="space-y-4 text-sm text-text-secondary">
						<div class="flex items-center gap-3">
							<svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							<span>{data.booking.duration} min</span>
						</div>
						<div class="flex items-center gap-3">
							<svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
							</svg>
							<span>{data.booking.inviteCalendar === 'outlook' ? 'Microsoft Teams' : 'Google Meet'}</span>
						</div>
					</div>

					<!-- Current booking info -->
					<div class="mt-6 pt-6 border-t border-border">
						<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-2">Current booking</p>
						<div class="rounded-large p-3 text-sm border border-red-500/30" style="background-color: rgba(239, 68, 68, 0.1)">
							<p class="font-medium text-red-400">{formatOriginalDateTime(data.booking.startTime)}</p>
							<p class="text-red-400/80">{data.booking.attendeeName}</p>
							<p class="text-red-400/70 text-xs">{data.booking.attendeeEmail}</p>
						</div>
					</div>

					{#if selectedSlot}
						<div class="mt-4">
							<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-2">New time</p>
							<div class="rounded-large p-3 text-sm border border-accent/30" style="background-color: color-mix(in srgb, var(--accent) 10%, transparent)">
								<p class="font-medium text-text">{formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}</p>
								<p class="text-text-secondary">{selectedDate ? formatSelectedDate(selectedDate) : ''}</p>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Main Content -->
			<div class="flex-1 p-6">
				{#if rescheduleError}
					<div class="bg-red-500/10 border border-red-500/30 text-red-400 rounded-large p-4 mb-6 max-w-2xl">
						{rescheduleError}
					</div>
				{/if}

				<div class="flex flex-col md:flex-row md:items-stretch">
					<div class="w-full md:w-80">
						<h2 class="font-display text-xl font-medium text-text mb-6">Select a New Date & Time</h2>

						<BookingCalendar
							{currentMonth}
							{selectedDate}
							{availableDates}
							{brandColor}
							{brandLighter}
							{brandDark}
							onDateSelect={handleDateSelect}
							onPrevMonth={prevMonth}
							onNextMonth={nextMonth}
						/>

						<!-- Timezone selector -->
						<div class="mt-6 relative">
							<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-2">Time zone</p>
							<button
								type="button"
								onclick={() => showTimezoneDropdown = !showTimezoneDropdown}
								class="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition"
							>
								<svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
								<span>{selectedTimezone} ({getCurrentTime(selectedTimezone, use12Hour)})</span>
								<svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
								</svg>
							</button>
							{#if showTimezoneDropdown}
								<TimezoneSelector
									{selectedTimezone}
									onSelect={(tz) => selectedTimezone = tz}
									onClose={() => showTimezoneDropdown = false}
									{brandColor}
									themed
								/>
							{/if}
						</div>
					</div>

					{#if selectedDate}
						<div class="w-full md:w-52 mt-6 md:mt-0 md:ml-6 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-6 flex flex-col" style="max-height: 400px;">
							<h3 class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-4 flex-shrink-0">
								{formatSelectedDate(selectedDate).split(',')[0]}
							</h3>
							{#if loading}
								<div class="flex items-center justify-center py-8">
									<div class="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style="border-color: var(--accent); border-top-color: transparent"></div>
								</div>
							{:else if availableSlots.length === 0}
								<p class="text-sm text-text-secondary py-4">No available times</p>
							{:else}
								<div class="space-y-2 overflow-y-auto flex-1 pr-2 pb-2 scrollbar-thin">
									{#each availableSlots as slot}
										{#if selectedSlot === slot}
											<button type="button" class="w-full py-2.5 px-3 border-2 border-accent bg-accent text-white rounded-large text-sm font-semibold">
												{formatTime(slot.start)}
											</button>
										{:else}
											<button
												type="button"
												onclick={() => selectSlot(slot)}
												class="w-full py-2.5 px-3 border-2 border-accent text-accent rounded-large text-sm font-semibold transition"
											>
												{formatTime(slot.start)}
											</button>
										{/if}
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Reschedule button -->
				{#if selectedSlot}
					<div class="mt-6 pt-6 border-t border-border">
						<button
							onclick={handleReschedule}
							disabled={rescheduleStatus === 'submitting'}
							class="w-full py-3 px-6 bg-accent hover:bg-accent-hover text-white rounded-full font-semibold transition disabled:opacity-50"
						>
							{rescheduleStatus === 'submitting' ? 'Rescheduling...' : 'Confirm Reschedule'}
						</button>
					</div>
				{/if}

				<!-- Cancel link -->
				<div class="mt-4 text-center">
					<a
						href="/cancel/{data.booking.id}"
						class="text-sm text-text-secondary hover:text-red-400 transition"
					>
						Or cancel this meeting instead
					</a>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Below md, the card stays fluid (w-full) so it never overflows a
	   narrow viewport. At md and up, restore the exact fixed-width
	   animation that was previously applied unconditionally. */
	@media (min-width: 768px) {
		.reschedule-card {
			width: var(--card-width);
		}
	}
</style>
