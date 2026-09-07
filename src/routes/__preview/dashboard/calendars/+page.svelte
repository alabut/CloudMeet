<script lang="ts">
	import type { PageData } from './$types';
	import {
		DashboardPageShell,
		DashboardHeader,
		CalendarSettings
	} from '$lib/components/dashboard';
	import {
		CALENDAR_PREVIEW_STATES,
		getCalendarPreviewGoogleCalendars,
		getCalendarPreviewUser
	} from '$lib/preview/sampleDashboard';

	let { data }: { data: PageData } = $props();
	const previewState = $derived(data.state);
	const previewUser = $derived(getCalendarPreviewUser(previewState));
	const previewGoogleCalendars = $derived(getCalendarPreviewGoogleCalendars(previewState));
</script>

<svelte:head>
	<title>Preview: Calendars ({previewState}) — CloudMeet</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<DashboardPageShell>
	<DashboardHeader
		title="Calendar Settings"
		subtitle="Connect calendars and configure defaults"
		backHref="/__preview/dashboard/overview"
		backLabel="Overview"
	/>

	<div class="px-4 sm:px-6 py-4 max-w-2xl">
		<nav class="flex gap-2 mb-6" aria-label="Preview states">
			{#each CALENDAR_PREVIEW_STATES as s}
				<a
					href="?preview={s}"
					class="px-2.5 py-1 rounded text-xs font-meta uppercase tracking-wide transition-colors
						{previewState === s
						? 'bg-dash-accent text-white'
						: 'bg-dash-surface border border-dash-border text-dash-text-secondary hover:text-dash-text'}"
				>
					{s}
				</a>
			{/each}
		</nav>

		<CalendarSettings
			user={previewUser}
			outlookConfigured={false}
			googleCalendarWarning={previewState === 'connected' ? null : null}
			inert
			previewGoogleCalendars={previewGoogleCalendars}
		/>
	</div>
</DashboardPageShell>
