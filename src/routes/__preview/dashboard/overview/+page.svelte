<script lang="ts">
	import type { PageData } from './$types';
	import {
		DashboardPageShell,
		DashboardHeader,
		DashboardCard,
		DashboardButton,
		DashboardNotice,
		DashboardSpinner,
		ProfileSection,
		BookingsList,
		EventTypesList,
		DashboardNavActions
	} from '$lib/components/dashboard';
	import { OVERVIEW_PREVIEW_STATES } from '$lib/preview/sampleDashboard';

	let { data }: { data: PageData } = $props();
	const previewState = $derived(data.state);
	const fixture = $derived(data.fixture);

	function noop() {}
</script>

<svelte:head>
	<title>Preview: Dashboard Overview ({previewState}) — CloudMeet</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<DashboardPageShell>
	<DashboardHeader title="Dashboard" subtitle="Welcome back, {fixture.user.name}!">
		{#snippet actions()}
			<DashboardNavActions />
		{/snippet}
	</DashboardHeader>

	<div class="px-4 sm:px-6 py-4 max-w-4xl">
		<nav class="flex flex-wrap gap-2 mb-6" aria-label="Preview states">
			{#each OVERVIEW_PREVIEW_STATES as s}
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

		{#if fixture.googleCalendarWarning}
			<DashboardNotice variant="attention" class="mb-4">
				{#snippet heading()}Google Calendar needs attention{/snippet}
				{fixture.googleCalendarWarning}
			</DashboardNotice>
		{:else if fixture.googleCalendarOk}
			<DashboardNotice variant="success" class="mb-4">
				Google Calendar is connected. New bookings can create invites.
			</DashboardNotice>
		{/if}

		{#if fixture.error}
			<DashboardNotice variant="danger" class="mb-4">
				{#snippet heading()}Error{/snippet}
				{fixture.error}
			</DashboardNotice>
		{/if}

		<ProfileSection user={fixture.user} />

		<DashboardCard variant="outlined" class="mb-6">
			<h2 class="font-display font-medium text-base text-dash-text mb-2">Your Booking Page</h2>
			<div class="flex flex-col sm:flex-row sm:items-center gap-2">
				<input
					type="text"
					readonly
					value="{fixture.appUrl}/"
					class="flex-1 min-w-0 px-3 py-2 bg-[var(--dash-field)] border border-dash-border rounded-md text-sm text-dash-text"
				/>
				<DashboardButton variant="primary" size="sm" class="flex-shrink-0" disabled>
					Copy Link
				</DashboardButton>
			</div>
		</DashboardCard>

		{#if fixture.loading}
			<div class="flex items-center justify-center py-12">
				<DashboardSpinner size="lg" />
			</div>
		{:else}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<EventTypesList eventTypes={fixture.eventTypes} />
				<BookingsList
					bookings={fixture.bookings ?? []}
					onCancelClick={noop}
					onRescheduleClick={noop}
				/>
			</div>
		{/if}
	</div>
</DashboardPageShell>
