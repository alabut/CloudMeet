<script lang="ts">
	import SimpleWysiwyg from '$lib/components/SimpleWysiwyg.svelte';
	import DashboardField from '$lib/components/dashboard/primitives/DashboardField.svelte';
	import DashboardCard from '$lib/components/dashboard/primitives/DashboardCard.svelte';
	import DashboardToggle from '$lib/components/dashboard/primitives/DashboardToggle.svelte';
	import DashboardButton from '$lib/components/dashboard/primitives/DashboardButton.svelte';
	import DashboardNotice from '$lib/components/dashboard/primitives/DashboardNotice.svelte';
	import DashboardSection from '$lib/components/dashboard/primitives/DashboardSection.svelte';
	import DashboardSpinner from '$lib/components/dashboard/primitives/DashboardSpinner.svelte';

	interface CalendarConfig {
		hasGoogle: boolean;
		hasOutlook: boolean;
		defaultAvailabilityCalendars: string;
		defaultInviteCalendar: string;
	}

	interface Props {
		name: string;
		slug: string;
		duration: number;
		description: string;
		isActive: boolean;
		coverImage: string;
		overrideCalendarSettings: boolean;
		availabilityCalendars: string;
		inviteCalendar: string;
		saving: boolean;
		uploadingCover: boolean;
		calendarConfig: CalendarConfig;
		submitLabel?: string;
		formError?: string | null;
		inert?: boolean;
		onCoverUpload: (e: Event) => void;
		onRemoveCover: () => void;
	}

	let {
		name = $bindable(),
		slug = $bindable(),
		duration = $bindable(30),
		description = $bindable(''),
		isActive = $bindable(true),
		coverImage = $bindable(''),
		overrideCalendarSettings = $bindable(false),
		availabilityCalendars = $bindable('google'),
		inviteCalendar = $bindable('google'),
		saving,
		uploadingCover,
		calendarConfig,
		submitLabel = 'Save',
		formError = null,
		inert = false,
		onCoverUpload,
		onRemoveCover
	}: Props = $props();

	const { hasGoogle, hasOutlook, defaultAvailabilityCalendars, defaultInviteCalendar } = $derived(calendarConfig);

	function getAvailabilityLabel(val: string) {
		if (val === 'both') return 'Both calendars';
		if (val === 'outlook') return 'Outlook Calendar';
		return 'Google Calendar';
	}

	function getInviteLabel(val: string) {
		if (val === 'outlook') return 'Outlook (Microsoft Teams)';
		return 'Google Calendar (Zoom)';
	}
</script>

{#if formError}
	<DashboardNotice variant="danger" class="mb-4">
		{#snippet heading()}Error{/snippet}
		{formError}
	</DashboardNotice>
{/if}

<DashboardCard variant="outlined">
	<div class="space-y-5">
		<!-- Event Name -->
		<div class="space-y-1">
			<label for="name" class="block text-sm font-medium text-dash-text">
				Event Name <span class="text-dash-accent ml-0.5" aria-hidden="true">*</span>
			</label>
			<input
				type="text"
				id="name"
				name="name"
				bind:value={name}
				required
				placeholder="e.g., 30 Minute Meeting"
				class="w-full px-3 py-2 bg-[var(--dash-field)] border border-dash-border rounded-md text-dash-text placeholder:text-dash-text-secondary text-base sm:text-sm focus:ring-2 focus:ring-dash-accent focus:border-transparent outline-none transition"
			/>
		</div>

		<!-- Slug -->
		<div class="space-y-1">
			<label for="slug" class="block text-sm font-medium text-dash-text">
				URL Slug <span class="text-dash-accent ml-0.5" aria-hidden="true">*</span>
			</label>
			<input
				type="text"
				id="slug"
				name="slug"
				bind:value={slug}
				required
				pattern="[a-z0-9\-]+"
				placeholder="e.g., 30min"
				class="w-full px-3 py-2 bg-[var(--dash-field)] border border-dash-border rounded-md text-dash-text placeholder:text-dash-text-secondary text-base sm:text-sm focus:ring-2 focus:ring-dash-accent focus:border-transparent outline-none transition"
			/>
			<p class="text-xs text-dash-text-secondary">Only lowercase letters, numbers, and hyphens. This will be part of your booking URL.</p>
		</div>

		<!-- Duration -->
		<div class="space-y-1">
			<label for="duration" class="block text-sm font-medium text-dash-text">
				Duration (minutes) <span class="text-dash-accent ml-0.5" aria-hidden="true">*</span>
			</label>
			<select
				id="duration"
				name="duration"
				bind:value={duration}
				required
				class="w-full px-3 py-2 bg-[var(--dash-field)] border border-dash-border rounded-md text-dash-text text-base sm:text-sm focus:ring-2 focus:ring-dash-accent focus:border-transparent outline-none transition appearance-none"
			>
				<option value={15}>15 minutes</option>
				<option value={30}>30 minutes</option>
				<option value={45}>45 minutes</option>
				<option value={60}>60 minutes</option>
				<option value={90}>90 minutes</option>
				<option value={120}>2 hours</option>
			</select>
		</div>

		<!-- Description -->
		<div class="space-y-1">
			<label class="block text-sm font-medium text-dash-text" id="description-label" for="description-editor">
				Description
			</label>
			<SimpleWysiwyg
				id="description-editor"
				aria-labelledby="description-label"
				bind:value={description}
				placeholder="Describe what this meeting is for…"
			/>
			<input type="hidden" name="description" value={description} />
		</div>

		<!-- Cover Image -->
		<div class="space-y-2">
			<p class="text-sm font-medium text-dash-text">Cover Image</p>
			<p class="text-xs text-dash-text-secondary">
				This image will be displayed at the top of your booking page
			</p>

			{#if coverImage}
				<div class="relative p-4 bg-[var(--dash-field)] border border-dash-border rounded-lg">
					<img
						src={coverImage}
						alt="Cover preview"
						class="max-h-20 w-auto object-contain mx-auto"
					/>
					<button
						type="button"
						onclick={onRemoveCover}
						class="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition"
						aria-label="Remove cover image"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/if}

			<label class="flex items-center justify-center w-full h-32 border-2 border-dashed border-dash-border rounded-lg cursor-pointer hover:border-dash-accent hover:bg-dash-surface-raised transition {coverImage ? 'hidden' : ''}">
				<input
					type="file"
					accept="image/*"
					onchange={onCoverUpload}
					class="hidden"
					disabled={uploadingCover || inert}
				/>
				{#if uploadingCover}
					<div class="flex items-center gap-2 text-dash-text-secondary">
						<DashboardSpinner size="sm" />
						<span class="text-sm">Uploading…</span>
					</div>
				{:else}
					<div class="text-center">
						<svg class="w-8 h-8 mx-auto text-dash-text-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<p class="text-sm text-dash-text-secondary">Click to upload cover image</p>
						<p class="text-xs text-dash-text-secondary">Max 2MB</p>
					</div>
				{/if}
			</label>
			<input type="hidden" name="cover_image" value={coverImage} />
		</div>

		<!-- Calendar Settings -->
		{#if hasGoogle || hasOutlook}
			<div class="border-t border-dash-border pt-5 space-y-4">
				<h3 class="text-sm font-medium text-dash-text">Calendar Settings</h3>

				<!-- Current global settings summary -->
				<div class="p-3 bg-[var(--dash-field)] border border-dash-border rounded-lg text-sm">
					<p class="text-dash-text-secondary mb-0.5">
						<span class="font-medium text-dash-text">Check availability from:</span>
						{getAvailabilityLabel(defaultAvailabilityCalendars)}
					</p>
					<p class="text-dash-text-secondary">
						<span class="font-medium text-dash-text">Send invite via:</span>
						{getInviteLabel(defaultInviteCalendar)}
					</p>
					<p class="text-xs text-dash-text-secondary mt-2">
						Global settings from <a href="/dashboard/calendars" class="text-dash-accent hover:underline">Calendar Settings</a>
					</p>
				</div>

				<!-- Override toggle -->
				<DashboardToggle
					id="override_calendar_settings"
					label="Override global calendar settings for this event type"
					bind:checked={overrideCalendarSettings}
				/>
				<input type="hidden" name="override_calendar_settings" value={overrideCalendarSettings ? 'on' : ''} />

				{#if overrideCalendarSettings}
					<DashboardField
						id="availability_calendars"
						label="Check availability from"
						kind="select"
						bind:value={availabilityCalendars}
						hint="Which calendars to check when showing available time slots"
					>
						{#if hasGoogle && hasOutlook}
							<option value="both">Both Google & Outlook calendars</option>
						{/if}
						{#if hasGoogle}
							<option value="google">Google Calendar only</option>
						{/if}
						{#if hasOutlook}
							<option value="outlook">Outlook Calendar only</option>
						{/if}
					</DashboardField>
					<input type="hidden" name="availability_calendars" value={availabilityCalendars} />

					<DashboardField
						id="invite_calendar"
						label="Send calendar invite via"
						kind="select"
						bind:value={inviteCalendar}
						hint="The attendee will receive an invite from this calendar with the meeting link"
					>
						{#if hasGoogle}
							<option value="google">Google Calendar (Zoom)</option>
						{/if}
						{#if hasOutlook}
							<option value="outlook">Outlook Calendar (Microsoft Teams)</option>
						{/if}
					</DashboardField>
					<input type="hidden" name="invite_calendar" value={inviteCalendar} />
				{/if}
			</div>
		{:else}
			<div class="border-t border-dash-border pt-5">
				<p class="text-sm text-dash-text-secondary">
					Connect a calendar in
					<a href="/dashboard/calendars" class="text-dash-accent hover:underline">Calendar Settings</a>
					to configure calendar options.
				</p>
			</div>
		{/if}

		<!-- Is Active -->
		<div class="border-t border-dash-border pt-5">
			<DashboardToggle
				id="is_active"
				label="Active"
				description="Allow people to book this event type"
				bind:checked={isActive}
			/>
			<input type="hidden" name="is_active" value={isActive ? 'on' : ''} />
		</div>

		<!-- Submit -->
		<div class="flex gap-3 pt-2">
			<DashboardButton type="submit" variant="primary" disabled={saving || inert}>
				{saving ? 'Saving…' : submitLabel}
			</DashboardButton>
			<DashboardButton variant="ghost" href="/dashboard">
				Cancel
			</DashboardButton>
		</div>
	</div>
</DashboardCard>
