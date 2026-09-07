<script lang="ts">
	import type { Snippet } from 'svelte';

	type Layout = 'centered' | 'document';
	type Width = 'narrow' | 'booking' | 'wide';

	interface Props {
		layout?: Layout;
		width?: Width;
		class?: string;
		children: Snippet;
	}

	let { layout = 'document', width = 'booking', class: className = '', children }: Props = $props();

	const layoutClasses: Record<Layout, string> = {
		centered: 'min-h-screen flex flex-col items-center justify-center p-gutter',
		document: 'min-h-screen py-10 sm:py-12 p-gutter'
	};

	const widthClasses: Record<Width, string> = {
		narrow: 'max-w-md w-full mx-auto',
		booking: 'max-w-2xl w-full mx-auto',
		wide: 'max-w-4xl w-full mx-auto'
	};
</script>

<div class="public-flow bg-bg text-text font-serif {layoutClasses[layout]}">
	<div class="{widthClasses[width]} {className}">
		{@render children()}
	</div>
</div>
