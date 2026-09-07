<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'plain' | 'outlined' | 'raised';

	interface Props {
		variant?: Variant;
		class?: string;
		children: Snippet;
	}

	let { variant = 'outlined', class: className = '', children }: Props = $props();

	const variantClasses: Record<Variant, string> = {
		plain: 'bg-dash-surface',
		outlined: 'bg-dash-surface border border-dash-border rounded-lg',
		raised: 'bg-dash-surface-raised border border-dash-border rounded-lg shadow-lg'
	};
</script>

<div class="{variantClasses[variant]} p-4 sm:p-5 {className}">
	{@render children()}
</div>
