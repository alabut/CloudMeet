<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'info' | 'attention' | 'danger' | 'success';

	interface Props {
		variant?: Variant;
		heading?: Snippet;
		children?: Snippet;
		class?: string;
	}

	let { variant = 'info', heading, children, class: className = '' }: Props = $props();

	const variantClasses: Record<Variant, string> = {
		info: 'bg-[var(--field-bg)] border-border text-text',
		attention: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
		danger: 'bg-red-500/10 border-red-500/30 text-red-400',
		success: 'bg-accent/10 border-accent/30 text-accent'
	};
</script>

<div
	class="rounded-large border p-4 {variantClasses[variant]} {className}"
	role={variant === 'danger' ? 'alert' : 'status'}
>
	{#if heading}
		<div class="font-display font-medium mb-1">
			{@render heading()}
		</div>
	{/if}
	{#if children}
		<div class="text-sm">
			{@render children()}
		</div>
	{/if}
</div>
