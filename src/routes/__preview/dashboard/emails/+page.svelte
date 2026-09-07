<script lang="ts">
	import {
		DashboardPageShell,
		DashboardHeader,
		DashboardCard,
		DashboardNotice,
		DashboardButton
	} from '$lib/components/dashboard';
</script>

<svelte:head>
	<title>Preview: Email Notifications — CloudMeet</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<DashboardPageShell>
	<DashboardHeader
		title="Email Notifications"
		subtitle="Optional branded transactional email (not available in V1)"
		backHref="/__preview/dashboard/overview"
		backLabel="Overview"
	/>

	<div class="px-4 sm:px-6 py-4 max-w-2xl">
		<DashboardNotice variant="info" class="mb-6">
			{#snippet heading()}How booking notifications work in V1{/snippet}
			<p class="mt-1">
				When someone books a meeting, <strong>Google Calendar sends the confirmation automatically</strong>
				as a calendar invitation to both you and the attendee.
			</p>
			<p class="mt-2">
				Optional branded transactional email is <strong>not configured in V1</strong>. This preview
				mirrors the read-only production page.
			</p>
		</DashboardNotice>

		<DashboardCard variant="outlined">
			<h2 class="font-display font-medium text-base text-dash-text mb-2">Coming later</h2>
			<p class="text-sm text-dash-text-secondary">
				Template customization and provider setup are future work. Until then, Google Calendar
				invitations and updates are the confirmation mechanism.
			</p>
			<div class="mt-5">
				<DashboardButton variant="secondary" size="sm" href="/__preview/dashboard/overview">
					Back to overview preview
				</DashboardButton>
			</div>
		</DashboardCard>
	</div>
</DashboardPageShell>
