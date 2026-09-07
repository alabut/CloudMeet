<script lang="ts">
	type Variant = 'success' | 'attention' | 'danger';
	type Size = 'default' | 'large';

	interface Props {
		variant: Variant;
		size?: Size;
	}

	let { variant, size = 'default' }: Props = $props();

	const outerSizeClasses: Record<Size, string> = {
		default: 'h-10 w-10 border-2',
		large: 'h-24 w-24 border-[6px] sm:h-28 sm:w-28'
	};

	const iconSizeClasses: Record<Size, string> = {
		default: 'h-5 w-5',
		large: 'h-16 w-16 sm:h-20 sm:w-20'
	};

	const variantClasses: Record<Variant, string> = {
		success: 'border-accent text-accent',
		attention: 'border-amber-500 text-amber-500',
		danger: 'border-red-500 text-red-500'
	};
</script>

<div
	class="flex items-center justify-center rounded-full bg-transparent {outerSizeClasses[size]} {variantClasses[variant]}"
	aria-hidden="true"
>
	{#if variant === 'success'}
		<svg class="{iconSizeClasses[size]}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
		</svg>
	{:else if variant === 'attention'}
		<svg class="{iconSizeClasses[size]}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			></path>
		</svg>
	{:else}
		<svg class="{iconSizeClasses[size]}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
		</svg>
	{/if}
</div>
