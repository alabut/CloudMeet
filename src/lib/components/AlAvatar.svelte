<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<picture>
	<source srcset="https://images.alabut.com/splash/al-in-Maui7-square.webp" type="image/webp" />
	<img
		src="https://images.alabut.com/splash/al-in-Maui7-square.jpg"
		alt="Al Abut"
		width="150"
		height="150"
		class={`rounded-full object-cover ${className}`}
	/>
</picture>
