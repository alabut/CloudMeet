<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'default' | 'muted' | 'danger';

	interface Props {
		href: string;
		variant?: Variant;
		underline?: boolean;
		class?: string;
		target?: string;
		rel?: string;
		children: Snippet;
	}

	let {
		href,
		variant = 'default',
		underline = true,
		class: className = '',
		target,
		rel,
		children
	}: Props = $props();

	const variantClasses: Record<Variant, string> = {
		default: 'text-accent hover:text-accent-hover',
		muted: 'text-text-secondary hover:text-text',
		danger: 'text-red-400 hover:text-red-300'
	};

	const baseClasses =
		'inline-block py-2.5 px-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm';
</script>

<a
	{href}
	{target}
	{rel}
	class="{baseClasses} {variantClasses[variant]} {underline ? 'link-underline' : ''} {className}"
>
	{@render children()}
</a>
