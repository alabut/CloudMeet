<script lang="ts">
	import type { PageData } from './$types';
	import {
		DashboardPageShell,
		DashboardHeader,
		DashboardCard,
		DashboardNotice,
		DashboardButton,
		ProfileSection,
		CancelBookingModal,
		HostRescheduleModal,
		BookingsList,
		EventTypesList,
		DashboardNavActions
	} from '$lib/components/dashboard';

	let { data }: { data: PageData } = $props();

	// Local reactive copy of bookings for UI updates
	let bookings = $state(data.recentBookings || []);

	// Cancel booking state
	let cancellingBookingId = $state<string | null>(null);
	let showCancelModal = $state(false);
	let cancelSuccess = $state('');

	// Reschedule booking state
	let reschedulingBookingId = $state<string | null>(null);
	let rescheduleSuccess = $state('');

	let copyStatus = $state('');
	let copyError = $state(false);

	async function copyBookingLink() {
		copyStatus = '';
		copyError = false;
		try {
			await navigator.clipboard.writeText(data.appUrl + '/');
			copyStatus = 'Booking link copied to clipboard';
			setTimeout(() => { copyStatus = ''; }, 3000);
		} catch {
			copyError = true;
			copyStatus = 'Could not copy link. Try selecting the URL manually.';
			setTimeout(() => { copyStatus = ''; copyError = false; }, 4000);
		}
	}

	function openCancelModal(bookingId: string) {
		cancellingBookingId = bookingId;
		showCancelModal = true;
	}

	function closeCancelModal() {
		showCancelModal = false;
		cancellingBookingId = null;
	}

	async function cancelBooking(message: string) {
		if (!cancellingBookingId) return;

		const response = await fetch('/api/bookings/cancel', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				bookingId: cancellingBookingId,
				message: message || null
			})
		});

		if (!response.ok) {
			const errData = await response.json() as { message?: string };
			throw new Error(errData.message || 'Failed to cancel booking');
		}

		bookings = bookings.map(b =>
			b.id === cancellingBookingId
				? { ...b, status: 'canceled' }
				: b
		);

		cancelSuccess = 'Booking cancelled successfully';
		closeCancelModal();
		setTimeout(() => cancelSuccess = '', 3000);
	}

	function getBookingById(bookingId: string | null) {
		if (!bookingId) return null;
		return bookings.find(b => b.id === bookingId) || null;
	}

	function openRescheduleModal(bookingId: string) {
		reschedulingBookingId = bookingId;
	}

	function closeRescheduleModal() {
		reschedulingBookingId = null;
	}

	async function submitRescheduleProposal(bookingId: string, newStartTime: string, newEndTime: string, message: string) {
		const response = await fetch('/api/bookings/propose-reschedule', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				bookingId,
				proposedStartTime: newStartTime,
				proposedEndTime: newEndTime,
				message: message || null
			})
		});

		if (!response.ok) {
			const errData = await response.json() as { message?: string };
			throw new Error(errData.message || 'Failed to send reschedule proposal');
		}

		bookings = bookings.map(b =>
			b.id === bookingId
				? { ...b, status: 'rescheduled' }
				: b
		);

		rescheduleSuccess = 'Reschedule proposal sent to attendee';
		closeRescheduleModal();
		setTimeout(() => rescheduleSuccess = '', 3000);
	}
</script>

<DashboardPageShell>
	<DashboardHeader title="Dashboard" subtitle="Welcome back, {data.user?.name || 'User'}!">
		{#snippet actions()}
			<DashboardNavActions />
		{/snippet}
	</DashboardHeader>

	<div class="px-4 sm:px-6 py-4 max-w-4xl">
		{#if data.googleCalendarWarning}
			<DashboardNotice variant="attention" class="mb-4">
				{#snippet heading()}Google Calendar needs attention{/snippet}
				{data.googleCalendarWarning}
				<div class="mt-2">
					<DashboardButton variant="secondary" size="sm" href="/auth/login">
						Reconnect Google
					</DashboardButton>
				</div>
			</DashboardNotice>
		{:else if data.googleCalendarOk}
			<DashboardNotice variant="success" class="mb-4">
				Google Calendar is connected. New bookings can create invites.
			</DashboardNotice>
		{/if}

		<!-- Profile Section -->
		<ProfileSection user={data.user} />

		<!-- Booking Link -->
		<DashboardCard variant="outlined" class="mb-6">
			<h2 class="font-display font-medium text-base text-dash-text mb-2">Your Booking Page</h2>
			<div class="flex flex-col sm:flex-row sm:items-center gap-2">
				<input
					type="text"
					readonly
					value="{data.appUrl}/"
					class="flex-1 min-w-0 px-3 py-2 bg-[var(--dash-field)] border border-dash-border rounded-md text-sm text-dash-text"
				/>
				<DashboardButton
					variant="primary"
					size="sm"
					onclick={copyBookingLink}
					class="flex-shrink-0"
				>
					Copy Link
				</DashboardButton>
			</div>
			{#if copyStatus}
				<DashboardNotice variant={copyError ? 'danger' : 'success'} live class="mt-2">
					{copyStatus}
				</DashboardNotice>
			{/if}
		</DashboardCard>

		{#if cancelSuccess || rescheduleSuccess}
			<DashboardNotice variant="success" live class="mb-4">
				{cancelSuccess || rescheduleSuccess}
			</DashboardNotice>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Event Types -->
			<EventTypesList eventTypes={data.eventTypes || []} />

			<!-- Recent Bookings -->
			<BookingsList {bookings} onCancelClick={openCancelModal} onRescheduleClick={openRescheduleModal} />
		</div>
	</div>

	<CancelBookingModal
		booking={getBookingById(cancellingBookingId)}
		show={showCancelModal}
		onClose={closeCancelModal}
		onCancel={cancelBooking}
	/>

	<HostRescheduleModal
		booking={getBookingById(reschedulingBookingId)}
		onClose={closeRescheduleModal}
		onSubmit={submitRescheduleProposal}
	/>
</DashboardPageShell>
