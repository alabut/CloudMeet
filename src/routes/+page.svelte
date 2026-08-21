<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Strip HTML tags from description for display, preserving spacing between block elements
	function stripHtml(html: string): string {
		return html
			.replace(/<\/(p|div|li|br|h[1-6])>/gi, ' ') // Add space after block elements
			.replace(/<[^>]*>/g, '') // Remove remaining tags
			.replace(/&nbsp;/g, ' ')
			.replace(/\s+/g, ' ') // Collapse multiple spaces
			.trim();
	}
</script>

{#if data.user && data.eventTypes}
	<!-- Event Types View -->
	<div class="public-flow min-h-screen bg-bg text-text font-serif py-12">
		<div class="max-w-2xl mx-auto px-gutter">
			<!-- User Header -->
			<div class="text-center mb-10">
				{#if data.user.profileImage}
					<img
						src={data.user.profileImage}
						alt={data.user.name}
						class="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-bg shadow-lg"
					/>
				{:else}
					<div class="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-semibold text-3xl border-4 border-bg shadow-lg" style="background-color: var(--accent)">
						{data.user.name?.charAt(0) || 'U'}
					</div>
				{/if}
				<h1 class="font-display text-3xl font-medium text-text mb-2">{data.user.name}</h1>
				<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary">Select a meeting type to book a time</p>
			</div>

			<!-- Event Types List -->
			{#if data.eventTypes.length > 0}
				<div class="space-y-4">
					{#each data.eventTypes as eventType}
						<a
							href="/{eventType.slug}"
							class="block bg-surface rounded-large border border-border hover:border-accent transition-all p-5 border-l-4 hover:translate-x-1"
							style="border-left-color: var(--accent)"
						>
							<div class="flex justify-between items-start gap-4">
								<div class="flex-1 min-w-0">
									<h2 class="font-display text-lg font-medium text-text mb-1">{eventType.name}</h2>
									{#if eventType.description}
										<p class="text-text-secondary text-sm line-clamp-2">{stripHtml(eventType.description)}</p>
									{/if}
								</div>
								<div class="flex items-center font-meta text-extrasmall uppercase tracking-wide ml-4 px-3 py-1 rounded-large text-accent" style="background-color: var(--bg-secondary)">
									<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
									<span>{eventType.duration} min</span>
								</div>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="bg-surface rounded-large border border-border p-12 text-center">
					<svg
						class="w-16 h-16 mx-auto mb-4 text-text-secondary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						></path>
					</svg>
					<h2 class="font-display text-xl font-medium text-text mb-2">No Available Meeting Types</h2>
					<p class="text-text-secondary">Check back later.</p>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<!-- Landing Page -->
	<div class="public-flow min-h-screen bg-bg text-text font-serif">
		<div class="max-w-7xl mx-auto px-gutter py-12">
		<!-- Header -->
		<div class="text-center mb-16">
			<h1 class="font-display text-5xl font-medium text-text mb-4">
				Meeting Scheduler
			</h1>
			<p class="text-xl text-text-secondary mb-8">
				Free, open-source meeting scheduling on Cloudflare
			</p>
			<div class="flex justify-center gap-4">
				<a
					href="/auth/login"
					class="inline-flex items-center px-8 py-3 text-base font-medium rounded-large shadow-sm text-white bg-accent hover:bg-accent-hover transition"
				>
					Login with Google
				</a>
				<a
					href="/dashboard"
					class="inline-flex items-center px-8 py-3 border border-border text-base font-medium rounded-large text-text bg-surface hover:border-accent transition"
				>
					Go to Dashboard
				</a>
			</div>
		</div>

		<!-- Features -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
			<div class="bg-surface p-8 rounded-large border border-border">
				<div class="w-12 h-12 rounded-large flex items-center justify-center mb-4" style="background-color: var(--bg-secondary)">
					<svg
						class="w-6 h-6 text-accent"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						></path>
					</svg>
				</div>
				<h3 class="font-display text-lg font-medium mb-2 text-text">Google Calendar Sync</h3>
				<p class="text-text-secondary text-sm">
					Automatically sync with your Google Calendar to prevent double bookings
				</p>
			</div>

			<div class="bg-surface p-8 rounded-large border border-border">
				<div class="w-12 h-12 rounded-large flex items-center justify-center mb-4" style="background-color: var(--bg-secondary)">
					<svg
						class="w-6 h-6 text-accent"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
				</div>
				<h3 class="font-display text-lg font-medium mb-2 text-text">Set Your Hours</h3>
				<p class="text-text-secondary text-sm">
					Define your availability and let people book meetings during those times
				</p>
			</div>

			<div class="bg-surface p-8 rounded-large border border-border">
				<div class="w-12 h-12 rounded-large flex items-center justify-center mb-4" style="background-color: var(--bg-secondary)">
					<svg
						class="w-6 h-6 text-accent"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						></path>
					</svg>
				</div>
				<h3 class="font-display text-lg font-medium mb-2 text-text">Lightning Fast</h3>
				<p class="text-text-secondary text-sm">
					Built on Cloudflare's edge network for instant page loads worldwide
				</p>
			</div>
		</div>

		<!-- How It Works -->
		<div class="mt-20 max-w-3xl mx-auto">
			<h2 class="font-display text-3xl font-medium text-center text-text mb-12">How It Works</h2>
			<div class="space-y-6">
				<div class="flex gap-4">
					<div
						class="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold"
					>
						1
					</div>
					<div>
						<h4 class="font-semibold text-text mb-1">Connect Your Google Calendar</h4>
						<p class="text-text-secondary text-sm">
							Log in with Google and grant access to your calendar
						</p>
					</div>
				</div>

				<div class="flex gap-4">
					<div
						class="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold"
					>
						2
					</div>
					<div>
						<h4 class="font-semibold text-text mb-1">Set Your Availability</h4>
						<p class="text-text-secondary text-sm">
							Define your working hours and create event types (30 min meetings, consultations, etc.)
						</p>
					</div>
				</div>

				<div class="flex gap-4">
					<div
						class="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold"
					>
						3
					</div>
					<div>
						<h4 class="font-semibold text-text mb-1">Share Your Link</h4>
						<p class="text-text-secondary text-sm">
							Get a personalized booking link to share with others
						</p>
					</div>
				</div>

				<div class="flex gap-4">
					<div
						class="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold"
					>
						4
					</div>
					<div>
						<h4 class="font-semibold text-text mb-1">Get Booked</h4>
						<p class="text-text-secondary text-sm">
							When someone books a meeting, it's automatically added to your Google Calendar
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- CTA -->
		<div class="mt-20 text-center">
			<a
				href="/auth/login"
				class="inline-flex items-center px-12 py-4 text-lg font-medium rounded-large shadow-sm text-white bg-accent hover:bg-accent-hover transition"
			>
				Get Started - It's Free
			</a>
		</div>
	</div>
	</div>
{/if}
