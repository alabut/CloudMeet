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
		plain: 'bg-bg',
		outlined: 'bg-bg border border-border rounded-large',
		raised: 'bg-bg border border-border rounded-large shadow-lg'
	};
</script>

<div class="{variantClasses[variant]} p-6 sm:p-8 {className}">
	{@render children()}
</div>
