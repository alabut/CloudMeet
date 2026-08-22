<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let cancelling = $state(false);
	let reason = $state('');
	const success = $derived($page.url.searchParams.get('success') === 'true');

	function formatDateTime(dateStr: string) {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		}).format(date);
	}

	function handleSubmit() {
		cancelling = true;
		return async ({ update }: any) => {
			await update();
			cancelling = false;
		};
	}
</script>

<svelte:head>
	<title>Cancel Booking</title>
</svelte:head>

<div class="public-flow min-h-screen bg-bg text-text font-serif py-12">
	<div class="max-w-2xl mx-auto px-gutter">
		{#if success || data.alreadyCanceled}
			<!-- Success Message -->
			<div class="bg-surface rounded-large border border-border shadow-lg p-8 text-center">
				<div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background-color: var(--bg-secondary)">
					<svg class="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						></path>
					</svg>
				</div>
				<h1 class="font-display text-2xl font-medium text-text mb-2">Booking Cancelled</h1>
				<p class="text-text-secondary mb-6">
					Your meeting has been cancelled successfully. The host has been notified.
				</p>
				<a
					href="/{data.booking.event_slug}"
					class="inline-block px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-large transition"
				>
					Book Another Meeting
				</a>
			</div>
		{:else}
			<!-- Cancellation Form -->
			<div class="bg-surface rounded-large border border-border shadow-lg p-8">
				<h1 class="font-display text-2xl font-medium text-text mb-6">Cancel Booking</h1>

				{#if form?.error}
					<div class="bg-red-500/10 border border-red-500/30 text-red-400 rounded-large p-4 mb-6">
						Error: {form.error}
					</div>
				{/if}

				<div class="border border-border rounded-large p-6 mb-6" style="background-color: var(--bg-secondary)">
					<h2 class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-4">Booking Details</h2>
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
				</div>

				<div class="mb-6">
					<label for="reason" class="block text-sm font-medium text-text mb-2">
						Reason for cancellation (optional)
					</label>
					<textarea
						id="reason"
						name="reason"
						bind:value={reason}
						rows="3"
						class="w-full px-3 py-2 bg-bg-secondary border border-border rounded-large text-text placeholder:text-text-secondary focus:ring-2 focus:ring-accent focus:border-accent outline-none"
						placeholder="Let the host know why you're cancelling..."
					></textarea>
				</div>

				<div class="border border-accent/30 rounded-large p-4 mb-6" style="background-color: color-mix(in srgb, var(--accent) 10%, transparent)">
					<p class="text-sm text-text">
						<strong>Warning:</strong> This action cannot be undone. The host will be notified of the cancellation.
					</p>
				</div>

				<form method="POST" use:enhance={handleSubmit}>
					<input type="hidden" name="reason" value={reason} />
					<div class="flex gap-4">
						<button
							type="submit"
							disabled={cancelling}
							class="flex-1 px-6 py-3 bg-red-600 text-white rounded-large hover:bg-red-700 transition disabled:opacity-50 font-medium"
						>
							{cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
						</button>
						<a
							href="/{data.booking.event_slug}"
							class="flex-1 px-6 py-3 border border-border text-text rounded-large hover:border-accent transition text-center font-medium"
						>
							Keep Booking
						</a>
					</div>
				</form>
			</div>
		{/if}
	</div>
</div>
