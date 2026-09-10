<script lang="ts">
	import AlAvatar from '$lib/components/AlAvatar.svelte';
	import BrandLogo from '$lib/components/BrandLogo.svelte';

	interface Props {
		profileImage?: string | null;
		name?: string;
	}

	let { profileImage = null, name = 'Al Abut' }: Props = $props();
</script>

<section class="relative w-full max-w-[920px] px-6 pt-12 pb-5 text-center md:px-0 md:pt-0 md:pb-8 md:text-left">
	<BrandLogo
		class="absolute right-0 top-0 hidden md:block"
		imageClass="h-10 w-auto"
	/>

	<div class="flex flex-col items-center gap-3 md:flex-row md:items-start md:gap-7 md:pr-20">
		<a
			href="https://alabut.com/"
			class="group block shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
			aria-label="Visit Al Abut's website"
		>
			{#if profileImage}
				<img
					src={profileImage}
					alt={name}
					width="150"
					height="150"
					class="h-28 w-28 rounded-full border-4 border-transparent object-cover shadow-lg transition-colors group-hover:border-white md:h-32 md:w-32"
				/>
			{:else}
				<AlAvatar class="h-28 w-28 border-4 border-transparent shadow-lg transition-colors group-hover:border-white md:h-32 md:w-32" />
			{/if}
		</a>

		<div class="max-w-2xl">
			<h1 class="font-display text-4xl font-medium leading-tight text-text md:text-4xl" style="margin-top: 0">{name}</h1>
			<p class="mt-1 font-display text-xl italic text-text md:text-xl">Product Designer &amp; Startup Leader</p>
			<p class="mt-3 flex flex-col gap-1 leading-relaxed text-text md:text-base">
				<span>Cofounder backed by Y Combinator, NEA, and 500 Startups.</span>
				<span>Founding designer at companies acquired by E-Trade, Groupon, Rubicon, and FARO.</span>
			</p>
		</div>
	</div>
</section>
