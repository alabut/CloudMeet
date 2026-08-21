<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const success = $derived($page.url.searchParams.get('success'));
	const action = $derived(data.action);

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

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}

	function formatTime(dateStr: string) {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		}).format(date);
	}
</script>

<svelte:head>
	<title>Reschedule Response</title>
</svelte:head>

<div class="public-flow min-h-screen bg-bg text-text font-serif flex flex-col items-center justify-center p-gutter">
	{#if success === 'accepted'}
		<!-- Accepted Success -->
		<div class="bg-surface rounded-large border border-border shadow-lg p-8 max-w-md w-full text-center">
			<div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style="background-color: var(--bg-secondary)">
				<svg class="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
				</svg>
			</div>
			<h1 class="font-display text-2xl font-medium text-text mb-2">Meeting Rescheduled!</h1>
			<p class="text-text-secondary mb-6">
				Your meeting has been confirmed for the new time. A calendar update has been sent to your email.
			</p>
			<div class="rounded-large p-4 text-left" style="background-color: var(--bg-secondary)">
				<p class="font-semibold text-text mb-2">{data.proposal?.event_name}</p>
				<p class="text-sm text-text-secondary">{formatDateTime(data.proposal?.proposed_start_time || '')}</p>
			</div>
		</div>
	{:else if success === 'declined'}
		<!-- Declined Success -->
		<div class="bg-surface rounded-large border border-border shadow-lg p-8 max-w-md w-full text-center">
			<div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30" style="background-color: rgba(239, 68, 68, 0.1)">
				<svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
				</svg>
			</div>
			<h1 class="font-display text-2xl font-medium text-text mb-2">Meeting Cancelled</h1>
			<p class="text-text-secondary mb-6">
				The meeting has been cancelled. The host has been notified.
			</p>
			<a
				href="/{data.proposal?.event_slug}"
				class="inline-block px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-large transition"
			>
				Book a New Time
			</a>
		</div>
	{:else if data.alreadyResponded}
		<!-- Already Responded -->
		<div class="bg-surface rounded-large border border-border shadow-lg p-8 max-w-md w-full text-center">
			<div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/30" style="background-color: rgba(234, 179, 8, 0.1)">
				<svg class="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
				</svg>
			</div>
			<h1 class="font-display text-2xl font-medium text-text mb-2">Already Responded</h1>
			<p class="text-text-secondary">
				This reschedule request has already been {data.proposal?.status}.
			</p>
		</div>
	{:else if action === 'counter'}
		<!-- Counter Propose - Redirect to reschedule page -->
		<div class="bg-surface rounded-large border border-border shadow-lg p-8 max-w-md w-full text-center">
			<h1 class="font-display text-2xl font-medium text-text mb-4">Propose Different Time</h1>
			<p class="text-text-secondary mb-6">
				You'll be redirected to choose a different time for your meeting.
			</p>
			<a
				href="/reschedule/{data.proposal?.booking_id}"
				class="inline-block px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-large transition"
			>
				Choose Different Time
			</a>
		</div>
	{:else}
		<!-- Response Form -->
		<div class="bg-surface rounded-large border border-border shadow-lg p-8 max-w-lg w-full">
			<h1 class="font-display text-2xl font-medium text-text mb-2 text-center">Reschedule Request</h1>
			<p class="text-text-secondary mb-6 text-center">
				<strong class="text-text">{data.proposal?.host_name}</strong> would like to reschedule your meeting.
			</p>

			{#if form?.error}
				<div class="bg-red-500/10 border border-red-500/30 text-red-400 rounded-large p-4 mb-6">
					{form.error}
				</div>
			{/if}

			{#if data.proposal?.message}
				<div class="rounded-large p-4 mb-6 border border-accent/30" style="background-color: color-mix(in srgb, var(--accent) 10%, transparent)">
					<p class="text-sm text-text">{data.proposal.message}</p>
				</div>
			{/if}

			<div class="space-y-4 mb-6">
				<!-- Original Time -->
				<div class="rounded-large p-4 border border-red-500/30" style="background-color: rgba(239, 68, 68, 0.1)">
					<div class="font-meta text-extrasmall uppercase tracking-wide text-red-400 mb-2">Original Time</div>
					<div class="text-text line-through">
						<p class="font-medium">{formatDate(data.proposal?.original_start_time || '')}</p>
						<p class="text-sm">{formatTime(data.proposal?.original_start_time || '')} - {formatTime(data.proposal?.original_end_time || '')}</p>
					</div>
				</div>

				<!-- Proposed New Time -->
				<div class="rounded-large p-4 border border-accent/30" style="background-color: color-mix(in srgb, var(--accent) 10%, transparent)">
					<div class="font-meta text-extrasmall uppercase tracking-wide text-accent mb-2">Proposed New Time</div>
					<div class="text-text">
						<p class="font-medium">{formatDate(data.proposal?.proposed_start_time || '')}</p>
						<p class="text-sm">{formatTime(data.proposal?.proposed_start_time || '')} - {formatTime(data.proposal?.proposed_end_time || '')}</p>
					</div>
				</div>
			</div>

			<div class="rounded-large p-4 mb-6" style="background-color: var(--bg-secondary)">
				<p class="text-sm"><span class="text-text-secondary">Meeting:</span> <span class="font-medium text-text">{data.proposal?.event_name}</span></p>
				<p class="text-sm"><span class="text-text-secondary">With:</span> <span class="font-medium text-text">{data.proposal?.host_name}</span></p>
			</div>

			<div class="space-y-3">
				<form method="POST" action="?/accept" use:enhance>
					<button
						type="submit"
						class="w-full px-6 py-3 text-white rounded-large font-medium transition bg-green-600 hover:bg-green-700"
					>
						Accept New Time
					</button>
				</form>

				<form method="POST" action="?/decline" use:enhance>
					<button
						type="submit"
						class="w-full px-6 py-3 text-white rounded-large font-medium transition bg-red-600 hover:bg-red-700"
					>
						Decline & Cancel Meeting
					</button>
				</form>

				<a
					href="/reschedule/{data.proposal?.booking_id}"
					class="block w-full px-6 py-3 text-center rounded-large font-medium transition border-2 border-accent text-accent hover:bg-accent/10"
				>
					Propose Different Time
				</a>
			</div>
		</div>
	{/if}
</div>
