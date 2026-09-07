<script lang="ts">
	type Size = 'sm' | 'md';

	interface Props {
		'aria-label': string;
		size?: Size;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		href?: string;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children: import('svelte').Snippet;
	}

	let {
		'aria-label': ariaLabel,
		size = 'md',
		type = 'button',
		disabled = false,
		href,
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const sizeClasses: Record<Size, string> = {
		sm: 'w-7 h-7 text-xs',
		md: 'w-8 h-8 text-sm'
	};

	const base =
		'inline-flex items-center justify-center rounded-md text-dash-text-secondary hover:text-dash-text hover:bg-dash-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent focus-visible:ring-offset-1 focus-visible:ring-offset-dash-bg disabled:opacity-50 disabled:cursor-not-allowed';
	const classes = $derived(`${base} ${sizeClasses[size]} ${className}`);
</script>

{#if href && !disabled}
	<a {href} aria-label={ariaLabel} class={classes}>
		{@render children()}
	</a>
{:else if href && disabled}
	<span class="{classes} pointer-events-none" aria-label={ariaLabel} aria-disabled="true" tabindex="-1">
		{@render children()}
	</span>
{:else}
	<button {type} {disabled} {onclick} aria-label={ariaLabel} class={classes}>
		{@render children()}
	</button>
{/if}
