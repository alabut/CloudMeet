<script lang="ts">
	interface Props {
		bookingForm: {
			name: string;
			email: string;
			notes: string;
		};
		bookingStatus: 'idle' | 'submitting' | 'success' | 'error';
		bookingError: string;
		brandColor: string;
		brandDark: string;
		onSubmit: (e: Event) => void;
	}

	let {
		bookingForm = $bindable(),
		bookingStatus,
		bookingError,
		brandColor,
		brandDark,
		onSubmit
	}: Props = $props();
</script>

<!-- ===== USER STYLE ANCHOR: booking-form ===== -->
<div class="max-w-md">
	<h2 class="font-display text-xl font-medium text-text mb-6">Enter Details</h2>

	{#if bookingError}
		<div class="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 mb-6">
			{bookingError}
		</div>
	{/if}

	<form onsubmit={onSubmit} class="space-y-5">
		<div>
			<label for="name" class="block text-sm font-medium text-text mb-2">Name *</label>
			<input
				type="text"
				id="name"
				bind:value={bookingForm.name}
				required
				class="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text placeholder:text-text-secondary focus:ring-2 focus:border-transparent outline-none"
				style="--tw-ring-color: {brandColor}"
			/>
		</div>
		<div>
			<label for="email" class="block text-sm font-medium text-text mb-2">Email *</label>
			<input
				type="email"
				id="email"
				bind:value={bookingForm.email}
				required
				class="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text placeholder:text-text-secondary focus:ring-2 focus:border-transparent outline-none"
				style="--tw-ring-color: {brandColor}"
			/>
		</div>
		<div>
			<label for="notes" class="block text-sm font-medium text-text mb-2">
				Please share anything that will help prepare for our meeting.
			</label>
			<textarea
				id="notes"
				bind:value={bookingForm.notes}
				rows="4"
				class="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text placeholder:text-text-secondary focus:ring-2 focus:border-transparent outline-none resize-none"
				style="--tw-ring-color: {brandColor}"
			></textarea>
		</div>
		<button
			type="submit"
			disabled={bookingStatus === 'submitting'}
			class="w-full text-white py-3 px-6 rounded-full font-semibold transition disabled:opacity-50"
			style="background-color: {brandColor}"
			onmouseenter={(e) => e.currentTarget.style.backgroundColor = brandDark}
			onmouseleave={(e) => e.currentTarget.style.backgroundColor = brandColor}
		>
			{bookingStatus === 'submitting' ? 'Scheduling...' : 'Schedule Event'}
		</button>
	</form>
</div>
