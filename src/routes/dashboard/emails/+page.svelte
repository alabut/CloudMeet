<script lang="ts">
	import {
		DashboardPageShell,
		DashboardHeader,
		DashboardCard,
		DashboardNotice,
		DashboardButton
	} from '$lib/components/dashboard';
</script>

<DashboardPageShell>
	<DashboardHeader
		title="Email Notifications"
		subtitle="Optional branded transactional email (not available in V1)"
		backHref="/dashboard"
		backLabel="Dashboard"
	/>

	<div class="px-4 sm:px-6 py-4 max-w-2xl">
		<DashboardNotice variant="info" class="mb-6">
			{#snippet heading()}How booking notifications work in V1{/snippet}
			<p class="mt-1">
				When someone books a meeting, <strong>Google Calendar sends the confirmation automatically</strong>
				as a calendar invitation to both you and the attendee. The invitation includes the meeting
				date, time, and Zoom link.
			</p>
			<p class="mt-2">
				Optional branded transactional email (custom subjects, reminders, or separate confirmation
				emails from a provider like Resend or Emailit) is <strong>not configured in V1</strong>.
				There is nothing to enable or customize here yet.
			</p>
		</DashboardNotice>

		<DashboardCard variant="outlined">
			<h2 class="font-display font-medium text-base text-dash-text mb-2">Coming later</h2>
			<p class="text-sm text-dash-text-secondary mb-4">
				Future versions may let you send branded confirmation and reminder emails alongside Google
				Calendar invitations. That work depends on choosing an email provider and wiring templates
				into the booking lifecycle.
			</p>
			<ul class="text-sm text-dash-text-secondary space-y-2 list-disc pl-5">
				<li>Booking confirmation email templates</li>
				<li>Cancellation and reschedule notification templates</li>
				<li>Reminder emails before meetings</li>
			</ul>
			<p class="text-sm text-dash-text-secondary mt-4">
				Until then, rely on Google Calendar invitations and updates — including when you cancel or
				propose a new time from the dashboard.
			</p>
			<div class="mt-5">
				<DashboardButton variant="secondary" size="sm" href="/dashboard">
					Back to Dashboard
				</DashboardButton>
			</div>
		</DashboardCard>
	</div>
</DashboardPageShell>
