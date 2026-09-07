<script lang="ts">
	import type { PageData } from './$types';
	import {
		DashboardPageShell,
		DashboardHeader,
		DashboardCard,
		DashboardButton,
		DashboardNotice,
		DashboardSection
	} from '$lib/components/dashboard';

	let { data }: { data: PageData } = $props();

	const daysOfWeek = [
		{ id: 0, name: 'Sunday' },
		{ id: 1, name: 'Monday' },
		{ id: 2, name: 'Tuesday' },
		{ id: 3, name: 'Wednesday' },
		{ id: 4, name: 'Thursday' },
		{ id: 5, name: 'Friday' },
		{ id: 6, name: 'Saturday' }
	];

	let availability = $state(
		daysOfWeek.map((day) => {
			const window = data.fixture.find((w) => w.day === day.name);
			return {
				day: day.id,
				name: day.name,
				enabled: window?.enabled ?? false,
				startTime: window?.start ?? '09:00',
				endTime: window?.end ?? '17:00'
			};
		})
	);
</script>

<svelte:head>
	<title>Preview: Availability — CloudMeet</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<DashboardPageShell>
	<DashboardHeader
		title="Set Availability"
		backHref="/__preview/dashboard/overview"
		backLabel="Overview"
	/>

	<div class="px-4 sm:px-6 py-4 max-w-2xl">
		<DashboardCard variant="outlined" class="mb-4">
			<h2 class="font-display font-medium text-base text-dash-text mb-1">Your Timezone</h2>
			<p class="text-sm text-dash-text-secondary mb-4">
				Set your timezone so that your availability is shown correctly to people booking meetings.
			</p>
			<button
				type="button"
				class="flex items-center gap-3 px-4 py-3 border border-dash-border bg-[var(--dash-field)] rounded-lg w-full text-left"
				aria-expanded="false"
			>
				<div class="min-w-0">
					<div class="text-sm font-medium text-dash-text">Pacific Time</div>
					<div class="text-xs text-dash-text-secondary">America/Los_Angeles (9:00 AM)</div>
				</div>
			</button>
		</DashboardCard>

		<DashboardCard variant="outlined" class="mb-4">
			<h2 class="font-display font-medium text-base text-dash-text mb-1">Weekly Schedule</h2>
			<p class="text-sm text-dash-text-secondary mb-4">
				Set your available hours for each day of the week.
			</p>

			<div class="space-y-2">
				{#each availability as day}
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 p-3 border border-dash-border rounded-lg bg-[var(--dash-field)] min-w-0">
						<div class="flex items-center sm:min-w-[120px] flex-shrink-0">
							<input
								type="checkbox"
								bind:checked={day.enabled}
								class="h-4 w-4 text-dash-accent rounded border-dash-border focus:ring-dash-accent"
								id="preview-day-{day.day}"
							/>
							<label for="preview-day-{day.day}" class="ml-2 text-sm font-medium text-dash-text cursor-pointer">
								{day.name}
							</label>
						</div>

						{#if day.enabled}
							<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-1 min-w-0 w-full">
								<label for="preview-start-{day.day}" class="sr-only">{day.name} start time</label>
								<input
									id="preview-start-{day.day}"
									type="time"
									bind:value={day.startTime}
									class="w-full min-w-0 px-3 py-2 bg-dash-surface border border-dash-border rounded-md text-sm text-dash-text"
								/>
								<span class="text-dash-text-secondary text-sm">to</span>
								<label for="preview-end-{day.day}" class="sr-only">{day.name} end time</label>
								<input
									id="preview-end-{day.day}"
									type="time"
									bind:value={day.endTime}
									class="w-full min-w-0 px-3 py-2 bg-dash-surface border border-dash-border rounded-md text-sm text-dash-text"
								/>
							</div>
						{:else}
							<span class="text-dash-text-secondary text-sm">Unavailable</span>
						{/if}
					</div>
				{/each}
			</div>

			<div class="mt-4 flex flex-wrap gap-3">
				<DashboardButton variant="primary" disabled>Save Availability</DashboardButton>
				<DashboardButton variant="secondary" disabled>Set Default Hours (Mon–Fri, 9–5)</DashboardButton>
			</div>
		</DashboardCard>

		<DashboardNotice variant="info">
			{#snippet heading()}Note{/snippet}
			Your connected calendars will also be checked for conflicts.
		</DashboardNotice>
	</div>
</DashboardPageShell>
