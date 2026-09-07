<script lang="ts">
	import { page } from '$app/stores';
	import { PublicPageShell, PublicCard, TextLink, StatusIcon } from '$lib/components/public';

	const status = $derived($page.status);
	const isServerError = $derived(status >= 500);

	const title = $derived.by(() => {
		if (status === 404) return 'Page not found';
		if (status === 400) return 'Invalid request';
		if (isServerError) return 'Something went wrong';
		return 'Unexpected error';
	});

	const message = $derived.by(() => {
		if (status === 404) {
			return 'The page you are looking for does not exist or may have moved.';
		}
		if (status === 400) {
			return 'This request could not be processed. Check the link and try again.';
		}
		if (isServerError) {
			return 'We ran into a problem on our end. Please try again in a moment.';
		}
		return 'Something unexpected happened. Please try again.';
	});

	const iconVariant = $derived(status === 400 || isServerError ? 'danger' : 'attention');
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<PublicPageShell layout="centered" width="narrow">
	<PublicCard variant="plain" class="text-center sm:border sm:border-border sm:shadow-lg">
		<div class="mx-auto mb-4 sm:mb-5 flex justify-center">
			<StatusIcon variant={iconVariant} size="large" />
		</div>
		<h1 class="font-display text-xl sm:text-2xl font-medium text-text mb-2">{title}</h1>
		<p class="mb-6 text-sm text-text-secondary sm:text-base">{message}</p>
		<TextLink href="/">Back to scheduling</TextLink>
	</PublicCard>
</PublicPageShell>
