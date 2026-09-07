<script lang="ts">
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		size?: Size;
		label?: string;
		class?: string;
	}

	let { size = 'md', label = 'Loading…', class: className = '' }: Props = $props();

	const sizeClasses: Record<Size, string> = {
		sm: 'w-4 h-4 border-2',
		md: 'w-6 h-6 border-2',
		lg: 'w-8 h-8 border-[3px]'
	};
</script>

<span role="status" aria-label={label} class="inline-flex {className}">
	<span
		class="rounded-full border-dash-border border-t-dash-accent animate-spin {sizeClasses[size]}"
		aria-hidden="true"
	></span>
	<span class="sr-only">{label}</span>
</span>
