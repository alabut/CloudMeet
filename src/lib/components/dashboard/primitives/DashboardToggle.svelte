<script lang="ts">
	import { nextDomId } from '$lib/utils/domIds';

	interface Props {
		checked?: boolean;
		label?: string;
		description?: string;
		disabled?: boolean;
		id?: string;
		class?: string;
		onchange?: (checked: boolean) => void;
	}

	let {
		checked = $bindable(false),
		label,
		description,
		disabled = false,
		id,
		class: className = '',
		onchange
	}: Props = $props();

	const fallbackToggleId = nextDomId('toggle');
	const toggleId = $derived(id ?? fallbackToggleId);

	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		checked = target.checked;
		onchange?.(target.checked);
	}
</script>

<div class="flex items-start gap-3 {className}">
	<div class="relative flex-shrink-0 mt-0.5">
		<input
			type="checkbox"
			id={toggleId}
			bind:checked
			{disabled}
			onchange={handleChange}
			class="sr-only peer"
		/>
		<label
			for={toggleId}
			class="block w-10 h-6 rounded-full cursor-pointer transition-colors
				bg-dash-border peer-checked:bg-dash-accent
				peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
				peer-focus-visible:ring-2 peer-focus-visible:ring-dash-accent peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-dash-bg"
		>
			<span
				class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform
					peer-checked:translate-x-4"
				aria-hidden="true"
			></span>
		</label>
	</div>
	{#if label || description}
		<div class="min-w-0">
			{#if label}
				<label for={toggleId} class="block text-sm font-medium text-dash-text cursor-pointer">
					{label}
				</label>
			{/if}
			{#if description}
				<p class="text-xs text-dash-text-secondary mt-0.5">{description}</p>
			{/if}
		</div>
	{/if}
</div>
