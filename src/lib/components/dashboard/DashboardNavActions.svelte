<script lang="ts">
	import DashboardButton from '$lib/components/dashboard/primitives/DashboardButton.svelte';
</script>

<div class="flex flex-wrap items-center justify-start sm:justify-end gap-2 max-w-full">
	<DashboardButton variant="secondary" size="sm" href="/dashboard/calendars">
		Calendars
	</DashboardButton>
	<DashboardButton variant="primary" size="sm" href="/dashboard/availability">
		Set Availability
	</DashboardButton>
	<form method="POST" action="/auth/logout" class="contents">
		<DashboardButton variant="ghost" size="sm" type="submit">
			Logout
		</DashboardButton>
	</form>
</div>
