<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData, ActionData } from './$types';
	import {
		PublicPageShell,
		PublicCard,
		TextLink,
		Notice,
		StatusIcon
	} from '$lib/components/public';
	import { BookingSummary } from '$lib/components/booking';
	import { PREVIEW_TIMEZONE } from '$lib/preview/sampleBooking';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let cancelling = $state(false);
	let previewCancelled = $state(false);
	let reason = $state(
		data.isPreview && data.previewState === 'reason'
			? 'Something came up and I need to cancel.'
			: ''
	);

	const success = $derived($page.url.searchParams.get('success') === 'true');
	const previewSuccess = $derived(
		data.isPreview &&
			(data.previewState === 'success' ||
				$page.url.searchParams.get('preview') === 'success' ||
				previewCancelled)
	);
	const previewSubmitting = $derived(data.isPreview && data.previewState === 'submitting');
	const previewError = $derived(
		data.isPreview && data.previewState === 'error'
			? 'Preview error: cancellation could not be completed.'
			: null
	);
	const showSuccess = $derived(
		(success && !data.alreadyCanceled) || previewSuccess
	);
	const showAlreadyCancelled = $derived(data.alreadyCanceled && !previewSuccess);

	function formatDateTime(dateStr: string) {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
			timeZone: data.isPreview ? PREVIEW_TIMEZONE : undefined
		}).format(date);
	}

	function handleSubmit() {
		cancelling = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			cancelling = false;
		};
	}

	function handlePreviewCancel(e: Event) {
		e.preventDefault();
		previewCancelled = true;
		void goto('?preview=success', { replaceState: true, keepFocus: true });
	}

	const isSubmitting = $derived(cancelling || previewSubmitting);
	const displayError = $derived(form?.error ?? previewError);
</script>

<svelte:head>
	<title>Cancel Booking</title>
</svelte:head>

{#if showSuccess}
	<PublicPageShell layout="centered" width="narrow">
		<PublicCard variant="plain" class="text-center sm:border sm:border-border sm:shadow-lg">
			<div class="mx-auto mb-4 sm:mb-5 flex justify-center">
				<StatusIcon variant="success" size="large" />
			</div>
			<h1 class="font-display text-xl sm:text-2xl font-medium text-text mb-2">Booking Cancelled</h1>
			<p class="mb-6 text-sm text-text-secondary sm:text-base">
				Your meeting has been cancelled successfully. The host has been notified.
			</p>
			<TextLink href="/{data.booking.event_slug}">Book Another Meeting</TextLink>
		</PublicCard>
	</PublicPageShell>
{:else if showAlreadyCancelled}
	<PublicPageShell layout="centered" width="narrow">
		<PublicCard variant="plain" class="text-center sm:border sm:border-border sm:shadow-lg">
			<div class="mx-auto mb-4 sm:mb-5 flex justify-center">
				<StatusIcon variant="attention" size="large" />
			</div>
			<h1 class="font-display text-xl sm:text-2xl font-medium text-text mb-2">Already Cancelled</h1>
			<p class="mb-6 text-sm text-text-secondary sm:text-base">
				This booking has already been cancelled.
			</p>
			<TextLink href="/{data.booking.event_slug}">Book Another Meeting</TextLink>
		</PublicCard>
	</PublicPageShell>
{:else}
	<PublicPageShell layout="document" width="booking">
		<PublicCard variant="raised">
			<h1 class="font-display text-2xl font-medium text-text mb-6">Cancel Booking</h1>

			{#if displayError}
				<Notice variant="danger" class="mb-6">
					{#snippet heading()}Error{/snippet}
					{displayError}
				</Notice>
			{/if}

			<BookingSummary title="Booking Details" class="mb-6">
				<div class="space-y-2 text-sm">
					<div>
						<span class="text-text-secondary">Event:</span>
						<span class="ml-2 text-text font-medium">{data.booking.event_name}</span>
					</div>
					<div>
						<span class="text-text-secondary">With:</span>
						<span class="ml-2 text-text font-medium">{data.booking.host_name}</span>
					</div>
					<div>
						<span class="text-text-secondary">Time:</span>
						<span class="ml-2 text-text font-medium"
							>{formatDateTime(data.booking.start_time)}</span
						>
					</div>
					<div>
						<span class="text-text-secondary">Attendee:</span>
						<span class="ml-2 text-text font-medium">{data.booking.attendee_name}</span>
					</div>
				</div>
			</BookingSummary>

			<div class="mb-6">
				<label for="reason" class="block text-sm font-medium text-text mb-2">
					Reason for cancellation (optional)
				</label>
				<textarea
					id="reason"
					name="reason"
					bind:value={reason}
					rows="3"
					class="w-full px-3 py-2 bg-[var(--field-bg)] border border-border rounded-lg text-text placeholder:text-text-secondary focus:ring-2 focus:ring-accent focus:border-accent outline-none resize-none"
					placeholder="Let the host know why you're cancelling..."
				></textarea>
			</div>

			<Notice variant="attention" class="mb-6">
				{#snippet heading()}Before you cancel{/snippet}
				Cancelling this meeting will notify the host.
			</Notice>

			<form
				method="POST"
				use:enhance={data.isPreview ? undefined : handleSubmit}
				onsubmit={data.isPreview ? handlePreviewCancel : undefined}
			>
				<input type="hidden" name="reason" value={reason} />
				<div class="flex flex-col sm:flex-row gap-4">
					<button
						type="submit"
						disabled={isSubmitting}
						class="flex-1 px-6 py-3 bg-red-600 text-white rounded-large hover:bg-red-700 transition disabled:opacity-50 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
					>
						{isSubmitting ? 'Cancelling...' : 'Yes, Cancel Booking'}
					</button>
					<a
						href="/{data.booking.event_slug}"
						class="flex-1 px-6 py-3 border border-border text-text rounded-large hover:border-accent transition text-center font-medium"
					>
						Keep Booking
					</a>
				</div>
			</form>
		</PublicCard>
	</PublicPageShell>
{/if}
