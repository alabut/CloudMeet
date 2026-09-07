<!--
  Localhost-only visual QA and learning surface — not part of the public product.
  The server loader returns 404 unless the hostname is loopback.
-->
<script lang="ts">
	import {
		DashboardPageShell,
		DashboardHeader,
		DashboardSection,
		DashboardCard,
		DashboardButton,
		DashboardField,
		DashboardNotice,
		DashboardStatusBadge,
		DashboardEmptyState,
		DashboardIconButton,
		DashboardToggle,
		DashboardDialog,
		DashboardSpinner
	} from '$lib/components/dashboard';

	// Dialog demo state
	let demoDialogOpen = $state(false);
	let toggleChecked = $state(true);

	const colorTokens = [
		{ name: '--dash-bg', role: 'Page canvas' },
		{ name: '--dash-surface', role: 'Card / panel surface' },
		{ name: '--dash-surface-raised', role: 'Elevated surface, modals' },
		{ name: '--dash-field', role: 'Form input background' },
		{ name: '--dash-text', role: 'Primary content' },
		{ name: '--dash-text-secondary', role: 'Supporting copy and metadata' },
		{ name: '--dash-border', role: 'Quiet structure' },
		{ name: '--dash-accent', role: 'Primary action, focus, success' },
		{ name: '--dash-accent-hover', role: 'Interactive hover emphasis' }
	];

	const previewRoutes = [
		{ label: 'Overview', states: ['connected', 'warning', 'empty', 'loading', 'error'], base: '/__preview/dashboard/overview' },
		{ label: 'Event type', states: ['new', 'edit'], base: '/__preview/dashboard/event-type' },
		{ label: 'Availability', states: ['(default)'], base: '/__preview/dashboard/availability' },
		{ label: 'Calendars', states: ['connected', 'disconnected'], base: '/__preview/dashboard/calendars' },
		{ label: 'Emails', states: ['default', 'loading'], base: '/__preview/dashboard/emails' },
		{ label: 'Cancel modal', states: ['form', 'error'], base: '/__preview/dashboard/cancel-modal' },
		{ label: 'Reschedule modal', states: ['form', 'selected', 'loading', 'empty'], base: '/__preview/dashboard/reschedule-modal' }
	];
</script>

<svelte:head>
	<title>Dashboard Design System — CloudMeet (localhost)</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<DashboardPageShell>
	<DashboardHeader title="Dashboard Design System" subtitle="Tokens, primitives, and preview routes for the management UI">
		{#snippet actions()}
			<DashboardButton variant="ghost" size="sm" href="/design-system">← Public system</DashboardButton>
		{/snippet}
	</DashboardHeader>

	<div class="px-4 sm:px-6 py-6 max-w-4xl space-y-12">

		<!-- Color tokens -->
		<DashboardSection
			heading="Color tokens"
			description="Dark-first with cream light mode. Set on .dashboard-flow, referenced via dash-* Tailwind utilities."
		>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each colorTokens as token}
					<div class="flex items-center gap-3 rounded-lg border border-dash-border bg-dash-surface p-3">
						<div
							class="w-9 h-9 rounded border border-dash-border flex-shrink-0"
							style:background="var({token.name})"
						></div>
						<div>
							<p class="font-meta text-xs uppercase tracking-wide text-dash-text">{token.name}</p>
							<p class="text-xs text-dash-text-secondary">{token.role}</p>
						</div>
					</div>
				{/each}
			</div>
		</DashboardSection>

		<!-- Typography -->
		<DashboardSection heading="Typography">
			<div class="space-y-6">
				<div>
					<p class="font-meta text-xs uppercase tracking-wide text-dash-text-secondary mb-2">font-display — headings and UI labels</p>
					<p class="font-display text-xl font-medium text-dash-text">Manage your calendar and events</p>
				</div>
				<div>
					<p class="font-meta text-xs uppercase tracking-wide text-dash-text-secondary mb-2">font-serif — detail and descriptive copy</p>
					<p class="font-serif text-dash-text">Set your availability windows to let people book time with you automatically.</p>
				</div>
				<div>
					<p class="font-meta text-xs uppercase tracking-wide text-dash-text-secondary mb-2">font-meta — timestamps, IDs, metadata labels</p>
					<p class="font-meta text-xs uppercase tracking-wide text-dash-text-secondary">Monday, Sep 12 · 2:00 PM · 30 min · bk-001</p>
				</div>
			</div>
		</DashboardSection>

		<!-- Cards -->
		<DashboardSection heading="DashboardCard variants">
			<div class="grid gap-4 sm:grid-cols-3">
				<DashboardCard variant="plain">
					<p class="font-display font-medium text-sm text-dash-text mb-1">Plain</p>
					<p class="text-xs text-dash-text-secondary">No border — dissolves into page.</p>
				</DashboardCard>
				<DashboardCard variant="outlined">
					<p class="font-display font-medium text-sm text-dash-text mb-1">Outlined</p>
					<p class="text-xs text-dash-text-secondary">Quiet border — default for panels.</p>
				</DashboardCard>
				<DashboardCard variant="raised">
					<p class="font-display font-medium text-sm text-dash-text mb-1">Raised</p>
					<p class="text-xs text-dash-text-secondary">Border + shadow — emphasis.</p>
				</DashboardCard>
			</div>
		</DashboardSection>

		<!-- Buttons -->
		<DashboardSection heading="DashboardButton variants and sizes">
			<div class="space-y-4">
				<div class="flex flex-wrap items-center gap-3">
					<DashboardButton variant="primary">Primary</DashboardButton>
					<DashboardButton variant="secondary">Secondary</DashboardButton>
					<DashboardButton variant="ghost">Ghost</DashboardButton>
					<DashboardButton variant="danger">Danger</DashboardButton>
					<DashboardButton variant="primary" disabled>Disabled</DashboardButton>
				</div>
				<div class="flex flex-wrap items-center gap-3">
					<DashboardButton variant="primary" size="sm">Primary sm</DashboardButton>
					<DashboardButton variant="secondary" size="sm">Secondary sm</DashboardButton>
					<DashboardButton variant="ghost" size="sm">Ghost sm</DashboardButton>
					<DashboardButton variant="danger" size="sm">Danger sm</DashboardButton>
				</div>
			</div>
		</DashboardSection>

		<!-- Icon button -->
		<DashboardSection heading="DashboardIconButton">
			<div class="flex items-center gap-3">
				<DashboardIconButton aria-label="Edit">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
				</DashboardIconButton>
				<DashboardIconButton aria-label="Delete">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
				</DashboardIconButton>
				<DashboardIconButton aria-label="Settings" size="sm">
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</DashboardIconButton>
			</div>
		</DashboardSection>

		<!-- Fields -->
		<DashboardSection heading="DashboardField variants">
			<div class="max-w-sm space-y-4">
				<DashboardField label="Text input" placeholder="Enter value" />
				<DashboardField label="With hint" placeholder="your-slug" hint="Used in your booking URL." />
				<DashboardField label="With error" placeholder="Email" error="Please enter a valid email address." />
				<DashboardField label="Textarea" kind="textarea" placeholder="Optional notes…" rows={3} />
				<DashboardField label="Select" kind="select">
					<option>Option A</option>
					<option>Option B</option>
					<option>Option C</option>
				</DashboardField>
				<DashboardField label="Disabled" placeholder="Cannot edit" disabled />
			</div>
		</DashboardSection>

		<!-- Notices -->
		<DashboardSection heading="DashboardNotice variants">
			<div class="space-y-3">
				<DashboardNotice variant="info">
					{#snippet heading()}Info{/snippet}
					Neutral context. Not an error, not a warning — just helpful.
				</DashboardNotice>
				<DashboardNotice variant="attention">
					{#snippet heading()}Attention{/snippet}
					Worth noticing. Google Calendar connection expires in 3 days.
				</DashboardNotice>
				<DashboardNotice variant="danger">
					{#snippet heading()}Error{/snippet}
					Could not sync calendar. Check your connection and try again.
				</DashboardNotice>
				<DashboardNotice variant="success">
					{#snippet heading()}Success{/snippet}
					Calendar connected. New bookings will sync automatically.
				</DashboardNotice>
			</div>
		</DashboardSection>

		<!-- Status badges -->
		<DashboardSection heading="DashboardStatusBadge variants">
			<div class="flex flex-wrap gap-3">
				<DashboardStatusBadge variant="neutral">neutral</DashboardStatusBadge>
				<DashboardStatusBadge variant="success">confirmed</DashboardStatusBadge>
				<DashboardStatusBadge variant="attention">pending</DashboardStatusBadge>
				<DashboardStatusBadge variant="danger">cancelled</DashboardStatusBadge>
			</div>
		</DashboardSection>

		<!-- Toggle -->
		<DashboardSection heading="DashboardToggle">
			<div class="space-y-4 max-w-sm">
				<DashboardToggle
					label="Active"
					description="Visible on your public booking page"
					bind:checked={toggleChecked}
				/>
				<DashboardToggle label="Disabled on" checked={true} disabled />
				<DashboardToggle label="Disabled off" checked={false} disabled />
			</div>
		</DashboardSection>

		<!-- Spinner -->
		<DashboardSection heading="DashboardSpinner sizes">
			<div class="flex items-center gap-6">
				<div class="text-center">
					<DashboardSpinner size="sm" />
					<p class="font-meta text-xs uppercase tracking-wide text-dash-text-secondary mt-2">sm</p>
				</div>
				<div class="text-center">
					<DashboardSpinner size="md" />
					<p class="font-meta text-xs uppercase tracking-wide text-dash-text-secondary mt-2">md</p>
				</div>
				<div class="text-center">
					<DashboardSpinner size="lg" />
					<p class="font-meta text-xs uppercase tracking-wide text-dash-text-secondary mt-2">lg</p>
				</div>
			</div>
		</DashboardSection>

		<!-- Empty state -->
		<DashboardSection heading="DashboardEmptyState">
			<DashboardCard variant="outlined">
				<DashboardEmptyState
					title="No event types yet"
					description="Create your first event type to start accepting bookings."
				>
					{#snippet icon()}
						<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
						</svg>
					{/snippet}
					{#snippet action()}
						<DashboardButton variant="primary">Create event type</DashboardButton>
					{/snippet}
				</DashboardEmptyState>
			</DashboardCard>
		</DashboardSection>

		<!-- Dialog -->
		<DashboardSection heading="DashboardDialog">
			<DashboardButton variant="secondary" onclick={() => (demoDialogOpen = true)}>
				Open dialog
			</DashboardButton>
			<DashboardDialog bind:open={demoDialogOpen} title="Example dialog">
				<p class="text-sm text-dash-text-secondary mb-5">
					This dialog has role=dialog, aria-modal, aria-labelledby, focus trap (Tab/Shift+Tab), and Escape to close.
				</p>
				<div class="flex justify-end gap-2">
					<DashboardButton variant="ghost" onclick={() => (demoDialogOpen = false)}>Cancel</DashboardButton>
					<DashboardButton variant="primary" onclick={() => (demoDialogOpen = false)}>Confirm</DashboardButton>
				</div>
			</DashboardDialog>
		</DashboardSection>

		<!-- Preview routes index -->
		<DashboardSection heading="Preview routes" description="Loopback-only deterministic fixtures. No auth, D1, or API calls.">
			<div class="space-y-3">
				{#each previewRoutes as route}
					<DashboardCard variant="outlined">
						<p class="font-display font-medium text-sm text-dash-text mb-2">{route.label}</p>
						<div class="flex flex-wrap gap-2">
							{#each route.states as s}
								{@const href = s === '(default)' ? route.base : `${route.base}?preview=${s}`}
								<a
									{href}
									class="px-2 py-0.5 rounded border border-dash-border text-xs font-meta uppercase tracking-wide text-dash-text-secondary hover:text-dash-text hover:border-dash-accent transition-colors"
								>
									{s}
								</a>
							{/each}
						</div>
					</DashboardCard>
				{/each}
			</div>
		</DashboardSection>

		<footer class="border-t border-dash-border pt-6 text-xs text-dash-text-secondary pb-8">
			<p>
				Tokens: <code class="font-meta">src/app.css .dashboard-flow</code> ·
				Primitives: <code class="font-meta">src/lib/components/dashboard/primitives/</code>
			</p>
		</footer>
	</div>
</DashboardPageShell>
