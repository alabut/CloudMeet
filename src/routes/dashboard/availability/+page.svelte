<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import TimezoneSelector from '$lib/components/TimezoneSelector.svelte';
	import { normalizeTimeForInput } from '$lib/utils/dateFormatters';
	import {
		DashboardPageShell,
		DashboardHeader,
		DashboardCard,
		DashboardNotice,
		DashboardButton,
		DashboardSection
	} from '$lib/components/dashboard';

	let { data, form }: { data: PageData; form: ActionData } = $props();

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
			const existingRules = data.rules?.filter((r) => r.day_of_week === day.id) || [];
			return {
				day: day.id,
				name: day.name,
				enabled: existingRules.length > 0,
				startTime: normalizeTimeForInput(existingRules[0]?.start_time),
				endTime: normalizeTimeForInput(existingRules[0]?.end_time, '17:00')
			};
		})
	);

	let saving = $state(false);
	let showSuccess = $state(false);
	let selectedTimezone = $state(data.timezone || 'UTC');
	let showTimezoneDropdown = $state(false);
	const timezoneListId = 'availability-timezone-list';

	const timezoneLabels: Record<string, string> = {
		'America/Los_Angeles': 'Pacific Time',
		'America/Denver': 'Mountain Time',
		'America/Chicago': 'Central Time',
		'America/New_York': 'Eastern Time',
		'Europe/London': 'UK, Ireland Time',
		'Europe/Paris': 'Central European Time',
		'Europe/Amsterdam': 'Amsterdam Time',
		'Europe/Berlin': 'Berlin Time',
		'Asia/Tokyo': 'Japan Time',
		'Asia/Shanghai': 'China Time',
		'Australia/Sydney': 'Sydney Time',
		'UTC': 'UTC Time'
	};

	function getTimezoneLabel(tz: string): string {
		return timezoneLabels[tz] || tz.replace(/_/g, ' ').split('/').pop() || tz;
	}

	function getCurrentTime(tz: string): string {
		try {
			return new Intl.DateTimeFormat('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true,
				timeZone: tz
			}).format(new Date());
		} catch {
			return '--:--';
		}
	}

	function handleSubmit() {
		saving = true;
		showSuccess = false;
		return async ({ update, result }: any) => {
			await update({ reset: false });
			saving = false;
			if (result.type === 'success' && result.data?.success) {
				showSuccess = true;
				setTimeout(() => { showSuccess = false; }, 3000);
			}
		};
	}
</script>

<DashboardPageShell>
	<DashboardHeader
		title="Set Availability"
		backHref="/dashboard"
		backLabel="Dashboard"
	/>

	<div class="px-4 sm:px-6 py-4 max-w-2xl">
		{#if showSuccess}
			<DashboardNotice variant="success" live class="mb-4">
				Availability saved successfully!
			</DashboardNotice>
		{/if}

		{#if form?.error}
			<DashboardNotice variant="danger" class="mb-4">
				{form.error}
			</DashboardNotice>
		{/if}

		<!-- Timezone Selection -->
		<DashboardCard variant="outlined" class="mb-4">
			<h2 class="font-display font-medium text-base text-dash-text mb-1">Your Timezone</h2>
			<p class="text-sm text-dash-text-secondary mb-4">
				Set your timezone so that your availability is shown correctly to people booking meetings.
			</p>
			<div class="relative">
				<button
					type="button"
					onclick={() => showTimezoneDropdown = !showTimezoneDropdown}
					aria-expanded={showTimezoneDropdown}
					aria-controls={timezoneListId}
					class="flex items-center gap-3 px-4 py-3 border border-dash-border bg-[var(--dash-field)] rounded-lg hover:border-dash-accent transition w-full sm:w-auto text-left"
				>
					<svg class="w-5 h-5 text-dash-text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="min-w-0">
						<div class="text-sm font-medium text-dash-text">{getTimezoneLabel(selectedTimezone)}</div>
						<div class="text-xs text-dash-text-secondary">{selectedTimezone} ({getCurrentTime(selectedTimezone)})</div>
					</div>
					<svg class="w-4 h-4 text-dash-text-secondary ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>
				{#if showTimezoneDropdown}
					<div id={timezoneListId}>
						<TimezoneSelector
							{selectedTimezone}
							onSelect={(tz) => selectedTimezone = tz}
							onClose={() => showTimezoneDropdown = false}
						/>
					</div>
				{/if}
			</div>
		</DashboardCard>

		<!-- Weekly Schedule -->
		<DashboardCard variant="outlined" class="mb-4">
			<h2 class="font-display font-medium text-base text-dash-text mb-1">Weekly Schedule</h2>
			<p class="text-sm text-dash-text-secondary mb-4">
				Set your available hours for each day of the week. People can only book meetings during these times.
			</p>

			<form method="POST" action="?/save" use:enhance={handleSubmit}>
				<input type="hidden" name="rules" value={JSON.stringify(availability)} />
				<input type="hidden" name="timezone" value={selectedTimezone} />

				<div class="space-y-2">
					{#each availability as day}
						<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 p-3 border border-dash-border rounded-lg bg-[var(--dash-field)] min-w-0">
							<div class="flex items-center sm:min-w-[120px] flex-shrink-0">
								<input
									type="checkbox"
									bind:checked={day.enabled}
									class="h-4 w-4 text-dash-accent rounded border-dash-border focus:ring-dash-accent"
									id="day-{day.day}"
								/>
								<label for="day-{day.day}" class="ml-2 text-sm font-medium text-dash-text cursor-pointer">
									{day.name}
								</label>
							</div>

							{#if day.enabled}
								<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-1 min-w-0 w-full">
									<label for="start-{day.day}" class="sr-only">{day.name} start time</label>
									<input
										id="start-{day.day}"
										type="time"
										bind:value={day.startTime}
										class="w-full min-w-0 px-3 py-2 bg-dash-surface border border-dash-border rounded-md text-sm text-dash-text focus:ring-2 focus:ring-dash-accent outline-none"
									/>
									<span class="text-dash-text-secondary text-sm">to</span>
									<label for="end-{day.day}" class="sr-only">{day.name} end time</label>
									<input
										id="end-{day.day}"
										type="time"
										bind:value={day.endTime}
										class="w-full min-w-0 px-3 py-2 bg-dash-surface border border-dash-border rounded-md text-sm text-dash-text focus:ring-2 focus:ring-dash-accent outline-none"
									/>
								</div>
							{:else}
								<span class="text-dash-text-secondary text-sm">Unavailable</span>
							{/if}
						</div>
					{/each}
				</div>

				<div class="mt-4 flex flex-wrap gap-3">
					<DashboardButton type="submit" variant="primary" disabled={saving}>
						{saving ? 'Saving…' : 'Save Availability'}
					</DashboardButton>
					<DashboardButton
						variant="secondary"
						onclick={() => {
							availability = availability.map((day) => ({
								...day,
								enabled: day.day >= 1 && day.day <= 5,
								startTime: '09:00',
								endTime: '17:00'
							}));
						}}
					>
						Set Default Hours (Mon–Fri, 9–5)
					</DashboardButton>
				</div>
			</form>
		</DashboardCard>

		<DashboardNotice variant="info">
			{#snippet heading()}Note{/snippet}
			Your connected calendars will also be checked for conflicts. Even if you're available according
			to these hours, if you have an event on your calendar during a time slot, it won't be shown as
			available to book.
		</DashboardNotice>
	</div>
</DashboardPageShell>
