<script lang="ts">
	import DashboardCard from '$lib/components/dashboard/primitives/DashboardCard.svelte';
	import DashboardField from '$lib/components/dashboard/primitives/DashboardField.svelte';
	import DashboardButton from '$lib/components/dashboard/primitives/DashboardButton.svelte';
	import DashboardNotice from '$lib/components/dashboard/primitives/DashboardNotice.svelte';
	import DashboardSpinner from '$lib/components/dashboard/primitives/DashboardSpinner.svelte';

	interface Props {
		user: {
			name?: string;
			email?: string;
			profile_image?: string | null;
			brand_color?: string;
			contact_email?: string | null;
			settings?: string | null;
		} | null;
		onProfileSaved?: () => void;
	}

	let { user, onProfileSaved }: Props = $props();

	function getUserSettings() {
		try {
			return user?.settings ? JSON.parse(user.settings) : {};
		} catch {
			return {};
		}
	}

	let showProfileEdit = $state(false);
	let profileName = $state(user?.name || '');
	let profileImage = $state(user?.profile_image || '');
	let brandColor = $state(user?.brand_color || '#3b82f6');
	let contactEmail = $state(user?.contact_email || '');
	let timeFormat = $state<'12h' | '24h'>(getUserSettings().timeFormat || '12h');
	let savingProfile = $state(false);
	let uploadingImage = $state(false);
	let profileError = $state('');
	let profileSuccess = $state('');

	const presetColors = [
		'#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
		'#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#6366f1',
		'#000000', '#6b7280'
	];

	async function handleImageUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploadingImage = true;
		profileError = '';

		try {
			const formData = new FormData();
			formData.append('image', file);

			const response = await fetch('/api/profile', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errData = await response.json() as { message?: string };
				throw new Error(errData.message || 'Failed to upload image');
			}

			const result = await response.json() as { imageUrl?: string };
			profileImage = result.imageUrl || '';
			profileSuccess = 'Image uploaded successfully';
			setTimeout(() => profileSuccess = '', 3000);
		} catch (err: any) {
			profileError = err.message || 'Failed to upload image';
		} finally {
			uploadingImage = false;
		}
	}

	async function saveProfile() {
		savingProfile = true;
		profileError = '';
		profileSuccess = '';

		try {
			const response = await fetch('/api/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: profileName,
					profileImage,
					brandColor,
					contactEmail,
					timeFormat
				})
			});

			if (!response.ok) {
				const errData = await response.json() as { message?: string };
				throw new Error(errData.message || 'Failed to save profile');
			}

			profileSuccess = 'Profile saved successfully';
			showProfileEdit = false;
			onProfileSaved?.();
		} catch (err: any) {
			profileError = err.message || 'Failed to save profile';
		} finally {
			savingProfile = false;
		}
	}
</script>

<DashboardCard variant="outlined" class="mb-6">
	<div class="flex items-center justify-between mb-4">
		<h2 class="font-display font-medium text-base text-dash-text">Your Profile</h2>
		<DashboardButton
			variant="ghost"
			size="sm"
			onclick={() => showProfileEdit = !showProfileEdit}
		>
			{showProfileEdit ? 'Cancel' : 'Edit Profile'}
		</DashboardButton>
	</div>

	{#if showProfileEdit}
		<div class="space-y-4">
			{#if profileError}
				<DashboardNotice variant="danger">{profileError}</DashboardNotice>
			{/if}
			{#if profileSuccess}
				<DashboardNotice variant="success">{profileSuccess}</DashboardNotice>
			{/if}

			<div class="flex flex-col sm:flex-row items-start gap-6">
				<!-- Profile Image Upload -->
				<div class="flex-shrink-0">
					<div class="relative">
						{#if profileImage}
							<img
								src={profileImage}
								alt="Profile"
								class="w-24 h-24 rounded-full object-cover"
							/>
						{:else}
							<div class="w-24 h-24 bg-dash-accent rounded-full flex items-center justify-center text-white font-semibold text-3xl">
								{profileName?.charAt(0) || 'U'}
							</div>
						{/if}
						<label class="absolute bottom-0 right-0 bg-dash-surface rounded-full p-2 shadow-lg border border-dash-border cursor-pointer hover:bg-dash-surface-raised transition">
							<input
								type="file"
								accept="image/*"
								onchange={handleImageUpload}
								class="hidden"
								disabled={uploadingImage}
							/>
							{#if uploadingImage}
								<DashboardSpinner size="sm" />
							{:else}
								<svg class="w-4 h-4 text-dash-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
								</svg>
							{/if}
						</label>
					</div>
					<p class="text-xs text-dash-text-secondary mt-2 text-center">Max 2MB</p>
				</div>

				<!-- Name + Contact Email -->
				<div class="flex-1 min-w-0 w-full space-y-4">
					<DashboardField
						id="profile-name"
						label="Display Name"
						bind:value={profileName}
						placeholder="Your name"
						hint="This name will be shown on your booking page"
					/>
					<DashboardField
						id="contact-email"
						label="Contact Email"
						type="email"
						bind:value={contactEmail}
						placeholder="your@business-email.com"
						hint="Business email shown in booking emails. Leave empty to use {user?.email}"
					/>
				</div>
			</div>

			<!-- Brand Color -->
			<div class="mt-2">
				<p id="brand-color-label" class="block text-sm font-medium text-dash-text mb-3">Brand Color</p>
				<div class="flex items-center gap-4">
					<div class="flex flex-wrap gap-2" role="group" aria-labelledby="brand-color-label">
						{#each presetColors as color}
							<button
								type="button"
								onclick={() => brandColor = color}
								class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 {brandColor === color ? 'ring-2 ring-offset-2 ring-dash-accent ring-offset-dash-bg' : 'border-dash-border'}"
								style="background-color: {color}"
								aria-label="Select brand color {color}"
								aria-pressed={brandColor === color}
							></button>
						{/each}
					</div>
					<div class="flex items-center gap-2">
						<label class="relative cursor-pointer" for="brand-color-custom">
							<span class="sr-only">Custom brand color</span>
							<input
								id="brand-color-custom"
								type="color"
								bind:value={brandColor}
								class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
								aria-labelledby="brand-color-label"
							/>
							<div
								class="w-8 h-8 rounded-full border-2 border-dashed border-dash-border flex items-center justify-center hover:border-dash-accent transition"
								style="background-color: {brandColor}"
							>
								<svg class="w-4 h-4 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
								</svg>
							</div>
						</label>
						<span class="text-sm text-dash-text-secondary font-mono">{brandColor}</span>
					</div>
				</div>
				<p class="text-xs text-dash-text-secondary mt-2">This color will be used on your booking page for buttons and accents</p>
			</div>

			<!-- Time Format -->
			<div>
				<p id="time-format-label" class="block text-sm font-medium text-dash-text mb-3">Time Format</p>
				<div class="flex gap-3" role="group" aria-labelledby="time-format-label">
					<button
						type="button"
						onclick={() => timeFormat = '12h'}
						class="px-4 py-2 rounded-lg border-2 text-sm font-medium transition {timeFormat === '12h' ? 'border-dash-accent bg-dash-accent/10 text-dash-accent' : 'border-dash-border text-dash-text-secondary hover:border-dash-accent'}"
						aria-pressed={timeFormat === '12h'}
					>
						12-hour (AM/PM)
					</button>
					<button
						type="button"
						onclick={() => timeFormat = '24h'}
						class="px-4 py-2 rounded-lg border-2 text-sm font-medium transition {timeFormat === '24h' ? 'border-dash-accent bg-dash-accent/10 text-dash-accent' : 'border-dash-border text-dash-text-secondary hover:border-dash-accent'}"
						aria-pressed={timeFormat === '24h'}
					>
						24-hour
					</button>
				</div>
				<p class="text-xs text-dash-text-secondary mt-2">Choose how times are displayed on your booking page</p>
			</div>

			<div class="flex justify-end mt-2">
				<DashboardButton
					variant="primary"
					onclick={saveProfile}
					disabled={savingProfile}
				>
					{savingProfile ? 'Saving…' : 'Save Profile'}
				</DashboardButton>
			</div>
		</div>
	{:else}
		<!-- View Mode -->
		<div class="flex items-center gap-4">
			{#if user?.profile_image}
				<img
					src={user.profile_image}
					alt="Profile"
					class="w-16 h-16 rounded-full object-cover flex-shrink-0"
				/>
			{:else}
				<div class="w-16 h-16 bg-dash-accent rounded-full flex items-center justify-center text-white font-semibold text-2xl flex-shrink-0">
					{user?.name?.charAt(0) || 'U'}
				</div>
			{/if}
			<div class="min-w-0">
				<p class="font-medium text-dash-text">{user?.name}</p>
				<p class="text-sm text-dash-text-secondary">{user?.email}</p>
			</div>
		</div>
	{/if}
</DashboardCard>
