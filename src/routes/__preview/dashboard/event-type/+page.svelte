<script lang="ts">
	import type { PageData } from './$types';
	import {
		DashboardPageShell,
		DashboardHeader,
		DashboardButton,
		EventTypeForm
	} from '$lib/components/dashboard';
	import { EVENT_TYPE_PREVIEW_STATES } from '$lib/preview/sampleDashboard';

	let { data }: { data: PageData } = $props();
	const previewState = $derived(data.state);
	const fixture = $derived(data.fixture);

	let name = $state('');
	let slug = $state('');
	let description = $state('');
	let duration = $state(30);
	let isActive = $state(true);
	let coverImage = $state('');
	let overrideCalendarSettings = $state(false);
	let availabilityCalendars = $state('google');
	let inviteCalendar = $state('google');

	$effect(() => {
		name = fixture.name;
		slug = fixture.slug;
		description = fixture.description;
		duration = fixture.duration;
		isActive = fixture.is_active;
	});

	const calendarConfig = {
		hasGoogle: true,
		hasOutlook: false,
		defaultAvailabilityCalendars: 'google',
		defaultInviteCalendar: 'google'
	};

	function noopUpload() {}
	function noopRemove() {}
</script>

<svelte:head>
	<title>Preview: Event Type ({previewState}) — CloudMeet</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<DashboardPageShell>
	<DashboardHeader
		title={previewState === 'edit' ? 'Edit Event Type' : 'Create Event Type'}
		backHref="/__preview/dashboard/overview"
		backLabel="Overview"
	/>

	<div class="px-4 sm:px-6 py-4 max-w-2xl">
		<nav class="flex gap-2 mb-6" aria-label="Preview states">
			{#each EVENT_TYPE_PREVIEW_STATES as s}
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

		<form onsubmit={(e) => e.preventDefault()}>
			<EventTypeForm
				bind:name
				bind:slug
				bind:duration
				bind:description
				bind:isActive
				bind:coverImage
				bind:overrideCalendarSettings
				bind:availabilityCalendars
				bind:inviteCalendar
				saving={false}
				uploadingCover={false}
				{calendarConfig}
				submitLabel={previewState === 'edit' ? 'Save Changes' : 'Create Event Type'}
				inert
				onCoverUpload={noopUpload}
				onRemoveCover={noopRemove}
			/>
		</form>
	</div>
</DashboardPageShell>
