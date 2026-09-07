<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		class?: string;
		children: Snippet;
	}

	let { title, class: className = '', children }: Props = $props();
</script>

<div class="rounded-lg border border-border bg-[var(--field-bg)] p-4 sm:p-6 {className}">
	{#if title}
		<h2 class="font-meta text-extrasmall uppercase tracking-wide text-text-secondary mb-4">
			{title}
		</h2>
	{/if}
	{@render children()}
</div>
