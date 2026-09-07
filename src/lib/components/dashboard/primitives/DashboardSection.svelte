<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		heading?: string;
		description?: string;
		class?: string;
		children: Snippet;
	}

	let { heading, description, class: className = '', children }: Props = $props();
</script>

<section class="py-4 sm:py-6 {className}">
	{#if heading}
		<div class="mb-4">
			<h2 class="font-display font-medium text-base text-dash-text">{heading}</h2>
			{#if description}
				<p class="text-sm text-dash-text-secondary mt-1">{description}</p>
			{/if}
		</div>
	{/if}
	{@render children()}
</section>
