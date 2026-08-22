<script lang="ts">
	import AlAvatar from '$lib/components/AlAvatar.svelte';
	import BrandLogo from '$lib/components/BrandLogo.svelte';

	interface Props {
		profileImage?: string | null;
		name?: string;
	}

	let { profileImage = null, name = 'Al Abut' }: Props = $props();
</script>

<section class="relative w-full max-w-[920px] px-6 pt-6 pb-7 text-center md:px-0 md:pt-0 md:pb-8 md:text-left">
	<BrandLogo
		class="absolute right-0 top-0 hidden md:block"
		imageClass="h-10 w-auto"
	/>

	<div class="flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-7 md:pr-20">
		{#if profileImage}
			<img
				src={profileImage}
				alt={name}
				width="150"
				height="150"
				class="h-20 w-20 shrink-0 rounded-full border-4 border-bg object-cover shadow-lg md:h-28 md:w-28"
			/>
		{:else}
			<AlAvatar class="h-20 w-20 shrink-0 border-4 border-bg shadow-lg md:h-28 md:w-28" />
		{/if}

		<div class="max-w-2xl">
			<h1 class="font-display text-3xl font-medium leading-tight text-text md:mt-0 md:text-4xl">{name}</h1>
			<p class="mt-1 font-display text-lg italic text-text md:text-xl">Product Designer &amp; Startup Leader</p>
			<p class="mt-3 text-sm leading-relaxed text-text-secondary md:text-base">
				Cofounder backed by Y Combinator, NEA, and 500 Startups. Founding designer at companies acquired by E-Trade, Groupon, Rubicon, and FARO.
			</p>
			<nav class="mt-3 flex justify-center gap-4 font-meta text-extrasmall uppercase tracking-wide md:justify-start" aria-label="Al Abut links">
				<a class="text-accent hover:text-accent-hover" href="https://alabut.com/">Work</a>
				<a class="text-accent hover:text-accent-hover" href="https://alabut.com/writing">Writing</a>
				<a class="text-accent hover:text-accent-hover" href="https://alabut.com/photos">Photos</a>
			</nav>
		</div>
	</div>
</section>
