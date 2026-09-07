<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import {
		DashboardPageShell,
		DashboardHeader,
		EventTypeForm
	} from '$lib/components/dashboard';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let name = $state(data.eventType.name);
	let slug = $state(data.eventType.slug);
	let duration = $state(data.eventType.duration);
	let description = $state(data.eventType.description || '');
	let isActive = $state(data.eventType.is_active === 1);
	let coverImage = $state(data.eventType.cover_image || '');
	let saving = $state(false);
	let uploadingCover = $state(false);

	const hasGoogle = data.googleConnected;
	const hasOutlook = data.outlookConnected && data.outlookConfigured;

	const hasCustomSettings = !!(data.eventType.availability_calendars || data.eventType.invite_calendar);
	let overrideCalendarSettings = $state(hasCustomSettings);

	function getGlobalAvailability() {
		if (data.defaultAvailabilityCalendars) return data.defaultAvailabilityCalendars;
		if (hasGoogle && hasOutlook) return 'both';
		if (hasOutlook) return 'outlook';
		return 'google';
	}

	function getGlobalInviteCalendar() {
		if (data.defaultInviteCalendar) return data.defaultInviteCalendar;
		if (hasGoogle) return 'google';
		if (hasOutlook) return 'outlook';
		return 'google';
	}

	function getDefaultAvailability() {
		if (data.eventType.availability_calendars) return data.eventType.availability_calendars;
		return getGlobalAvailability();
	}

	function getDefaultInviteCalendar() {
		if (data.eventType.invite_calendar) return data.eventType.invite_calendar;
		return getGlobalInviteCalendar();
	}

	let availabilityCalendars = $state(getDefaultAvailability());
	let inviteCalendar = $state(getDefaultInviteCalendar());

	// Auto-generate slug from name (only when name changes from original)
	$effect(() => {
		if (name && name !== data.eventType.name) {
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
		defaultAvailabilityCalendars: getGlobalAvailability(),
		defaultInviteCalendar: getGlobalInviteCalendar()
	});
</script>

<DashboardPageShell>
	<DashboardHeader
		title="Edit Event Type"
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
				submitLabel="Save Changes"
				formError={form?.error}
				onCoverUpload={handleCoverUpload}
				onRemoveCover={removeCoverImage}
			/>
		</form>
	</div>
</DashboardPageShell>
