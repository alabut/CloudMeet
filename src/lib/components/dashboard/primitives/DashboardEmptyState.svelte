<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		icon?: Snippet;
		action?: Snippet;
		class?: string;
	}

	let { title, description, icon, action, class: className = '' }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center text-center py-12 px-4 {className}">
	{#if icon}
		<div class="text-dash-text-secondary mb-4">
			{@render icon()}
		</div>
	{/if}
	<h3 class="font-display font-medium text-dash-text mb-2">{title}</h3>
	{#if description}
		<p class="text-sm text-dash-text-secondary max-w-xs mb-6">{description}</p>
	{/if}
	{#if action}
		<div>
			{@render action()}
		</div>
	{/if}
</div>
