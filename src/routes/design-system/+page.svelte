<!--
  Localhost-only visual QA and learning surface — not part of the public product.
  The server loader returns 404 unless the hostname is loopback.
  See docs/DESIGN.md for the implementation contract.
-->
<script lang="ts">
	import {
		PublicPageShell,
		PublicCard,
		TextLink,
		Notice,
		StatusIcon
	} from '$lib/components/public';
	import { BookingSuccess, BookingSummary } from '$lib/components/booking';
	import {
		PREVIEW_BOOKING_ID,
		PREVIEW_PROPOSAL_TOKEN,
		PREVIEW_MEETING_URL,
		getPreviewSampleSlot
	} from '$lib/preview/sampleBooking';
	import { formatSelectedDate, formatTimeRange } from '$lib/utils/dateFormatters';

	const accentColor = '#f15403';
	const sample = getPreviewSampleSlot();

	const colorTokens = [
		{ name: 'bg', role: 'Page canvas' },
		{ name: 'field-bg', role: 'Solid inner surface for details and controls' },
		{ name: 'surface / bg-secondary', role: 'Subtle secondary surface — avoid stacking' },
		{ name: 'text', role: 'Primary content' },
		{ name: 'text-secondary', role: 'Supporting copy and metadata' },
		{ name: 'border', role: 'Quiet structure' },
		{ name: 'accent', role: 'Focus, selection, success, navigation' },
		{ name: 'accent-hover', role: 'Interactive hover emphasis' }
	];

	const existingPatterns = [
		{
			name: 'BookingCalendar',
			path: 'src/lib/components/booking/BookingCalendar.svelte',
			used: 'Public booking page — month grid (desktop tree)'
		},
		{
			name: 'TimeSlotList',
			path: 'src/lib/components/booking/TimeSlotList.svelte',
			used: 'Public booking page — time slot buttons (desktop tree)'
		},
		{
			name: 'BookingForm',
			path: 'src/lib/components/booking/BookingForm.svelte',
			used: 'Public booking page — name/email/notes form (desktop tree)'
		},
		{
			name: 'BookingSuccess',
			path: 'src/lib/components/booking/BookingSuccess.svelte',
			used: 'Booking confirmation — shared by mobile and desktop trees'
		},
		{
			name: 'EventSidebar',
			path: 'src/lib/components/booking/EventSidebar.svelte',
			used: 'Public booking page — event details sidebar (desktop tree)'
		},
		{
			name: 'BookingIdentity',
			path: 'src/lib/components/BookingIdentity.svelte',
			used: 'Public booking page — host avatar and name header'
		},
		{
			name: 'TimezoneSelector',
			path: 'src/lib/components/TimezoneSelector.svelte',
			used: 'Booking, reschedule, and EventSidebar — timezone picker'
		}
	];
</script>

<svelte:head>
	<title>Design System — CloudMeet (localhost)</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<PublicPageShell width="wide">
	<header class="mb-10 sm:mb-12">
		<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-2">
			Localhost only
		</p>
		<h1 class="font-display text-2xl sm:text-3xl font-medium text-text mb-3">CloudMeet Design System</h1>
		<p class="text-sm sm:text-base text-text-secondary max-w-2xl">
			Visual catalog for the visitor-facing interface. Warm, editorial, and personal — a focused
			extension of alabut.com rather than stock scheduling SaaS.
		</p>
	</header>

	<!-- Four-layer model -->
	<section class="mb-12">
		<h2 class="font-display text-xl font-medium text-text mb-4">Four layers</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			<PublicCard variant="outlined">
				<h3 class="font-display font-medium text-text mb-1">1. Tokens</h3>
				<p class="text-sm text-text-secondary">
					Semantic CSS variables in <code class="font-meta text-extrasmall">src/app.css</code>, mapped
					through Tailwind. Colors, type, spacing, radii.
				</p>
			</PublicCard>
			<PublicCard variant="outlined">
				<h3 class="font-display font-medium text-text mb-1">2. Primitives</h3>
				<p class="text-sm text-text-secondary">
					Reusable Svelte components under <code class="font-meta text-extrasmall">src/lib/components/public/</code>
					— shells, cards, links, notices, icons.
				</p>
			</PublicCard>
			<PublicCard variant="outlined">
				<h3 class="font-display font-medium text-text mb-1">3. Patterns</h3>
				<p class="text-sm text-text-secondary">
					Domain compositions in <code class="font-meta text-extrasmall">booking/</code> — calendar,
					forms, confirmation panels, summaries.
				</p>
			</PublicCard>
			<PublicCard variant="outlined">
				<h3 class="font-display font-medium text-text mb-1">4. Pages</h3>
				<p class="text-sm text-text-secondary">
					Route files wire data and compose primitives and patterns. One-off layout stays in the page.
				</p>
			</PublicCard>
		</div>
	</section>

	<!-- Color tokens -->
	<section class="mb-12">
		<h2 class="font-display text-xl font-medium text-text mb-4">Color tokens</h2>
		<p class="text-sm text-text-secondary mb-4">
			Dark-first with cream light mode. Orange accent for focus and success — not decoration.
			Destructive red is reserved for errors and irreversible actions.
		</p>
		<div class="grid gap-3 sm:grid-cols-2">
			{#each colorTokens as token}
				<div class="flex items-center gap-3 rounded-lg border border-border p-3 bg-[var(--field-bg)]">
					<div
						class="h-10 w-10 rounded-small border border-border flex-shrink-0"
						style:background={token.name === 'surface / bg-secondary'
							? 'var(--bg-secondary)'
							: token.name === 'field-bg'
								? 'var(--field-bg)'
								: `var(--${token.name})`}
					></div>
					<div>
						<p class="font-meta text-extrasmall uppercase tracking-wide text-text">{token.name}</p>
						<p class="text-sm text-text-secondary">{token.role}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Typography -->
	<section class="mb-12">
		<h2 class="font-display text-xl font-medium text-text mb-4">Typography</h2>
		<div class="space-y-6">
			<div>
				<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-2">
					font-display — headings and primary UI labels
				</p>
				<p class="font-display text-2xl font-medium text-text">Schedule a conversation</p>
			</div>
			<div>
				<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-2">
					font-serif — body and explanatory copy
				</p>
				<p class="font-serif text-text">
					A calendar invitation has been sent to your email address. Pick a time that works for you.
				</p>
			</div>
			<div>
				<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-2">
					font-meta — dates, durations, compact labels
				</p>
				<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary">
					Monday, September 9, 2026 · 30 minutes
				</p>
			</div>
		</div>
	</section>

	<!-- Spacing, radius, surfaces -->
	<section class="mb-12">
		<h2 class="font-display text-xl font-medium text-text mb-4">Spacing, radius, surfaces</h2>
		<div class="grid gap-4 sm:grid-cols-3 mb-6">
			<div class="rounded-large border border-border bg-[var(--field-bg)] p-gutter text-center text-sm text-text-secondary">
				p-gutter (20px)
			</div>
			<div class="rounded-large border border-border bg-[var(--field-bg)] p-6 text-center text-sm text-text-secondary">
				rounded-large
			</div>
			<div class="rounded-small border border-border bg-[var(--field-bg)] p-4 text-center text-sm text-text-secondary">
				rounded-small
			</div>
		</div>
		<div class="grid gap-4 sm:grid-cols-3">
			<PublicCard variant="plain">
				<p class="font-display font-medium text-text mb-1">Plain</p>
				<p class="text-sm text-text-secondary">No border — dissolves into page on mobile success screens.</p>
			</PublicCard>
			<PublicCard variant="outlined">
				<p class="font-display font-medium text-text mb-1">Outlined</p>
				<p class="text-sm text-text-secondary">Quiet border — default for detail panels.</p>
			</PublicCard>
			<PublicCard variant="raised">
				<p class="font-display font-medium text-text mb-1">Raised</p>
				<p class="text-sm text-text-secondary">Border plus shadow — emphasis without stacking grays.</p>
			</PublicCard>
		</div>
	</section>

	<!-- Links and actions -->
	<section class="mb-12">
		<h2 class="font-display text-xl font-medium text-text mb-4">Links and action hierarchy</h2>
		<p class="text-sm text-text-secondary mb-4">
			A link navigates or opens a resource. A button performs an in-place action or submits a form.
			Visual weight follows importance, but semantics do not change for styling.
		</p>
		<div class="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
			<TextLink href="#links" variant="default">Default link</TextLink>
			<TextLink href="#links" variant="muted">Muted link</TextLink>
			<TextLink href="#links" variant="danger">Danger link</TextLink>
		</div>
		<div class="flex flex-wrap items-center gap-4">
			<button
				type="button"
				class="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
			>
				Primary action
			</button>
			<button
				type="button"
				class="rounded-full border border-border bg-[var(--field-bg)] px-6 py-3 text-sm font-medium text-text transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
			>
				Secondary action
			</button>
			<button
				type="button"
				disabled
				class="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
			>
				Disabled
			</button>
		</div>
	</section>

	<!-- Notices -->
	<section class="mb-12">
		<h2 class="font-display text-xl font-medium text-text mb-4">Notices</h2>
		<p class="text-sm text-text-secondary mb-4">
			Neutral information is not red. Attention means notice-worthy, not yet an error. Danger is for
			failures and irreversible consequences.
		</p>
		<div class="space-y-4">
			<Notice variant="info">
				{#snippet heading()}Information{/snippet}
				Your selected time is still available. This is neutral context — ordinary surfaces and text.
			</Notice>
			<Notice variant="attention">
				{#snippet heading()}Attention{/snippet}
				This reschedule link expires in 24 hours. Worth noticing, but not an error.
			</Notice>
			<Notice variant="danger">
				{#snippet heading()}Error{/snippet}
				We could not create the calendar event. Please try again or contact the host.
			</Notice>
			<Notice variant="success">
				{#snippet heading()}Success{/snippet}
				Your meeting has been scheduled. A calendar invitation is on its way.
			</Notice>
		</div>
	</section>

	<!-- Status icons -->
	<section class="mb-12">
		<h2 class="font-display text-xl font-medium text-text mb-4">Status icons</h2>
		<p class="text-sm text-text-secondary mb-6">
			Large success icons use a transparent circular field with a 6px accent border — the approved
			confirmation treatment.
		</p>
		<div class="flex flex-wrap items-end gap-8">
			<div class="text-center">
				<StatusIcon variant="success" size="large" />
				<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mt-3">Success (large)</p>
			</div>
			<div class="text-center">
				<StatusIcon variant="attention" size="default" />
				<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mt-3">Attention</p>
			</div>
			<div class="text-center">
				<StatusIcon variant="danger" size="default" />
				<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mt-3">Danger</p>
			</div>
		</div>
	</section>

	<!-- Form controls -->
	<section class="mb-12">
		<h2 class="font-display text-xl font-medium text-text mb-4">Form controls</h2>
		<p class="text-sm text-text-secondary mb-4">
			16px minimum on inputs to prevent iOS zoom. Focus rings use the accent color.
		</p>
		<div class="max-w-md space-y-5">
			<div>
				<label for="ds-name" class="block text-sm font-medium text-text mb-2">Name</label>
				<input
					id="ds-name"
					type="text"
					placeholder="Jane Doe"
					class="w-full px-4 py-3 bg-[var(--field-bg)] border border-border rounded-lg text-text placeholder:text-text-secondary focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
				/>
			</div>
			<div>
				<label for="ds-email" class="block text-sm font-medium text-text mb-2">Email (focused example)</label>
				<input
					id="ds-email"
					type="email"
					value="jane@example.com"
					class="w-full px-4 py-3 bg-[var(--field-bg)] border border-accent rounded-lg text-text ring-2 ring-accent outline-none"
				/>
			</div>
			<div>
				<label for="ds-notes" class="block text-sm font-medium text-text mb-2">Notes (disabled)</label>
				<textarea
					id="ds-notes"
					rows="3"
					disabled
					placeholder="Optional context"
					class="w-full px-4 py-3 bg-[var(--field-bg)] border border-border rounded-lg text-text placeholder:text-text-secondary opacity-50 cursor-not-allowed resize-none"
				></textarea>
			</div>
		</div>
	</section>

	<!-- Booking summary example -->
	<section class="mb-12">
		<h2 class="font-display text-xl font-medium text-text mb-4">BookingSummary pattern</h2>
		<p class="text-sm text-text-secondary mb-4">
			Neutral detail surface for booking metadata in management flows (cancel, reschedule, proposals).
		</p>
		<div class="max-w-md">
			<BookingSummary title="Booking Details">
				<div class="space-y-4 text-sm">
					<div class="flex items-start gap-3">
						<svg class="w-5 h-5 text-text-secondary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
						</svg>
						<div>
							<p class="text-text">{formatTimeRange(sample.slot.start, sample.slot.end)}</p>
							<p class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mt-1">
								{formatSelectedDate(sample.date)}
							</p>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<svg class="w-5 h-5 text-text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
						</svg>
						<p class="text-text">Preview Attendee</p>
					</div>
				</div>
			</BookingSummary>
		</div>
	</section>

	<!-- Edge-state preview URLs -->
	<section class="mb-12">
		<h2 class="font-display text-xl font-medium text-text mb-4">Edge-state previews</h2>
		<p class="text-sm text-text-secondary mb-4">
			Deterministic loopback-only URLs. Full matrix:
			<code class="font-meta text-extrasmall">docs/VISUAL-QA-MATRIX.md</code>
		</p>
		<div class="space-y-2 text-sm text-text-secondary">
			<p>
				<span class="font-meta text-extrasmall uppercase tracking-wide text-text">Cancel</span> —
				<TextLink href="/cancel/{PREVIEW_BOOKING_ID}" class="!inline !px-1 !py-0">form</TextLink>,
				<TextLink href="/cancel/{PREVIEW_BOOKING_ID}?preview=success" class="!inline !px-1 !py-0">success</TextLink>
			</p>
			<p>
				<span class="font-meta text-extrasmall uppercase tracking-wide text-text">Reschedule</span> —
				<TextLink href="/reschedule/{PREVIEW_BOOKING_ID}" class="!inline !px-1 !py-0">form</TextLink>,
				<TextLink href="/reschedule/{PREVIEW_BOOKING_ID}?preview=success" class="!inline !px-1 !py-0">success</TextLink>
			</p>
			<p>
				<span class="font-meta text-extrasmall uppercase tracking-wide text-text">Proposal</span> —
				<TextLink href="/reschedule-response/{PREVIEW_PROPOSAL_TOKEN}" class="!inline !px-1 !py-0">pending</TextLink>,
				<TextLink href="/reschedule-response/{PREVIEW_PROPOSAL_TOKEN}?preview=accepted" class="!inline !px-1 !py-0">accepted</TextLink>
			</p>
			<p>
				<span class="font-meta text-extrasmall uppercase tracking-wide text-text">Error</span> —
				<TextLink href="/__preview/error/404" class="!inline !px-1 !py-0">404</TextLink>
			</p>
		</div>
	</section>

	<!-- BookingSuccess -->
	<section class="mb-12">
		<h2 class="font-display text-xl font-medium text-text mb-4">BookingSuccess pattern</h2>
		<p class="text-sm text-text-secondary mb-6">
			Approved confirmation composition with deterministic sample data — no real booking created.
		</p>
		<div class="flex justify-center">
			<BookingSuccess
				eventName="30-minute conversation"
				selectedDate={sample.date}
				selectedSlot={sample.slot}
				meetingUrl={PREVIEW_MEETING_URL}
				meetingType="zoom"
				bookingId={PREVIEW_BOOKING_ID}
				brandColor={accentColor}
				{formatTimeRange}
				{formatSelectedDate}
			/>
		</div>
	</section>

	<!-- Page shell widths -->
	<section class="mb-12">
		<h2 class="font-display text-xl font-medium text-text mb-4">Page shell widths</h2>
		<div class="space-y-3 text-sm text-text-secondary">
			<p><span class="font-meta text-extrasmall uppercase tracking-wide text-text">narrow</span> — max-w-md · singular outcomes, confirmations</p>
			<p><span class="font-meta text-extrasmall uppercase tracking-wide text-text">booking</span> — max-w-2xl · standard booking and management forms</p>
			<p><span class="font-meta text-extrasmall uppercase tracking-wide text-text">wide</span> — max-w-4xl · this catalog page</p>
		</div>
	</section>

	<!-- Existing patterns inventory -->
	<section class="mb-8">
		<h2 class="font-display text-xl font-medium text-text mb-4">Existing public patterns</h2>
		<p class="text-sm text-text-secondary mb-4">
			Domain components not yet migrated to primitives. Catalog only — live widgets need application state.
		</p>
		<div class="overflow-x-auto">
			<table class="w-full text-sm text-left border-collapse">
				<thead>
					<tr class="border-b border-border">
						<th class="font-display font-medium text-text py-2 pr-4">Component</th>
						<th class="font-display font-medium text-text py-2 pr-4">Location</th>
						<th class="font-display font-medium text-text py-2">Used in</th>
					</tr>
				</thead>
				<tbody class="text-text-secondary">
					{#each existingPatterns as pattern}
						<tr class="border-b border-border">
							<td class="py-2 pr-4 font-medium text-text">{pattern.name}</td>
							<td class="py-2 pr-4 font-meta text-extrasmall">{pattern.path}</td>
							<td class="py-2">{pattern.used}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<!-- Other design systems -->
	<section class="mb-8">
		<h2 class="font-display text-xl font-medium text-text mb-4">Other systems</h2>
		<a
			href="/design-system/dashboard"
			class="inline-flex items-center gap-2 rounded-lg border border-border bg-[var(--field-bg)] px-4 py-3 text-sm text-text hover:border-accent transition-colors"
		>
			<span class="font-display font-medium">Dashboard Design System →</span>
		</a>
	</section>

	<footer class="border-t border-border pt-6 text-sm text-text-secondary">
		<p>
			Contract: <code class="font-meta text-extrasmall">docs/DESIGN.md</code> · Tokens:
			<code class="font-meta text-extrasmall">src/app.css</code>
		</p>
	</footer>
</PublicPageShell>
