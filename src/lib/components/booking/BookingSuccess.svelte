<script lang="ts">
	import type { MeetingType } from '$lib/meeting';
	import { meetingJoinLabel } from '$lib/meeting';
	import { buildGoogleCalendarUrl, downloadIcsFile } from '$lib/utils/calendarLinks';

	interface Props {
		eventName: string;
		selectedDate: string;
		selectedSlot: { start: string; end: string };
		meetingUrl: string | null;
		meetingType?: MeetingType;
		bookingId?: string | null;
		brandColor: string;
		formatTimeRange: (start: string, end: string) => string;
		formatSelectedDate: (dateStr: string) => string;
	}

	let {
		eventName,
		selectedDate,
		selectedSlot,
		meetingUrl,
		meetingType = 'zoom',
		bookingId = null,
		brandColor,
		formatTimeRange,
		formatSelectedDate
	}: Props = $props();

	const joinLabel = meetingJoinLabel(meetingType);

	const calendarEvent = $derived({
		title: eventName,
		start: selectedSlot.start,
		end: selectedSlot.end,
		meetingUrl,
		joinLabel,
		bookingId
	});

	const googleCalendarUrl = $derived(buildGoogleCalendarUrl(calendarEvent));

	function handleDownloadIcs() {
		downloadIcsFile(calendarEvent);
	}
</script>

<!-- ===== USER STYLE ANCHOR: confirmation-view ===== -->
<div class="bg-bg border border-border rounded-large shadow-lg p-6 sm:p-8 max-w-md w-[calc(100%-1rem)] sm:w-full mx-2">
	<div class="text-center">
		<div class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-accent sm:mb-5 sm:h-28 sm:w-28">
			<svg class="h-16 w-16 text-accent sm:h-20 sm:w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
			</svg>
		</div>
		<h1 class="font-display text-xl sm:text-2xl font-medium text-text mb-2">You are scheduled</h1>
		<p class="mb-5 text-sm text-text-secondary sm:mb-6 sm:text-base">A calendar invitation has been sent to your email address.</p>

		<div class="mb-5 rounded-lg border border-border bg-[var(--field-bg)] p-6 text-left sm:mb-6">
			<h3 class="mb-4 font-semibold text-text">{eventName}</h3>
			<div class="space-y-4 text-sm">
				<div class="flex items-start gap-3">
					<svg class="w-5 h-5 text-text-secondary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
					</svg>
					<div>
						<p class="text-text">{formatTimeRange(selectedSlot.start, selectedSlot.end)}</p>
						<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mt-1">{formatSelectedDate(selectedDate)}</p>
					</div>
				</div>
				{#if meetingUrl}
					<div class="flex items-start gap-3">
						<svg class="w-5 h-5 text-text-secondary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
						</svg>
						<a
							href={meetingUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="link-underline break-all"
							style="color: {brandColor}"
						>{joinLabel}</a>
					</div>
				{/if}
			</div>
		</div>

		<div class="mb-5 flex items-center justify-center gap-3 text-sm text-text-secondary sm:mb-6">
			<a
				href={googleCalendarUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="link-underline"
				style="color: {brandColor}"
			>Add to Google Calendar</a>
			<span class="select-none leading-none" aria-hidden="true">&middot;</span>
			<button
				type="button"
				onclick={handleDownloadIcs}
				class="link-underline rounded-sm bg-transparent border-0 p-0 font-inherit text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
				style="color: {brandColor}"
			>Download .ics</button>
		</div>

		{#if bookingId}
			<div class="flex items-center justify-center gap-3 text-sm">
				<a
					href={`/reschedule/${bookingId}`}
					class="link-underline"
					style="color: {brandColor}"
				>Reschedule</a>
				<span class="select-none leading-none text-text-secondary" aria-hidden="true">&middot;</span>
				<a
					href={`/cancel/${bookingId}`}
					class="link-underline"
					style="color: {brandColor}"
				>Cancel</a>
			</div>
		{/if}
	</div>
</div>
