<script lang="ts">
	import type { PageData } from './$types';
	import { DashboardPageShell, DashboardHeader, CalendarSettings } from '$lib/components/dashboard';

	let { data }: { data: PageData } = $props();
</script>

<DashboardPageShell>
	<DashboardHeader
		title="Calendar Settings"
		subtitle="Connect calendars and configure defaults"
		backHref="/dashboard"
		backLabel="Dashboard"
	/>

	<div class="px-4 sm:px-6 py-4 max-w-2xl">
		<CalendarSettings
			user={data.user}
			outlookConfigured={data.outlookConfigured}
			googleCalendarWarning={data.googleCalendarWarning}
		/>
	</div>
</DashboardPageShell>
