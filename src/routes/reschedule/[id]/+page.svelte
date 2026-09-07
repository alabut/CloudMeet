<script lang="ts">
	import type { PageData } from './$types';
	import TimezoneSelector from '$lib/components/TimezoneSelector.svelte';
	import { detectTimezone, getCurrentTime } from '$lib/constants/timezones';
	import { formatSelectedDate } from '$lib/utils/dateFormatters';
	import { BookingCalendar, BookingSummary } from '$lib/components/booking';
	import { PublicPageShell, PublicCard, TextLink, Notice, StatusIcon } from '$lib/components/public';
	import { meetingJoinLabel, meetingShortLabel, meetingTypeForInviteCalendar } from '$lib/meeting';
	import {
		getLocalPreviewSlots,
		getPreviewSampleSlot,
		PREVIEW_MEETING_URL,
		PREVIEW_TIMEZONE
	} from '$lib/preview/sampleBooking';

	let { data }: { data: PageData } = $props();

	const previewSample = getPreviewSampleSlot();
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

	let availableDates = $state<Set<string>>(new Set());
	let loadingAvailability = $state(false);
	let previewReady = $state(false);

	let selectedTimezone = $state(data.isPreview ? PREVIEW_TIMEZONE : detectTimezone());
	let showTimezoneDropdown = $state(false);
	let currentMonth = $state(new Date());

	const use12Hour = data.timeFormat !== '24h';

	const previewState = $derived(data.previewState);
	const showPreviewSuccess = $derived(data.isPreview && previewState === 'success');
	const showPreviewSubmitting = $derived(data.isPreview && previewState === 'submitting');
	const showPreviewError = $derived(
		data.isPreview && previewState === 'error'
			? 'Preview error: reschedule could not be completed.'
			: ''
	);
	const showSuccess = $derived(rescheduleStatus === 'success' || showPreviewSuccess);

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
		if (data.isPreview) {
			const sampleDay = new Date(`${previewSample.date}T12:00:00`);
			const isSampleMonth =
				currentMonth.getFullYear() === sampleDay.getFullYear() &&
				currentMonth.getMonth() === sampleDay.getMonth();
			availableDates = isSampleMonth ? new Set([previewSample.date]) : new Set();
			loadingAvailability = false;
			return;
		}

		loadingAvailability = true;

		try {
			const year = currentMonth.getFullYear();
			const month = currentMonth.getMonth() + 1;
			const monthStr = `${year}-${String(month).padStart(2, '0')}`;

			const response = await fetch(
				`/api/availability/month?event=${data.booking.eventSlug}&month=${monthStr}`
			);
			if (!response.ok) throw new Error('Failed to fetch availability');

			const result = (await response.json()) as { availableDates?: string[] };
			availableDates = new Set(result.availableDates || []);
		} catch (error) {
			console.error('Error fetching month availability:', error);
			availableDates = new Set();
		} finally {
			loadingAvailability = false;
		}
	}

	$effect(() => {
		if (data.isPreview) return;
		fetchMonthAvailability();
	});

	$effect(() => {
		if (!data.isPreview || previewReady) return;
		previewReady = true;

		const sampleDay = new Date(`${previewSample.date}T12:00:00`);
		currentMonth = new Date(sampleDay.getFullYear(), sampleDay.getMonth(), 1);
		availableDates = new Set([previewSample.date]);

		if (previewState === 'selected' || previewState === 'submitting' || previewState === 'success') {
			selectedDate = previewSample.date;
			selectedSlot = previewSample.slot;
			availableSlots = getLocalPreviewSlots(previewSample.slot);
		}

		if (previewState === 'loading') {
			selectedDate = previewSample.date;
			loading = true;
		}

		if (previewState === 'empty') {
			selectedDate = previewSample.date;
			availableSlots = [];
		}

		if (previewState === 'error') {
			rescheduleError = showPreviewError;
		}

		if (previewState === 'success') {
			newMeetingUrl = PREVIEW_MEETING_URL;
		}
	});

	async function handleDateSelect(dateStr: string) {
		selectedDate = dateStr;
		selectedSlot = null;

		if (data.isPreview) {
			if (previewState === 'loading') {
				loading = true;
				return;
			}
			if (previewState === 'empty') {
				availableSlots = [];
				return;
			}
			loading = true;
			availableSlots =
				dateStr === previewSample.date ? getLocalPreviewSlots(previewSample.slot) : [];
			loading = false;
			return;
		}

		loading = true;

		try {
			const response = await fetch(
				`/api/availability?event=${data.booking.eventSlug}&date=${dateStr}`
			);
			if (!response.ok) throw new Error('Failed to fetch availability');
			const result = (await response.json()) as { slots?: Array<{ start: string; end: string }> };
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

		if (data.isPreview) {
			newMeetingUrl = PREVIEW_MEETING_URL;
			rescheduleStatus = 'success';
			return;
		}

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
				const errData = (await response.json()) as { message?: string };
				throw new Error(errData.message || 'Failed to reschedule booking');
			}

			const result = (await response.json()) as { meetingUrl?: string };
			newMeetingUrl = result.meetingUrl || null;
			rescheduleStatus = 'success';
		} catch (error: unknown) {
			console.error('Reschedule error:', error);
			rescheduleError =
				error instanceof Error ? error.message : 'Failed to reschedule booking';
			rescheduleStatus = 'error';
		}
	}

	const displayError = $derived(rescheduleError || showPreviewError);
	const isSubmitting = $derived(
		rescheduleStatus === 'submitting' || showPreviewSubmitting
	);
	const successSlot = $derived(
		selectedSlot ?? (showPreviewSuccess ? previewSample.slot : null)
	);
	const successDate = $derived(
		selectedDate ?? (showPreviewSuccess ? previewSample.date : null)
	);
</script>

<svelte:head>
	<title>Reschedule Meeting</title>
</svelte:head>

{#if showSuccess}
	<PublicPageShell layout="centered" width="narrow">
		<PublicCard variant="plain" class="text-center sm:border sm:border-border sm:shadow-lg">
			<div class="mx-auto mb-4 sm:mb-5 flex justify-center">
				<StatusIcon variant="success" size="large" />
			</div>
			<h1 class="font-display text-xl sm:text-2xl font-medium text-text mb-2">Meeting Rescheduled</h1>
			<p class="mb-4 text-sm text-text-secondary sm:mb-5 sm:text-base">
				Your calendar invitation has been updated.
			</p>

			<BookingSummary class="mb-4 sm:mb-5 text-left">
				<h3 class="mb-4 font-semibold text-text">{data.booking.eventName}</h3>
				<div class="space-y-4 text-sm">
					<div class="flex items-start gap-3">
						<svg
							class="w-5 h-5 text-text-secondary mt-0.5 flex-shrink-0"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							></path>
						</svg>
						<div>
							<p class="text-text">
								{successSlot ? formatTimeRange(successSlot.start, successSlot.end) : ''}
							</p>
							<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mt-1">
								{successDate ? formatSelectedDate(successDate) : ''}
							</p>
						</div>
					</div>
					{#if newMeetingUrl || (data.isPreview && showPreviewSuccess)}
						<div class="flex items-center gap-3">
							<svg
								class="w-5 h-5 text-text-secondary flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
								></path>
							</svg>
							<TextLink
								href={newMeetingUrl || PREVIEW_MEETING_URL}
								target="_blank"
								rel="noopener noreferrer"
								class="break-all !px-0"
							>
								{meetingJoinLabel(meetingTypeForInviteCalendar(data.booking.inviteCalendar))}
							</TextLink>
						</div>
					{/if}
				</div>
			</BookingSummary>

			<div class="flex items-center justify-center gap-3 text-sm">
				<TextLink href={`/reschedule/${data.booking.id}`} class="!px-1">Reschedule</TextLink>
				<span class="select-none leading-none text-text-secondary" aria-hidden="true">&middot;</span>
				<TextLink href={`/cancel/${data.booking.id}`} class="!px-1">Cancel</TextLink>
			</div>
		</PublicCard>
	</PublicPageShell>
{:else}
	<PublicPageShell layout="centered" width="wide" class="!max-w-none">
		<div
			class="reschedule-card w-full bg-bg border border-border rounded-large shadow-lg overflow-hidden flex flex-col md:flex-row transition-all duration-300 ease-in-out"
			style="--card-width: {selectedDate ? '920px' : '650px'}"
		>
			<div
				class="w-full md:w-72 border-b md:border-b-0 md:border-r border-border flex flex-col flex-shrink-0"
			>
				{#if data.booking.coverImage}
					<div class="p-6 pb-4 flex justify-center">
						<img src={data.booking.coverImage} alt="" class="max-h-16 w-auto object-contain" />
					</div>
					<div class="border-b border-border mx-6"></div>
				{/if}

				<div class="flex-1 p-6">
					<div class="mb-6">
						{#if data.booking.profileImage}
							<img
								src={data.booking.profileImage}
								alt={data.booking.hostName}
								class="w-12 h-12 rounded-full object-cover mb-3"
							/>
						{:else}
							<div
								class="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg mb-3"
								style="background-color: var(--accent)"
							>
								{data.booking.hostName?.charAt(0) || 'H'}
							</div>
						{/if}
						<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-1">
							{data.booking.hostName}
						</p>
						<h1 class="font-display text-2xl font-medium text-text">{data.booking.eventName}</h1>
					</div>

					<div class="space-y-4 text-sm text-text-secondary">
						<div class="flex items-center gap-3">
							<svg
								class="w-5 h-5 text-text-secondary"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
							<span>{data.booking.duration} min</span>
						</div>
						<div class="flex items-center gap-3">
							<svg
								class="w-5 h-5 text-text-secondary"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
								></path>
							</svg>
							<span
								>{meetingShortLabel(
									meetingTypeForInviteCalendar(data.booking.inviteCalendar)
								)}</span
							>
						</div>
					</div>

					<div class="mt-6 pt-6 border-t border-border">
						<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-2">
							Current booking
						</p>
						<BookingSummary>
							<p class="font-medium text-text">
								{formatOriginalDateTime(data.booking.startTime)}
							</p>
							<p class="text-text-secondary">{data.booking.attendeeName}</p>
							<p class="text-xs text-text-secondary">{data.booking.attendeeEmail}</p>
						</BookingSummary>
					</div>

					{#if selectedSlot}
						<div class="mt-4">
							<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-2">
								New time
							</p>
							<div
								class="rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm"
							>
								<p class="font-medium text-text">
									{formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
								</p>
								<p class="text-text-secondary">
									{selectedDate ? formatSelectedDate(selectedDate) : ''}
								</p>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<div class="flex-1 p-6">
				{#if displayError}
					<Notice variant="danger" class="mb-6 max-w-2xl">
						{#snippet heading()}Error{/snippet}
						{displayError}
					</Notice>
				{/if}

				<div class="flex flex-col md:flex-row md:items-stretch">
					<div class="w-full md:w-80">
						<h2 class="font-display text-xl font-medium text-text mb-6">
							Select a New Date & Time
						</h2>

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

						<div class="mt-6 relative">
							<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-2">
								Time zone
							</p>
							<button
								type="button"
								onclick={() => (showTimezoneDropdown = !showTimezoneDropdown)}
								class="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition"
							>
								<svg
									class="w-4 h-4 text-text-secondary"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
								<span>{selectedTimezone} ({getCurrentTime(selectedTimezone, use12Hour)})</span>
								<svg
									class="w-4 h-4 text-text-secondary"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									></path>
								</svg>
							</button>
							{#if showTimezoneDropdown}
								<TimezoneSelector
									{selectedTimezone}
									onSelect={(tz) => (selectedTimezone = tz)}
									onClose={() => (showTimezoneDropdown = false)}
									{brandColor}
									themed
								/>
							{/if}
						</div>
					</div>

					{#if selectedDate}
						<div
							class="w-full md:w-52 mt-6 md:mt-0 md:ml-6 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-6 flex flex-col"
							style="max-height: 400px;"
						>
							<h3
								class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-4 flex-shrink-0"
							>
								{formatSelectedDate(selectedDate).split(',')[0]}
							</h3>
							{#if loading}
								<div class="flex items-center justify-center py-8">
									<div
										class="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
										style="border-color: var(--accent); border-top-color: transparent"
									></div>
								</div>
							{:else if availableSlots.length === 0}
								<p class="text-sm text-text-secondary py-4">No available times</p>
							{:else}
								<div class="space-y-2 overflow-y-auto flex-1 pr-2 pb-2 scrollbar-thin">
									{#each availableSlots as slot}
										{#if selectedSlot === slot}
											<button
												type="button"
												class="w-full py-2.5 px-3 border-2 border-accent bg-accent text-white rounded-large text-sm font-semibold"
											>
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

				{#if selectedSlot}
					<div class="mt-6 pt-6 border-t border-border">
						<button
							type="button"
							onclick={handleReschedule}
							disabled={isSubmitting}
							class="w-full py-3 px-6 bg-accent hover:bg-accent-hover text-white rounded-full font-semibold transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
						>
							{isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
						</button>
					</div>
				{/if}

				<div class="mt-4 text-center">
					<TextLink href="/cancel/{data.booking.id}" class="text-sm">
						Or cancel this meeting instead
					</TextLink>
				</div>
			</div>
		</div>
	</PublicPageShell>
{/if}

<style>
	@media (min-width: 768px) {
		.reschedule-card {
			width: var(--card-width);
		}
	}
</style>
