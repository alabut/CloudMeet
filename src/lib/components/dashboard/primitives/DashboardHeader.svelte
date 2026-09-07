<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		subtitle?: string;
		backHref?: string;
		backLabel?: string;
		actions?: Snippet;
		class?: string;
	}

	let { title, subtitle, backHref, backLabel = 'Back', actions, class: className = '' }: Props =
		$props();
</script>

<header class="border-b border-dash-border bg-dash-surface px-4 sm:px-6 py-4 {className}">
	<div class="flex items-start justify-between gap-4">
		<div class="min-w-0">
			{#if backHref}
				<a
					href={backHref}
					class="inline-flex items-center gap-1 text-xs font-meta uppercase tracking-wide text-dash-text-secondary hover:text-dash-text transition-colors mb-2"
				>
					<svg
						class="w-3 h-3"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					{backLabel}
				</a>
			{/if}
			<h1 class="font-display font-medium text-lg sm:text-xl text-dash-text truncate">{title}</h1>
			{#if subtitle}
				<p class="text-sm text-dash-text-secondary mt-0.5">{subtitle}</p>
			{/if}
		</div>
		{#if actions}
			<div class="flex flex-wrap items-center justify-end gap-2 flex-shrink-0 max-w-full">
				{@render actions()}
			</div>
		{/if}
	</div>
</header>
