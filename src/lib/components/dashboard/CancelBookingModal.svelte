<script lang="ts">
	import { createFormatters } from '$lib/utils/dateFormatters';
	import DashboardDialog from '$lib/components/dashboard/primitives/DashboardDialog.svelte';
	import DashboardField from '$lib/components/dashboard/primitives/DashboardField.svelte';
	import DashboardButton from '$lib/components/dashboard/primitives/DashboardButton.svelte';
	import DashboardNotice from '$lib/components/dashboard/primitives/DashboardNotice.svelte';

	interface Booking {
		id: string;
		event_type_name: string;
		attendee_name: string;
		attendee_email: string;
		start_time: string;
		status: string;
	}

	interface Props {
		booking: Booking | null;
		show: boolean;
		onClose: () => void;
		onCancel: (message: string) => Promise<void>;
		inert?: boolean;
		previewError?: string | null;
	}

	let { booking, show, onClose, onCancel, inert = false, previewError = null }: Props = $props();

	let cancelMessage = $state('');
	let cancelError = $state('');
	let cancelling = $state(false);

	const { formatCompactDateTime } = createFormatters();

	let open = $state(false);

	$effect(() => {
		open = show && booking !== null;
	});

	async function handleCancel() {
		if (!booking) return;

		if (inert) return;

		cancelling = true;
		cancelError = '';

		try {
			await onCancel(cancelMessage.trim() || '');
			cancelMessage = '';
			cancelError = '';
		} catch (err: any) {
			cancelError = err.message || 'Failed to cancel booking';
		} finally {
			cancelling = false;
		}
	}

	function handleClose() {
		cancelMessage = '';
		cancelError = '';
		onClose();
	}

	const displayError = $derived(previewError || cancelError);
</script>

<DashboardDialog
	bind:open
	title="Cancel Booking"
	onclose={handleClose}
>
	{#if booking}
		<div class="space-y-4">
			<p class="text-sm text-dash-text-secondary">
				Cancel <strong class="text-dash-text">{booking.event_type_name}</strong> with
				<strong class="text-dash-text">{booking.attendee_name}</strong> on
				{formatCompactDateTime(new Date(booking.start_time))}?
			</p>

			{#if displayError}
				<DashboardNotice variant="danger">{displayError}</DashboardNotice>
			{/if}

			<DashboardField
				id="cancel-message"
				label="Message to attendee (optional)"
				kind="textarea"
				bind:value={cancelMessage}
				placeholder="Let them know why you're cancelling…"
				rows={3}
				hint="Your message will be included in the Google Calendar invitation update sent to the attendee."
			/>

			<div class="flex justify-end gap-3 pt-2">
				<DashboardButton variant="ghost" onclick={handleClose} disabled={cancelling}>
					Keep Booking
				</DashboardButton>
				<DashboardButton variant="danger" onclick={handleCancel} disabled={cancelling || inert}>
					{cancelling ? 'Cancelling…' : 'Cancel Booking'}
				</DashboardButton>
			</div>
		</div>
	{/if}
</DashboardDialog>
