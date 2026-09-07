<script lang="ts">
	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md';

	interface Props {
		variant?: Variant;
		size?: Size;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		href?: string;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children: import('svelte').Snippet;
	}

	let {
		variant = 'secondary',
		size = 'md',
		type = 'button',
		disabled = false,
		href,
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const variantClasses: Record<Variant, string> = {
		primary:
			'bg-dash-accent text-white hover:bg-dash-accent-hover focus-visible:ring-dash-accent disabled:opacity-50',
		secondary:
			'bg-dash-surface border border-dash-border text-dash-text hover:border-dash-accent focus-visible:ring-dash-accent disabled:opacity-50',
		ghost:
			'bg-transparent text-dash-text hover:bg-dash-surface focus-visible:ring-dash-accent disabled:opacity-50',
		danger:
			'bg-dash-danger-surface border border-dash-danger-border text-dash-danger hover:bg-dash-danger/20 focus-visible:ring-dash-danger disabled:opacity-50'
	};

	const sizeClasses: Record<Size, string> = {
		sm: 'px-3 py-1.5 text-xs',
		md: 'px-4 py-2 text-sm'
	};

	const base =
		'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dash-bg cursor-pointer disabled:cursor-not-allowed';
	const classes = $derived(`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`);
</script>

{#if href && !disabled}
	<a {href} class={classes}>
		{@render children()}
	</a>
{:else if href && disabled}
	<span class="{classes} pointer-events-none" aria-disabled="true" tabindex="-1">
		{@render children()}
	</span>
{:else}
	<button {type} {disabled} {onclick} class={classes}>
		{@render children()}
	</button>
{/if}
