<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import {
		DashboardPageShell,
		DashboardHeader,
		EventTypeForm
	} from '$lib/components/dashboard';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let name = $state('');
	let slug = $state('');
	let duration = $state(30);
	let description = $state('');
	let isActive = $state(true);
	let coverImage = $state('');
	let saving = $state(false);
	let uploadingCover = $state(false);

	const hasGoogle = data.googleConnected;
	const hasOutlook = data.outlookConnected && data.outlookConfigured;

	function getDefaultAvailability() {
		if (data.defaultAvailabilityCalendars) return data.defaultAvailabilityCalendars;
		if (hasGoogle && hasOutlook) return 'both';
		if (hasOutlook) return 'outlook';
		return 'google';
	}

	function getDefaultInviteCalendar() {
		if (data.defaultInviteCalendar) return data.defaultInviteCalendar;
		if (hasGoogle) return 'google';
		if (hasOutlook) return 'outlook';
		return 'google';
	}

	let overrideCalendarSettings = $state(false);
	let availabilityCalendars = $state(getDefaultAvailability());
	let inviteCalendar = $state(getDefaultInviteCalendar());

	// Auto-generate slug from name
	$effect(() => {
		if (name) {
			slug = name
				.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, '')
				.replace(/\s+/g, '-')
				.replace(/-+/g, '-')
				.trim();
		}
	});

	async function handleCoverUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		if (file.size > 2 * 1024 * 1024) {
			alert('Image must be less than 2MB');
			return;
		}
		uploadingCover = true;
		try {
			const reader = new FileReader();
			reader.onload = () => {
				coverImage = reader.result as string;
				uploadingCover = false;
			};
			reader.onerror = () => {
				alert('Failed to read image');
				uploadingCover = false;
			};
			reader.readAsDataURL(file);
		} catch (err) {
			alert('Failed to upload image');
			uploadingCover = false;
		}
	}

	function removeCoverImage() {
		coverImage = '';
	}

	function handleSubmit() {
		saving = true;
		return async ({ update }: any) => {
			await update();
			saving = false;
		};
	}

	const calendarConfig = $derived({
		hasGoogle: !!hasGoogle,
		hasOutlook: !!hasOutlook,
		defaultAvailabilityCalendars: getDefaultAvailability(),
		defaultInviteCalendar: getDefaultInviteCalendar()
	});
</script>

<DashboardPageShell>
	<DashboardHeader
		title="Create Event Type"
		backHref="/dashboard"
		backLabel="Dashboard"
	/>

	<div class="px-4 sm:px-6 py-4 max-w-2xl">
		<form method="POST" use:enhance={handleSubmit}>
			<EventTypeForm
				bind:name
				bind:slug
				bind:duration
				bind:description
				bind:isActive
				bind:coverImage
				bind:overrideCalendarSettings
				bind:availabilityCalendars
				bind:inviteCalendar
				{saving}
				{uploadingCover}
				{calendarConfig}
				submitLabel="Create Event Type"
				formError={form?.error}
				onCoverUpload={handleCoverUpload}
				onRemoveCover={removeCoverImage}
			/>
		</form>
	</div>
</DashboardPageShell>
