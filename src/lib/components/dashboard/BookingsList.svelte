<script lang="ts">
	import { createFormatters } from '$lib/utils/dateFormatters';
	import DashboardSection from '$lib/components/dashboard/primitives/DashboardSection.svelte';
	import DashboardCard from '$lib/components/dashboard/primitives/DashboardCard.svelte';
	import DashboardStatusBadge from '$lib/components/dashboard/primitives/DashboardStatusBadge.svelte';
	import DashboardEmptyState from '$lib/components/dashboard/primitives/DashboardEmptyState.svelte';
	import DashboardButton from '$lib/components/dashboard/primitives/DashboardButton.svelte';

	interface Booking {
		id: string;
		event_type_name: string;
		event_type_slug: string;
		event_type_id: string;
		duration_minutes: number;
		attendee_name: string;
		attendee_email: string;
		start_time: string;
		end_time: string;
		status: string;
		attendee_notes?: string | null;
		canceled_by?: string | null;
		cancellation_reason?: string | null;
	}

	interface Props {
		bookings: Booking[];
		onCancelClick: (bookingId: string) => void;
		onRescheduleClick: (bookingId: string) => void;
	}

	let { bookings, onCancelClick, onRescheduleClick }: Props = $props();

	const { formatCompactDateTime } = createFormatters();

	let sortOrder = $state<'last_booked' | 'upcoming'>('last_booked');

	const sortedBookings = $derived(() => {
		if (!bookings) return [];
		const sorted = [...bookings];
		if (sortOrder === 'upcoming') {
			sorted.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
		}
		return sorted;
	});

	function getStatusVariant(status: string): 'success' | 'danger' | 'attention' | 'neutral' {
		switch (status) {
			case 'confirmed': return 'success';
			case 'canceled': return 'danger';
			case 'pending': return 'attention';
			default: return 'neutral';
		}
	}
</script>

<section class="py-4 sm:py-6">
	<div class="flex items-center justify-between gap-3 mb-4">
		<h2 class="font-display font-medium text-base text-dash-text">Upcoming Bookings</h2>
		<select
			bind:value={sortOrder}
			class="px-2.5 py-1.5 bg-[var(--dash-field)] border border-dash-border rounded-md text-sm text-dash-text focus:ring-2 focus:ring-dash-accent focus:border-transparent outline-none"
		>
			<option value="last_booked">Last booked</option>
			<option value="upcoming">Upcoming first</option>
		</select>
	</div>

	<div class="space-y-2">
		{#if sortedBookings().length > 0}
			{#each sortedBookings() as booking}
				<DashboardCard variant="outlined">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div class="min-w-0">
							<h3 class="text-sm font-medium text-dash-text">{booking.event_type_name}</h3>
							<p class="text-sm text-dash-text-secondary">{booking.attendee_name}</p>
							<p class="text-xs text-dash-text-secondary break-all">{booking.attendee_email}</p>
							<p class="text-xs text-dash-text-secondary mt-1">
								{formatCompactDateTime(new Date(booking.start_time))}
							</p>
						</div>
						<div class="flex flex-wrap items-center gap-2 flex-shrink-0">
							<DashboardStatusBadge variant={getStatusVariant(booking.status)}>
								{booking.status}
							</DashboardStatusBadge>
							{#if booking.status === 'confirmed'}
								<DashboardButton
									variant="ghost"
									size="sm"
									onclick={() => onRescheduleClick(booking.id)}
								>
									Reschedule
								</DashboardButton>
								<DashboardButton
									variant="danger"
									size="sm"
									onclick={() => onCancelClick(booking.id)}
								>
									Cancel
								</DashboardButton>
							{/if}
						</div>
					</div>

					{#if booking.attendee_notes}
						<div class="mt-3 text-sm text-dash-text-secondary bg-[var(--dash-field)] rounded-md p-2.5">
							<span class="font-medium text-dash-text">Message:</span> {booking.attendee_notes}
						</div>
					{/if}

					{#if booking.status === 'canceled'}
						<div class="mt-3 text-sm text-dash-danger bg-dash-danger-surface rounded-md p-2.5">
							<span class="font-medium">Cancelled by {booking.canceled_by === 'host' ? 'you' : 'attendee'}</span>
							{#if booking.cancellation_reason}
								<span>: {booking.cancellation_reason}</span>
							{/if}
						</div>
					{/if}
				</DashboardCard>
			{/each}
		{:else}
			<DashboardEmptyState
				title="No bookings yet"
				description="Share your booking page to start scheduling meetings."
			>
				{#snippet icon()}
					<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				{/snippet}
			</DashboardEmptyState>
		{/if}
	</div>
</section>
