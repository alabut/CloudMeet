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
	import { PREVIEW_BOOKING_ID, PREVIEW_TIMEZONE } from '$lib/preview/sampleBooking';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let accepting = $state(false);
	let declining = $state(false);

	const success = $derived($page.url.searchParams.get('success'));
	const action = $derived(data.action);
	const previewState = $derived(data.previewState);

	const showAccepted = $derived(
		success === 'accepted' || previewState === 'accepted'
	);
	const showDeclined = $derived(
		success === 'declined' || previewState === 'declined'
	);
	const showAlreadyResponded = $derived(
		data.alreadyResponded && !showAccepted && !showDeclined
	);
	const showCounter = $derived(
		action === 'counter' || previewState === 'counter'
	);
	const previewError = $derived(
		data.isPreview && previewState === 'error'
			? 'Preview error: response could not be submitted.'
			: null
	);
	const isSubmittingAccept = $derived(
		accepting || previewState === 'submitting-accept'
	);
	const isSubmittingDecline = $derived(
		declining || previewState === 'submitting-decline'
	);

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			timeZone: data.isPreview ? PREVIEW_TIMEZONE : undefined
		}).format(date);
	}

	function formatTime(dateStr: string) {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
			timeZone: data.isPreview ? PREVIEW_TIMEZONE : undefined
		}).format(date);
	}

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

	function humanizeStatus(status: string | undefined) {
		if (status === 'accepted') return 'accepted';
		if (status === 'declined') return 'declined';
		return status ?? 'responded to';
	}

	function handlePreviewAccept(e: Event) {
		e.preventDefault();
		void goto('?preview=accepted', { replaceState: true, keepFocus: true });
	}

	function handlePreviewDecline(e: Event) {
		e.preventDefault();
		void goto('?preview=declined', { replaceState: true, keepFocus: true });
	}

	function handleAcceptSubmit() {
		accepting = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			accepting = false;
		};
	}

	function handleDeclineSubmit() {
		declining = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			declining = false;
		};
	}

	const bookingId = $derived(
		data.proposal?.booking_id ?? (data.isPreview ? PREVIEW_BOOKING_ID : '')
	);
</script>

<svelte:head>
	<title>Reschedule Response</title>
</svelte:head>

{#if showAccepted}
	<PublicPageShell layout="centered" width="narrow">
		<PublicCard variant="plain" class="text-center sm:border sm:border-border sm:shadow-lg">
			<div class="mx-auto mb-4 sm:mb-5 flex justify-center">
				<StatusIcon variant="success" size="large" />
			</div>
			<h1 class="font-display text-xl sm:text-2xl font-medium text-text mb-2">Meeting Rescheduled</h1>
			<p class="mb-6 text-sm text-text-secondary sm:text-base">
				Your calendar invitation has been updated.
			</p>
			<BookingSummary class="text-left">
				<p class="font-semibold text-text mb-2">{data.proposal?.event_name}</p>
				<p class="text-sm text-text-secondary">
					{formatDateTime(data.proposal?.proposed_start_time || '')}
				</p>
			</BookingSummary>
		</PublicCard>
	</PublicPageShell>
{:else if showDeclined}
	<PublicPageShell layout="centered" width="narrow">
		<PublicCard variant="plain" class="text-center sm:border sm:border-border sm:shadow-lg">
			<div class="mx-auto mb-4 sm:mb-5 flex justify-center">
				<StatusIcon variant="danger" size="large" />
			</div>
			<h1 class="font-display text-xl sm:text-2xl font-medium text-text mb-2">Meeting Cancelled</h1>
			<p class="mb-6 text-sm text-text-secondary sm:text-base">
				The meeting has been cancelled. The host has been notified.
			</p>
			<TextLink href="/{data.proposal?.event_slug}">Book a New Time</TextLink>
		</PublicCard>
	</PublicPageShell>
{:else if showAlreadyResponded}
	<PublicPageShell layout="centered" width="narrow">
		<PublicCard variant="plain" class="text-center sm:border sm:border-border sm:shadow-lg">
			<div class="mx-auto mb-4 sm:mb-5 flex justify-center">
				<StatusIcon variant="attention" size="large" />
			</div>
			<h1 class="font-display text-xl sm:text-2xl font-medium text-text mb-2">Already Responded</h1>
			<p class="text-sm text-text-secondary sm:text-base">
				You have already {humanizeStatus(data.proposal?.status)} this reschedule request.
			</p>
		</PublicCard>
	</PublicPageShell>
{:else if showCounter}
	<PublicPageShell layout="centered" width="narrow">
		<PublicCard variant="raised" class="text-center">
			<h1 class="font-display text-xl sm:text-2xl font-medium text-text mb-4">
				Propose Different Time
			</h1>
			<p class="text-sm text-text-secondary sm:text-base mb-6">
				Choose a different time for your meeting.
			</p>
			<a
				href="/reschedule/{bookingId}"
				class="inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
			>
				Choose Different Time
			</a>
		</PublicCard>
	</PublicPageShell>
{:else}
	<PublicPageShell layout="document" width="booking">
		<PublicCard variant="raised">
			<h1 class="font-display text-2xl font-medium text-text mb-2 text-center">
				Reschedule Request
			</h1>
			<p class="text-text-secondary mb-6 text-center">
				<strong class="text-text">{data.proposal?.host_name}</strong> would like to reschedule your
				meeting.
			</p>

			{#if form?.error || previewError}
				<Notice variant="danger" class="mb-6">
					{#snippet heading()}Error{/snippet}
					{form?.error ?? previewError}
				</Notice>
			{/if}

			{#if data.proposal?.message}
				<Notice variant="info" class="mb-6">
					{#snippet heading()}Message from host{/snippet}
					{data.proposal.message}
				</Notice>
			{/if}

			<div class="space-y-4 mb-6">
				<BookingSummary title="Original time">
					<div class="text-text line-through">
						<p class="font-medium">{formatDate(data.proposal?.original_start_time || '')}</p>
						<p class="text-sm">
							{formatTime(data.proposal?.original_start_time || '')} -
							{formatTime(data.proposal?.original_end_time || '')}
						</p>
					</div>
				</BookingSummary>

				<div class="rounded-lg border border-accent/30 bg-accent/10 p-4 sm:p-6">
					<p class="font-meta text-extrasmall uppercase tracking-wide text-accent mb-2">
						Proposed new time
					</p>
					<div class="text-text">
						<p class="font-medium">{formatDate(data.proposal?.proposed_start_time || '')}</p>
						<p class="text-sm">
							{formatTime(data.proposal?.proposed_start_time || '')} -
							{formatTime(data.proposal?.proposed_end_time || '')}
						</p>
					</div>
				</div>
			</div>

			<BookingSummary class="mb-6">
				<p class="text-sm">
					<span class="text-text-secondary">Meeting:</span>
					<span class="font-medium text-text">{data.proposal?.event_name}</span>
				</p>
				<p class="text-sm mt-1">
					<span class="text-text-secondary">With:</span>
					<span class="font-medium text-text">{data.proposal?.host_name}</span>
				</p>
			</BookingSummary>

			<div class="space-y-3">
				<form
					method="POST"
					action="?/accept"
					use:enhance={data.isPreview ? undefined : handleAcceptSubmit}
					onsubmit={data.isPreview ? handlePreviewAccept : undefined}
				>
					<button
						type="submit"
						disabled={isSubmittingAccept || isSubmittingDecline}
						class="w-full px-6 py-3 text-white rounded-large font-medium transition bg-accent hover:bg-accent-hover disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
					>
						{isSubmittingAccept ? 'Accepting...' : 'Accept New Time'}
					</button>
				</form>

				<form
					method="POST"
					action="?/decline"
					use:enhance={data.isPreview ? undefined : handleDeclineSubmit}
					onsubmit={data.isPreview ? handlePreviewDecline : undefined}
				>
					<button
						type="submit"
						disabled={isSubmittingAccept || isSubmittingDecline}
						class="w-full px-6 py-3 text-white rounded-large font-medium transition bg-red-600 hover:bg-red-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
					>
						{isSubmittingDecline ? 'Declining...' : 'Decline & Cancel Meeting'}
					</button>
				</form>

				<a
					href="/reschedule/{bookingId}"
					class="block w-full px-6 py-3 text-center rounded-large font-medium transition border-2 border-accent text-accent hover:bg-accent/10"
				>
					Propose Different Time
				</a>
			</div>
		</PublicCard>
	</PublicPageShell>
{/if}
