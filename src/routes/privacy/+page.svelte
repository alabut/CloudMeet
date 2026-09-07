<script lang="ts">
	import { PublicPageShell, TextLink } from '$lib/components/public';
</script>

<svelte:head>
	<title>Privacy — Schedule with Al Abut</title>
	<meta
		name="description"
		content="How CloudMeet on schedule.alabut.com handles personal information."
	/>
</svelte:head>

<PublicPageShell layout="document" width="booking">
	<h1 class="font-display text-3xl font-medium text-text mb-6">Privacy</h1>
	<div class="space-y-5 text-text">
		<p>
			This page covers the personal scheduling site at
			<TextLink href="https://schedule.alabut.com" class="!inline !px-0 !py-0 text-base">
				schedule.alabut.com
			</TextLink>
			(CloudMeet).
		</p>
		<p>
			When someone books a meeting, we store their name, email, chosen time, and any notes they
			include, so the host can hold the appointment. If the host has connected Google Calendar, we
			create a calendar event and send a Google Calendar invitation. That invitation includes the
			host's Zoom meeting link.
		</p>
		<p>
			The host signs in with Google so the app can read calendar availability and create those
			invites. We do not sell this information. We do not use it for advertising.
		</p>
		<p>
			Questions:
			<TextLink href="mailto:alabut@gmail.com" class="!inline !px-0 !py-0 text-base">
				alabut@gmail.com
			</TextLink>.
		</p>
		<p>
			<TextLink href="/">Back to scheduling</TextLink>
		</p>
	</div>
</PublicPageShell>
