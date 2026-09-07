<script lang="ts">
	import DashboardSection from '$lib/components/dashboard/primitives/DashboardSection.svelte';
	import DashboardCard from '$lib/components/dashboard/primitives/DashboardCard.svelte';
	import DashboardStatusBadge from '$lib/components/dashboard/primitives/DashboardStatusBadge.svelte';
	import DashboardEmptyState from '$lib/components/dashboard/primitives/DashboardEmptyState.svelte';
	import DashboardButton from '$lib/components/dashboard/primitives/DashboardButton.svelte';

	interface EventType {
		id: string;
		name: string;
		slug: string;
		duration: number;
		description?: string | null;
		is_active: boolean;
	}

	interface Props {
		eventTypes: EventType[];
	}

	let { eventTypes }: Props = $props();
</script>

<DashboardSection heading="Event Types">
	{#if eventTypes && eventTypes.length > 0}
		<div class="flex justify-end mb-3">
			<DashboardButton variant="primary" size="sm" href="/dashboard/event-types/new">
				+ New Event Type
			</DashboardButton>
		</div>
		<div class="space-y-2">
			{#each eventTypes as eventType}
				<DashboardCard variant="outlined">
					<div class="flex flex-wrap justify-between items-start gap-2 mb-2">
						<div class="min-w-0">
							<h3 class="text-sm font-medium text-dash-text">{eventType.name}</h3>
							<p class="text-xs text-dash-text-secondary">{eventType.duration} minutes</p>
						</div>
						<DashboardStatusBadge variant={eventType.is_active ? 'success' : 'neutral'}>
							{eventType.is_active ? 'Active' : 'Inactive'}
						</DashboardStatusBadge>
					</div>
					{#if eventType.description}
						<p class="text-sm text-dash-text-secondary mb-3">{eventType.description}</p>
					{/if}
					<div class="flex gap-3">
						<DashboardButton variant="ghost" size="sm" href="/{eventType.slug}">
							View Page
						</DashboardButton>
						<DashboardButton variant="ghost" size="sm" href="/dashboard/event-types/{eventType.id}">
							Edit
						</DashboardButton>
					</div>
				</DashboardCard>
			{/each}
		</div>
	{:else}
		<DashboardEmptyState
			title="No event types yet"
			description="Create your first event type so people can book meetings with you."
		>
			{#snippet icon()}
				<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			{/snippet}
			{#snippet action()}
				<DashboardButton variant="primary" href="/dashboard/event-types/new">
					Create Your First Event Type
				</DashboardButton>
			{/snippet}
		</DashboardEmptyState>
	{/if}
</DashboardSection>
