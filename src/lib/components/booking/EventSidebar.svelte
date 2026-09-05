<script lang="ts">
	import { browser } from '$app/environment';
	import TimezoneSelector from '$lib/components/TimezoneSelector.svelte';
	import type { BrandColors } from '$lib/utils/colorUtils';
	import { formatSelectedDate } from '$lib/utils/dateFormatters';
	import { meetingShortLabel, meetingTypeForInviteCalendar } from '$lib/meeting';

	interface Props {
		user: {
			profileImage?: string | null;
			name?: string;
		} | null;
		eventType: {
			name: string;
			duration: number;
			description?: string | null;
			cover_image?: string | null;
			invite_calendar?: string | null;
		} | null;
		selectedDate: string | null;
		selectedSlot: { start: string; end: string } | null;
		brandColor: string;
		formatTime: (isoStr: string) => string;
		displayName?: string;
		displayDescription?: string;
		timezoneLabel: string;
		selectedTimezone: string;
		showTimezoneDropdown: boolean;
		onTimezoneToggle: () => void;
		onTimezoneSelect: (timezone: string) => void;
		onTimezoneClose: () => void;
	}

	let {
		user,
		eventType,
		selectedDate,
		selectedSlot,
		brandColor,
		formatTime,
		displayName,
		displayDescription,
		timezoneLabel,
		selectedTimezone,
		showTimezoneDropdown,
		onTimezoneToggle,
		onTimezoneSelect,
		onTimezoneClose
	}: Props = $props();

	// Sanitize event description to prevent XSS (only in browser, SSR uses raw since admin-entered)
	let sanitizedDescription = $state('');
	$effect(() => {
		if (eventType?.description) {
			if (browser) {
				import('isomorphic-dompurify').then(({ default: DOMPurify }) => {
					sanitizedDescription = DOMPurify.sanitize(eventType.description!);
				});
			} else {
				// During SSR, escape basic HTML entities as a fallback
				sanitizedDescription = eventType.description
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;');
			}
		} else {
			sanitizedDescription = '';
		}
	});

	const meetingLabel = meetingShortLabel(meetingTypeForInviteCalendar(eventType?.invite_calendar));
</script>

<div class="w-64 border-r border-border flex flex-col flex-shrink-0">
	{#if eventType?.cover_image}
		<div class="p-6 pb-4 flex justify-center">
			<img src={eventType.cover_image} alt="" class="max-h-16 w-auto object-contain" />
		</div>
		<div class="border-b border-border mx-6"></div>
	{/if}

	<div class="flex-1 p-6">
		<div class="mb-6">
			<h2 class="font-display text-2xl font-medium text-text">{displayName || eventType?.name || 'Meeting'}</h2>
		</div>

		{#if displayDescription || eventType?.description}
			<div class="mb-6 text-sm text-text-secondary prose prose-sm max-w-none prose-headings:text-text prose-p:text-text-secondary prose-strong:text-text prose-a:text-accent prose-li:text-text-secondary [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1">
				{#if displayDescription}
					<p>{displayDescription}</p>
				{:else}
					{@html sanitizedDescription}
				{/if}
			</div>
		{/if}

		<div class="space-y-4 font-meta text-extrasmall uppercase tracking-wide text-text-secondary">
			<div class="flex items-center gap-3">
				<svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				<span>{eventType?.duration} min</span>
			</div>
			<div class="flex items-center gap-3">
				<svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
				</svg>
				<span>{meetingLabel}</span>
			</div>
			<div class="relative flex items-start gap-3">
				<svg class="mt-0.5 w-5 h-5 shrink-0 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				<button type="button" onclick={onTimezoneToggle} class="flex min-w-0 items-center gap-1 text-left hover:text-accent transition">
					<span class="whitespace-nowrap text-[11px] normal-case tracking-normal">{timezoneLabel}</span>
					<svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
					</svg>
				</button>
				{#if showTimezoneDropdown}
					<TimezoneSelector
						{selectedTimezone}
						onSelect={onTimezoneSelect}
						onClose={onTimezoneClose}
						{brandColor}
						themed
					/>
				{/if}
			</div>
		</div>

		{#if selectedDate && selectedSlot}
			<div class="mt-6 pt-6 border-t border-border">
				<div class="flex items-center gap-3 text-sm">
					<svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
					</svg>
					<div>
						<p class="font-medium text-text">{formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}</p>
						<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mt-1">{formatSelectedDate(selectedDate)}</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
