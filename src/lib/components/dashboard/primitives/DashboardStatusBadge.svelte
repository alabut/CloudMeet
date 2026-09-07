<script lang="ts">
	type Variant = 'neutral' | 'success' | 'attention' | 'danger';

	interface Props {
		variant?: Variant;
		class?: string;
		children: import('svelte').Snippet;
	}

	let { variant = 'neutral', class: className = '', children }: Props = $props();

	const variantClasses: Record<Variant, string> = {
		neutral: 'bg-dash-surface border border-dash-border text-dash-text-secondary',
		success: 'bg-[var(--dash-accent)]/10 border-[var(--dash-accent)]/20 text-[var(--dash-accent)]',
		attention: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
		danger: 'bg-red-500/10 border-red-500/20 text-red-400'
	};
</script>

<span
	class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-meta uppercase tracking-wide border {variantClasses[variant]} {className}"
>
	{@render children()}
</span>
