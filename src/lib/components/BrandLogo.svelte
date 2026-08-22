<script lang="ts">
	interface Props {
		class?: string;
		imageClass?: string;
	}

	let { class: className = '', imageClass = 'h-[68px] w-[69px]' }: Props = $props();
</script>

<a
	href="https://alabut.com"
	class={`inline-block rounded-small leading-none transition-transform hover:scale-90 ${className}`}
	aria-label="Visit alabut.com"
>
	<picture>
		<source
			media="(prefers-color-scheme: light)"
			srcset="https://s3.amazonaws.com/alabut.com/images/writing/logos/logo-small-light-mode.png 1x,
				https://s3.amazonaws.com/alabut.com/images/writing/logos/logo-small-light-mode@2x.png 2x,
				https://s3.amazonaws.com/alabut.com/images/writing/logos/logo-small-light-mode@3x.png 3x"
		/>
		<img
			src="https://images.alabut.com/writing/logo-sega-monogram-bordered-white.png"
			srcset="https://images.alabut.com/writing/logo-sega-monogram-bordered-white.png 1x,
				https://images.alabut.com/writing/logo-sega-monogram-bordered-white@2x.png 2x,
				https://images.alabut.com/writing/logo-sega-monogram-bordered-white@3x.png 3x"
			width="69"
			height="68"
			alt="Al Abut"
			class={`block ${imageClass}`}
		/>
	</picture>
</a>
