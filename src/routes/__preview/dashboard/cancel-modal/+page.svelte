<script lang="ts">
	import type { PageData } from './$types';
	import {
		DashboardPageShell,
		DashboardHeader,
		DashboardButton,
		CancelBookingModal
	} from '$lib/components/dashboard';
	import { CANCEL_MODAL_PREVIEW_STATES } from '$lib/preview/sampleDashboard';

	let { data }: { data: PageData } = $props();
	const previewState = $derived(data.state);
	const fixture = $derived(data.fixture);

	let showModal = $state(true);

	function closeModal() {
		showModal = false;
	}

	async function noopCancel() {}
</script>

<svelte:head>
	<title>Preview: Cancel Modal ({previewState}) — CloudMeet</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<DashboardPageShell>
	<DashboardHeader title="Cancel modal preview" />

	<div class="px-4 sm:px-6 py-4">
		<nav class="flex gap-2 mb-6" aria-label="Preview states">
			{#each CANCEL_MODAL_PREVIEW_STATES as s}
				<a
					href="?preview={s}"
					class="px-2.5 py-1 rounded text-xs font-meta uppercase tracking-wide transition-colors
						{previewState === s
						? 'bg-dash-accent text-white'
						: 'bg-dash-surface border border-dash-border text-dash-text-secondary hover:text-dash-text'}"
				>
					{s}
				</a>
			{/each}
		</nav>

		<DashboardButton variant="primary" onclick={() => (showModal = true)}>
			Open cancel dialog
		</DashboardButton>
	</div>

	<CancelBookingModal
		booking={fixture}
		show={showModal}
		onClose={closeModal}
		onCancel={noopCancel}
		inert
		previewError={previewState === 'error' ? 'Something went wrong. Please try again.' : null}
	/>
</DashboardPageShell>
