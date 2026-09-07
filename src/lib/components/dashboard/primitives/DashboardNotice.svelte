<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'info' | 'attention' | 'danger' | 'success';

	interface Props {
		variant?: Variant;
		heading?: Snippet;
		children?: Snippet;
		class?: string;
		live?: boolean;
	}

	let { variant = 'info', heading, children, class: className = '', live = false }: Props = $props();

	const variantClasses: Record<Variant, string> = {
		info: 'bg-[var(--dash-field)] border-dash-border text-dash-text',
		attention: 'bg-dash-attention-surface border-dash-attention-border text-dash-attention',
		danger: 'bg-dash-danger-surface border-dash-danger-border text-dash-danger',
		success: 'bg-[var(--dash-accent)]/10 border-[var(--dash-accent)]/30 text-[var(--dash-accent)]'
	};
</script>

<div
	class="rounded-lg border p-3 {variantClasses[variant]} {className}"
	role={variant === 'danger' ? 'alert' : undefined}
	aria-live={live ? 'polite' : undefined}
>
	{#if heading}
		<div class="font-display font-medium text-sm mb-1">
			{@render heading()}
		</div>
	{/if}
	{#if children}
		<div class="text-sm">
			{@render children()}
		</div>
	{/if}
</div>
