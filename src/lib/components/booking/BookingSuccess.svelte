<script lang="ts">
	interface Props {
		eventName: string;
		selectedDate: string;
		selectedSlot: { start: string; end: string };
		meetingUrl: string | null;
		meetingType?: 'google_meet' | 'teams';
		brandColor: string;
		formatTimeRange: (start: string, end: string) => string;
		formatSelectedDate: (dateStr: string) => string;
	}

	let {
		eventName,
		selectedDate,
		selectedSlot,
		meetingUrl,
		meetingType = 'google_meet',
		brandColor,
		formatTimeRange,
		formatSelectedDate
	}: Props = $props();

	const meetingLabel = meetingType === 'teams' ? 'Join Microsoft Teams Meeting' : 'Join Google Meet';
</script>

<!-- ===== USER STYLE ANCHOR: confirmation-view ===== -->
<div class="bg-bg border border-border rounded-large shadow-lg p-6 sm:p-8 max-w-md w-full mx-2">
	<div class="text-center">
		<div class="w-16 h-16 sm:w-20 sm:h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
			<svg class="w-8 h-8 sm:w-10 sm:h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
			</svg>
		</div>
		<h1 class="font-display text-xl sm:text-2xl font-medium text-text mb-2">You are scheduled</h1>
		<p class="text-text-secondary mb-6 sm:mb-8 text-sm sm:text-base">A calendar invitation has been sent to your email address.</p>

		<div class="bg-bg-secondary rounded-lg p-4 sm:p-6 text-left mb-6">
			<h3 class="font-semibold text-text mb-3 sm:mb-4">{eventName}</h3>
			<div class="space-y-3 text-sm">
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
						<a href={meetingUrl} target="_blank" class="break-all pb-[3px] no-underline border-b-2 border-transparent hover:border-current transition-colors" style="color: {brandColor}">{meetingLabel}</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
