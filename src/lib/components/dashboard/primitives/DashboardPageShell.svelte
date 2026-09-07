<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="dashboard-flow min-h-screen bg-dash-bg text-dash-text {className}">
	{@render children()}
</div>
